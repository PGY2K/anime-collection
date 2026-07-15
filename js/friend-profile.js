const FRIEND_ANILIST_ENDPOINT = "https://graphql.anilist.co";
let friendProfileAnime = [];
let friendProfileFilter = "all";
let activeFriendUserId = null;

function fpEscape(value) {
  return String(value ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

function fpNormalize(value) {
  return String(value ?? "").trim().toLowerCase();
}

function fpAverage(item) {
  const scores = [item.story, item.animation, item.enjoyment]
    .map(Number)
    .filter(Number.isFinite);
  if (scores.length < 3) return null;
  return scores.reduce((sum, score) => sum + score, 0) / scores.length;
}

function fpStatusClass(status) {
  const value = fpNormalize(status);
  if (value === "completed") return "status-completed";
  if (value === "in progress") return "status-progress";
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

async function fetchFriendAnime(userId) {
  const { data, error } = await supabaseClient.rpc("get_friend_anime", {
    p_friend_user_id: userId
  });

  if (error) throw error;
  return data || [];
}

async function fetchFriendPosters(ids) {
  const uniqueIds = [...new Set(ids.map(Number).filter(Number.isFinite))];
  if (!uniqueIds.length) return new Map();

  const query = `
    query ($ids: [Int]) {
      Page(page: 1, perPage: 50) {
        media(id_in: $ids, type: ANIME) {
          id
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
    item.coverImage?.extraLarge || item.coverImage?.large || ""
  ]));
}

function renderFriendProfileShell(profile) {
  const root = document.getElementById("friendProfileRoot");

  root.innerHTML = `
    <section class="friend-profile-header">
      <img class="friend-profile-avatar" src="${profileAvatarPath(profile.avatar_id || 1)}" alt="${fpEscape(profile.username)} avatar" />
      <div>
        <a class="friend-profile-back" href="friends.html">← Friends</a>
        <h1>${fpEscape(profile.username || "Anime Fan")}</h1>
        <p>Accepted friend profile</p>
      </div>
    </section>

    <div class="friend-filter-bar">
      <button class="filter-btn active" type="button" data-friend-filter="all">All</button>
      <button class="filter-btn" type="button" data-friend-filter="in progress">Watching</button>
      <button class="filter-btn" type="button" data-friend-filter="queued">Queue</button>
      <button class="filter-btn" type="button" data-friend-filter="completed">Completed</button>
      <button class="filter-btn" type="button" data-friend-filter="favorites">Favorites</button>
    </div>

    <section class="friend-anime-grid" id="friendAnimeGrid">
      <div class="loading">Loading collection…</div>
    </section>
  `;

  document.querySelectorAll("[data-friend-filter]").forEach((button) => {
    button.addEventListener("click", () => {
      document.querySelectorAll("[data-friend-filter]").forEach((item) => item.classList.remove("active"));
      button.classList.add("active");
      friendProfileFilter = button.dataset.friendFilter;
      renderFriendAnime();
    });
  });
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
        const poster = posters.get(Number(item.anilist_id));
        return `
          <article class="friend-anime-card">
            <div class="friend-anime-poster">
              ${poster
                ? `<img src="${fpEscape(poster)}" alt="${fpEscape(item.title)} poster" loading="lazy" />`
                : '<div class="poster-placeholder">🎌</div>'}
            </div>
            <div class="friend-anime-body">
              <h3 class="friend-anime-title">${fpEscape(item.title)}</h3>
              <div class="friend-anime-meta">
                <span class="status ${fpStatusClass(item.status)}">${fpEscape(item.status || "Queued")}</span>
                <span class="friend-anime-score">${score === null ? "Not rated" : `⭐ ${score.toFixed(1)}`}</span>
              </div>
              <button
                class="primary-btn add-queue-btn"
                type="button"
                data-anilist-id="${item.anilist_id}"
                data-title="${fpEscape(item.title)}"
              >
                + Add to Queue
              </button>
            </div>
          </article>
        `;
      }).join("")
    : '<div class="empty-state">No anime in this section.</div>';

  root.querySelectorAll(".add-queue-btn").forEach((button) => {
    button.addEventListener("click", async () => {
      button.disabled = true;
      button.textContent = "Adding…";

      const { error } = await supabaseClient.rpc("add_friend_anime_to_queue", {
        p_friend_user_id: activeFriendUserId,
        p_anilist_id: Number(button.dataset.anilistId),
        p_title: button.dataset.title
      });

      if (error) {
        alert(error.message);
        button.disabled = false;
        button.textContent = "+ Add to Queue";
        return;
      }

      button.textContent = "Added to Queue";
    });
  });
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
    const [profile, anime] = await Promise.all([
      fetchFriendProfile(activeFriendUserId),
      fetchFriendAnime(activeFriendUserId)
    ]);

    friendProfileAnime = anime;
    renderFriendProfileShell(profile);
    await renderFriendAnime();
  } catch (error) {
    console.error(error);
    root.innerHTML = `<div class="error">${fpEscape(error.message || "Could not load friend profile.")}</div>`;
  }
}
