const FRIEND_ANILIST_ENDPOINT = "https://graphql.anilist.co";
let friendProfileAnime = [];
let friendProfileFilter = "all";
let activeFriendUserId = null;
let friendProfileFranchises = [];
let friendProfileTopFive = [];
let friendProfileFriendCount = 0;
let friendActiveRecommendation = null;
let friendProfileViewer = null;

function fpEscape(value) {
  return String(value ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}



function fpPositiveInteger(...values) {
  for (const value of values) {
    const number = Number(value);
    if (Number.isInteger(number) && number > 0) return number;
  }
  return null;
}

function fpRecommendationAnimeId(recommendation, media = null) {
  return fpPositiveInteger(
    media?.anilistId,
    recommendation?.anilist_id,
    recommendation?.item_key,
    recommendation?.media_id,
    recommendation?.title_id
  );
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
  const { data, error } = await supabaseClient.rpc("get_public_user_profile", {
    p_user_id: userId
  });

  if (error) throw error;
  if (!data?.length) throw new Error("This profile could not be found.");
  return data[0];
}

async function fetchFriendFranchises(userId){ const {data,error}=await supabaseClient.rpc("get_public_user_franchises",{p_user_id:userId}); if(error)throw error; return data||[]; }

async function fetchFriendAnime(userId) {
  const { data, error } = await supabaseClient.rpc("get_public_user_anime", {
    p_user_id: userId
  });

  if (error) throw error;
  return data || [];
}


async function fetchFriendTopFive(userId) {
  const { data, error } = await supabaseClient.rpc("get_public_user_top_five", {
    p_user_id: userId
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

async function fpResolveRecommendationMedia(recommendation) {
  const posterId = fpRecommendationPosterId(recommendation);
  if (posterId) {
    const posters = await fetchFriendPosters([posterId]);
    const found = posters.get(Number(posterId));
    if (found) return { ...found, anilistId: Number(posterId) };
  }
  if (!recommendation?.title) return { url: "", isAdult: false, anilistId: null };
  try {
    const query = `query ($search:String){Media(search:$search,type:ANIME){id isAdult coverImage{extraLarge large}}}`;
    const response = await fetch(FRIEND_ANILIST_ENDPOINT, { method: "POST", headers: { "Content-Type": "application/json", Accept: "application/json" }, body: JSON.stringify({ query, variables: { search: recommendation.title } }) });
    const json = response.ok ? await response.json() : null;
    const media = json?.data?.Media;
    return { url: media?.coverImage?.extraLarge || media?.coverImage?.large || "", isAdult: Boolean(media?.isAdult), anilistId: Number(media?.id) || null };
  } catch (error) {
    console.warn("Recommendation artwork fallback failed.", error);
    return { url: "", isAdult: false, anilistId: null };
  }
}

function fpRecommendationHref(recommendation, profileUserId, media) {
  if (recommendation.item_type === "franchise") return `franchise.html?key=${encodeURIComponent(recommendation.franchise_key)}&rec_source=profile&recommender=${encodeURIComponent(profileUserId)}`;
  const query = new URLSearchParams({
    rec_source: "profile",
    recommender: String(profileUserId || ""),
    rec_title: String(recommendation.title || "")
  });
  const anilistId = fpRecommendationAnimeId(recommendation, media);
  if (anilistId) query.set("anilist_id", String(anilistId));
  return `anime.html?${query.toString()}`;
}

async function fpAddRecommendationToQueue(recommendation, profileUserId, media, button) {
  button.disabled = true;
  button.textContent = "Adding…";
  try {
    const itemKey = recommendation.item_type === "franchise" ? String(recommendation.franchise_key) : String(fpRecommendationAnimeId(recommendation, media) || "");
    if (!itemKey || itemKey === "null" || itemKey === "undefined") throw new Error("This recommendation is missing its title ID.");
    const { error: attributionError } = await supabaseClient.rpc("set_recommendation_attribution", { p_item_type: recommendation.item_type, p_item_key: itemKey, p_source_mode: "profile", p_recommender_ids: [profileUserId] });
    if (attributionError) throw attributionError;

    if (recommendation.item_type === "franchise") {
      const { error } = await supabaseClient.from("user_franchises").insert({ user_id: friendProfileViewer.id, franchise_key: Number(recommendation.franchise_key), status: "Queued", updated_at: new Date().toISOString() });
      if (error) throw error;
    } else {
      const anilistId = fpRecommendationAnimeId(recommendation, media);
      const { error } = await supabaseClient.from("anime").insert({ anilist_id: anilistId, title: recommendation.title, status: "Queued" });
      if (error) throw error;
      await window.matClaimPioneerBadge?.({ anilistId });
    }
    button.textContent = "In Your Collection";
  } catch (error) {
    const duplicate = error?.code === "23505" || /duplicate|already exists/i.test(error?.message || "");
    button.textContent = duplicate ? "In Your Collection" : "Add to Queue";
    button.disabled = duplicate;
    if (!duplicate) alert(error.message || "Could not add this recommendation to your queue.");
  }
}

function fpRecommendationPosterId(recommendation) {
  if (!recommendation) return null;
  if (recommendation.item_type === "anime") return fpRecommendationAnimeId(recommendation);
  const franchise = friendProfileFranchises.find((item) => Number(item.franchise_key) === Number(recommendation.franchise_key));
  return Number(franchise?.cover_anilist_id) || null;
}

async function renderFriendProfileShell(profile) {
  const profileBadges = await matLoadUserBadges(profile.user_id);
  const root = document.getElementById("friendProfileRoot");
  const topFive = friendProfileTopFive;
  const recommendationPosterId=fpRecommendationPosterId(friendActiveRecommendation);
  const recPosterIds=topFive.map((item)=>item.anilist_id);if(recommendationPosterId)recPosterIds.push(recommendationPosterId);const topPosters = await fetchFriendPosters(recPosterIds);
  const recommendationMedia = friendActiveRecommendation ? await fpResolveRecommendationMedia(friendActiveRecommendation) : null;
  const count = (status) => friendProfileAnime.filter((item) => fpNormalize(item.status) === status).length;

  root.innerHTML = `
    <a class="friend-profile-back standalone-back" href="friends.html">← Following</a>
    <section class="public-profile-card friend-public-profile">
      <button class="profile-rp-corner" type="button" onclick="matOpenRpModal()"><img src="assets/icons/rp-gem.png" alt="RP"><strong>${Math.round(Number(profile.recommendation_points)||0).toLocaleString()} RP</strong></button>
      <img class="profile-main-avatar" src="${profileAvatarPath(profile.avatar_id || 1)}" alt="${fpEscape(profile.username)} avatar" />
      <h2>${fpEscape(profile.username || "Anime Fan")}</h2>
      ${matBadgeRowHtml(profileBadges, { emptyText: "No badges awarded yet." })}
      <a class="secondary-btn profile-badges-page-btn" href="badges.html?user=${encodeURIComponent(profile.user_id)}">🏅 Badges</a>
      <p class="profile-social-meta">${profile.is_private
        ? `<span title="This user’s social lists are private">${friendProfileFriendCount.toLocaleString()} Followers</span><span>•</span><span title="This user’s social lists are private">${Number(profile.following_count||0).toLocaleString()} Following</span>`
        : `<a href="friends.html?user=${encodeURIComponent(profile.user_id)}&tab=followers">${friendProfileFriendCount.toLocaleString()} Followers</a><span>•</span><a href="friends.html?user=${encodeURIComponent(profile.user_id)}&tab=following">${Number(profile.following_count||0).toLocaleString()} Following</a>`}<span>•</span><span>${fpEscape(fpJoinedLabel(profile.created_at))}</span></p>
      ${friendActiveRecommendation?`<section class="profile-active-recommendation"><div class="profile-section-heading"><h3>💎 Recommendation</h3><span>Featured by ${fpEscape(profile.username)}</span></div><article class="dashboard-media-card friend-rating-card profile-rec-card"><a class="profile-rec-poster-link${matAdultPosterClass(recommendationMedia?.isAdult)}" href="${fpRecommendationHref(friendActiveRecommendation,profile.user_id,recommendationMedia)}">${recommendationMedia?.url?`<img class="profile-rec-poster" src="${fpEscape(recommendationMedia.url)}" alt="${fpEscape(friendActiveRecommendation.title)} poster" loading="lazy">`:'<div class="profile-rec-poster poster-placeholder">🎌</div>'}${matAdultPosterOverlay(recommendationMedia?.isAdult)}</a><div class="dashboard-media-body"><a class="recommendation-title-link" href="${fpRecommendationHref(friendActiveRecommendation,profile.user_id,recommendationMedia)}"><h3>${fpEscape(friendActiveRecommendation.title)}</h3></a><strong>⭐ ${Number(friendActiveRecommendation.rating).toFixed(1)}</strong>${friendActiveRecommendation.note?`<small>${fpEscape(friendActiveRecommendation.note)}</small>`:""}<button class="dashboard-queue-btn" id="profileRecommendationQueueBtn" type="button">Add to Queue</button></div></article></section>`:""}
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
  document.getElementById("profileRecommendationQueueBtn")?.addEventListener("click", (event) => fpAddRecommendationToQueue(friendActiveRecommendation, profile.user_id, recommendationMedia, event.currentTarget));

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

async function initFriendProfile(user) {
  friendProfileViewer = user;
  const params = new URLSearchParams(window.location.search);
  activeFriendUserId = params.get("user");
  const root = document.getElementById("friendProfileRoot");

  if (!activeFriendUserId) {
    root.innerHTML = '<div class="error">Friend profile was not specified.</div>';
    return;
  }

  try {
    const [profile, anime, franchises, topFive, friendCount, recommendation] = await Promise.all([
      fetchFriendProfile(activeFriendUserId),
      fetchFriendAnime(activeFriendUserId),
      fetchFriendFranchises(activeFriendUserId),
      fetchFriendTopFive(activeFriendUserId),
      supabaseClient.rpc("get_follower_count", { p_user_id: activeFriendUserId }).then(({data,error}) => error ? 0 : Number(data) || 0),
      supabaseClient.from("recommendations").select("*").eq("recommender_id",activeFriendUserId).eq("active",true).maybeSingle().then(({data,error})=>error?null:data)
    ]);

    friendProfileFranchises = franchises;
    friendProfileTopFive = topFive;
    friendProfileFriendCount = friendCount;
    friendActiveRecommendation = recommendation;
    friendProfileAnime = anime;
    await renderFriendProfileShell(profile);
    await renderFriendAnime();
  } catch (error) {
    console.error(error);
    window.matShowNetworkError?.(error, { type: "service", retry: () => location.reload(), goBack: () => history.back() });
    root.innerHTML = `<div class="error">Could not load friend profile.</div>`;
  }
}
