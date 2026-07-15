let deferredInstallPrompt = null;

function isStandaloneMode() {
  return window.matchMedia("(display-mode: standalone)").matches ||
    window.navigator.standalone === true;
}

function isAppleMobileDevice() {
  return /iphone|ipad|ipod/i.test(window.navigator.userAgent);
}

function setupInstallButton() {
  const card = document.getElementById("installAppCard");
  const button = document.getElementById("installAppButton");
  const modal = document.getElementById("installHelpModal");
  const closeButton = document.getElementById("closeInstallHelp");

  if (!card || !button) return;

  const hideInstallCard = () => {
    card.hidden = true;
  };

  if (isStandaloneMode()) {
    hideInstallCard();
    return;
  }

  if (isAppleMobileDevice()) {
    card.hidden = false;
  }

  window.addEventListener("beforeinstallprompt", (event) => {
    event.preventDefault();
    deferredInstallPrompt = event;
    card.hidden = false;
  });

  window.addEventListener("appinstalled", () => {
    deferredInstallPrompt = null;
    hideInstallCard();
    if (modal) modal.hidden = true;
  });

  button.addEventListener("click", async () => {
    if (deferredInstallPrompt) {
      deferredInstallPrompt.prompt();
      await deferredInstallPrompt.userChoice;
      deferredInstallPrompt = null;
      return;
    }

    if (modal) {
      modal.hidden = false;
    }
  });

  if (closeButton && modal) {
    closeButton.addEventListener("click", () => {
      modal.hidden = true;
    });

    modal.addEventListener("click", (event) => {
      if (event.target === modal) modal.hidden = true;
    });

    document.addEventListener("keydown", (event) => {
      if (event.key === "Escape") modal.hidden = true;
    });
  }
}

if ("serviceWorker" in navigator) {
  window.addEventListener("load", () => {
    navigator.serviceWorker.register("./service-worker.js").catch((error) => {
      console.warn("Service worker registration failed:", error);
    });
  });
}

document.addEventListener("DOMContentLoaded", setupInstallButton);
