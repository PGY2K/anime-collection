const PROFILE_ANILIST_ENDPOINT = "https://graphql.anilist.co";
let currentProfileUser = null;
let currentProfileData = null;
let selectedAvatarId = 1;
let profileAnime = [];
let profileBadges = [];
let profileFranchises = [];
let profileFranchiseEntryRatings = [];
let profileFriendCount = 0;
let profileFollowingCount = 0;
let activeRecommendation = null;

function profileJoinedLabel(value) {
  const date = value ? new Date(value) : null;
  if (!date || Number.isNaN(date.getTime())) return "Joined MAT";
  return `Joined ${date.toLocaleDateString(undefined, { month: "short", year: "numeric" })}`;
}

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
  const rawDirect = item?.overall_rating;
  const direct = rawDirect === null || rawDirect === undefined || rawDirect === "" ? null : Number(rawDirect);
  if(Number.isFinite(direct) && direct > 0) return direct;
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
async function claimPendingReferral(user) {
  const referralCode = String(user?.user_metadata?.referral_code || "").trim().toUpperCase();
  if (!referralCode) return;

  const { data: claimResult, error } = await supabaseClient.rpc("claim_referral", { p_referral_code: referralCode });
  if (error) {
    console.warn("Referral could not be applied.", error);
    return;
  }

  const claimFinished = claimResult?.claimed === true || claimResult?.reason === "already_claimed";
  if (!claimFinished) return;

  await supabaseClient.auth.updateUser({
    data: { ...user.user_metadata, referral_code: null }
  });
}

async function getOrCreateProfile(user) {
  const { data, error } = await supabaseClient.from("profiles").select("*").eq("user_id", user.id).maybeSingle();
  if (error) throw error;
  const profile = data || await createProfile(user);
  await claimPendingReferral(user);
  return profile;
}
async function loadProfileAnime() {
  const { data, error } = await supabaseClient.from("anime")
    .select("id, anilist_id, title, status, franchise_key, franchise_title, rating_mode, overall_rating, story, characters, animation, sound, world, pacing, emotion, originality, rewatch_value, enjoyment")
    .order("title");
  if (error) throw error;
  return data || [];
}

async function loadProfileFranchiseEntryRatings() {
  const { data, error } = await supabaseClient
    .from("user_franchise_entry_ratings")
    .select("franchise_key, anilist_id, overall_rating, rating_mode, story, characters, animation, sound, world, pacing, emotion, originality, rewatch_value, enjoyment");
  if (error) {
    if (error.code === "42P01") return [];
    throw error;
  }
  return data || [];
}

function profileEntryRating(row) {
  const rawDirect = row?.overall_rating;
  const direct = rawDirect === null || rawDirect === undefined || rawDirect === "" ? null : Number(rawDirect);
  if (Number.isFinite(direct) && direct > 0) return direct;
  const scores = ["story","characters","animation","sound","world","pacing","emotion","originality","rewatch_value","enjoyment"]
    .map((field) => row?.[field] === null || row?.[field] === undefined || row?.[field] === "" ? null : Number(row[field]))
    .filter(Number.isFinite);
  return scores.length === 10 ? scores.reduce((sum, value) => sum + value, 0) / 10 : null;
}

async function loadProfilePosters(items) {
  const ids = [...new Set(items.map((item) => Number(item.anilist_id)).filter(Number.isFinite))];
  if (!ids.length) return new Map();
  const query = `query ($ids: [Int]) { Page(page: 1, perPage: 20) { media(id_in: $ids, type: ANIME) { id isAdult coverImage { extraLarge large } } } }`;
  try {
    const response = await fetch(PROFILE_ANILIST_ENDPOINT, { method: "POST", headers: { "Content-Type": "application/json", Accept: "application/json" }, body: JSON.stringify({ query, variables: { ids } }) });
    if (!response.ok) return new Map();
    const json = await response.json();
    return new Map((json?.data?.Page?.media || []).map((item) => [Number(item.id), { url: item.coverImage?.extraLarge || item.coverImage?.large || "", isAdult: Boolean(item.isAdult) }]));
  } catch (error) {
    if (window.matIsOffline?.()) throw error;
    console.warn("Profile posters could not be loaded.", error);
    return new Map();
  }
}
function statusCount(status) { return profileAnime.filter((item) => profileNormalize(item.status) === status).length; }

function profileRecommendationPosterId(recommendation) {
  if (!recommendation) return null;
  if (recommendation.item_type === "anime") return Number(recommendation.anilist_id) || null;
  const franchise = profileFranchises.find((item) => Number(item.franchise_key) === Number(recommendation.franchise_key));
  return Number(franchise?.cover_anilist_id) || null;
}

function profileTopItems() {
  const franchiseItems = profileFranchises.map((franchise) => {
    const dedicatedScores = profileFranchiseEntryRatings
      .filter((row) => Number(row.franchise_key) === Number(franchise.franchise_key))
      .map(profileEntryRating)
      .filter(Number.isFinite);

    let rating = dedicatedScores.length
      ? dedicatedScores.reduce((sum, value) => sum + value, 0) / dedicatedScores.length
      : null;

    if (rating === null) {
      const direct = franchise.overall_rating === null || franchise.overall_rating === undefined || franchise.overall_rating === ""
        ? null
        : Number(franchise.overall_rating);
      if (Number.isFinite(direct) && direct > 0) rating = direct;
    }

    if (rating === null) {
      const legacyScores = profileAnime
        .filter((item) => Number(item.franchise_key) === Number(franchise.franchise_key))
        .map(profileAverage)
        .filter(Number.isFinite);
      if (legacyScores.length) rating = legacyScores.reduce((sum, value) => sum + value, 0) / legacyScores.length;
    }

    return rating === null ? null : {
      kind: "franchise",
      title: franchise.title,
      rating,
      href: `franchise.html?key=${franchise.franchise_key}`,
      posterId: franchise.cover_anilist_id
    };
  }).filter(Boolean);

  const standalone = profileAnime
    .filter((item) => !item.franchise_key)
    .map((item) => ({
      kind: "anime",
      title: item.title,
      rating: profileAverage(item),
      href: `anime.html?id=${item.id}`,
      posterId: item.anilist_id
    }))
    .filter((item) => item.rating !== null);

  return [...franchiseItems, ...standalone]
    .sort((a, b) => b.rating - a.rating || a.title.localeCompare(b.title))
    .slice(0, 5);
}

async function renderProfile() {
  selectedAvatarId = Number(currentProfileData.avatar_id) || 1;
  const topFive = profileTopItems();
  const recommendationPosterId=profileRecommendationPosterId(activeRecommendation);
  const posterItems=topFive.map(item=>({anilist_id:item.posterId}));if(recommendationPosterId)posterItems.push({anilist_id:recommendationPosterId});const posters = await loadProfilePosters(posterItems);
  const root = document.getElementById("profileRoot");
  root.innerHTML = `
    <section class="public-profile-card">
      <button class="profile-rp-corner" type="button" onclick="matOpenRpModal()"><img src="assets/icons/rp-gem.png" alt="RP"><strong>${Math.round(Number(currentProfileData.recommendation_points)||0).toLocaleString()} RP</strong></button>
      <img class="profile-main-avatar" src="${profileAvatarPath(selectedAvatarId)}" alt="Your profile avatar" />
      <h2>${escapeProfileHtml(currentProfileData.username || "Anime Fan")}</h2>
      ${matBadgeRowHtml(profileBadges, { emptyText: "No badges awarded yet." })}
      <a class="secondary-btn profile-badges-page-btn" href="badges.html">🏅 Badges</a>
      <p class="profile-social-meta"><a href="friends.html?tab=followers">${profileFriendCount.toLocaleString()} Followers</a><span>•</span><a href="friends.html?tab=following">${profileFollowingCount.toLocaleString()} Following</a><span>•</span><span>${escapeProfileHtml(profileJoinedLabel(currentProfileUser?.created_at || currentProfileData.created_at))}</span></p>
      ${activeRecommendation?`<section class="profile-active-recommendation"><div class="profile-section-heading"><h3>💎 My Recommendation</h3><span>Featured title</span></div><a class="dashboard-media-card friend-rating-card profile-rec-card" href="${activeRecommendation.item_type==='franchise'?`franchise.html?key=${activeRecommendation.franchise_key}&rec_source=profile&recommender=${currentProfileUser.id}`:`anime.html?anilist_id=${activeRecommendation.anilist_id}&rec_source=profile&recommender=${currentProfileUser.id}`}">${posters.get(Number(recommendationPosterId))?.url?`<img class="profile-rec-poster" src="${escapeProfileHtml(posters.get(Number(recommendationPosterId)).url)}" alt="${escapeProfileHtml(activeRecommendation.title)} poster">`:'<div class="profile-rec-poster poster-placeholder">🎌</div>'}<div class="dashboard-media-body"><h3>${escapeProfileHtml(activeRecommendation.title)}</h3><strong>⭐ ${Number(activeRecommendation.rating).toFixed(1)}</strong>${activeRecommendation.note?`<small>${escapeProfileHtml(activeRecommendation.note)}</small>`:""}</div></a></section>`:""}

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
            <a class="profile-top-card${matAdultPosterClass(posters.get(Number(item.posterId))?.isAdult)}" href="${item.href}">
              ${posters.get(Number(item.posterId))?.url ? `<img src="${escapeProfileHtml(posters.get(Number(item.posterId)).url)}" alt="${escapeProfileHtml(item.title)} poster" />${matAdultPosterOverlay(posters.get(Number(item.posterId)).isAdult)}` : '<div class="poster-placeholder">🎌</div>'}
              <span class="profile-top-rank">#${index + 1}</span>
              <div><strong>${escapeProfileHtml(item.title)}</strong><small>⭐ ${item.rating.toFixed(1)}</small></div>
            </a>`).join("") : '<div class="empty-state">Rate anime to build your Top 5.</div>'}
        </div>
      </section>

      <div class="profile-actions-row">
        <button class="secondary-btn" id="openProfileSettings" type="button">⚙️ Settings</button>
        ${currentProfileData.can_manage_badges ? '<a class="secondary-btn profile-admin-link" href="admin.html">Admin Control Panel</a>' : ''}
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
          <label>Your user code</label>
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
          <div class="profile-setting-row"><div><strong>Private Profile</strong><small>Public profiles can be followed instantly. Private profiles approve follow requests.</small></div><label class="settings-switch"><input id="profilePrivateToggle" type="checkbox" ${currentProfileData.is_private ? "checked" : ""}><span></span></label></div><section class="franchise-settings"><h3>Franchise Options</h3><p>TV seasons and movies are grouped by default. Optional formats can be included when organizing franchises.</p><label class="profile-setting-row"><span><strong>Group TV Seasons</strong></span><input id="franchiseGroupTv" type="checkbox" ${currentProfileData.franchise_group_tv!==false?"checked":""}></label><label class="profile-setting-row"><span><strong>Group Movies</strong></span><input id="franchiseGroupMovies" type="checkbox" ${currentProfileData.franchise_group_movies!==false?"checked":""}></label><label class="profile-setting-row"><span><strong>Include OVAs</strong></span><input id="franchiseIncludeOva" type="checkbox" ${currentProfileData.franchise_include_ova?"checked":""}></label><label class="profile-setting-row"><span><strong>Include Specials</strong></span><input id="franchiseIncludeSpecials" type="checkbox" ${currentProfileData.franchise_include_specials?"checked":""}></label><label class="profile-setting-row"><span><strong>Include ONAs</strong></span><input id="franchiseIncludeOna" type="checkbox" ${currentProfileData.franchise_include_ona?"checked":""}></label><label class="profile-setting-row"><span><strong>Include Recaps</strong></span><input id="franchiseIncludeRecaps" type="checkbox" ${currentProfileData.franchise_include_recaps?"checked":""}></label></section><button class="primary-btn profile-save-btn" type="submit">Save Changes</button>
          <div class="profile-message" id="profileMessage"></div>
        </form>
      </section>
    </div>`;
  matBindBadgeButtons(root);
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
  const { error } = await supabaseClient.from("profiles").update({ username, avatar_id: selectedAvatarId, franchise_group_tv: document.getElementById("franchiseGroupTv").checked, franchise_group_movies: document.getElementById("franchiseGroupMovies").checked, franchise_include_ova: document.getElementById("franchiseIncludeOva").checked, franchise_include_specials: document.getElementById("franchiseIncludeSpecials").checked, franchise_include_ona: document.getElementById("franchiseIncludeOna").checked, franchise_include_recaps: document.getElementById("franchiseIncludeRecaps").checked,
      is_private: document.getElementById("profilePrivateToggle").checked, updated_at: new Date().toISOString() }).eq("user_id", currentProfileUser.id);
  if (error) { message.textContent = error.code === "23505" ? "That username is already taken." : error.message; message.className = "profile-message profile-error"; return; }
  currentProfileData.username = username; currentProfileData.avatar_id = selectedAvatarId; currentProfileData.franchise_group_tv=document.getElementById("franchiseGroupTv").checked; currentProfileData.franchise_group_movies=document.getElementById("franchiseGroupMovies").checked; currentProfileData.franchise_include_ova=document.getElementById("franchiseIncludeOva").checked; currentProfileData.franchise_include_specials=document.getElementById("franchiseIncludeSpecials").checked; currentProfileData.franchise_include_ona=document.getElementById("franchiseIncludeOna").checked; currentProfileData.franchise_include_recaps=document.getElementById("franchiseIncludeRecaps").checked; currentProfileData.is_private=document.getElementById("profilePrivateToggle").checked;
  document.getElementById("navProfileAvatar").src = profileAvatarPath(selectedAvatarId);
  message.textContent = "Profile saved."; message.className = "profile-message profile-success";
  setTimeout(renderProfile, 600);
}
async function initProfile(user) {
  currentProfileUser = user;
  try {
    [currentProfileData, profileAnime, profileBadges, profileFranchises, profileFranchiseEntryRatings, profileFriendCount, profileFollowingCount, activeRecommendation] = await Promise.all([
      getOrCreateProfile(user),
      loadProfileAnime(),
      matLoadUserBadges(user.id),
      matLoadOwnFranchises(),
      loadProfileFranchiseEntryRatings(),
      supabaseClient.rpc("get_follower_count", { p_user_id: user.id }).then(({data,error}) => error ? 0 : Number(data) || 0),
      supabaseClient.rpc("get_following_count", { p_user_id: user.id }).then(({data,error}) => error ? 0 : Number(data) || 0),
      supabaseClient.from("recommendations").select("*").eq("recommender_id", user.id).eq("active", true).maybeSingle().then(({data,error}) => error ? null : data)
    ]);
    await renderProfile();
  } catch (error) {
    console.error(error);
    window.matShowNetworkError?.(error, { type: navigator.onLine === false ? "offline" : "service", retry: () => location.reload(), goBack: () => history.back() });
    document.getElementById("profileRoot").innerHTML = `<div class="error">Could not load profile.</div>`;
  }
}
