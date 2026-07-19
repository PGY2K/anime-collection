const SUPABASE_URL = "https://ivkqdrfkmmgrytyicbus.supabase.co";
const SUPABASE_PUBLISHABLE_KEY = "sb_publishable_42A3-VlHUVFQYvMLowlkNg_2vHgGkmc";

const supabaseClient = window.supabase.createClient(
  SUPABASE_URL,
  SUPABASE_PUBLISHABLE_KEY
);

const MAT_SUSPENDED_SESSION_KEY = "mat-suspended-account";

async function getMatSuspensionStatus(userId) {
  if (!userId) return false;

  const { data: profile, error } = await supabaseClient
    .from("profiles")
    .select("is_suspended")
    .eq("user_id", userId)
    .maybeSingle();

  if (error) {
    console.error("MAT could not verify the account status.", error);
    return false;
  }

  return profile?.is_suspended === true;
}

async function endSuspendedMatSession({ redirectToLogin = true } = {}) {
  sessionStorage.setItem(MAT_SUSPENDED_SESSION_KEY, "1");
  await supabaseClient.auth.signOut();

  if (redirectToLogin) {
    window.location.href = "login.html";
  }
}

async function requireSignedInUser() {
  const { data, error } = await supabaseClient.auth.getSession();

  if (error) {
    console.error(error);
  }

  if (!data?.session) {
    window.location.href = "login.html";
    return null;
  }

  const user = data.session.user;
  const isSuspended = await getMatSuspensionStatus(user.id);

  if (isSuspended) {
    await endSuspendedMatSession();
    return null;
  }

  return user;
}

async function signOutUser() {
  await supabaseClient.auth.signOut();
  window.location.href = "index.html";
}
