window.MAT_VERSION = "v5.8.6";

(function initMatSharedChrome() {
  const bannerId = "matEmergencyBanner";
  let bannerChannel = null;

  function escapeHtml(value) {
    return String(value ?? "")
      .replaceAll("&", "&amp;")
      .replaceAll("<", "&lt;")
      .replaceAll(">", "&gt;")
      .replaceAll('"', "&quot;")
      .replaceAll("'", "&#039;");
  }

  function renderFooter() {
    document.querySelectorAll(".mat-footer").forEach((footer) => {
      footer.innerHTML = `
        <span class="mat-footer-version">${escapeHtml(window.MAT_VERSION)}</span>
        <button class="mat-footer-install" id="matFooterInstallButton" type="button">Install MAT</button>
        <a class="mat-footer-discord" href="https://discord.gg/" target="_blank" rel="noopener noreferrer">
          <span class="mat-footer-discord-copy"><strong>MAT Discord</strong><small>Support &amp; Suggestions</small></span>
        </a>`;
    });
  }

  function ensureBannerElement() {
    let banner = document.getElementById(bannerId);
    if (banner) return banner;
    banner = document.createElement("aside");
    banner.id = bannerId;
    banner.className = "mat-emergency-banner";
    banner.hidden = true;
    banner.setAttribute("role", "status");
    banner.setAttribute("aria-live", "polite");
    banner.innerHTML = '<div class="mat-emergency-track"><span class="mat-emergency-message"></span></div>';
    document.body.prepend(banner);
    return banner;
  }

  function showBanner(message) {
    const banner = ensureBannerElement();
    let clean = String(message || "").trim();
    if (clean.toLowerCase() === "emergency message") clean = "";
    const messageNode = banner.querySelector(".mat-emergency-message");
    if (messageNode) messageNode.textContent = clean;
    banner.hidden = !clean;
    document.body.classList.toggle("mat-has-emergency-banner", Boolean(clean));
  }

  async function loadBanner() {
    if (typeof supabaseClient === "undefined") return;
    const { data, error } = await supabaseClient
      .from("app_emergency_banner")
      .select("message")
      .eq("id", 1)
      .maybeSingle();
    if (error) {
      console.warn("Emergency banner could not be loaded.", error);
      return;
    }
    showBanner(data?.message || "");
  }

  function subscribeToBanner() {
    if (typeof supabaseClient === "undefined" || !supabaseClient.channel) return;
    bannerChannel = supabaseClient
      .channel("mat-emergency-banner")
      .on("postgres_changes", { event: "*", schema: "public", table: "app_emergency_banner", filter: "id=eq.1" }, (payload) => {
        showBanner(payload.new?.message || "");
      })
      .subscribe();
  }

  document.addEventListener("DOMContentLoaded", async () => {
    renderFooter();
    ensureBannerElement();
    await loadBanner();
    subscribeToBanner();
  });

  window.addEventListener("beforeunload", () => {
    if (bannerChannel && typeof supabaseClient !== "undefined") supabaseClient.removeChannel(bannerChannel);
  });
})();
