window.MAT_VERSION = "v4.4.0";
window.MAT_DISCORD_URL = "https://discord.gg/FWQXmgKACk";

(function renderMatFooter() {
  const render = () => {
    document.querySelectorAll("footer").forEach((footer) => {
      footer.classList.add("mat-footer");
      footer.innerHTML = `
        <span class="mat-footer-version">My Anime Tracker • ${window.MAT_VERSION}</span>
        <button class="mat-footer-install" id="matFooterInstallButton" type="button">Install App</button>
        <a
          class="mat-footer-discord"
          href="${window.MAT_DISCORD_URL}"
          target="_blank"
          rel="noopener noreferrer"
          aria-label="Open the MAT Discord community for support and suggestions"
          title="MAT Discord Community"
        >
          <svg class="mat-footer-discord-logo" viewBox="0 0 24 24" aria-hidden="true" focusable="false">
            <path fill="currentColor" d="M19.54 5.34A16.18 16.18 0 0 0 15.44 4l-.5 1.02a14.9 14.9 0 0 0-5.88 0L8.55 4a16.3 16.3 0 0 0-4.1 1.35C1.85 9.2 1.15 12.95 1.5 16.65a16.64 16.64 0 0 0 5.03 2.55l1.22-1.68a10.6 10.6 0 0 1-1.92-.92l.47-.36c3.7 1.7 7.7 1.7 11.36 0l.48.36c-.62.37-1.27.68-1.93.92l1.22 1.68a16.63 16.63 0 0 0 5.03-2.55c.42-4.29-.72-8-2.92-11.31ZM8.62 14.85c-1.11 0-2.03-1.02-2.03-2.27 0-1.25.9-2.28 2.03-2.28s2.05 1.03 2.03 2.28c0 1.25-.9 2.27-2.03 2.27Zm6.76 0c-1.11 0-2.03-1.02-2.03-2.27 0-1.25.9-2.28 2.03-2.28 1.13 0 2.05 1.03 2.03 2.28 0 1.25-.9 2.27-2.03 2.27Z"/>
          </svg>
          <span class="mat-footer-discord-copy">
            <strong>Discord</strong>
            <small>Support &amp; Suggestions</small>
          </span>
        </a>
      `;
    });
  };

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", render, { once: true });
  } else {
    render();
  }
})();
