let deferredInstallPrompt = null;

function isStandaloneMode() {
  return window.matchMedia("(display-mode: standalone)").matches || window.navigator.standalone === true;
}
function isAppleMobileDevice() { return /iphone|ipad|ipod/i.test(window.navigator.userAgent); }
function isSupportedInstallBrowser() { return /chrome|chromium|crios|edg|opr|opera/i.test(navigator.userAgent) && !/firefox|fxios/i.test(navigator.userAgent); }

function ensureInstallModal() {
  if (document.getElementById("matInstallModal")) return;
  document.body.insertAdjacentHTML("beforeend", `
    <div class="mat-popup-backdrop" id="matInstallModal" hidden>
      <section class="mat-popup-card" role="dialog" aria-modal="true" aria-labelledby="matInstallTitle">
        <button class="mat-popup-close" id="matInstallClose" type="button" aria-label="Close">×</button>
        <h2 id="matInstallTitle">Install MAT</h2>
        <p id="matInstallMessage"></p>
        <div class="mat-popup-actions" id="matInstallActions"></div>
      </section>
    </div>`);
}

function installState() {
  if (isStandaloneMode()) return { message: "MAT is already installed on this device.", action: null };
  if (deferredInstallPrompt) return { message: "Install My Anime Tracker for quick access from your device.", action: "install" };
  if (isAppleMobileDevice()) return { message: "To install MAT, open this page in Safari, tap Share, then choose Add to Home Screen.", action: null };
  if (!isSupportedInstallBrowser()) return { message: "This browser does not support direct app installation. Try Chrome, Edge, or Opera.", action: null };
  return { message: "Installation is not available right now. Refresh the page and try again.", action: "retry" };
}

function openInstallModal() {
  ensureInstallModal();
  const modal = document.getElementById("matInstallModal");
  const message = document.getElementById("matInstallMessage");
  const actions = document.getElementById("matInstallActions");
  const state = installState();
  message.textContent = state.message;
  actions.innerHTML = `${state.action === "install" ? '<button class="primary-btn" id="matInstallNow" type="button">Install MAT</button>' : ''}${state.action === "retry" ? '<button class="primary-btn" id="matInstallRetry" type="button">Retry</button>' : ''}<button class="secondary-btn" id="matInstallDismiss" type="button">Close</button>`;
  modal.hidden = false;
  document.body.classList.add("modal-open");
  document.getElementById("matInstallDismiss").onclick = closeInstallModal;
  document.getElementById("matInstallRetry")?.addEventListener("click", () => location.reload());
  document.getElementById("matInstallNow")?.addEventListener("click", async () => {
    if (!deferredInstallPrompt) return openInstallModal();
    deferredInstallPrompt.prompt();
    await deferredInstallPrompt.userChoice;
    deferredInstallPrompt = null;
    openInstallModal();
  });
}
function closeInstallModal() { const modal=document.getElementById("matInstallModal"); if(modal) modal.hidden=true; document.body.classList.remove("modal-open"); }

function setupInstallButton() {
  ensureInstallModal();
  document.getElementById("matFooterInstallButton")?.addEventListener("click", openInstallModal);
  document.getElementById("matInstallClose")?.addEventListener("click", closeInstallModal);
  document.getElementById("matInstallModal")?.addEventListener("click", (event) => { if (event.target.id === "matInstallModal") closeInstallModal(); });
  document.addEventListener("keydown", (event) => { if (event.key === "Escape") closeInstallModal(); });
}
window.addEventListener("beforeinstallprompt", (event) => { event.preventDefault(); deferredInstallPrompt = event; });
window.addEventListener("appinstalled", () => { deferredInstallPrompt = null; openInstallModal(); });
if ("serviceWorker" in navigator) window.addEventListener("load", () => navigator.serviceWorker.register("./service-worker.js").catch((error) => console.warn("Service worker registration failed:", error)));
document.addEventListener("DOMContentLoaded", setupInstallButton);
