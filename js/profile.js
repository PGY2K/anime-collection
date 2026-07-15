const PROFILE_ANILIST_ENDPOINT = "https://graphql.anilist.co";
let currentProfileUser = null;
let currentProfileData = null;
let selectedAvatarId = 1;
let profileAnime = [];

function escapeProfileHtml(value) {
  return String(value ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

function profileNormalize(value) { return String(value ?? "").trim().toLowerCase(); }
function profileAverage(item) {
  const scores = ["story","characters","animation","sound","world","pacing","emotion","originality","rewatch_value","enjoyment"]
    .map((field) => item[field] === null || item[field] === "" ? null : Number(item[field]))
    .filter(Number.isFinite);
  if (scores.length < 10) return null;
  return scores.reduce((sum, value) => sum + value, 0) / scores.length;
}

function makeFriendCode() {
  const alphabet = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  return Array.from({ length: 8 }, () => alphabet[Math.floor(Math.random() * alphabet.length)]).join("");
}
function defaultUsername(user) {
  const cleaned = String(user.email || "AnimeFan").split("@")[0].replace(/[^a-zA-Z0-9_]/g, "").slice(0, 20);
  return cleaned || `AnimeFan${Math.floor(Math.random() * 9000 + 1000)}`;
}
async function createProfile(user) {
  for (let attempt = 0; attempt < 5; attempt += 1) {
    const payload = { user_id: user.id, username: attempt ? `${defaultUsername(user)}${attempt}` : defaultUsername(user), avatar_id: 1, friend_code: makeFriendCode() };
    const { data, error } = await supabaseClient.from("profiles").insert(payload).select().single();
    if (!error) return data;
    if (error.code !== "23505") throw error;
  }
  throw new Error("Could not generate a unique profile.");
}
async function getOrCreateProfile(user) {
  const { data, error } = await supabaseClient.from("profiles").select("*").eq("user_id", user.id).maybeSingle();
  if (error) throw error;
  return data || createProfile(user);
}
async function loadProfileAnime() {
  const { data, error } = await supabaseClient.from("anime")
    .select("id, anilist_id, title, status, story, characters, animation, sound, world, pacing, emotion, originality, rewatch_value, enjoyment")
    .order("title");
  if (error) throw error;
  return data || [];
}
async function loadProfilePosters(items) {
  const ids = [...new Set(items.map((item) => Number(item.anilist_id)).filter(Number.isFinite))];
  if (!ids.length) return new Map();
  const query = `query ($ids: [Int]) { Page(page: 1, perPage: 20) { media(id_in: $ids, type: ANIME) { id isAdult coverImage { extraLarge large } } } }`;
  const response = await fetch(PROFILE_ANILIST_ENDPOINT, { method: "POST", headers: { "Content-Type": "application/json", Accept: "application/json" }, body: JSON.stringify({ query, variables: { ids } }) });
  if (!response.ok) return new Map();
  const json = await response.json();
  return new Map((json?.data?.Page?.media || []).map((item) => [Number(item.id), { url: item.coverImage?.extraLarge || item.coverImage?.large || "", isAdult: Boolean(item.isAdult) }]));
}
function statusCount(status) { return profileAnime.filter((item) => profileNormalize(item.status) === status).length; }

async function renderProfile() {
  selectedAvatarId = Number(currentProfileData.avatar_id) || 1;
  const topFive = profileAnime.map((item) => ({ ...item, rating: profileAverage(item) }))
    .filter((item) => item.rating !== null)
    .sort((a,b) => b.rating - a.rating || a.title.localeCompare(b.title)).slice(0,5);
  const posters = await loadProfilePosters(topFive);
  const root = document.getElementById("profileRoot");
  root.innerHTML = `
    <section class="public-profile-card">
      <img class="profile-main-avatar" src="${profileAvatarPath(selectedAvatarId)}" alt="Your profile avatar" />
      <h2>${escapeProfileHtml(currentProfileData.username || "Anime Fan")}</h2>
      <p class="profile-private-note">Visible only to accepted friends.</p>

      <div class="profile-stat-grid">
        <div><strong>${statusCount("in progress")}</strong><span>Watching</span></div>
        <div><strong>${statusCount("waiting")}</strong><span>Waiting</span></div>
        <div><strong>${statusCount("queued")}</strong><span>Queued</span></div>
        <div><strong>${statusCount("completed")}</strong><span>Completed</span></div>
        <div><strong>${statusCount("dropped")}</strong><span>Dropped</span></div>
      </div>

      <section class="profile-top-section">
        <div class="profile-section-heading"><h3>⭐ Top 5 Anime</h3><span>Highest rated</span></div>
        <div class="profile-top-grid">
          ${topFive.length ? topFive.map((item, index) => `
            <a class="profile-top-card${matAdultPosterClass(posters.get(Number(item.anilist_id))?.isAdult)}" href="anime.html?id=${encodeURIComponent(item.id)}">
              ${posters.get(Number(item.anilist_id))?.url ? `<img src="${escapeProfileHtml(posters.get(Number(item.anilist_id)).url)}" alt="${escapeProfileHtml(item.title)} poster" />${matAdultPosterOverlay(posters.get(Number(item.anilist_id)).isAdult)}` : '<div class="poster-placeholder">🎌</div>'}
              <span class="profile-top-rank">#${index + 1}</span>
              <div><strong>${escapeProfileHtml(item.title)}</strong><small>⭐ ${item.rating.toFixed(1)}</small></div>
            </a>`).join("") : '<div class="empty-state">Rate anime to build your Top 5.</div>'}
        </div>
      </section>

      <div class="profile-actions-row">
        <button class="secondary-btn" id="openProfileSettings" type="button">⚙️ Settings</button>
        <button class="profile-signout-btn" id="profileSignOutBtn" type="button">Sign Out</button>
      </div>
    </section>

    <div class="profile-settings-backdrop" id="profileSettingsModal" hidden>
      <section class="profile-settings-dialog" role="dialog" aria-modal="true" aria-labelledby="profileSettingsTitle">
        <button class="profile-settings-close" id="closeProfileSettings" type="button" aria-label="Close">×</button>
        <h2 id="profileSettingsTitle">Profile Settings</h2>
        <form id="profileForm">
          <label for="profileUsername">Username</label>
          <input class="search-box" id="profileUsername" maxlength="24" value="${escapeProfileHtml(currentProfileData.username || "")}" required />
          <label>Choose a profile picture</label>
          <div class="avatar-grid">${Array.from({length: PROFILE_AVATAR_COUNT}, (_,i)=>i+1).map((id)=>`<button class="avatar-choice ${id===selectedAvatarId?'selected':''}" type="button" data-avatar-id="${id}"><img src="${profileAvatarPath(id)}" alt="Avatar ${id}" /></button>`).join("")}</div>
          <label>Your friend code</label>
          <div class="friend-code-row"><code id="friendCode">${escapeProfileHtml(currentProfileData.friend_code)}</code><button class="secondary-btn" id="copyFriendCodeBtn" type="button">Copy</button></div>
          <div class="profile-setting-row">
            <div>
              <strong>Show 18+ Posters</strong>
              <small>Only sexually explicit poster artwork is blurred. Anime details remain accessible.</small>
            </div>
            <label class="settings-switch" aria-label="Show 18+ Posters">
              <input id="show18PostersToggle" type="checkbox" ${matShow18Posters() ? "checked" : ""} />
              <span></span>
            </label>
          </div>
          <button class="primary-btn profile-save-btn" type="submit">Save Changes</button>
          <div class="profile-message" id="profileMessage"></div>
        </form>
      </section>
    </div>`;
  bindProfileEvents();
}

function bindProfileEvents() {
  const modal = document.getElementById("profileSettingsModal");
  document.getElementById("openProfileSettings").addEventListener("click", () => { modal.hidden = false; document.body.classList.add("modal-open"); });
  const close = () => { modal.hidden = true; document.body.classList.remove("modal-open"); };
  document.getElementById("closeProfileSettings").addEventListener("click", close);
  modal.addEventListener("click", (event) => { if (event.target === modal) close(); });
  document.getElementById("profileSignOutBtn").addEventListener("click", signOutUser);
  document.getElementById("show18PostersToggle").addEventListener("change", (event) => {
    matSetShow18Posters(event.target.checked);
    renderProfile();
  });
  document.querySelectorAll(".avatar-choice").forEach((button) => button.addEventListener("click", () => {
    selectedAvatarId = Number(button.dataset.avatarId);
    document.querySelectorAll(".avatar-choice").forEach((item)=>item.classList.remove("selected"));
    button.classList.add("selected");
  }));
  document.getElementById("copyFriendCodeBtn").addEventListener("click", async () => {
    await navigator.clipboard.writeText(document.getElementById("friendCode").textContent.trim());
    document.getElementById("copyFriendCodeBtn").textContent = "Copied";
  });
  document.getElementById("profileForm").addEventListener("submit", saveProfile);
}
async function saveProfile(event) {
  event.preventDefault();
  const message = document.getElementById("profileMessage");
  const username = document.getElementById("profileUsername").value.trim();
  if (username.length < 3) { message.textContent = "Username must be at least 3 characters."; message.className = "profile-message profile-error"; return; }
  const { error } = await supabaseClient.from("profiles").update({ username, avatar_id: selectedAvatarId, updated_at: new Date().toISOString() }).eq("user_id", currentProfileUser.id);
  if (error) { message.textContent = error.code === "23505" ? "That username is already taken." : error.message; message.className = "profile-message profile-error"; return; }
  currentProfileData.username = username; currentProfileData.avatar_id = selectedAvatarId;
  document.getElementById("navProfileAvatar").src = profileAvatarPath(selectedAvatarId);
  message.textContent = "Profile saved."; message.className = "profile-message profile-success";
  setTimeout(renderProfile, 600);
}
async function initProfile(user) {
  currentProfileUser = user;
  try {
    [currentProfileData, profileAnime] = await Promise.all([getOrCreateProfile(user), loadProfileAnime()]);
    await renderProfile();
  } catch (error) {
    console.error(error);
    document.getElementById("profileRoot").innerHTML = `<div class="error">${escapeProfileHtml(error.message || "Could not load profile.")}</div>`;
  }
}
