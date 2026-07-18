const DASHBOARD_ANILIST_ENDPOINT = "https://graphql.anilist.co";

function dashboardNormalize(value) {
  return String(value ?? "").trim().toLowerCase();
}

function dashboardEscapeHtml(value) {
  return String(value ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

function dashboardNumber(value) {
  if (value === null || value === undefined || value === "") {
    return null;
  }

  const number = Number(value);
  return Number.isFinite(number) ? number : null;
}

function dashboardAverage(item) {
  const scores = ["story","characters","animation","sound","world","pacing","emotion","originality","rewatch_value","enjoyment"]
    .map((field) => dashboardNumber(item[field]))
    .filter((value) => value !== null);

  if (scores.length < 10) return null;
  return scores.reduce((sum, value) => sum + value, 0) / scores.length;
}

async function dashboardAniListRequest(query, variables = {}) {
  const response = await fetch(DASHBOARD_ANILIST_ENDPOINT, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Accept: "application/json"
    },
    body: JSON.stringify({ query, variables })
  });

  if (!response.ok) {
    throw new Error("Anime data request failed.");
  }

  const json = await response.json();

  if (json.errors?.length) {
    throw new Error(json.errors[0].message || "Anime data request failed.");
  }

  return json.data;
}

async function loadDashboardAnime() {
  const { data, error } = await supabaseClient
    .from("anime")
    .select("id, anilist_id, title, status, story, characters, animation, sound, world, pacing, emotion, originality, rewatch_value, enjoyment, created_at")
    .order("created_at", { ascending: false });

  if (error) {
    throw error;
  }

  return data || [];
}

function renderDashboardStats(anime) {
  document.getElementById("totalAnime").textContent = anime.length;

  document.getElementById("completedAnime").textContent = anime.filter(
    (item) => dashboardNormalize(item.status) === "completed"
  ).length;

  document.getElementById("inProgressAnime").textContent = anime.filter(
    (item) => dashboardNormalize(item.status) === "in progress"
  ).length;

  document.getElementById("waitingAnime").textContent = anime.filter(
    (item) => dashboardNormalize(item.status) === "waiting"
  ).length;

  document.getElementById("droppedAnime").textContent = anime.filter(
    (item) => dashboardNormalize(item.status) === "dropped"
  ).length;
}

function renderTopRated(anime) {
  const topRated = anime
    .map((item) => ({
      ...item,
      rating: dashboardAverage(item)
    }))
    .filter((item) => item.rating !== null)
    .sort((a, b) => b.rating - a.rating || a.title.localeCompare(b.title))
    .slice(0, 5);

  const medals = ["🥇", "🥈", "🥉", "4", "5"];
  const container = document.getElementById("topRated");

  if (!topRated.length) {
    container.innerHTML = '<div class="empty-state">Rate a completed anime to see it here.</div>';
    return;
  }

  container.innerHTML = topRated
    .map(
      (item, index) => `
        <a class="rank-item" href="anime.html?id=${encodeURIComponent(item.id)}">
          <div class="badge">${medals[index]}</div>
          <div class="title">${dashboardEscapeHtml(item.title)}</div>
          <div class="rating">⭐ ${item.rating.toFixed(1)}</div>
        </a>
      `
    )
    .join("");
}

function renderQueue(anime) {
  const queue = anime
    .filter((item) => dashboardNormalize(item.status) === "queued")
    .slice(0, 5);

  const container = document.getElementById("queueList");

  if (!queue.length) {
    container.innerHTML = '<div class="empty-state">Your queue is empty.</div>';
    return;
  }

  container.innerHTML = queue
    .map(
      (item) => `
        <a class="queue-item" href="anime.html?id=${encodeURIComponent(item.id)}">
          <div class="title">${dashboardEscapeHtml(item.title)}</div>
          <div class="status status-queued">Queued</div>
        </a>
      `
    )
    .join("");
}


async function loadTrendingAnime() {
  const query = `
    query {
      Page(page: 1, perPage: 8) {
        media(type: ANIME, sort: TRENDING_DESC) {
          id
          title {
            english
            romaji
          }
          coverImage {
            extraLarge
            large
          }
          isAdult
          averageScore
          episodes
          format
          seasonYear
        }
      }
    }
  `;

  const data = await dashboardAniListRequest(query);
  return data?.Page?.media || [];
}

function dashboardAnimeTitle(media) {
  return media?.title?.english || media?.title?.romaji || "Untitled";
}

function dashboardInCollection(anime, anilistId) {
  return anime.some((item) => Number(item.anilist_id) === Number(anilistId));
}

async function addTrendingToQueue(media, button, anime) {
  button.disabled = true;
  button.textContent = "Adding…";

  const title = dashboardAnimeTitle(media);

  const { data, error } = await supabaseClient
    .from("anime")
    .insert({
      anilist_id: media.id,
      title,
      status: "Queued"
    })
    .select("id, anilist_id, title, status, story, characters, animation, sound, world, pacing, emotion, originality, rewatch_value, enjoyment, created_at")
    .single();

  if (error) {
    if (error.code === "23505") {
      button.textContent = "In Your Collection";
      return;
    }

    button.disabled = false;
    button.textContent = "+ Add to Queue";
    alert(error.message);
    return;
  }

  await matClaimPioneerBadge({ anilistId: media.id });
  anime.unshift(data);
  button.textContent = "In Your Collection";
  renderTrending(anime, window.dashboardTrendingMedia || []);
  renderRatedByFriends(anime, window.dashboardFriendRatingGroups || []);
}

function renderTrending(anime, media) {
  const container = document.getElementById("trendingAnime");

  if (!media.length) {
    container.innerHTML = '<div class="empty-state">Trending anime are unavailable right now.</div>';
    return;
  }

  container.innerHTML = media.map((item, index) => {
    const title = dashboardAnimeTitle(item);
    const poster = item.coverImage?.extraLarge || item.coverImage?.large || "";
    const inCollection = dashboardInCollection(anime, item.id);
    const details = [
      item.format ? String(item.format).replaceAll("_", " ") : null,
      item.episodes ? `${item.episodes} eps` : null,
      item.seasonYear || null
    ].filter(Boolean).join(" • ");

    return `
      <article class="dashboard-media-card">
        <a class="dashboard-poster dashboard-poster-link${matAdultPosterClass(item.isAdult)}" href="anime.html?anilist_id=${item.id}" aria-label="View ${dashboardEscapeHtml(title)} details">
          ${poster
            ? `<img src="${dashboardEscapeHtml(poster)}" alt="${dashboardEscapeHtml(title)} poster" loading="lazy" />`
            : '<div class="poster-placeholder">🎌</div>'}
          ${matAdultPosterOverlay(item.isAdult)}
          <span class="dashboard-trend-rank">#${index + 1}</span>
        </a>

        <div class="dashboard-media-body">
          <h3>${dashboardEscapeHtml(title)}</h3>
          <div class="dashboard-media-meta">
            ${dashboardEscapeHtml(details || "Anime")}
            
          </div>

          <button
            class="dashboard-queue-btn"
            type="button"
            data-trending-id="${item.id}"
            ${inCollection ? "disabled" : ""}
          >
            ${inCollection ? "In Your Collection" : "+ Add to Queue"}
          </button>
        </div>
      </article>
    `;
  }).join("");

  container.querySelectorAll("[data-trending-id]").forEach((button) => {
    button.addEventListener("click", () => {
      const mediaItem = media.find(
        (item) => String(item.id) === button.dataset.trendingId
      );

      if (mediaItem) {
        addTrendingToQueue(mediaItem, button, anime);
      }
    });
  });
}

async function loadFriendRatings() {
  const { data, error } = await supabaseClient.rpc("get_following_recommendations");
  if (error) throw error;
  return data || [];
}
async function dashboardResolveRecommendationMedia(groups) {
  const resolved = new Map();
  const ids = [...new Set(groups.map((group) => Number(group.anilist_id)).filter(Number.isFinite))];

  if (ids.length) {
    const query = `query ($ids:[Int]){Page(page:1,perPage:50){media(id_in:$ids,type:ANIME){id isAdult coverImage{extraLarge large}}}}`;
    const data = await dashboardAniListRequest(query, { ids });
    (data?.Page?.media || []).forEach((media) => {
      resolved.set(Number(media.id), {
        anilistId: Number(media.id),
        url: media.coverImage?.extraLarge || media.coverImage?.large || "",
        isAdult: Boolean(media.isAdult)
      });
    });
  }

  for (const group of groups) {
    if (Number.isFinite(Number(group.anilist_id)) && resolved.has(Number(group.anilist_id))) continue;
    if (!group.title) continue;
    try {
      const query = `query ($search:String){Media(search:$search,type:ANIME){id isAdult coverImage{extraLarge large}}}`;
      const data = await dashboardAniListRequest(query, { search: group.title });
      const media = data?.Media;
      if (media?.id) {
        resolved.set(`title:${group.title}`, {
          anilistId: Number(media.id),
          url: media.coverImage?.extraLarge || media.coverImage?.large || "",
          isAdult: Boolean(media.isAdult)
        });
      }
    } catch (error) {
      console.warn("Recommendation artwork fallback failed.", error);
    }
  }
  return resolved;
}

function dashboardRecommendationMedia(group, mediaMap) {
  return mediaMap.get(Number(group.anilist_id)) || mediaMap.get(`title:${group.title}`) || {
    anilistId: Number(group.anilist_id) || null,
    url: "",
    isAdult: false
  };
}

function dashboardRecommendationHref(group, media) {
  const recommenders = group.recommenders.map((item) => item.recommender_id).filter(Boolean).join(",");
  if (group.item_type === "franchise") {
    return `franchise.html?key=${encodeURIComponent(group.franchise_key)}&rec_source=dashboard&recommenders=${encodeURIComponent(recommenders)}`;
  }
  const anilistId = media.anilistId || Number(group.anilist_id);
  return `anime.html?anilist_id=${encodeURIComponent(anilistId)}&rec_source=dashboard&recommenders=${encodeURIComponent(recommenders)}`;
}

async function dashboardRecommendationInCollection(anime, group, media) {
  if (group.item_type === "anime") return dashboardInCollection(anime, media.anilistId || group.anilist_id);
  const { data: authData } = await supabaseClient.auth.getUser();
  const userId = authData?.user?.id;
  if (!userId) return false;
  const { data } = await supabaseClient.from("user_franchises").select("franchise_key").eq("user_id", userId).eq("franchise_key", Number(group.franchise_key)).maybeSingle();
  return Boolean(data);
}

async function addRecommendationToQueue(group, media, button, anime) {
  button.disabled = true;
  button.textContent = "Adding…";
  const recommenderIds = group.recommenders.map((item) => item.recommender_id).filter(Boolean);
  const itemKey = group.item_type === "franchise" ? String(group.franchise_key) : String(media.anilistId || group.anilist_id);

  try {
    const { error: attributionError } = await supabaseClient.rpc("set_recommendation_attribution", {
      p_item_type: group.item_type,
      p_item_key: itemKey,
      p_source_mode: "dashboard",
      p_recommender_ids: recommenderIds
    });
    if (attributionError) throw attributionError;

    if (group.item_type === "franchise") {
      const { data: authData, error: authError } = await supabaseClient.auth.getUser();
      if (authError) throw authError;
      const userId = authData?.user?.id;
      if (!userId) throw new Error("You must be signed in.");
      const { error } = await supabaseClient.from("user_franchises").insert({
        user_id: userId,
        franchise_key: Number(group.franchise_key),
        status: "Queued",
        updated_at: new Date().toISOString()
      });
      if (error) throw error;
    } else {
      const anilistId = media.anilistId || Number(group.anilist_id);
      if (!anilistId) throw new Error("This recommendation is missing its title ID.");
      const { data, error } = await supabaseClient.from("anime").insert({
        anilist_id: anilistId,
        title: group.title,
        status: "Queued"
      }).select("*").single();
      if (error) throw error;
      await matClaimPioneerBadge({ anilistId });
      anime.unshift(data);
    }

    button.textContent = "In Your Collection";
  } catch (error) {
    const duplicate = error?.code === "23505" || /duplicate|already exists/i.test(error?.message || "");
    button.textContent = duplicate ? "In Your Collection" : "Add to Queue";
    button.disabled = duplicate;
    if (!duplicate) alert(error.message || "Could not add this recommendation to your queue.");
  }
}

async function renderRatedByFriends(anime, rows) {
  const container = document.getElementById("friendRatedAnime");
  if (!rows.length) {
    container.innerHTML = '<div class="empty-state">No active recommendations from users you follow yet.</div>';
    return;
  }

  const grouped = new Map();
  rows.forEach((row) => {
    const key = `${row.item_type}:${row.anilist_id || row.franchise_key || row.title}`;
    if (!grouped.has(key)) grouped.set(key, { ...row, recommenders: [] });
    grouped.get(key).recommenders.push(row);
  });
  const groups = [...grouped.values()];
  const mediaMap = await dashboardResolveRecommendationMedia(groups);
  const states = await Promise.all(groups.map(async (group) => {
    const media = dashboardRecommendationMedia(group, mediaMap);
    return { group, media, inCollection: await dashboardRecommendationInCollection(anime, group, media) };
  }));

  container.innerHTML = states.map(({ group, media, inCollection }, index) => `
    <article class="dashboard-media-card friend-rating-card" data-recommendation-index="${index}">
      <a class="dashboard-poster dashboard-poster-link${matAdultPosterClass(media.isAdult)}" href="${dashboardRecommendationHref(group, media)}" aria-label="View ${dashboardEscapeHtml(group.title)} details">
        ${media.url ? `<img src="${dashboardEscapeHtml(media.url)}" alt="${dashboardEscapeHtml(group.title)} poster" loading="lazy">` : '<div class="poster-placeholder">🎌</div>'}
        ${matAdultPosterOverlay(media.isAdult)}
      </a>
      <div class="dashboard-media-body">
        <a class="recommendation-title-link" href="${dashboardRecommendationHref(group, media)}"><h3>${dashboardEscapeHtml(group.title)}</h3></a>
        <div class="friend-rating-summary">${group.recommenders.map((item) => `<div class="friend-rating-line"><span>${dashboardEscapeHtml(item.username)} • ${Math.round(Number(item.recommendation_points) || 0).toLocaleString()} RP</span><strong>⭐ ${Number(item.rating).toFixed(1)}</strong>${item.note ? `<small>${dashboardEscapeHtml(item.note)}</small>` : ""}</div>`).join("")}</div>
        <button class="dashboard-queue-btn" type="button" data-recommendation-queue="${index}" ${inCollection ? "disabled" : ""}>${inCollection ? "In Your Collection" : "Add to Queue"}</button>
      </div>
    </article>`).join("");

  container.querySelectorAll("[data-recommendation-queue]").forEach((button) => {
    const state = states[Number(button.dataset.recommendationQueue)];
    button.addEventListener("click", () => addRecommendationToQueue(state.group, state.media, button, anime));
  });
}

function renderDashboardError(error) {
  console.error(error);
  const message = dashboardEscapeHtml(error?.message || "Could not load your dashboard.");
  const trendingContainer = document.getElementById("trendingAnime");
  if (trendingContainer) trendingContainer.innerHTML = `<div class="error">${message}</div>`;
}

async function initDashboard() {
  try {
    const anime = await loadDashboardAnime();
  
    const [trendingResult, friendRatingsResult] = await Promise.allSettled([
      loadTrendingAnime(),
      loadFriendRatings()
    ]);

    if (trendingResult.status === "fulfilled") {
      window.dashboardTrendingMedia = trendingResult.value;
      renderTrending(anime, trendingResult.value);
    } else {
      console.error(trendingResult.reason);
      document.getElementById("trendingAnime").innerHTML =
        '<div class="error">Could not load trending anime.</div>';
    }

    if (friendRatingsResult.status === "fulfilled") {
      window.dashboardFriendRatingGroups = friendRatingsResult.value;
      await renderRatedByFriends(anime, friendRatingsResult.value);
    } else {
      console.error(friendRatingsResult.reason);
      document.getElementById("friendRatedAnime").innerHTML =
        '<div class="error">Could not load recommendations.</div>';
    }
  } catch (error) {
    renderDashboardError(error);
    document.getElementById("trendingAnime").innerHTML =
      '<div class="error">Could not load trending anime.</div>';
    document.getElementById("friendRatedAnime").innerHTML =
      '<div class="error">Could not load recommendations.</div>';
  }
}
