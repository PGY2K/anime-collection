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
}

document.addEventListener("DOMContentLoaded", loadNavigationProfile);
