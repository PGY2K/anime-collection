const PROFILE_AVATAR_COUNT = 8;

function profileAvatarPath(avatarId) {
  const safeId = Math.min(PROFILE_AVATAR_COUNT, Math.max(1, Number(avatarId) || 1));
  return `assets/avatars/avatar-${safeId}.svg`;
}

async function loadNavigationProfile() {
  const avatar = document.getElementById("navProfileAvatar");
  if (!avatar || typeof supabaseClient === "undefined") return;

  const { data: sessionData } = await supabaseClient.auth.getSession();
  const user = sessionData?.session?.user;
  if (!user) return;

  const { data } = await supabaseClient
    .from("profiles")
    .select("avatar_id")
    .eq("user_id", user.id)
    .maybeSingle();

  avatar.src = profileAvatarPath(data?.avatar_id || 1);

  const referralCode = String(user.user_metadata?.referral_code || "").trim().toUpperCase();
  if (data && referralCode) {
    const { data: claimResult, error: referralError } = await supabaseClient.rpc("claim_referral", {
      p_referral_code: referralCode
    });
    const claimFinished = claimResult?.claimed === true || claimResult?.reason === "already_claimed";
    if (!referralError && claimFinished) {
      await supabaseClient.auth.updateUser({
        data: { ...user.user_metadata, referral_code: null }
      });
    } else if (referralError) {
      console.warn("Referral could not be applied.", referralError);
    }
  }
}

document.addEventListener("DOMContentLoaded", loadNavigationProfile);
