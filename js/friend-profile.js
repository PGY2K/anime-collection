const FRIEND_ANILIST_ENDPOINT = "https://graphql.anilist.co";
let friendProfileAnime = [];
let friendProfileFilter = "all";
let activeFriendUserId = null;
let friendProfileFranchises = [];
let friendProfileTopFive = [];
let friendProfileFriendCount = 0;

function fpEscape(value) {
  return String(value ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}


function fpJoinedLabel(value) {
  const date = value ? new Date(value) : null;
  if (!date || Number.isNaN(date.getTime())) return "Joined MAT";
  return `Joined ${date.toLocaleDateString(undefined, { month: "short", year: "numeric" })}`;
}
function fpNormalize(value) {
  return String(value ?? "").trim().toLowerCase();
}

function fpAverage(item) {
  const rawDirect = item?.overall_rating;
  const direct = rawDirect === null || rawDirect === undefined || rawDirect === "" ? null : Number(rawDirect);
  if(Number.isFinite(direct) && direct > 0) return direct;
  if (fpNormalize(item.status) !== "completed") return null;
  const scores = ["story","characters","animation","sound","world","pacing","emotion","originality","rewatch_value","enjoyment"]
    .map((field) => item[field] === null || item[field] === undefined || item[field] === "" ? null : Number(item[field]))
    .filter(Number.isFinite);
  if (scores.length < 10) return null;
  return scores.reduce((sum, score) => sum + score, 0) / scores.length;
}

function fpStatusClass(status) {
  const value = fpNormalize(status);
  if (value === "completed") return "status-completed";
  if (value === "in progress") return "status-progress";
  if (value === "waiting") return "status-waiting";
  if (value === "dropped") return "status-dropped";
  return "status-queued";
}

async function fetchFriendProfile(userId) {
  const { data, error } = await supabaseClient.rpc("get_friend_profile", {
    p_friend_user_id: userId
  });

  if (error) throw error;
  if (!data?.length) throw new Error("This profile is private or you are no longer friends.");
  return data[0];
}

async function fetchFriendFranchises(userId){ const {data,error}=await supabaseClient.rpc("get_friend_franchises",{p_friend_user_id:userId}); if(error)throw error; return data||[]; }

async function fetchFriendAnime(userId) {
  const { data, error } = await supabaseClient.rpc("get_friend_anime", {
    p_friend_user_id: userId
  });

  if (error) throw error;
  return data || [];
}


async function fetchFriendTopFive(userId) {
  const { data, error } = await supabaseClient.rpc("get_friend_top_five", {
    p_friend_user_id: userId
  });
  if (error) throw error;
  return (data || []).map((item) => ({
    ...item,
    rating: Number(item.rating),
    href: item.kind === "franchise"
      ? `franchise.html?key=${item.franchise_key}&user=${userId}`
      : `anime.html?anilist_id=${item.anilist_id}`
  }));
}

async function fetchFriendPosters(ids) {
  const uniqueIds = [...new Set(ids.map(Number).filter(Number.isFinite))];
  if (!uniqueIds.length) return new Map();

  const query = `
    query ($ids: [Int]) {
      Page(page: 1, perPage: 50) {
        media(id_in: $ids, type: ANIME) {
          id
          isAdult
          coverImage { extraLarge large }
        }
      }
    }
  `;

  const response = await fetch(FRIEND_ANILIST_ENDPOINT, {
    method: "POST",
    headers: { "Content-Type": "application/json", Accept: "application/json" },
    body: JSON.stringify({ query, variables: { ids: uniqueIds } })
  });

  if (!response.ok) return new Map();
  const json = await response.json();
  const media = json?.data?.Page?.media || [];

  return new Map(media.map((item) => [
    Number(item.id),
    { url: item.coverImage?.extraLarge || item.coverImage?.large || "", isAdult: Boolean(item.isAdult) }
  ]));
}

async function renderFriendProfileShell(profile) {
  const profileBadges = await matLoadUserBadges(profile.user_id);
  const root = document.getElementById("friendProfileRoot");
  const topFive = friendProfileTopFive;
  const topPosters = await fetchFriendPosters(topFive.map((item) => item.anilist_id));
  const count = (status) => friendProfileAnime.filter((item) => fpNormalize(item.status) === status).length;

  root.innerHTML = `
    <a class="friend-profile-back standalone-back" href="friends.html">← Friends</a>
    <section class="public-profile-card friend-public-profile">
      <div class="profile-corner-meta">
        <span class="profile-corner-friends">👥 ${friendProfileFriendCount.toLocaleString()} Friends</span>
        <span class="profile-corner-joined">${fpEscape(fpJoinedLabel(profile.created_at))}</span>
      </div>
      <img class="profile-main-avatar" src="${profileAvatarPath(profile.avatar_id || 1)}" alt="${fpEscape(profile.username)} avatar" />
      <h2>${fpEscape(profile.username || "Anime Fan")}</h2>
      ${matBadgeRowHtml(profileBadges, { emptyText: "No badges awarded yet." })}
      <a class="secondary-btn profile-badges-page-btn" href="badges.html?user=${encodeURIComponent(profile.user_id)}">🏅 Badges</a>
      <p class="profile-private-note">Accepted friend</p>
      <div class="profile-stat-grid">
        <div><strong>${count("in progress")}</strong><span>Watching</span></div>
        <div><strong>${count("waiting")}</strong><span>Waiting</span></div>
        <div><strong>${count("queued")}</strong><span>Queued</span></div>
        <div><strong>${count("completed")}</strong><span>Completed</span></div>
        <div><strong>${count("dropped")}</strong><span>Dropped</span></div>
      </div>
      <section class="profile-top-section">
        <div class="profile-section-heading"><h3>⭐ Top 5 Anime</h3><span>Highest rated</span></div>
        <div class="profile-top-grid">
          ${topFive.length ? topFive.map((item,index)=>`
            <a class="profile-top-card${matAdultPosterClass(topPosters.get(Number(item.anilist_id))?.isAdult)}" href="${item.href || `anime.html?anilist_id=${item.anilist_id}`}">
              ${topPosters.get(Number(item.anilist_id))?.url ? `<img src="${fpEscape(topPosters.get(Number(item.anilist_id)).url)}" alt="${fpEscape(item.title)} poster" />${matAdultPosterOverlay(topPosters.get(Number(item.anilist_id)).isAdult)}` : '<div class="poster-placeholder">🎌</div>'}
              <span class="profile-top-rank">#${index+1}</span>
              <div><strong>${fpEscape(item.title)}</strong><small>⭐ ${item.rating.toFixed(1)}</small></div>
            </a>`).join("") : '<div class="empty-state">No fully rated anime yet.</div>'}
        </div>
      </section>
    </section>

    <section class="friend-collection-section">
      <div class="profile-section-heading"><h3>Collection</h3><span>Browse their anime collection</span></div>
      <div class="friend-filter-bar">
        <button class="filter-btn active" type="button" data-friend-filter="all">All</button>
        <button class="filter-btn" type="button" data-friend-filter="in progress">Watching</button>
        <button class="filter-btn" type="button" data-friend-filter="waiting">Waiting</button>
        <button class="filter-btn" type="button" data-friend-filter="queued">Queue</button>
        <button class="filter-btn" type="button" data-friend-filter="completed">Completed</button>
        <button class="filter-btn" type="button" data-friend-filter="favorites">Favorites</button>
      </div>
      <section class="friend-anime-grid" id="friendAnimeGrid"><div class="loading">Loading collection…</div></section>
    </section>`;

  matBindBadgeButtons(root);

  document.querySelectorAll("[data-friend-filter]").forEach((button) => button.addEventListener("click", () => {
    matBindBadgeButtons(root);

  document.querySelectorAll("[data-friend-filter]").forEach((item) => item.classList.remove("active"));
    button.classList.add("active");
    friendProfileFilter = button.dataset.friendFilter;
    renderFriendAnime();
  }));
}

async function renderFriendAnime() {
  const root = document.getElementById("friendAnimeGrid");
  let filtered = friendProfileAnime;

  if (friendProfileFilter === "favorites") {
    filtered = filtered.filter((item) => item.favorite);
  } else if (friendProfileFilter !== "all") {
    filtered = filtered.filter((item) => fpNormalize(item.status) === friendProfileFilter);
  }

  const posters = await fetchFriendPosters(filtered.map((item) => item.anilist_id));

  root.innerHTML = filtered.length
    ? filtered.map((item) => {
        const score = fpAverage(item);
        const posterData = posters.get(Number(item.anilist_id)) || { url: "", isAdult: false };
        const poster = posterData.url;
        return `
          <article class="friend-anime-card">
            <a class="friend-anime-poster friend-anime-poster-link${matAdultPosterClass(posterData.isAdult)}" href="${item.href || `anime.html?anilist_id=${item.anilist_id}`}" aria-label="View ${fpEscape(item.title)} details">
              ${poster
                ? `<img src="${fpEscape(poster)}" alt="${fpEscape(item.title)} poster" loading="lazy" />`
                : '<div class="poster-placeholder">🎌</div>'}
              ${matAdultPosterOverlay(posterData.isAdult)}
            </a>
            <div class="friend-anime-body">
              <h3 class="friend-anime-title">${fpEscape(item.title)}</h3>
              <div class="friend-anime-meta">
                <span class="status ${fpStatusClass(item.status)}">${fpEscape(item.status || "Queued")}</span>
                ${score === null ? "" : `<span class="friend-anime-score">⭐ ${score.toFixed(1)}</span>`}
              </div>
            </div>
          </article>
        `;
      }).join("")
    : '<div class="empty-state">No anime in this section.</div>';
}

async function initFriendProfile() {
  const params = new URLSearchParams(window.location.search);
  activeFriendUserId = params.get("user");
  const root = document.getElementById("friendProfileRoot");

  if (!activeFriendUserId) {
    root.innerHTML = '<div class="error">Friend profile was not specified.</div>';
    return;
  }

  try {
    const [profile, anime, franchises, topFive, friendCount] = await Promise.all([
      fetchFriendProfile(activeFriendUserId),
      fetchFriendAnime(activeFriendUserId),
      fetchFriendFranchises(activeFriendUserId),
      fetchFriendTopFive(activeFriendUserId),
      supabaseClient.rpc("get_public_friend_count", { p_user_id: activeFriendUserId }).then(({data,error}) => error ? 0 : Number(data) || 0)
    ]);

    friendProfileFranchises = franchises;
    friendProfileTopFive = topFive;
    friendProfileFriendCount = friendCount;
    friendProfileAnime = anime;
    await renderFriendProfileShell(profile);
    await renderFriendAnime();
  } catch (error) {
    console.error(error);
    window.matShowNetworkError?.(error, { type: "service", retry: () => location.reload(), goBack: () => history.back() });
    root.innerHTML = `<div class="error">Could not load friend profile.</div>`;
  }
}
