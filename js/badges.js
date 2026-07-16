const MAT_BADGE_FALLBACK_IMAGE = "assets/icons/mat-logo.png";

function matBadgeEscape(value) {
  return String(value ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

async function matLoadBadgeCatalog() {
  const { data, error } = await supabaseClient.rpc("get_badge_catalog");
  if (error) throw error;
  return data || [];
}

async function matLoadUserBadges(userId) {
  if (!userId) return [];
  const { data, error } = await supabaseClient.rpc("get_public_user_badges", {
    p_user_id: userId
  });
  if (error) throw error;
  return data || [];
}

function matBadgeRowHtml(badges, options = {}) {
  const { emptyText = "No badges yet.", compact = false } = options;
  if (!badges?.length) {
    return `<div class="mat-badge-empty${compact ? " compact" : ""}">${matBadgeEscape(emptyText)}</div>`;
  }

  return `
    <div class="mat-badge-row${compact ? " compact" : ""}" aria-label="Profile badges">
      ${badges.map((badge) => `
        <button
          class="mat-badge-button"
          type="button"
          title="${matBadgeEscape(badge.name)}"
          aria-label="View ${matBadgeEscape(badge.name)} badge details"
          data-mat-badge-name="${matBadgeEscape(badge.name)}"
          data-mat-badge-description="${matBadgeEscape(badge.description)}"
          data-mat-badge-image="${matBadgeEscape(badge.image_path || MAT_BADGE_FALLBACK_IMAGE)}"
          data-mat-badge-awarded="${matBadgeEscape(badge.awarded_at || "")}">
          <img src="${matBadgeEscape(badge.image_path || MAT_BADGE_FALLBACK_IMAGE)}" alt="" />
        </button>
      `).join("")}
    </div>`;
}

function matEnsureBadgeDetailsModal() {
  let modal = document.getElementById("matBadgeDetailsModal");
  if (modal) return modal;

  modal = document.createElement("div");
  modal.id = "matBadgeDetailsModal";
  modal.className = "mat-badge-modal-backdrop";
  modal.hidden = true;
  modal.innerHTML = `
    <section class="mat-badge-modal" role="dialog" aria-modal="true" aria-labelledby="matBadgeModalName">
      <button class="mat-badge-modal-close" type="button" aria-label="Close">×</button>
      <img class="mat-badge-modal-image" id="matBadgeModalImage" src="${MAT_BADGE_FALLBACK_IMAGE}" alt="" />
      <h2 id="matBadgeModalName">Badge</h2>
      <p id="matBadgeModalDescription"></p>
      <small id="matBadgeModalAwarded"></small>
    </section>`;
  document.body.appendChild(modal);

  const close = () => {
    modal.hidden = true;
    document.body.classList.remove("modal-open");
  };
  modal.querySelector(".mat-badge-modal-close").addEventListener("click", close);
  modal.addEventListener("click", (event) => {
    if (event.target === modal) close();
  });
  return modal;
}

function matBindBadgeButtons(root = document) {
  const modal = matEnsureBadgeDetailsModal();
  root.querySelectorAll("[data-mat-badge-name]").forEach((button) => {
    if (button.dataset.badgeBound === "true") return;
    button.dataset.badgeBound = "true";
    button.addEventListener("click", () => {
      document.getElementById("matBadgeModalImage").src = button.dataset.matBadgeImage || MAT_BADGE_FALLBACK_IMAGE;
      document.getElementById("matBadgeModalName").textContent = button.dataset.matBadgeName || "Badge";
      document.getElementById("matBadgeModalDescription").textContent = button.dataset.matBadgeDescription || "";
      const awarded = button.dataset.matBadgeAwarded;
      document.getElementById("matBadgeModalAwarded").textContent = awarded
        ? `Awarded ${new Date(awarded).toLocaleDateString()}`
        : "";
      modal.hidden = false;
      document.body.classList.add("modal-open");
    });
  });
}
