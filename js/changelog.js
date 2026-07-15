const MAT_CHANGELOG = [
  {
    version: "v3.0.2",
    date: "July 2026",
    changes: [
      "Improved the signup confirmation experience.",
      "Added a clear reminder to check for the confirmation email from Supabase."
    ]
  },
  {
    version: "v3.0.1",
    date: "July 2026",
    changes: [
      "Added the Install MAT button.",
      "Fixed the oversized MAT logo on mobile."
    ]
  },
  {
    version: "v3.0",
    date: "July 2026",
    changes: [
      "Rebranded the app to My Anime Tracker (MAT).",
      "Added PWA installation support and the MAT app icon.",
      "Added universal anime details with trailers and collapsible descriptions."
    ]
  }
];

(function initChangelog() {
  const openButton = document.getElementById("openChangelogBtn");
  const modal = document.getElementById("changelogModal");
  const closeButton = document.getElementById("closeChangelogBtn");
  const list = document.getElementById("changelogList");

  if (!openButton || !modal || !closeButton || !list) return;

  list.innerHTML = MAT_CHANGELOG.map((entry) => `
    <article class="changelog-entry">
      <div class="changelog-entry-heading">
        <strong>${entry.version}</strong>
        <span>${entry.date}</span>
      </div>
      <ul>${entry.changes.map((change) => `<li>${change}</li>`).join("")}</ul>
    </article>
  `).join("");

  const open = () => {
    modal.hidden = false;
    document.body.classList.add("modal-open");
    closeButton.focus();
  };

  const close = () => {
    modal.hidden = true;
    document.body.classList.remove("modal-open");
    openButton.focus();
  };

  openButton.addEventListener("click", open);
  closeButton.addEventListener("click", close);
  modal.addEventListener("click", (event) => {
    if (event.target === modal) close();
  });
  document.addEventListener("keydown", (event) => {
    if (event.key === "Escape" && !modal.hidden) close();
  });
})();
