window.MAT_VERSION = "v3.3.1";
window.MAT_DISCORD_URL = "https://discord.gg/FWQXmgKACk";

(function renderMatFooter() {
  const render = () => {
    document.querySelectorAll("footer").forEach((footer) => {
      footer.classList.add("mat-footer");
      footer.innerHTML = `
        <span class="mat-footer-version">My Anime Tracker • ${window.MAT_VERSION}</span>
        <a
          class="mat-footer-discord"
          href="${window.MAT_DISCORD_URL}"
          target="_blank"
          rel="noopener noreferrer"
          aria-label="Open the MAT Discord for support and suggestions"
          title="Support & Suggestions"
        >Discord</a>
      `;
    });
  };

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", render, { once: true });
  } else {
    render();
  }
})();
