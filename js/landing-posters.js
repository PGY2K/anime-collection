(function loadLandingPosterArtwork() {
  const titles = [
    "Jujutsu Kaisen",
    "Demon Slayer: Kimetsu no Yaiba",
    "Solo Leveling",
    "Attack on Titan",
    "One Piece"
  ];

  async function fetchCovers() {
    const aliases = titles.map((_, index) => `title${index}: Media(type: ANIME, search: $title${index}) { coverImage { extraLarge large } }`).join("\n");
    const variables = Object.fromEntries(titles.map((title, index) => [`title${index}`, title]));
    const variableDefinitions = titles.map((_, index) => `$title${index}: String`).join(", ");
    const query = `query (${variableDefinitions}) { ${aliases} }`;

    const response = await fetch("https://graphql.anilist.co", {
      method: "POST",
      headers: { "Content-Type": "application/json", Accept: "application/json" },
      body: JSON.stringify({ query, variables })
    });
    if (!response.ok) throw new Error(`Poster request failed (${response.status})`);
    const payload = await response.json();
    return Object.fromEntries(titles.map((title, index) => {
      const cover = payload?.data?.[`title${index}`]?.coverImage;
      return [title, cover?.extraLarge || cover?.large || ""];
    }));
  }

  async function applyCovers() {
    const images = Array.from(document.querySelectorAll("img[data-landing-anime]"));
    if (!images.length) return;
    try {
      const covers = await fetchCovers();
      images.forEach((image) => {
        const source = covers[image.dataset.landingAnime];
        if (!source) return;
        image.addEventListener("load", () => image.classList.add("is-loaded"), { once: true });
        image.src = source;
      });
    } catch (error) {
      console.warn("Landing poster artwork could not be loaded.", error);
    }
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", applyCovers, { once: true });
  } else {
    applyCovers();
  }
})();
