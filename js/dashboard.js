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
  const scores = [item.story, item.animation, item.enjoyment]
    .map(dashboardNumber)
    .filter((value) => value !== null);

  if (scores.length < 3) {
    return null;
  }

  return scores.reduce((sum, value) => sum + value, 0) / scores.length;
}

async function loadDashboardAnime() {
  const { data, error } = await supabaseClient
    .from("anime")
    .select("id, title, status, story, animation, enjoyment, created_at")
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

function renderDashboardError(error) {
  console.error(error);

  document.querySelectorAll(".stat-number").forEach((element) => {
    element.textContent = "!";
  });

  const message = dashboardEscapeHtml(
    error?.message || "Could not load your dashboard."
  );

  document.getElementById("topRated").innerHTML =
    `<div class="error">${message}</div>`;

  document.getElementById("queueList").innerHTML =
    `<div class="error">${message}</div>`;
}

async function initDashboard() {
  try {
    const anime = await loadDashboardAnime();
    renderDashboardStats(anime);
    renderTopRated(anime);
    renderQueue(anime);
  } catch (error) {
    renderDashboardError(error);
  }
}
