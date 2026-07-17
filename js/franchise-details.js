const FRANCHISE_RATING_FIELDS = [
  { key: "story", label: "Story", description: "How strong and well-written the plot is, including structure, conflict, and payoff." },
  { key: "characters", label: "Characters", description: "How well-developed, believable, and memorable the main and supporting characters are." },
  { key: "animation", label: "Visuals", description: "The quality of the animation, artwork, CGI, cinematography, and overall presentation." },
  { key: "sound", label: "Sound", description: "The quality of the music, sound design, voice acting, and audio atmosphere." },
  { key: "world", label: "World", description: "How interesting, detailed, and believable the setting and world-building are." },
  { key: "pacing", label: "Pacing", description: "How well the story moves without feeling rushed, slow, or repetitive." },
  { key: "emotion", label: "Emotion", description: "How strongly the anime makes you feel invested, excited, sad, tense, or connected." },
  { key: "originality", label: "Originality", description: "How fresh, creative, or distinctive the anime feels compared with similar shows." },
  { key: "rewatch_value", label: "Rewatch Value", description: "How likely you would be to watch the anime again." },
  { key: "enjoyment", label: "Enjoyment", description: "How much you personally enjoyed the overall experience." }
];

let fdUser = null;
let fdViewingUser = null;
let fdFranchise = null;
let fdEntries = [];
let fdEntryMedia = [];
let fdEntryRatings = [];
let fdExistingAnimeRatings = [];
let fdProfile = null;
let fdHeroMedia = null;
let fdCollectionCount = 0;

function fdEsc(value) {
  return String(value ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}
function fdNormalize(value) { return String(value ?? "").trim().toLowerCase(); }
function fdStripHtml(value) { const temp = document.createElement("div"); temp.innerHTML = String(value || ""); return temp.textContent || temp.innerText || ""; }
function fdStatusClass(status) {
  const value = fdNormalize(status);
  if (value === "completed") return "status-completed";
  if (value === "in progress") return "status-progress";
  if (value === "waiting") return "status-waiting";
  if (value === "dropped") return "status-dropped";
  return "status-queued";
}
function fdStatusOptions(selected) {
  return ["Queued", "In Progress", "Waiting", "Completed", "Dropped"]
    .map((status) => `<option value="${status}" ${status === selected ? "selected" : ""}>${status}</option>`)
    .join("");
}
function fdAverage(row) {
  if (!row) return null;
  if (row.overall_rating !== null && row.overall_rating !== undefined && row.overall_rating !== "") {
    const direct = Number(row.overall_rating);
    if (Number.isFinite(direct) && direct > 0) return direct;
  }
  const scores = FRANCHISE_RATING_FIELDS
    .map(({ key }) => row[key] === null || row[key] === undefined || row[key] === "" ? null : Number(row[key]))
    .filter((value) => Number.isFinite(value) && value > 0);
  return scores.length === 10 ? scores.reduce((sum, n) => sum + n, 0) / 10 : null;
}
function fdCalculatedFranchiseRating() {
  const scores = fdEntryMedia
    .map((entry) => fdAverage(fdEntryRatingFor(entry.anilist_id)))
    .filter((value) => Number.isFinite(value) && value > 0);
  return scores.length ? scores.reduce((sum, score) => sum + score, 0) / scores.length : null;
}
function fdEntryRatingFor(anilistId) {
  const dedicated = fdEntryRatings.find((row) => Number(row.anilist_id) === Number(anilistId)) || null;
  const existing = fdExistingAnimeRatings.find((row) => Number(row.anilist_id) === Number(anilistId)) || null;
  if (!dedicated) return existing;
  if (!existing) return dedicated;
  const dedicatedTime = Date.parse(dedicated.updated_at || 0) || 0;
  const existingTime = Date.parse(existing.updated_at || 0) || 0;
  return existingTime > dedicatedTime ? existing : dedicated;
}
function fdAdvancedSliders(row, prefix, dataAttribute) {
  return FRANCHISE_RATING_FIELDS.map(({ key, label, description }) => {
    const stored = Number(row?.[key]);
    const value = Number.isFinite(stored) && stored >= 1 && stored <= 10 ? stored : 5;
    return `<div class="rating-slider-group">
      <div class="rating-slider-heading">
        <label for="${prefix}-${key}">${fdEsc(label)}</label>
        <output id="${prefix}-${key}-value">${value}</output>
      </div>
      <p>${fdEsc(description)}</p>
      <div class="rating-slider-control">
        <span>1</span>
        <input id="${prefix}-${key}" type="range" min="1" max="10" step="1" value="${value}" ${dataAttribute}="${key}">
        <span>10</span>
      </div>
    </div>`;
  }).join("");
}

async function fdLoad(key) {
  const viewingFriend = fdViewingUser && fdViewingUser !== fdUser.id;
  const [catalog, entries, userFranchise, profile] = await Promise.all([
    supabaseClient.from("franchise_catalog").select("*").eq("franchise_key", key).single(),
    matLoadFranchiseEntries(key),
    viewingFriend
      ? supabaseClient.rpc("get_friend_franchises", { p_friend_user_id: fdViewingUser })
      : supabaseClient.from("user_franchises").select("*").eq("franchise_key", key).maybeSingle(),
    supabaseClient.from("profiles").select("*").eq("user_id", fdUser.id).single()
  ]);
  if (catalog.error) throw catalog.error;
  if (userFranchise.error) throw userFranchise.error;
  if (profile.error) throw profile.error;

  const franchiseRow = viewingFriend
    ? (userFranchise.data || []).find((row) => Number(row.franchise_key) === Number(key))
    : userFranchise.data;
  if (!franchiseRow) throw new Error("This franchise is not available on that profile.");

  fdFranchise = { ...franchiseRow, ...catalog.data };
  fdProfile = profile.data;
  fdEntries = (entries || []).filter((entry) => matEntryVisibleForPrefs(entry, matFranchisePrefs(fdProfile)));
  const media = await matFetchMediaBatch(fdEntries.map((entry) => entry.anilist_id));
  const mediaMap = new Map(media.map((item) => [Number(item.id), item]));
  fdEntryMedia = fdEntries.map((entry) => ({ ...entry, media: mediaMap.get(Number(entry.anilist_id)) || null }));
  fdHeroMedia = mediaMap.get(Number(fdFranchise.cover_anilist_id)) || await matFetchRelationNode(fdFranchise.cover_anilist_id);
  const countResult = await supabaseClient.rpc("get_franchise_collection_count", { p_franchise_key: Number(key) });
  fdCollectionCount = countResult.error ? 0 : Number(countResult.data) || 0;

  if (!viewingFriend) {
    const entryIds = fdEntries.map((entry) => Number(entry.anilist_id)).filter(Number.isFinite);
    const [entryRatingsResult, existingAnimeResult] = await Promise.all([
      supabaseClient
        .from("user_franchise_entry_ratings")
        .select("*")
        .eq("user_id", fdUser.id)
        .eq("franchise_key", Number(key)),
      entryIds.length
        ? supabaseClient
            .from("anime")
            .select("id,anilist_id,status,rating_mode,overall_rating,story,characters,animation,sound,world,pacing,emotion,originality,rewatch_value,enjoyment,updated_at")
            .eq("user_id", fdUser.id)
            .in("anilist_id", entryIds)
        : Promise.resolve({ data: [], error: null })
    ]);
    if (entryRatingsResult.error && entryRatingsResult.error.code !== "42P01") throw entryRatingsResult.error;
    if (existingAnimeResult.error) throw existingAnimeResult.error;
    fdEntryRatings = entryRatingsResult.data || [];
    fdExistingAnimeRatings = existingAnimeResult.data || [];
    await fdRefreshFranchiseOverall();
  }
}

function fdEntryCard(entry, index) {
  const media = entry.media || {};
  const poster = media.coverImage?.large || media.coverImage?.extraLarge || "";
  const year = media.seasonYear || media.startDate?.year || "Year unavailable";
  const format = String(entry.media_format || media.format || "Anime").replaceAll("_", " ");
  const episodes = media.episodes ? `${media.episodes} episodes` : "Episode count unavailable";
  const href = `anime.html?anilist_id=${encodeURIComponent(entry.anilist_id)}&franchise_key=${encodeURIComponent(fdFranchise.franchise_key)}`;
  const rating = fdAverage(fdEntryRatingFor(entry.anilist_id));
  const ownView = fdViewingUser === fdUser.id;
  return `<article class="franchise-entry-card" data-entry-card="${index}">
    <a class="franchise-entry-main" href="${href}">
      <div class="franchise-entry-poster">
        ${poster ? `<img src="${fdEsc(poster)}" alt="${fdEsc(entry.title)} poster" loading="lazy">` : `<div class="poster-placeholder">🎌</div>`}
      </div>
      <div class="franchise-entry-copy">
        <h3>${fdEsc(entry.title)}</h3>
        <p>${fdEsc(format)} • ${fdEsc(year)} • ${fdEsc(episodes)}</p>
        ${rating !== null ? `<span class="entry-rating-readout">⭐ ${rating.toFixed(1)}</span>` : `<span class="entry-rating-readout unrated">Not rated</span>`}
      </div>
    </a>
    ${ownView ? `<button class="entry-rate-btn" type="button" data-rate-entry="${index}">${rating !== null ? "Edit Rating" : "Rate"}</button>` : ""}
  </article>`;
}

function fdEntryRatingForm(entry, index) {
  const row = fdEntryRatingFor(entry.anilist_id);
  const rating = fdAverage(row) ?? 5;
  const advanced = row?.rating_mode === "advanced";
  const prefix = `entry-modal-${index}`;
  return `<div class="edit-modal-backdrop hidden" id="entryRatingModal" aria-hidden="true">
    <section class="edit-modal-card franchise-entry-rating-modal" role="dialog" aria-modal="true">
      <div class="edit-modal-header">
        <div><h2>Rate ${fdEsc(entry.title)}</h2><p>Use one overall score or open Advanced Rating.</p></div>
        <button class="edit-close-btn" id="closeEntryRatingBtn" type="button">×</button>
      </div>
      <form id="entryRatingForm" class="edit-form" data-rating-entry-index="${index}">
        <div class="simple-rating-box">
          <div><strong>Overall Rating</strong><small>Choose one score from 1–10.</small></div>
          <output id="entryModalOverallOutput">${rating.toFixed(1)}</output>
          <div class="rating-slider-control">
            <span>1</span><input id="entryModalOverall" type="range" min="1" max="10" step="0.1" value="${rating}"><span>10</span>
          </div>
        </div>
        <details id="entryModalAdvanced" class="advanced-rating-disclosure">
          <summary>Advanced Rating</summary>
          <div class="rating-slider-list">${fdAdvancedSliders(row, prefix, "data-entry-modal-field")}</div>
        </details>
        <div class="edit-message" id="entryRatingMessage"></div>
        <div class="edit-form-actions"><button class="secondary-action-btn" id="cancelEntryRatingBtn" type="button">Cancel</button><button class="save-anime-btn" type="submit">Save Rating</button></div>
      </form>
    </section>
  </div>`;
}

function fdStatusModalMarkup() {
  return `<div class="edit-modal-backdrop hidden" id="franchiseStatusModal" aria-hidden="true">
    <section class="edit-modal-card franchise-status-modal-card" role="dialog" aria-modal="true">
      <div class="edit-modal-header">
        <div><h2>Change Status</h2><p>Update ${fdEsc(fdFranchise.title)}.</p></div>
        <button class="edit-close-btn" id="closeFranchiseStatusBtn" type="button">×</button>
      </div>
      <form id="franchiseStatusForm" class="edit-form">
        <label>Status<select id="franchiseStatusSelect">${fdStatusOptions(fdFranchise.status || "Queued")}</select></label>
        <details class="status-guide">
          <summary>ⓘ Status Guide</summary>
          <div class="status-guide-list">
            <p><strong>Queued:</strong> You've added this franchise but haven't started watching it yet.</p>
            <p><strong>In Progress:</strong> You're currently watching this franchise.</p>
            <p><strong>Waiting:</strong> You're waiting for new episodes, movies, or the next season.</p>
            <p><strong>Completed:</strong> You've finished the franchise entries you consider complete.</p>
            <p><strong>Dropped:</strong> You've decided not to continue this franchise.</p>
          </div>
        </details>
        <div class="edit-message" id="franchiseStatusMessage"></div>
        <div class="edit-form-actions"><button class="secondary-action-btn" id="cancelFranchiseStatusBtn" type="button">Cancel</button><button class="save-anime-btn" type="submit">Save Status</button></div>
      </form>
    </section>
  </div>`;
}

function openFranchiseCollectionPopup(){ document.getElementById("franchiseCountModal")?.remove(); document.body.insertAdjacentHTML("beforeend", `<div class="mat-popup-backdrop" id="franchiseCountModal"><section class="mat-popup-card"><button class="mat-popup-close" id="franchiseCountClose" type="button">×</button><h2>Collection Count</h2><p><strong>${fdCollectionCount.toLocaleString()}</strong> users have this franchise in their collection.</p><div class="mat-popup-actions"><button class="secondary-btn" id="franchiseCountDismiss" type="button">Close</button></div></section></div>`); const close=()=>document.getElementById("franchiseCountModal")?.remove(); document.getElementById("franchiseCountClose").onclick=close; document.getElementById("franchiseCountDismiss").onclick=close; }

function fdRender() {
  const root = document.getElementById("franchiseRoot");
  const poster = fdHeroMedia?.coverImage?.extraLarge || fdHeroMedia?.coverImage?.large || "";
  const synopsis = fdStripHtml(fdHeroMedia?.description) || "No description is available yet.";
  const ownView = fdViewingUser === fdUser.id;
  const rating = ownView ? fdCalculatedFranchiseRating() : fdAverage(fdFranchise);

  root.innerHTML = `
    <a class="standalone-back" href="collection.html">← Collection</a>
    <section class="franchise-hero">
      <div class="franchise-hero-poster">${poster ? `<img src="${fdEsc(poster)}" alt="${fdEsc(fdFranchise.title)} poster">` : `<div class="poster-placeholder">🎌</div>`}</div>
      <div class="franchise-hero-copy">
        <h1>${fdEsc(fdFranchise.title)}</h1>
        <span class="franchise-pill">Franchise</span>
        <button class="community-count-btn" id="franchiseCollectionCount" type="button">📚 <span>${fdCollectionCount.toLocaleString()}</span></button>
        <details class="description-disclosure franchise-description"><summary>Description</summary><p>${fdEsc(synopsis)}</p></details>
        <div class="details-actions franchise-actions">
          <span class="details-status status ${fdStatusClass(fdFranchise.status)}">${fdEsc(fdFranchise.status || "Queued")}</span>
          ${rating !== null ? `<span class="details-rating">⭐ ${rating.toFixed(1)}</span>` : ""}
          ${ownView ? `<button class="edit-anime-btn status-details-btn" id="changeFranchiseStatusBtn" type="button">Change Status</button>` : ""}
        </div>
      </div>
    </section>
    <section class="franchise-entries-section">
      <div class="profile-section-heading"><h2>Entries</h2></div>
      <div class="franchise-entry-list">${fdEntryMedia.map(fdEntryCard).join("")}</div>
    </section>
    ${ownView ? fdStatusModalMarkup() : ""}
    <div id="entryRatingModalHost"></div>`;

  document.getElementById("franchiseCollectionCount")?.addEventListener("click", () => openFranchiseCollectionPopup());
  if (ownView) fdBind();
}

async function fdRefreshFranchiseOverall() {
  const average = fdCalculatedFranchiseRating();
  const changes = {
    overall_rating: average === null ? null : Number(average.toFixed(1)),
    rating_mode: average === null ? null : "entries",
    updated_at: new Date().toISOString()
  };
  const { error: updateError } = await supabaseClient
    .from("user_franchises")
    .update(changes)
    .eq("user_id", fdUser.id)
    .eq("franchise_key", Number(fdFranchise.franchise_key));
  if (updateError) throw updateError;
  fdFranchise = { ...fdFranchise, ...changes };
}

function fdOpenEntryRating(index) {
  const entry = fdEntryMedia[index];
  const host = document.getElementById("entryRatingModalHost");
  host.innerHTML = fdEntryRatingForm(entry, index);
  const modal = document.getElementById("entryRatingModal");
  const close = () => { modal.classList.add("hidden"); document.body.classList.remove("modal-open"); host.innerHTML = ""; };
  modal.classList.remove("hidden");
  document.body.classList.add("modal-open");

  const overall = document.getElementById("entryModalOverall");
  const output = document.getElementById("entryModalOverallOutput");
  const advanced = document.getElementById("entryModalAdvanced");
  document.getElementById("closeEntryRatingBtn").onclick = close;
  document.getElementById("cancelEntryRatingBtn").onclick = close;
  overall.addEventListener("input", () => { output.textContent = Number(overall.value).toFixed(1); });

  const recalcAdvanced = () => {
    const values = FRANCHISE_RATING_FIELDS.map(({ key }) => Number(document.querySelector(`[data-entry-modal-field="${key}"]`).value));
    const average = values.reduce((sum, value) => sum + value, 0) / values.length;
    overall.value = average.toFixed(1);
    output.textContent = average.toFixed(1);
  };
  advanced.addEventListener("toggle", () => {
    overall.disabled = advanced.open;
    if (advanced.open) recalcAdvanced();
  });
  document.querySelectorAll("[data-entry-modal-field]").forEach((slider) => {
    slider.addEventListener("input", () => {
      document.getElementById(`${slider.id}-value`).textContent = slider.value;
      recalcAdvanced();
    });
  });

  document.getElementById("entryRatingForm").addEventListener("submit", async (event) => {
    event.preventDefault();
    const message = document.getElementById("entryRatingMessage");
    message.textContent = "Saving…";
    const now = new Date().toISOString();
    const row = {
      user_id: fdUser.id,
      franchise_key: Number(fdFranchise.franchise_key),
      anilist_id: Number(entry.anilist_id),
      rating_mode: advanced.open ? "advanced" : "simple",
      overall_rating: Number(output.textContent),
      updated_at: now
    };
    FRANCHISE_RATING_FIELDS.forEach(({ key }) => { row[key] = advanced.open ? Number(document.querySelector(`[data-entry-modal-field="${key}"]`).value) : null; });
    try {
      const { data: savedRating, error } = await supabaseClient
        .from("user_franchise_entry_ratings")
        .upsert(row, { onConflict: "user_id,franchise_key,anilist_id" })
        .select("*")
        .single();
      if (error) throw error;
      const savedIndex = fdEntryRatings.findIndex((item) => Number(item.anilist_id) === Number(entry.anilist_id));
      if (savedIndex >= 0) fdEntryRatings[savedIndex] = savedRating;
      else fdEntryRatings.push(savedRating);
      const existingAnime = fdExistingAnimeRatings.find((item) => Number(item.anilist_id) === Number(entry.anilist_id));
      if (existingAnime) {
        const changes = { rating_mode: row.rating_mode, overall_rating: row.overall_rating, updated_at: now };
        FRANCHISE_RATING_FIELDS.forEach(({ key }) => { changes[key] = row[key]; });
        const { error: syncError } = await supabaseClient.from("anime").update(changes).eq("id", existingAnime.id).eq("user_id", fdUser.id);
        if (syncError) throw syncError;
      }
      await fdRefreshFranchiseOverall();
      close();
      location.reload();
    } catch (error) {
      console.error(error);
      message.textContent = error.message || "Could not save this rating.";
    }
  });
}

function fdBind() {
  const modal = document.getElementById("franchiseStatusModal");
  const open = () => { modal.classList.remove("hidden"); document.body.classList.add("modal-open"); };
  const close = () => { modal.classList.add("hidden"); document.body.classList.remove("modal-open"); };
  document.getElementById("changeFranchiseStatusBtn").onclick = open;
  document.getElementById("closeFranchiseStatusBtn").onclick = close;
  document.getElementById("cancelFranchiseStatusBtn").onclick = close;
  document.querySelectorAll("[data-rate-entry]").forEach((button) => {
    button.addEventListener("click", () => fdOpenEntryRating(Number(button.dataset.rateEntry)));
  });
  document.getElementById("franchiseStatusForm").addEventListener("submit", async (event) => {
    event.preventDefault();
    const message = document.getElementById("franchiseStatusMessage");
    message.textContent = "Saving…";
    try {
      const { error } = await supabaseClient
        .from("user_franchises")
        .update({ status: document.getElementById("franchiseStatusSelect").value, updated_at: new Date().toISOString() })
        .eq("user_id", fdUser.id)
        .eq("franchise_key", fdFranchise.franchise_key);
      if (error) throw error;
      close();
      location.reload();
    } catch (error) {
      console.error(error);
      message.textContent = error.message || "Could not save franchise status.";
    }
  });
}

async function initFranchiseDetails(user) {
  fdUser = user;
  const params = new URLSearchParams(location.search);
  const key = params.get("key");
  fdViewingUser = params.get("user") || user.id;
  if (!key) {
    document.getElementById("franchiseRoot").innerHTML = `<div class="error">No franchise was selected.</div>`;
    return;
  }
  try {
    await fdLoad(key);
    fdRender();
  } catch (error) {
    console.error(error);
    const type = error?.matErrorType || (navigator.onLine === false ? "offline" : "unexpected");
    window.matShowNetworkError?.(error, { type, retry: () => location.reload(), goBack: () => history.back() });
    document.getElementById("franchiseRoot").innerHTML = `<div class="error">Could not load this franchise.</div>`;
  }
}
