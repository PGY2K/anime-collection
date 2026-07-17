const MAT_RELEASES = [
  {
    version: window.MAT_VERSION || "v4.3.0",
    date: "July 2026",
    announcementTitle: "Invites and automatic badges are ready",
    announcement: "Invitation links can now fill referral codes automatically while still allowing manual edits, and MAT now uses the new artwork for automatic badges and Beta Tester. View the Changelog tab for the complete list of changes.",
    groups: {
      NEW: [
        "Added editable referral codes to account creation.",
        "Added automatic referral-link filling with clear signup guidance.",
        "Added automatic badge awarding for Community Favorite, Recruiter, Anime Completion Master, and Rating Legend."
      ],
      IMPROVED: [
        "Added official artwork to all four automatic badge progress cards.",
        "Replaced the Beta Tester badge artwork with the new diamond design."
      ],
      FIXED: [
        "Connected Recruiter progress to the profile referral count instead of a placeholder value."
      ]
    }
  },
  {
    version: window.MAT_VERSION || "v4.2.0",
    date: "July 2026",
    announcementTitle: "Badge progress now has a home",
    announcement: "Profiles now include a dedicated Badges button, a new page for viewing earned badges and automatic-badge progress, plus cleaner Friends and Joined information in the profile corners. View the Changelog tab for the complete list of changes.",
    groups: {
      NEW: [
        "Added a dedicated Badges page for earned badges and automatic-badge progress.",
        "Added progress tracking for comment likes, completed anime, rated anime, and referrals."
      ],
      IMPROVED: [
        "Moved Friends to the top-left of profile cards as plain text.",
        "Added the account join date to the top-right of profile cards.",
        "Replaced the centered Friends control with a Badges button."
      ]
    }
  },
  {
    version: window.MAT_VERSION || "v4.1.0",
    date: "July 2026",
    announcementTitle: "Community counts and easier installation",
    announcement: "Anime and franchise pages now show how many MAT collections they appear in, profiles display public friend counts, and the app install option now lives neatly in the footer. View the Changelog tab for the complete list of changes.",
    groups: {
      NEW: [
        "Added a clickable collection-count indicator to anime and franchise pages.",
        "Added public accepted-friend counts to user profiles.",
        "Added an Install App option to every page footer with a guided popup."
      ],
      IMPROVED: [
        "Moved installation guidance into a clean footer popup.",
        "Added clear install states for available, installed, unsupported, and temporarily unavailable situations."
      ]
    }
  },
  {
    version: "v4.0.0",
    date: "July 2026",
    announcementTitle: "Franchise tracking has arrived",
    announcement: "Long-running anime can now stay organized under one franchise, so your collection is easier to browse without losing access to individual seasons and movies. Ratings now stay connected across franchise entries as well. View the Changelog tab for the complete list of changes.",
    groups: {
      NEW: [
        "Added automatic franchise grouping for TV seasons and movies.",
        "Added franchise pages with clickable season and movie entries.",
        "Added individual entry ratings that calculate the franchise score.",
        "Added franchise format options in Settings."
      ],
      IMPROVED: [
        "Updated Collection cards and Top 5 profiles to show franchises once.",
        "Kept individual franchise entries informational while tracking stays at the franchise level.",
        "Improved franchise loading and rating synchronization."
      ],
      FIXED: [
        "Fixed franchise artwork and navigation issues.",
        "Fixed franchise entry rating saves and collection score mismatches.",
        "Added clearer offline and service-unavailable messages."
      ]
    }
  },
  {
    version: "v3.4.0",
    date: "July 2026",
    announcementTitle: "Official badges are now live",
    announcement: "Profiles can now display official MAT badges, and badge management is available through the owner-only Admin Control Panel. View the Changelog tab for the complete list of changes.",
    groups: { NEW: ["Added Creator, Beta Tester, and Discord Moderator badges.", "Added badge details on hover and click, including locked profiles.", "Added an owner-only Admin Control Panel with friend-code badge management."] }
  },
  {
    version: "v3.3.2",
    date: "July 2026",
    announcementTitle: "Discord support is easier to find",
    announcement: "The MAT Discord now has a clearer home in the footer, making support and suggestions easier to access. View the Changelog tab for the complete list of changes.",
    groups: { IMPROVED: ["Redesigned the Discord footer link as a MAT-themed button.", "Added the Discord logo and Support & Suggestions label."] }
  },
  {
    version: "v3.3.1",
    date: "July 2026",
    announcementTitle: "Small navigation improvements",
    announcement: "Waiting updates now lead directly where expected, and version information stays consistent across MAT. View the Changelog tab for the complete list of changes.",
    groups: { IMPROVED: ["Fixed Open Waiting so it opens the Waiting collection filter.", "Made Open Waiting visually match MAT action buttons.", "Added the MAT Discord link for support and suggestions.", "Synchronized the footer version with What's New."] }
  },
  {
    version: "v3.3.0",
    date: "July 2026",
    announcementTitle: "A more detailed rating system",
    announcement: "Ratings now use a full ten-category, ten-point system with live score updates, giving you more control over how each anime is scored. View the Changelog tab for the complete list of changes.",
    groups: { NEW: ["Expanded ratings to ten categories on a 10-point scale.", "Added live slider scores and overall rating updates."], IMPROVED: ["Renamed Status & Details to Change Status."] }
  },
  {
    version: "v3.2.0",
    date: "July 2026",
    announcementTitle: "More control over your viewing experience",
    announcement: "MAT now includes poster privacy controls, cleaner account navigation, and visible version information. View the Changelog tab for the complete list of changes.",
    groups: { NEW: ["Added the current MAT version to page footers.", "Added a Show 18+ Posters setting that only controls sexually explicit poster blurring."], IMPROVED: ["Removed Sign Out from page headers and kept it inside Profile Settings."] }
  },
  {
    version: "v3.1.0",
    date: "July 2026",
    announcementTitle: "Public anime discussions are here",
    announcement: "You can now join public conversations on anime pages with comments, replies, likes, and sorting. View the Changelog tab for the complete list of changes.",
    groups: { NEW: ["Added public comments to every anime.", "Added comment likes, replies, and sorting by Relevant, Recent, or Oldest.", "Added locked commenter profiles with friend request options."] }
  },
  {
    version: "v3.0.5",
    date: "July 2026",
    announcementTitle: "Dashboard and ratings cleanup",
    announcement: "The Dashboard is more focused, and completed-anime ratings are easier to manage from one place. View the Changelog tab for the complete list of changes.",
    groups: { IMPROVED: ["Removed Continue Watching from the Dashboard.", "Matched the What's New and Waiting Updates mini-section layouts.", "Limited anime ratings to Completed titles.", "Improved rating controls across Collection, Details, Friends, and Ratings."] }
  },
  {
    version: "v3.0.4",
    date: "July 2026",
    announcementTitle: "Profiles now show more of your anime identity",
    announcement: "Stats and Top 5 Anime moved to profiles, while the Dashboard became cleaner and more focused on current activity. View the Changelog tab for the complete list of changes.",
    groups: { IMPROVED: ["Moved anime statistics and Top 5 Anime to user profiles.", "Redesigned profiles and moved editing controls into Settings.", "Cleaned up and reordered the Dashboard."] }
  },
  {
    version: "v3.0.3",
    date: "July 2026",
    announcementTitle: "Invite friends and follow MAT updates",
    announcement: "Friend invites and the first What's New experience were added to make MAT easier to share and keep up with. View the Changelog tab for the complete list of changes.",
    groups: { NEW: ["Added Invite Friends sharing tools.", "Added the What's New section."] }
  },
  {
    version: "v3.0.2",
    date: "July 2026",
    announcementTitle: "Signup is clearer",
    announcement: "New users now receive a clearer reminder to confirm their account before signing in. View the Changelog tab for the complete list of changes.",
    groups: { IMPROVED: ["Improved the signup confirmation experience.", "Added a clear reminder to check for the confirmation email from Supabase."] }
  },
  {
    version: "v3.0.1",
    date: "July 2026",
    announcementTitle: "MAT is easier to install",
    announcement: "The install experience and mobile navigation were improved so MAT works more naturally as an app. View the Changelog tab for the complete list of changes.",
    groups: { NEW: ["Added the Install MAT button."], FIXED: ["Fixed the oversized MAT logo on mobile."] }
  },
  {
    version: "v3.0.0",
    date: "July 2026",
    announcementTitle: "Welcome to My Anime Tracker",
    announcement: "Anime Collection became My Anime Tracker, complete with MAT branding, an installable PWA, and richer anime details. View the Changelog tab for the complete list of changes.",
    groups: { NEW: ["Rebranded the app to My Anime Tracker (MAT).", "Added PWA installation support and the MAT app icon.", "Added universal anime details with trailers and collapsible descriptions."] }
  }
];

(function initWhatsNew() {
  const openButton = document.getElementById("openChangelogBtn");
  const modal = document.getElementById("changelogModal");
  const closeButton = document.getElementById("closeChangelogBtn");
  const announcementList = document.getElementById("announcementList");
  const changelogList = document.getElementById("changelogList");
  const announcementTab = document.getElementById("announcementsTab");
  const changelogTab = document.getElementById("changelogTab");
  const announcementPanel = document.getElementById("announcementsPanel");
  const changelogPanel = document.getElementById("changelogPanel");

  if (!openButton || !modal || !closeButton || !announcementList || !changelogList || !announcementTab || !changelogTab || !announcementPanel || !changelogPanel) return;

  const preview = document.getElementById("latestChangelogPreview");
  const latest = MAT_RELEASES[0];

  if (preview && latest) {
    preview.innerHTML = `
      <span class="dashboard-mini-icon">📢</span>
      <div>
        <strong>${escapeHtml(latest.announcementTitle)}</strong>
        <p>${escapeHtml(latest.announcement)}</p>
      </div>
    `;
  }

  announcementList.innerHTML = MAT_RELEASES.map((entry) => `
    <article class="announcement-entry">
      <div class="announcement-entry-heading">
        <div>
          <strong>${escapeHtml(entry.announcementTitle)}</strong>
          <span>${escapeHtml(entry.version)} • ${escapeHtml(entry.date)}</span>
        </div>
      </div>
      <p>${escapeHtml(entry.announcement)}</p>
    </article>
  `).join("");

  changelogList.innerHTML = MAT_RELEASES.map((entry) => {
    const groups = Object.entries(entry.groups || {}).filter(([, changes]) => Array.isArray(changes) && changes.length);
    return `
      <article class="changelog-entry">
        <div class="changelog-entry-heading">
          <strong>${escapeHtml(entry.version)}</strong>
          <span>${escapeHtml(entry.date)}</span>
        </div>
        ${groups.map(([label, changes]) => `
          <section class="changelog-group">
            <h3>${escapeHtml(label)}</h3>
            <ul>${changes.map((change) => `<li>${escapeHtml(change)}</li>`).join("")}</ul>
          </section>
        `).join("")}
      </article>
    `;
  }).join("");

  function selectTab(tab) {
    const showingAnnouncements = tab === "announcements";
    announcementTab.classList.toggle("is-active", showingAnnouncements);
    changelogTab.classList.toggle("is-active", !showingAnnouncements);
    announcementTab.setAttribute("aria-selected", String(showingAnnouncements));
    changelogTab.setAttribute("aria-selected", String(!showingAnnouncements));
    announcementPanel.hidden = !showingAnnouncements;
    changelogPanel.hidden = showingAnnouncements;
  }

  const open = () => {
    selectTab("announcements");
    modal.hidden = false;
    document.body.classList.add("modal-open");
    announcementTab.focus();
  };

  const close = () => {
    modal.hidden = true;
    document.body.classList.remove("modal-open");
    openButton.focus();
  };

  announcementTab.addEventListener("click", () => selectTab("announcements"));
  changelogTab.addEventListener("click", () => selectTab("changelog"));
  openButton.addEventListener("click", open);
  closeButton.addEventListener("click", close);
  modal.addEventListener("click", (event) => {
    if (event.target === modal) close();
  });
  document.addEventListener("keydown", (event) => {
    if (event.key === "Escape" && !modal.hidden) close();
  });
})();

function escapeHtml(value) {
  return String(value ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}
