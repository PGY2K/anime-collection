const MAT_SHOW_18_POSTERS_KEY = "matShow18Posters";

function matShow18Posters() {
  return localStorage.getItem(MAT_SHOW_18_POSTERS_KEY) === "true";
}

function matSetShow18Posters(enabled) {
  localStorage.setItem(MAT_SHOW_18_POSTERS_KEY, enabled ? "true" : "false");
  window.dispatchEvent(new CustomEvent("mat-poster-preference-changed", { detail: { enabled } }));
}

function matAdultPosterClass(isAdult) {
  return isAdult && !matShow18Posters() ? " mat-adult-poster-hidden" : "";
}

function matAdultPosterOverlay(isAdult) {
  if (!isAdult || matShow18Posters()) return "";
  return `<span class="mat-adult-poster-overlay"><strong>18+ Content</strong><small>Enable Show 18+ Posters in Settings to reveal.</small></span>`;
}
