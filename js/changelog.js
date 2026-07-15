const MAT_CHANGELOG = [
  {
    version: "v3.2.0",
    date: "July 2026",
    changes: [
      "Added the current MAT version to page footers.",
      "Added a Show 18+ Posters setting that only controls sexually explicit poster blurring.",
      "Removed Sign Out from page headers and kept it inside Profile Settings."
    ]
  },
  {
    version: "v3.0.6",
    date: "July 2026",
    changes: [
      "Added public comments to every anime.",
      "Added comment likes, replies, and sorting by Relevant, Recent, or Oldest.",
      "Added locked commenter profiles with friend request options."
    ]
  },
  {
    version: "v3.0.5.2",
    date: "July 2026",
    changes: [
      "Updated What's New so release notes always load from the latest deployed version.",
      "Simplified PWA caching so MAT remains online-only and only the offline message is cached."
    ]
  },
  {
    version: "v3.0.5.1",
    date: "July 2026",
    changes: [
      "Fixed the poster details opening error."
    ]
  },
  {
    version: "v3.0.5",
    date: "July 2026",
    changes: [
      "Removed Continue Watching from the Dashboard.",
      "Matched the What's New and Waiting Updates mini-section layouts.",
      "Limited anime ratings to Completed titles.",
      "Improved rating controls across Collection, Details, Friends, and Ratings."
    ]
  },
  {
    version: "v3.0.4",
    date: "July 2026",
    changes: [
      "Moved anime statistics and Top 5 Anime to user profiles.",
      "Redesigned profiles and moved editing controls into Settings.",
      "Cleaned up and reordered the Dashboard."
    ]
  },
  {
    version: "v3.0.3",
    date: "July 2026",
    changes: [
      "Added Invite Friends sharing tools.",
      "Added the What's New announcements section."
    ]
  },
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

  const preview = document.getElementById("latestChangelogPreview");
  const latest = MAT_CHANGELOG[0];

  if (preview && latest) {
    preview.innerHTML = `
      <span class="dashboard-mini-icon">📢</span>
      <div>
        <strong>${latest.version} • ${latest.date}</strong>
        <p>${latest.changes[0]}</p>
      </div>
    `;
  }

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
