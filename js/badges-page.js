function badgesPageEscape(value) {
  return String(value ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

function badgesPageRated(row) {
  const fields = ["overall_rating","story","characters","animation","sound","world","pacing","emotion","originality","rewatch_value","enjoyment"];
  return fields.some((field) => row[field] !== null && row[field] !== undefined && row[field] !== "" && Number(row[field]) > 0);
}

async function loadOwnBadgeProgress(userId) {
  const [animeResult, commentsResult, profileResult] = await Promise.all([
    supabaseClient.from("anime").select("status, overall_rating, story, characters, animation, sound, world, pacing, emotion, originality, rewatch_value, enjoyment"),
    supabaseClient.from("anime_comments").select("id").eq("user_id", userId),
    supabaseClient.from("profiles").select("referral_count").eq("user_id", userId).maybeSingle()
  ]);

  if (animeResult.error) throw animeResult.error;
  if (commentsResult.error) throw commentsResult.error;
  if (profileResult.error) throw profileResult.error;

  const anime = animeResult.data || [];
  const commentIds = (commentsResult.data || []).map((row) => Number(row.id)).filter(Number.isFinite);
  let totalLikes = 0;

  if (commentIds.length) {
    for (let start = 0; start < commentIds.length; start += 200) {
      const batch = commentIds.slice(start, start + 200);
      const { count, error } = await supabaseClient
        .from("comment_likes")
        .select("*", { count: "exact", head: true })
        .in("comment_id", batch);
      if (error) throw error;
      totalLikes += Number(count) || 0;
    }
  }

  return {
    likes: totalLikes,
    completed: anime.filter((row) => String(row.status || "").trim().toLowerCase() === "completed").length,
    rated: anime.filter(badgesPageRated).length,
    referrals: Number(profileResult.data?.referral_count) || 0
  };
}

function badgeProgressCard(item) {
  const current = Math.max(0, Number(item.current) || 0);
  const target = Math.max(1, Number(item.target) || 1);
  const percent = Math.min(100, (current / target) * 100);
  const earned = current >= target;
  return `
    <article class="badge-progress-card${earned ? " is-earned" : ""}">
      <div class="badge-progress-top">
        <div><h3>${badgesPageEscape(item.name)}</h3><p>${badgesPageEscape(item.description)}</p></div>
        <img class="badge-progress-art" src="${badgesPageEscape(item.image)}" alt="" />
      </div>
      <div class="badge-progress-value"><span>${current.toLocaleString()} / ${target.toLocaleString()}</span><span>${Math.floor(percent)}%</span></div>
      <div class="badge-progress-track" role="progressbar" aria-valuemin="0" aria-valuemax="${target}" aria-valuenow="${Math.min(current,target)}">
        <div class="badge-progress-fill" style="width:${percent}%"></div>
      </div>
      <div class="badge-progress-status">${earned ? "Badge requirement completed" : item.status || "Keep going"}</div>
    </article>`;
}

function earnedBadgeCard(badge) {
  return `
    <article class="badges-earned-card">
      <img src="${badgesPageEscape(badge.image_path || MAT_BADGE_FALLBACK_IMAGE)}" alt="" />
      <div>
        <h3>${badgesPageEscape(badge.name || "MAT Badge")}</h3>
        <p>${badgesPageEscape(badge.description || "Official MAT badge.")}</p>
        ${badge.awarded_at ? `<small>Earned ${new Date(badge.awarded_at).toLocaleDateString()}</small>` : ""}
      </div>
    </article>`;
}

async function initBadgesPage(currentUser) {
  const root = document.getElementById("badgesPageRoot");
  const params = new URLSearchParams(location.search);
  const requestedUserId = params.get("user");
  const targetUserId = requestedUserId || currentUser.id;
  const isOwnPage = targetUserId === currentUser.id;

  try {
    if (isOwnPage) {
      const { error: refreshError } = await supabaseClient.rpc("refresh_automatic_badges");
      if (refreshError) console.warn("Automatic badges could not be refreshed.", refreshError);
    }
    const badges = await matLoadUserBadges(targetUserId);
    let username = "Your";

    if (!isOwnPage) {
      const { data, error } = await supabaseClient.rpc("get_friend_profile", { p_friend_user_id: targetUserId });
      if (error) throw error;
      if (!data?.length) throw new Error("This badge profile is private or unavailable.");
      username = data[0].username || "Friend";
      document.getElementById("badgesBackLink").href = `friend.html?user=${encodeURIComponent(targetUserId)}`;
      document.getElementById("badgesPageSubtitle").textContent = `${username}'s earned MAT badges.`;
    }

    const earnedMarkup = badges.length
      ? badges.map(earnedBadgeCard).join("")
      : '<div class="empty-state">No badges earned yet.</div>';

    let progressMarkup = '<div class="badges-private-note">Automatic badge progress is visible only to the profile owner.</div>';
    if (isOwnPage) {
      const progress = await loadOwnBadgeProgress(currentUser.id);
      const automaticBadges = [
        { image: "assets/badges/community-favorite.png", name: "Community Favorite", description: "Receive 1,000 total likes across all of your comments.", current: progress.likes, target: 1000 },
        { image: "assets/badges/recruiter.png", name: "Recruiter", description: "Invite a new member who signs up using your friend code or invitation link.", current: progress.referrals, target: 1 },
        { image: "assets/badges/anime-completion-master.png", name: "Anime Completion Master", description: "Complete 2,500 anime.", current: progress.completed, target: 2500 },
        { image: "assets/badges/rating-legend.png", name: "Rating Legend", description: "Rate 10,000 anime.", current: progress.rated, target: 10000 }
      ];
      progressMarkup = `<div class="badge-progress-grid">${automaticBadges.map(badgeProgressCard).join("")}</div>`;
    }

    root.innerHTML = `
      <div class="badges-summary">
        <div><strong>${badges.length.toLocaleString()} Earned</strong><span>${isOwnPage ? "Your official MAT badge collection" : `${badgesPageEscape(username)}'s official MAT badge collection`}</span></div>
      </div>
      <section class="badges-section">
        <div class="badges-section-heading"><h2>Earned Badges</h2><span>Official badges on this profile</span></div>
        <div class="badges-earned-grid">${earnedMarkup}</div>
      </section>
      <section class="badges-section">
        <div class="badges-section-heading"><h2>Automatic Badge Progress</h2><span>Progress updates from MAT activity</span></div>
        ${progressMarkup}
      </section>`;
  } catch (error) {
    console.error(error);
    window.matShowNetworkError?.(error, { type: navigator.onLine === false ? "offline" : "service", retry: () => location.reload(), goBack: () => history.back() });
    root.innerHTML = '<div class="error">Could not load badges.</div>';
  }
}
