async function matClaimPioneerBadge({ anilistId = null, franchiseKey = null } = {}) {
  if (!anilistId && !franchiseKey) return false;

  try {
    const { data, error } = await supabaseClient.rpc("claim_pioneer_badge", {
      p_anilist_id: anilistId ? Number(anilistId) : null,
      p_franchise_key: franchiseKey ? Number(franchiseKey) : null
    });

    if (error) {
      console.warn("Pioneer badge check could not be completed:", error.message);
      return false;
    }

    return Boolean(data);
  } catch (error) {
    console.warn("Pioneer badge check could not be completed:", error);
    return false;
  }
}
