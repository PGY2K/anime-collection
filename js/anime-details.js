const ANILIST_DETAILS_ENDPOINT = "https://graphql.anilist.co";

function detailsEscapeHtml(value) {
  return String(value ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

function detailsNormalize(value) {
  return String(value ?? "").trim().toLowerCase();
}

function detailsStatusClass(status) {
  const value = detailsNormalize(status);
  if (value === "completed") return "status-completed";
  if (value === "in progress") return "status-progress";
  if (value === "waiting") return "status-waiting";
  if (value === "dropped") return "status-dropped";
  return "status-queued";
}

function detailsAverage(story, animation, enjoyment) {
  const scores = [story, animation, enjoyment]
    .map((value) => Number(value))
    .filter(Number.isFinite);

  if (scores.length < 3) return null;
  return scores.reduce((sum, value) => sum + value, 0) / scores.length;
}

function stripHtml(html) {
  const element = document.createElement("div");
  element.innerHTML = html || "";
  return element.textContent || element.innerText || "";
}

function scoreOptions(selectedValue) {
  const selected = selectedValue === null || selectedValue === undefined
    ? ""
    : String(selectedValue);

  return ["", "1", "2", "3", "4", "5"]
    .map((value) => {
      const label = value || "Not rated";
      return `<option value="${value}" ${value === selected ? "selected" : ""}>${label}</option>`;
    })
    .join("");
}

function statusOptions(selectedStatus) {
  return ["Queued", "In Progress", "Waiting", "Completed", "Dropped"]
    .map((status) => (
      `<option value="${status}" ${status === selectedStatus ? "selected" : ""}>${status}</option>`
    ))
    .join("");
}

async function fetchRecord(recordId) {
  const { data, error } = await supabaseClient
    .from("anime")
    .select("*")
    .eq("id", recordId)
    .single();

  if (error) throw error;
  return data;
}

async function updateRecord(recordId, changes) {
  const { data, error } = await supabaseClient
    .from("anime")
    .update({
      ...changes,
      updated_at: new Date().toISOString()
    })
    .eq("id", recordId)
    .select("*")
    .single();

  if (error) throw error;
  return data;
}

async function deleteRecord(recordId) {
  const { error } = await supabaseClient
    .from("anime")
    .delete()
    .eq("id", recordId);

  if (error) throw error;
}

async function fetchAniListDetails(anilistId) {
  const query = `
    query ($id: Int) {
      Media(id: $id, type: ANIME) {
        id
        title { romaji english native }
        description(asHtml: true)
        bannerImage
        coverImage { extraLarge large }
        episodes
        duration
        format
        season
        seasonYear
        status
        genres
        averageScore
        studios(isMain: true) { nodes { name } }
      }
    }
  `;

  const response = await fetch(ANILIST_DETAILS_ENDPOINT, {
    method: "POST",
    headers: { "Content-Type": "application/json", Accept: "application/json" },
    body: JSON.stringify({ query, variables: { id: Number(anilistId) } })
  });

  if (!response.ok) throw new Error("AniList details request failed");

  const json = await response.json();
  return json?.data?.Media ?? null;
}

function renderDetails(record, media) {
  const root = document.getElementById("detailsRoot");
  const title = media?.title?.english || media?.title?.romaji || record.title;
  const poster = media?.coverImage?.extraLarge || media?.coverImage?.large || "";
  const banner = media?.bannerImage || "";
  const synopsis = stripHtml(media?.description) || "No synopsis is available yet.";
  const genres = media?.genres || [];
  const studios = media?.studios?.nodes?.map((studio) => studio.name).join(", ") || "Unknown";
  const rating = detailsAverage(record.story, record.animation, record.enjoyment);
  const meta = [
    media?.format?.replaceAll("_", " "),
    media?.episodes ? `${media.episodes} Episodes` : null,
    media?.seasonYear
  ].filter(Boolean).join(" • ");

  root.innerHTML = `
    <section class="details-hero">
      ${banner
        ? `<img class="details-banner" src="${detailsEscapeHtml(banner)}" alt="${detailsEscapeHtml(title)} banner">`
        : '<div class="details-banner-fallback"></div>'}
      <div class="details-overlay"></div>

      <div class="details-hero-content">
        ${poster
          ? `<img class="details-poster" src="${detailsEscapeHtml(poster)}" alt="${detailsEscapeHtml(title)} poster">`
          : '<div class="details-poster"></div>'}

        <div>
          <a class="back-link" href="collection.html">← Collection</a>
          <h1 class="details-title">${detailsEscapeHtml(title)}</h1>
          <div class="details-meta">${detailsEscapeHtml(meta || "Anime")}</div>

          <div class="details-actions">
            <span class="details-status status ${detailsStatusClass(record.status)}">
              ${detailsEscapeHtml(record.status || "Queued")}
            </span>
            <span class="details-rating">
              ${rating === null ? "Not rated yet" : `⭐ ${rating.toFixed(1)}`}
            </span>
            ${record.favorite ? '<span class="favorite-badge">♥ Favorite</span>' : ""}
            <button class="edit-anime-btn" id="editAnimeBtn" type="button">Edit Anime</button>
            <button class="remove-anime-btn" id="removeAnimeBtn" type="button">Remove from Collection</button>
          </div>
        </div>
      </div>
    </section>

    <section class="details-grid">
      <article class="details-panel">
        <h2>Synopsis</h2>
        <p class="synopsis">${detailsEscapeHtml(synopsis)}</p>

        <h2 class="section-spacing">Genres</h2>
        <div class="genre-list">
          ${genres.length
            ? genres.map((genre) => `<span class="genre-chip">${detailsEscapeHtml(genre)}</span>`).join("")
            : '<span class="genre-chip">Unknown</span>'}
        </div>

        <h2 class="section-spacing">Your Notes</h2>
        <p class="notes-display">${record.notes ? detailsEscapeHtml(record.notes) : "No notes yet."}</p>
      </article>

      <aside class="details-panel">
        <h2>Your Tracking</h2>
        <div class="info-list">
          <div class="info-row"><span class="info-label">Story</span><span class="info-value">${record.story ?? "—"}</span></div>
          <div class="info-row"><span class="info-label">Animation</span><span class="info-value">${record.animation ?? "—"}</span></div>
          <div class="info-row"><span class="info-label">Enjoyment</span><span class="info-value">${record.enjoyment ?? "—"}</span></div>
          <div class="info-row"><span class="info-label">Last Season</span><span class="info-value">${detailsEscapeHtml(record.last_season || "—")}</span></div>
          <div class="info-row"><span class="info-label">Started Watching</span><span class="info-value">${detailsEscapeHtml(record.started_watching || "—")}</span></div>
        </div>

        <h2 class="section-spacing">Information</h2>
        <div class="info-list">
          <div class="info-row"><span class="info-label">Studio</span><span class="info-value">${detailsEscapeHtml(studios)}</span></div>
          <div class="info-row"><span class="info-label">Episodes</span><span class="info-value">${detailsEscapeHtml(media?.episodes ?? "Unknown")}</span></div>
          <div class="info-row"><span class="info-label">Format</span><span class="info-value">${detailsEscapeHtml(media?.format?.replaceAll("_", " ") || "Unknown")}</span></div>
          <div class="info-row"><span class="info-label">Year</span><span class="info-value">${detailsEscapeHtml(media?.seasonYear ?? "Unknown")}</span></div>
          <div class="info-row"><span class="info-label">AniList Score</span><span class="info-value">${detailsEscapeHtml(media?.averageScore ? `${media.averageScore}%` : "Unknown")}</span></div>
        </div>
      </aside>
    </section>

    <div class="remove-modal-backdrop hidden" id="removeAnimeModal" aria-hidden="true">
      <section class="remove-modal-card" role="dialog" aria-modal="true" aria-labelledby="removeAnimeTitle">
        <h2 id="removeAnimeTitle">Remove from Collection?</h2>
        <p>Remove <strong>${detailsEscapeHtml(title)}</strong> from your collection? This cannot be undone.</p>
        <div class="remove-modal-actions">
          <button class="secondary-action-btn" id="cancelRemoveBtn" type="button">Cancel</button>
          <button class="confirm-remove-btn" id="confirmRemoveBtn" type="button">Remove</button>
        </div>
        <div class="edit-message" id="removeMessage"></div>
      </section>
    </div>

    <div class="edit-modal-backdrop hidden" id="editAnimeModal" aria-hidden="true">
      <section class="edit-modal-card" role="dialog" aria-modal="true" aria-labelledby="editAnimeTitle">
        <div class="edit-modal-header">
          <div>
            <h2 id="editAnimeTitle">Edit ${detailsEscapeHtml(title)}</h2>
            <p>Update your status, ratings, progress, and notes.</p>
          </div>
          <button class="edit-close-btn" id="closeEditBtn" type="button" aria-label="Close">×</button>
        </div>

        <form id="editAnimeForm" class="edit-form">
          <label>
            Status
            <select id="editStatus">${statusOptions(record.status || "Queued")}</select>
          </label>

          <details class="status-guide">
            <summary>ⓘ Status Guide</summary>
            <div class="status-guide-list">
              <p><strong>Queued:</strong> You've added this anime to your collection but haven't started watching it yet.</p>
              <p><strong>In Progress:</strong> You're currently watching these anime.</p>
              <p><strong>Waiting:</strong> You're waiting for new episodes or the next season.</p>
              <p><strong>Completed:</strong> You've finished watching these anime.</p>
              <p><strong>Dropped:</strong> You've decided not to continue watching these anime.</p>
            </div>
          </details>

          <div class="rating-fields">
            <label>
              Story
              <select id="editStory">${scoreOptions(record.story)}</select>
            </label>
            <label>
              Animation
              <select id="editAnimation">${scoreOptions(record.animation)}</select>
            </label>
            <label>
              Enjoyment
              <select id="editEnjoyment">${scoreOptions(record.enjoyment)}</select>
            </label>
          </div>

          <label>
            Last Season Watched
            <input id="editLastSeason" type="text" value="${detailsEscapeHtml(record.last_season || "")}" placeholder="Example: Season 2">
          </label>

          <label>
            Started Watching
            <input id="editStartedWatching" type="date" value="${detailsEscapeHtml(record.started_watching || "")}">
          </label>

          <label>
            Notes
            <textarea id="editNotes" rows="5" placeholder="Add personal notes...">${detailsEscapeHtml(record.notes || "")}</textarea>
          </label>

          <label class="favorite-toggle">
            <input id="editFavorite" type="checkbox" ${record.favorite ? "checked" : ""}>
            <span>Mark as favorite</span>
          </label>

          <div class="edit-message" id="editMessage"></div>

          <div class="edit-form-actions">
            <button class="secondary-action-btn" id="cancelEditBtn" type="button">Cancel</button>
            <button class="save-anime-btn" id="saveEditBtn" type="submit">Save Changes</button>
          </div>
        </form>
      </section>
    </div>
  `;

  initializeEditor(record, media);
}

function initializeEditor(record, media) {
  const modal = document.getElementById("editAnimeModal");
  const form = document.getElementById("editAnimeForm");
  const editButton = document.getElementById("editAnimeBtn");
  const closeButton = document.getElementById("closeEditBtn");
  const cancelButton = document.getElementById("cancelEditBtn");
  const removeModal = document.getElementById("removeAnimeModal");
  const removeButton = document.getElementById("removeAnimeBtn");
  const cancelRemoveButton = document.getElementById("cancelRemoveBtn");
  const confirmRemoveButton = document.getElementById("confirmRemoveBtn");

  function openRemoveModal() {
    removeModal.classList.remove("hidden");
    removeModal.setAttribute("aria-hidden", "false");
    document.body.classList.add("modal-open");
  }

  function closeRemoveModal() {
    removeModal.classList.add("hidden");
    removeModal.setAttribute("aria-hidden", "true");
    document.body.classList.remove("modal-open");
  }

  function openEditor() {
    modal.classList.remove("hidden");
    modal.setAttribute("aria-hidden", "false");
    document.body.classList.add("modal-open");
  }

  function closeEditor() {
    modal.classList.add("hidden");
    modal.setAttribute("aria-hidden", "true");
    document.body.classList.remove("modal-open");
  }

  editButton.addEventListener("click", openEditor);
  removeButton.addEventListener("click", openRemoveModal);
  cancelRemoveButton.addEventListener("click", closeRemoveModal);
  removeModal.addEventListener("click", (event) => {
    if (event.target === removeModal) closeRemoveModal();
  });

  confirmRemoveButton.addEventListener("click", async () => {
    const message = document.getElementById("removeMessage");
    confirmRemoveButton.disabled = true;
    confirmRemoveButton.textContent = "Removing...";
    message.textContent = "";

    try {
      await deleteRecord(record.id);
      window.location.href = "collection.html";
    } catch (error) {
      console.error(error);
      message.textContent = error.message || "Could not remove anime.";
      message.className = "edit-message edit-message-error";
      confirmRemoveButton.disabled = false;
      confirmRemoveButton.textContent = "Remove";
    }
  });

  if (new URLSearchParams(window.location.search).get("edit") === "1") {
    openEditor();
  }

  closeButton.addEventListener("click", closeEditor);
  cancelButton.addEventListener("click", closeEditor);

  modal.addEventListener("click", (event) => {
    if (event.target === modal) closeEditor();
  });

  document.addEventListener("keydown", (event) => {
    if (event.key !== "Escape") return;

    if (!modal.classList.contains("hidden")) closeEditor();
    if (!removeModal.classList.contains("hidden")) closeRemoveModal();
  });

  form.addEventListener("submit", async (event) => {
    event.preventDefault();

    const saveButton = document.getElementById("saveEditBtn");
    const message = document.getElementById("editMessage");

    saveButton.disabled = true;
    saveButton.textContent = "Saving...";
    message.textContent = "";
    message.className = "edit-message";

    const nullableNumber = (id) => {
      const value = document.getElementById(id).value;
      return value === "" ? null : Number(value);
    };

    const changes = {
      status: document.getElementById("editStatus").value,
      story: nullableNumber("editStory"),
      animation: nullableNumber("editAnimation"),
      enjoyment: nullableNumber("editEnjoyment"),
      last_season: document.getElementById("editLastSeason").value.trim() || null,
      started_watching: document.getElementById("editStartedWatching").value || null,
      notes: document.getElementById("editNotes").value.trim() || null,
      favorite: document.getElementById("editFavorite").checked
    };

    try {
      const updatedRecord = await updateRecord(record.id, changes);
      closeEditor();
      renderDetails(updatedRecord, media);
    } catch (error) {
      console.error(error);
      message.textContent = error.message || "Could not save changes.";
      message.className = "edit-message edit-message-error";
      saveButton.disabled = false;
      saveButton.textContent = "Save Changes";
    }
  });
}

async function initAnimeDetails() {
  const root = document.getElementById("detailsRoot");
  const recordId = new URLSearchParams(window.location.search).get("id");

  if (!recordId) {
    root.innerHTML = '<div class="error">No anime was selected.</div>';
    return;
  }

  try {
    const record = await fetchRecord(recordId);
    const media = await fetchAniListDetails(record.anilist_id);
    renderDetails(record, media);
  } catch (error) {
    console.error(error);
    root.innerHTML = `<div class="error">${detailsEscapeHtml(error.message || "Could not load anime details.")}</div>`;
  }
}
