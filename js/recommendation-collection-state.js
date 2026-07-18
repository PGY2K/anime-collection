(function () {
  function positiveInteger(value) {
    const number = Number(value);
    return Number.isInteger(number) && number > 0 ? number : null;
  }

  async function getViewerId() {
    const { data, error } = await supabaseClient.auth.getUser();
    if (error) throw error;
    return data?.user?.id || null;
  }

  async function isInCollection(itemType, itemKey) {
    const normalizedType = String(itemType || "").toLowerCase();
    const viewerId = await getViewerId();
    if (!viewerId) return false;

    if (normalizedType === "anime") {
      const anilistId = positiveInteger(itemKey);
      if (!anilistId) return false;
      const { data, error } = await supabaseClient
        .from("anime")
        .select("anilist_id")
        .eq("user_id", viewerId)
        .eq("anilist_id", anilistId)
        .maybeSingle();
      if (error) throw error;
      return Boolean(data);
    }

    if (normalizedType === "franchise") {
      const franchiseKey = positiveInteger(itemKey);
      if (!franchiseKey) return false;
      const { data, error } = await supabaseClient
        .from("user_franchises")
        .select("franchise_key")
        .eq("user_id", viewerId)
        .eq("franchise_key", franchiseKey)
        .maybeSingle();
      if (error) throw error;
      return Boolean(data);
    }

    return false;
  }

  function applyButtonState(button, inCollection) {
    if (!button) return;
    button.disabled = Boolean(inCollection);
    button.textContent = inCollection ? "In Your Collection" : "Add to Queue";
    button.dataset.collectionState = inCollection ? "added" : "missing";
  }

  window.matRecommendationCollectionState = {
    isInCollection,
    applyButtonState
  };
})();
