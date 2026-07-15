const RATINGS_ANILIST_ENDPOINT = "https://graphql.anilist.co";
let ratingsRecords = [];
let ratingsTab = "rated";

function rEsc(value) {
  return String(value ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

function rNum(value) {
  if (value === null || value === undefined || value === "") return null;
  const number = Number(value);
  return Number.isFinite(number) ? number : null;
}

const RATING_FIELDS = ["story","characters","animation","sound","world","pacing","emotion","originality","rewatch_value","enjoyment"];

function completeRating(record) {
  return RATING_FIELDS.every((field) => rNum(record[field]) !== null);
}

function overall(record) {
  if (!completeRating(record)) return null;
  return RATING_FIELDS.reduce((sum, field) => sum + Number(record[field]), 0) / RATING_FIELDS.length;
}

async function loadRatingsRecords() {
  const { data, error } = await supabaseClient
    .from("anime")
    .select("id, anilist_id, title, status, story, characters, animation, sound, world, pacing, emotion, originality, rewatch_value, enjoyment, favorite, updated_at")
    .order("title", { ascending: true });
  if (error) throw error;
  return data || [];
}

async function fetchPoster(anilistId) {
  const query = `query ($id: Int) { Media(id: $id, type: ANIME) { isAdult coverImage { large medium } } }`;
  const response = await fetch(RATINGS_ANILIST_ENDPOINT, {
    method: "POST",
    headers: { "Content-Type": "application/json", Accept: "application/json" },
    body: JSON.stringify({ query, variables: { id: Number(anilistId) } })
  });
  if (!response.ok) return { url: "", isAdult: false };
  const json = await response.json();
  const media = json?.data?.Media;
  return { url: media?.coverImage?.large || media?.coverImage?.medium || "", isAdult: Boolean(media?.isAdult) };
}

async function fillPosters() {
  const images = [...document.querySelectorAll("[data-rating-poster]")];
  for (let i = 0; i < images.length; i += 5) {
    await Promise.all(images.slice(i, i + 5).map(async (holder) => {
      try {
        const poster = await fetchPoster(holder.dataset.ratingPoster);
        if (poster.url) {
          holder.classList.toggle("mat-adult-poster-hidden", poster.isAdult && !matShow18Posters());
          holder.innerHTML = `<img src="${rEsc(poster.url)}" alt="Anime poster" loading="lazy">${matAdultPosterOverlay(poster.isAdult)}`;
        }
      } catch (error) { console.warn(error); }
    }));
  }
}

function renderRatings() {
  const list = document.getElementById("ratingsList");
  const meta = document.getElementById("ratingsMeta");
  const controls = document.getElementById("ratedControls");

  if (ratingsTab === "unrated") {
    controls.classList.add("hidden");
    const items = ratingsRecords.filter((record) =>
      String(record.status || "").toLowerCase() === "completed" && !completeRating(record)
    );
    meta.textContent = `${items.length} completed anime ${items.length === 1 ? "needs" : "need"} a rating`;
    list.innerHTML = items.length ? items.map((record) => `
      <article class="rating-row">
        <div class="rating-poster-placeholder" data-rating-poster="${record.anilist_id}">🎌</div>
        <div>
          <h2 class="rating-row-title">${rEsc(record.title)}</h2>
          <div class="rating-breakdown">Completed • Rating incomplete</div>
        </div>
        <a class="rate-now-btn" href="anime.html?id=${encodeURIComponent(record.id)}&edit=1">Rate Anime</a>
      </article>
    `).join("") : '<div class="empty-state">Every completed anime has been rated.</div>';
    fillPosters();
    return;
  }

  controls.classList.remove("hidden");
  const search = document.getElementById("ratingsSearch").value.trim().toLowerCase();
  const sort = document.getElementById("ratingsSort").value;
  const favoritesOnly = document.getElementById("favoritesOnly").checked;
  let items = ratingsRecords.filter((record) => String(record.status || "").toLowerCase() === "completed" && completeRating(record));
  if (search) items = items.filter((record) => String(record.title).toLowerCase().includes(search));
  if (favoritesOnly) items = items.filter((record) => record.favorite);
  items.sort((a, b) => {
    if (sort === "highest") return overall(b) - overall(a) || a.title.localeCompare(b.title);
    if (sort === "lowest") return overall(a) - overall(b) || a.title.localeCompare(b.title);
    if (sort === "za") return b.title.localeCompare(a.title);
    return a.title.localeCompare(b.title);
  });
  meta.textContent = `${items.length} rated anime shown`;
  list.innerHTML = items.length ? items.map((record) => `
    <article class="rating-row rated-rating-row">
      <a class="rating-row-main" href="anime.html?id=${encodeURIComponent(record.id)}">
        <div class="rating-poster-placeholder" data-rating-poster="${record.anilist_id}">🎌</div>
        <div>
          <h2 class="rating-row-title">${rEsc(record.title)}${record.favorite ? " ♥" : ""}</h2>
          <div class="rating-breakdown">Completed • 10-category rating</div>
        </div>
        <div class="rating-overall">⭐ ${overall(record).toFixed(1)}</div>
      </a>
      <a class="rate-now-btn" href="anime.html?id=${encodeURIComponent(record.id)}&edit=1">Rate Anime</a>
    </article>
  `).join("") : '<div class="empty-state">No completed rated anime match this filter.</div>';
  fillPosters();
}

async function initRatings() {
  try {
    ratingsRecords = await loadRatingsRecords();
    document.querySelectorAll(".ratings-tab").forEach((button) => {
      button.addEventListener("click", () => {
        document.querySelectorAll(".ratings-tab").forEach((item) => item.classList.remove("active"));
        button.classList.add("active");
        ratingsTab = button.dataset.tab;
        renderRatings();
      });
    });
    document.getElementById("ratingsSearch").addEventListener("input", renderRatings);
    document.getElementById("ratingsSort").addEventListener("change", renderRatings);
    document.getElementById("favoritesOnly").addEventListener("change", renderRatings);
    renderRatings();
  } catch (error) {
    console.error(error);
    document.getElementById("ratingsList").innerHTML = `<div class="error">${rEsc(error.message || "Could not load ratings.")}</div>`;
  }
}
