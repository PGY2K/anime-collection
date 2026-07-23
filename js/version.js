window.MAT_VERSION = "v6.7.1";

(function initMatEmergencyBanner() {
  if (typeof document === "undefined" || typeof supabaseClient === "undefined") return;

  let banner = null;
  let lastMessage = null;

  function ensureBanner() {
    if (banner?.isConnected) return banner;
    banner = document.createElement("aside");
    banner.className = "mat-emergency-banner";
    banner.hidden = true;
    banner.setAttribute("role", "status");
    banner.setAttribute("aria-live", "polite");
    banner.innerHTML = '<div class="mat-emergency-track"><span class="mat-emergency-message"></span><span class="mat-emergency-message" aria-hidden="true"></span></div>';
    document.body.insertBefore(banner, document.body.firstChild);
    return banner;
  }

  function showMessage(value) {
    const clean = String(value || "").trim();
    if (clean === lastMessage) return;
    lastMessage = clean;
    const node = ensureBanner();
    node.querySelectorAll(".mat-emergency-message").forEach((item) => { item.textContent = clean; });
    node.hidden = !clean;
  }

  async function loadMessage() {
    try {
      let result = await supabaseClient.from("app_emergency_banner").select("message").eq("id", 1).maybeSingle();
      if (result.error) {
        const fallback = await supabaseClient.rpc("get_emergency_banner");
        if (fallback.error) throw fallback.error;
        const value = Array.isArray(fallback.data) ? fallback.data[0]?.message : (fallback.data?.message ?? fallback.data);
        showMessage(value);
        return;
      }
      showMessage(result.data?.message);
    } catch (error) {
      console.warn("Emergency banner could not be loaded.", error);
    }
  }

  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", loadMessage, { once: true });
  else loadMessage();
  window.addEventListener("focus", loadMessage);
  window.addEventListener("mat-emergency-banner-changed", loadMessage);
  setInterval(loadMessage, 60000);
})();
