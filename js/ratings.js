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

function completeRating(record) {
  return [record.story, record.animation, record.enjoyment].every((value) => rNum(value) !== null);
}

function overall(record) {
  if (!completeRating(record)) return null;
  return (Number(record.story) + Number(record.animation) + Number(record.enjoyment)) / 3;
}

async function loadRatingsRecords() {
  const { data, error } = await supabaseClient
    .from("anime")
    .select("id, anilist_id, title, status, story, animation, enjoyment, favorite, updated_at")
    .order("title", { ascending: true });
  if (error) throw error;
  return data || [];
}

async function fetchPoster(anilistId) {
  const query = `query ($id: Int) { Media(id: $id, type: ANIME) { coverImage { large medium } } }`;
  const response = await fetch(RATINGS_ANILIST_ENDPOINT, {
    method: "POST",
    headers: { "Content-Type": "application/json", Accept: "application/json" },
    body: JSON.stringify({ query, variables: { id: Number(anilistId) } })
  });
  if (!response.ok) return "";
  const json = await response.json();
  return json?.data?.Media?.coverImage?.large || json?.data?.Media?.coverImage?.medium || "";
}

async function fillPosters() {
  const images = [...document.querySelectorAll("[data-rating-poster]")];
  for (let i = 0; i < images.length; i += 5) {
    await Promise.all(images.slice(i, i + 5).map(async (holder) => {
      try {
        const url = await fetchPoster(holder.dataset.ratingPoster);
        if (url) holder.outerHTML = `<img src="${rEsc(url)}" alt="Anime poster" loading="lazy">`;
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
        <a class="rate-now-btn" href="anime.html?id=${encodeURIComponent(record.id)}&edit=1">Rate Now</a>
      </article>
    `).join("") : '<div class="empty-state">Every completed anime has been rated.</div>';
    fillPosters();
    return;
  }

  controls.classList.remove("hidden");
  const search = document.getElementById("ratingsSearch").value.trim().toLowerCase();
  const sort = document.getElementById("ratingsSort").value;
  const favoritesOnly = document.getElementById("favoritesOnly").checked;
  let items = ratingsRecords.filter((record) => completeRating(record));
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
    <a class="rating-row" href="anime.html?id=${encodeURIComponent(record.id)}">
      <div class="rating-poster-placeholder" data-rating-poster="${record.anilist_id}">🎌</div>
      <div>
        <h2 class="rating-row-title">${rEsc(record.title)}${record.favorite ? " ♥" : ""}</h2>
        <div class="rating-breakdown">
          <span>Story ${Number(record.story).toFixed(1)}</span>
          <span>Animation ${Number(record.animation).toFixed(1)}</span>
          <span>Enjoyment ${Number(record.enjoyment).toFixed(1)}</span>
        </div>
      </div>
      <div class="rating-overall">⭐ ${overall(record).toFixed(1)}</div>
    </a>
  `).join("") : '<div class="empty-state">No rated anime match this filter.</div>';
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
