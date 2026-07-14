const SPREADSHEET_ID = "1Rn3s0qd-JnTyOMO0C4nPM14kNr5QYbOxHYD7vtp-YMg";
const ALL_ANIME_SHEET = "All Anime";
const ANILIST_ENDPOINT = "https://graphql.anilist.co";
const CACHE_KEY = "animeCollectionAniListCacheV2";

function sheetUrl(sheetName) {
  return `https://docs.google.com/spreadsheets/d/${SPREADSHEET_ID}/gviz/tq?tqx=out:json&sheet=${encodeURIComponent(sheetName)}`;
}

async function fetchSheet(sheetName) {
  const response = await fetch(sheetUrl(sheetName), { cache: "no-store" });
  if (!response.ok) throw new Error(`Could not load ${sheetName}`);

  const text = await response.text();
  const start = text.indexOf("{");
  const end = text.lastIndexOf("}") + 1;

  if (start < 0 || end <= 0) throw new Error(`Unexpected response from ${sheetName}`);

  const json = JSON.parse(text.slice(start, end));

  return json.table.rows.map((row) =>
    (row.c || []).map((cell) => (cell ? (cell.f ?? cell.v ?? "") : ""))
  );
}

function normalize(value) {
  return String(value ?? "").trim().toLowerCase();
}

function toNumber(value) {
  const number = Number(String(value ?? "").replace(",", "."));
  return Number.isFinite(number) ? number : null;
}

function averageRating(story, animation, enjoyment) {
  const scores = [story, animation, enjoyment]
    .map(toNumber)
    .filter((value) => value !== null);

  if (scores.length < 3) return null;
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

function getDisplayStatus(item) {
  const status = normalize(item.status);
  const label = normalize(item.label);

  if (status === "completed") return "Completed";
  if (status === "in progress") return "In Progress";
  if (label === "dropped") return "Dropped";
  if (label === "queued") return "Queued";

  return item.status || item.label || "Unsorted";
}

function statusClass(status) {
  const value = normalize(status);

  if (value === "completed") return "status-completed";
  if (value === "in progress") return "status-progress";
  if (value === "dropped") return "status-dropped";
  if (value === "queued") return "status-queued";

  return "status-queued";
}

async function loadAnimeData() {
  const rows = await fetchSheet(ALL_ANIME_SHEET);

  return rows
    .map((row) => {
      const anilistId = String(row[0] ?? "").trim();
      const title = String(row[1] ?? "").trim();
      const status = String(row[2] ?? "").trim();
      const label = String(row[3] ?? "").trim();
      const story = row[4] ?? "";
      const animation = row[5] ?? "";
      const enjoyment = row[6] ?? "";
      const lastSeason = String(row[7] ?? "").trim();
      const startedWatching = String(row[8] ?? "").trim();

      const item = {
        anilistId,
        title,
        status,
        label,
        story,
        animation,
        enjoyment,
        lastSeason,
        startedWatching
      };

      return {
        ...item,
        displayStatus: getDisplayStatus(item),
        rating: averageRating(story, animation, enjoyment)
      };
    })
    .filter((item) => {
      const title = normalize(item.title);
      return item.title && title !== "anime" && title !== "anime title";
    });
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
  } catch {}
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

  if (!response.ok) throw new Error("AniList request failed");

  const json = await response.json();
  return json?.data ?? null;
}

async function fetchAniListById(id) {
  const query = `
    query ($id: Int) {
      Media(id: $id, type: ANIME) {
        id
        title { romaji english }
        coverImage { extraLarge large }
        episodes
        format
        seasonYear
      }
    }
  `;

  const data = await requestAniList(query, { id: Number(id) });
  return data?.Media ?? null;
}

async function searchAniList(title) {
  const query = `
    query ($search: String) {
      Media(search: $search, type: ANIME, sort: SEARCH_MATCH) {
        id
        title { romaji english }
        coverImage { extraLarge large }
        episodes
        format
        seasonYear
      }
    }
  `;

  const data = await requestAniList(query, { search: title });
  return data?.Media ?? null;
}

async function searchAniListPage(search) {
  const query = `
    query ($search: String) {
      Page(page: 1, perPage: 8) {
        media(search: $search, type: ANIME, sort: SEARCH_MATCH) {
          id
          title { romaji english }
          coverImage { extraLarge large medium }
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

function cacheKeyFor(item) {
  return item.anilistId ? `id:${item.anilistId}` : `title:${normalize(item.title)}`;
}

async function loadPosters() {
  const cards = [...document.querySelectorAll(".anime-card[data-cache-key]")];
  const cache = readCache();
  const uncachedCards = [];

  cards.forEach((card) => {
    const cached = cache[card.dataset.cacheKey];

    if (cached?.poster) {
      applyPoster(card, cached.poster);
    } else {
      uncachedCards.push(card);
    }
  });

  for (let index = 0; index < uncachedCards.length; index += 4) {
    const batch = uncachedCards.slice(index, index + 4);

    await Promise.all(
      batch.map(async (card) => {
        const title = card.dataset.title;
        const anilistId = card.dataset.anilistId;

        try {
          const media = anilistId
            ? await fetchAniListById(anilistId)
            : await searchAniList(title);

          if (!media) return;

          const poster =
            media.coverImage?.extraLarge ||
            media.coverImage?.large ||
            "";

          cache[card.dataset.cacheKey] = {
            id: media.id,
            poster
          };

          if (poster) applyPoster(card, poster);
        } catch (error) {
          console.warn(`Could not load poster for ${title}`, error);
        }
      })
    );

    writeCache(cache);

    if (index + 4 < uncachedCards.length) {
      await new Promise((resolve) => setTimeout(resolve, 300));
    }
  }
}

function applyPoster(card, posterUrl) {
  const poster = card.querySelector(".poster");
  if (!poster) return;

  poster.innerHTML = `
    <img
      src="${escapeHtml(posterUrl)}"
      alt="${escapeHtml(card.dataset.title)} poster"
      loading="lazy"
    />
  `;
}

function renderDashboard(anime) {
  document.getElementById("totalAnime").textContent = anime.length;
  document.getElementById("completedAnime").textContent =
    anime.filter((item) => normalize(item.displayStatus) === "completed").length;
  document.getElementById("inProgressAnime").textContent =
    anime.filter((item) => normalize(item.displayStatus) === "in progress").length;
  document.getElementById("droppedAnime").textContent =
    anime.filter((item) => normalize(item.displayStatus) === "dropped").length;

  const topRated = anime
    .filter((item) => Number.isFinite(item.rating))
    .sort((a, b) => b.rating - a.rating || a.title.localeCompare(b.title))
    .slice(0, 5);

  const queue = anime
    .filter((item) => normalize(item.displayStatus) === "queued")
    .slice(0, 5);

  const medals = ["🥇", "🥈", "🥉", "4", "5"];

  document.getElementById("topRated").innerHTML = topRated.length
    ? topRated.map((item, index) => `
        <div class="rank-item">
          <div class="badge">${medals[index]}</div>
          <div class="title">${escapeHtml(item.title)}</div>
          <div class="rating">⭐ ${item.rating.toFixed(1)}</div>
        </div>
      `).join("")
    : '<div class="empty-state">No ratings yet.</div>';

  document.getElementById("queueList").innerHTML = queue.length
    ? queue.map((item) => `
        <div class="queue-item">
          <div class="title">${escapeHtml(item.title)}</div>
          <div class="status status-queued">Queued</div>
        </div>
      `).join("")
    : '<div class="empty-state">No queued anime yet.</div>';
}

let collectionAnime = [];
let currentFilter = "all";

function renderCollection() {
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

  document.getElementById("resultCount").textContent = `${filtered.length} anime shown`;

  document.getElementById("animeGrid").innerHTML = filtered.length
    ? filtered.map((item) => `
        <article
          class="anime-card"
          data-title="${escapeHtml(item.title)}"
          data-anilist-id="${escapeHtml(item.anilistId)}"
          data-cache-key="${escapeHtml(cacheKeyFor(item))}"
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

              <span class="rating">
                ${Number.isFinite(item.rating)
                  ? `⭐ ${item.rating.toFixed(1)}`
                  : "Not rated yet"}
              </span>
            </div>
          </div>
        </article>
      `).join("")
    : '<div class="empty-state">No anime match your search or filter.</div>';

  loadPosters();
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
    '<div class="loading">Searching AniList…</div>';

  try {
    const results = await searchAniListPage(search);

    resultsContainer.innerHTML = results.length
      ? results.map((anime) => {
          const title = anime.title?.english || anime.title?.romaji || "Untitled";
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
            <article class="search-result-card">
              <img src="${escapeHtml(poster)}" alt="${escapeHtml(title)} poster">

              <div>
                <h3 class="search-result-title">${escapeHtml(title)}</h3>
                <div class="search-result-meta">
                  ${escapeHtml(format)} • ${escapeHtml(episodes)} • ${escapeHtml(year)}
                  <br>
                  AniList ID: ${anime.id}
                </div>
              </div>

              <button
                class="select-anime-btn"
                type="button"
                data-id="${anime.id}"
                data-title="${escapeHtml(title)}"
              >
                Select
              </button>
            </article>
          `;
        }).join("")
      : '<div class="empty-state">No matching anime found.</div>';

    document.querySelectorAll(".select-anime-btn").forEach((button) => {
      button.addEventListener("click", () => {
        alert(
          `${button.dataset.title} selected.\n\nSaving will be connected in the next step.`
        );
      });
    });
  } catch (error) {
    console.error(error);
    resultsContainer.innerHTML =
      '<div class="error">AniList search failed. Please try again.</div>';
  }
}

function initAddAnimeModal() {
  const openButton = document.getElementById("openAddAnimeBtn");
  const closeButton = document.getElementById("closeAddAnimeBtn");
  const modal = document.getElementById("addAnimeModal");
  const searchButton = document.getElementById("searchAniListBtn");
  const searchInput = document.getElementById("addAnimeSearchInput");

  if (!openButton || !closeButton || !modal || !searchButton || !searchInput) return;

  openButton.addEventListener("click", openAddAnimeModal);
  closeButton.addEventListener("click", closeAddAnimeModal);
  searchButton.addEventListener("click", runAddAnimeSearch);

  searchInput.addEventListener("keydown", (event) => {
    if (event.key === "Enter") runAddAnimeSearch();
  });

  modal.addEventListener("click", (event) => {
    if (event.target === modal) closeAddAnimeModal();
  });

  document.addEventListener("keydown", (event) => {
    if (event.key === "Escape") closeAddAnimeModal();
  });
}

async function initDashboard() {
  try {
    const anime = await loadAnimeData();
    renderDashboard(anime);
  } catch (error) {
    console.error(error);
    document.querySelectorAll(".stat-number").forEach((element) => {
      element.textContent = "!";
    });

    document.getElementById("topRated").innerHTML =
      '<div class="error">Could not load your Google Sheet.</div>';

    document.getElementById("queueList").innerHTML =
      '<div class="error">Could not load your Google Sheet.</div>';
  }
}

async function initCollection() {
  try {
    collectionAnime = await loadAnimeData();
    renderCollection();

    document.getElementById("searchInput")
      .addEventListener("input", renderCollection);

    document.getElementById("sortSelect")
      .addEventListener("change", renderCollection);

    document.querySelectorAll(".filter-btn").forEach((button) => {
      button.addEventListener("click", () => {
        document.querySelectorAll(".filter-btn").forEach((item) => {
          item.classList.remove("active");
        });

        button.classList.add("active");
        currentFilter = button.dataset.filter;
        renderCollection();
      });
    });

    initAddAnimeModal();
  } catch (error) {
    console.error(error);

    document.getElementById("animeGrid").innerHTML =
      '<div class="error">Could not load your Google Sheet.</div>';
  }
}
