(function () {
  function isOffline() {
    return typeof navigator !== "undefined" && navigator.onLine === false;
  }

  function classify(error, requestedType) {
    if (isOffline()) return "offline";
    if (requestedType) return requestedType;
    if (error?.matErrorType) return error.matErrorType;
    const message = String(error?.message || "");
    const code = String(error?.code || "");
    if (/graphql|anime information|source provider|anilist/i.test(message)) return "source";
    if (/pgrst|postgrest|supabase|backend|auth|row level security/i.test(message) || /^PGRST/i.test(code)) return "service";
    return "unexpected";
  }

  const COPY = {
    offline: {
      title: "No Internet Connection",
      message: "MAT couldn't connect to the internet. Please check your connection and try again."
    },
    source: {
      title: "Source Provider Unavailable",
      message: "The anime information service is temporarily unavailable. Please try again in a few minutes."
    },
    service: {
      title: "Service Unavailable",
      message: "MAT is temporarily unable to load your collection data. Please try again in a few minutes."
    },
    unexpected: {
      title: "Unexpected Error",
      message: "Something went wrong while loading this page. Please try again."
    }
  };

  function showError(error, options = {}) {
    const type = classify(error, options.type);
    const copy = COPY[type] || COPY.unexpected;
    let backdrop = document.getElementById("matNetworkDialog");
    if (!backdrop) {
      backdrop = document.createElement("div");
      backdrop.id = "matNetworkDialog";
      backdrop.className = "mat-network-dialog-backdrop";
      backdrop.innerHTML = `
        <section class="mat-network-dialog" role="alertdialog" aria-modal="true" aria-labelledby="matNetworkTitle">
          <h2 id="matNetworkTitle"></h2>
          <p id="matNetworkMessage"></p>
          <div class="mat-network-dialog-actions">
            <button type="button" class="primary-btn" id="matNetworkRetry">Retry</button>
            <button type="button" class="secondary-btn" id="matNetworkBack">Go Back</button>
          </div>
        </section>`;
      document.body.appendChild(backdrop);
    }
    backdrop.querySelector("#matNetworkTitle").textContent = copy.title;
    backdrop.querySelector("#matNetworkMessage").textContent = copy.message;
    const retry = backdrop.querySelector("#matNetworkRetry");
    const back = backdrop.querySelector("#matNetworkBack");
    retry.onclick = () => typeof options.retry === "function" ? options.retry() : location.reload();
    back.onclick = () => typeof options.goBack === "function" ? options.goBack() : history.back();
    backdrop.hidden = false;
    return type;
  }

  function friendlyMessage(error, fallback = "Something went wrong while loading this page.", requestedType) {
    const type = classify(error, requestedType);
    return (COPY[type] || { message: fallback }).message;
  }

  window.matIsOffline = isOffline;
  window.matClassifyNetworkError = classify;
  window.matFriendlyLoadMessage = friendlyMessage;
  window.matShowNetworkError = showError;
  window.matShowOfflineDialog = function () {
    if (!isOffline()) return false;
    showError(new Error("offline"), { type: "offline" });
    return true;
  };

  window.addEventListener("online", () => {
    const dialog = document.getElementById("matNetworkDialog");
    if (dialog) dialog.hidden = true;
  });
})();
