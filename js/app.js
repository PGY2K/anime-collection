const ANILIST_ENDPOINT = "https://graphql.anilist.co";
const CACHE_KEY = "animeCollectionAniListCacheV3";

function normalize(value) {
  return String(value ?? "").trim().toLowerCase();
}

function toNumber(value) {
  if (value === null || value === undefined || value === "") return null;
  const number = Number(String(value).replace(",", "."));
  return Number.isFinite(number) ? number : null;
}

function averageRating(item) {
  const scores = ["story","characters","animation","sound","world","pacing","emotion","originality","rewatch_value","enjoyment"]
    .map((field) => toNumber(item[field]))
    .filter((value) => value !== null);

  if (scores.length < 10) return null;
  return scores.reduce((sum, value) => sum + value, 0) / scores.length;
}

function escapeHtml(value) {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

function statusClass(status) {
  const value = normalize(status);

  if (value === "completed") return "status-completed";
  if (value === "in progress") return "status-progress";
  if (value === "waiting") return "status-waiting";
  if (value === "dropped") return "status-dropped";
  if (value === "queued") return "status-queued";

  return "status-queued";
}

async function requestAniList(query, variables) {
  const response = await fetch(ANILIST_ENDPOINT, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Accept: "application/json"
    },
    body: JSON.stringify({ query, variables })
  });

  if (!response.ok) {
    throw new Error("AniList request failed");
  }

  const json = await response.json();
  return json?.data ?? null;
}

async function fetchAniListById(id) {
  const query = `
    query ($id: Int) {
      Media(id: $id, type: ANIME) {
        id
        title {
          romaji
          english
        }
        coverImage {
          extraLarge
          large
        }
        isAdult
        episodes
        format
        seasonYear
      }
    }
  `;

  const data = await requestAniList(query, { id: Number(id) });
  return data?.Media ?? null;
}

async function searchAniListPage(search) {
  const query = `
    query ($search: String) {
      Page(page: 1, perPage: 8) {
        media(search: $search, type: ANIME, sort: SEARCH_MATCH) {
          id
          title {
            romaji
            english
          }
          coverImage {
            extraLarge
            large
            medium
          }
          isAdult
          episodes
          format
          seasonYear
          status
        }
      }
    }
  `;

  const data = await requestAniList(query, { search });
  return data?.Page?.media ?? [];
}

function readCache() {
  try {
    return JSON.parse(localStorage.getItem(CACHE_KEY) || "{}");
  } catch {
    return {};
  }
}

function writeCache(cache) {
  try {
    localStorage.setItem(CACHE_KEY, JSON.stringify(cache));
  } catch {
    // The collection still works without local storage.
  }
}

async function loadCollectionFromSupabase() {
  const { data, error } = await supabaseClient
    .from("anime")
    .select("*")
    .order("created_at", { ascending: false });

  if (error) {
    throw error;
  }

  return (data || []).map((item) => ({
    id: item.id,
    anilistId: item.anilist_id,
    title: item.title,
    displayStatus: item.status || "Queued",
    story: item.story,
    characters: item.characters,
    animation: item.animation,
    sound: item.sound,
    world: item.world,
    pacing: item.pacing,
    emotion: item.emotion,
    originality: item.originality,
    rewatch_value: item.rewatch_value,
    enjoyment: item.enjoyment,
    lastSeason: item.last_season,
    startedWatching: item.started_watching,
    rating: normalize(item.status) === "completed" ? averageRating(item) : null
  }));
}

async function addAnimeToSupabase(anime) {
  const title = anime.title?.english || anime.title?.romaji || "Untitled";

  const { data, error } = await supabaseClient
    .from("anime")
    .insert({
      anilist_id: anime.id,
      title,
      status: "Queued"
    })
    .select()
    .single();

  if (error) {
    if (error.code === "23505") {
      throw new Error("That anime is already in your collection.");
    }

    throw error;
  }

  return data;
}

function applyPoster(card, posterUrl, isAdult = false) {
  const poster = card.querySelector(".poster");
  if (!poster || !posterUrl) return;

  poster.classList.toggle("mat-adult-poster-hidden", Boolean(isAdult) && !matShow18Posters());
  poster.innerHTML = `
    <img
      src="${escapeHtml(posterUrl)}"
      alt="${escapeHtml(card.dataset.title)} poster"
      loading="lazy"
    />
    ${matAdultPosterOverlay(isAdult)}
  `;
}

async function loadPosters() {
  const cards = [...document.querySelectorAll(".anime-card[data-anilist-id]")];
  const cache = readCache();

  for (let index = 0; index < cards.length; index += 4) {
    const batch = cards.slice(index, index + 4);

    await Promise.all(
      batch.map(async (card) => {
        const id = card.dataset.anilistId;
        const cacheKey = `id:${id}`;
        const cached = cache[cacheKey];

        if (cached?.poster) {
          applyPoster(card, cached.poster, cached.isAdult);
          return;
        }

        try {
          const media = await fetchAniListById(id);
          const poster =
            media?.coverImage?.extraLarge ||
            media?.coverImage?.large ||
            "";

          cache[cacheKey] = { poster, isAdult: Boolean(media?.isAdult) };

          if (poster) {
            applyPoster(card, poster, Boolean(media?.isAdult));
          }
        } catch (error) {
          console.warn(`Could not load poster for ${card.dataset.title}`, error);
        }
      })
    );

    writeCache(cache);

    if (index + 4 < cards.length) {
      await new Promise((resolve) => setTimeout(resolve, 250));
    }
  }
}

let collectionAnime = [];
let currentFilter = "all";

const collectionFilterCopy = {
  all: {
    title: 'Your <span>Collection</span>',
    description: "Search, filter, and browse your anime."
  },
  queued: {
    title: "Queued",
    description: "You've added this anime to your collection but haven't started watching it yet."
  },
  "in progress": {
    title: "In Progress",
    description: "You're currently watching these anime."
  },
  waiting: {
    title: "Waiting",
    description: "You're waiting for new episodes or the next season."
  },
  completed: {
    title: "Completed",
    description: "You've finished watching these anime."
  },
  dropped: {
    title: "Dropped",
    description: "You've decided not to continue watching these anime."
  }
};

function updateCollectionHeader() {
  const copy = collectionFilterCopy[currentFilter] || collectionFilterCopy.all;
  const title = document.getElementById("collectionPageTitle");
  const subtitle = document.getElementById("collectionPageSubtitle");

  if (title) title.innerHTML = copy.title;
  if (subtitle) subtitle.textContent = copy.description;
}

function renderCollection() {
  updateCollectionHeader();
  const search = normalize(document.getElementById("searchInput").value);
  const sortValue = document.getElementById("sortSelect").value;

  let filtered = collectionAnime.filter((item) => {
    const matchesSearch = normalize(item.title).includes(search);
    const matchesFilter =
      currentFilter === "all" ||
      normalize(item.displayStatus) === currentFilter;

    return matchesSearch && matchesFilter;
  });

  filtered.sort((a, b) => {
    if (sortValue === "title-asc") return a.title.localeCompare(b.title);
    if (sortValue === "title-desc") return b.title.localeCompare(a.title);
    if (sortValue === "rating-desc") return (b.rating ?? -1) - (a.rating ?? -1);
    if (sortValue === "rating-asc") return (a.rating ?? 999) - (b.rating ?? 999);

    return 0;
  });

  document.getElementById("resultCount").textContent =
    `${filtered.length} anime shown`;

  document.getElementById("animeGrid").innerHTML = filtered.length
    ? filtered
        .map(
          (item) => `
            <a
              class="anime-card anime-card-link"
              href="anime.html?id=${encodeURIComponent(item.id)}"
              data-record-id="${item.id}"
              data-anilist-id="${item.anilistId}"
              data-title="${escapeHtml(item.title)}"
              aria-label="View details for ${escapeHtml(item.title)}"
            >
              <div class="poster">
                <div class="poster-placeholder">🎌</div>
              </div>

              <div class="card-body">
                <h3 class="card-title">${escapeHtml(item.title)}</h3>

                <div class="card-details">
                  <span class="status ${statusClass(item.displayStatus)}">
                    ${escapeHtml(item.displayStatus)}
                  </span>

                  ${Number.isFinite(item.rating)
                    ? `<span class="rating">⭐ ${item.rating.toFixed(1)}</span>`
                    : ""}
                </div>
              </div>
            </a>
          `
        )
        .join("")
    : '<div class="empty-state">Your collection is empty.</div>';

  loadPosters();
}

async function refreshCollection() {
  collectionAnime = await loadCollectionFromSupabase();
  renderCollection();
}

function openAddAnimeModal() {
  const modal = document.getElementById("addAnimeModal");

  modal.classList.remove("hidden");
  modal.setAttribute("aria-hidden", "false");

  document.getElementById("addAnimeSearchInput").focus();
}

function closeAddAnimeModal() {
  const modal = document.getElementById("addAnimeModal");

  modal.classList.add("hidden");
  modal.setAttribute("aria-hidden", "true");
}

async function runAddAnimeSearch() {
  const input = document.getElementById("addAnimeSearchInput");
  const resultsContainer = document.getElementById("addAnimeResults");
  const search = input.value.trim();

  if (!search) {
    resultsContainer.innerHTML =
      '<div class="empty-state">Type an anime name first.</div>';
    return;
  }

  resultsContainer.innerHTML =
    '<div class="loading">Searching…</div>';

  try {
    const results = await searchAniListPage(search);

    resultsContainer.innerHTML = results.length
      ? results
          .map((anime) => {
            const title =
              anime.title?.english ||
              anime.title?.romaji ||
              "Untitled";

            const poster =
              anime.coverImage?.large ||
              anime.coverImage?.medium ||
              "";

            const format = anime.format || "Anime";

            const episodes = anime.episodes
              ? `${anime.episodes} episodes`
              : "Episode count unavailable";

            const year = anime.seasonYear || "Year unavailable";

            return `
              <article class="search-result-card${matAdultPosterClass(anime.isAdult)}">
                <div class="search-result-poster">
                <img
                  src="${escapeHtml(poster)}"
                  alt="${escapeHtml(title)} poster"
                />
                ${matAdultPosterOverlay(anime.isAdult)}
                </div>

                <div>
                  <h3 class="search-result-title">${escapeHtml(title)}</h3>

                  <div class="search-result-meta">
                    ${escapeHtml(format)} •
                    ${escapeHtml(episodes)} •
                    ${escapeHtml(year)}
                  </div>
                </div>

                <button
                  class="select-anime-btn"
                  type="button"
                  data-anime-id="${anime.id}"
                >
                  Add
                </button>
              </article>
            `;
          })
          .join("")
      : '<div class="empty-state">No matching anime found.</div>';

    document.querySelectorAll(".select-anime-btn").forEach((button) => {
      button.addEventListener("click", async () => {
        const anime = results.find(
          (item) => String(item.id) === button.dataset.animeId
        );

        if (!anime) return;

        button.disabled = true;
        button.textContent = "Adding...";

        try {
          await addAnimeToSupabase(anime);
          await refreshCollection();

          closeAddAnimeModal();

          document.getElementById("addAnimeSearchInput").value = "";
          document.getElementById("addAnimeResults").innerHTML =
            '<div class="empty-state">Search for an anime to begin.</div>';
        } catch (error) {
          console.error(error);
          button.disabled = false;
          button.textContent = "Add";
          alert(error.message || "Could not add anime.");
        }
      });
    });
  } catch (error) {
    console.error(error);

    resultsContainer.innerHTML =
      '<div class="error">Search failed. Please try again.</div>';
  }
}

function initAddAnimeModal() {
  const openButton = document.getElementById("openAddAnimeBtn");
  const closeButton = document.getElementById("closeAddAnimeBtn");
  const modal = document.getElementById("addAnimeModal");
  const searchButton = document.getElementById("searchAniListBtn");
  const searchInput = document.getElementById("addAnimeSearchInput");

  openButton.addEventListener("click", openAddAnimeModal);
  closeButton.addEventListener("click", closeAddAnimeModal);
  searchButton.addEventListener("click", runAddAnimeSearch);

  searchInput.addEventListener("keydown", (event) => {
    if (event.key === "Enter") {
      runAddAnimeSearch();
    }
  });

  modal.addEventListener("click", (event) => {
    if (event.target === modal) {
      closeAddAnimeModal();
    }
  });

  document.addEventListener("keydown", (event) => {
    if (event.key === "Escape") {
      closeAddAnimeModal();
    }
  });
}

function initializeCollectionFilterFromUrl() {
  const requestedStatus = normalize(new URLSearchParams(window.location.search).get("status"));
  const supportedFilters = new Set(Object.keys(collectionFilterCopy));

  currentFilter = supportedFilters.has(requestedStatus) ? requestedStatus : "all";

  document.querySelectorAll(".filter-btn").forEach((button) => {
    button.classList.toggle("active", button.dataset.filter === currentFilter);
  });
}

async function initCollection() {
  try {
    initializeCollectionFilterFromUrl();
    await refreshCollection();

    document
      .getElementById("searchInput")
      .addEventListener("input", renderCollection);

    document
      .getElementById("sortSelect")
      .addEventListener("change", renderCollection);

    document.querySelectorAll(".filter-btn").forEach((button) => {
      button.addEventListener("click", () => {
        document.querySelectorAll(".filter-btn").forEach((item) => {
          item.classList.remove("active");
        });

        button.classList.add("active");
        currentFilter = button.dataset.filter;

        const url = new URL(window.location.href);
        if (currentFilter === "all") url.searchParams.delete("status");
        else url.searchParams.set("status", currentFilter);
        window.history.replaceState({}, "", url);

        renderCollection();
      });
    });

    initAddAnimeModal();
  } catch (error) {
    console.error(error);

    document.getElementById("animeGrid").innerHTML =
      `<div class="error">${escapeHtml(error.message || "Could not load your collection.")}</div>`;
  }
}
