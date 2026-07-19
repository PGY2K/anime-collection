const SUPABASE_URL = "https://ivkqdrfkmmgrytyicbus.supabase.co";
const SUPABASE_PUBLISHABLE_KEY = "sb_publishable_42A3-VlHUVFQYvMLowlkNg_2vHgGkmc";

const supabaseClient = window.supabase.createClient(
  SUPABASE_URL,
  SUPABASE_PUBLISHABLE_KEY
);

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
  const { data: profile } = await supabaseClient
    .from("profiles")
    .select("is_suspended")
    .eq("user_id", user.id)
    .maybeSingle();
  if (profile?.is_suspended) {
    await supabaseClient.auth.signOut();
    sessionStorage.setItem("mat-auth-message", "This account is suspended.");
    window.location.href = "login.html";
    return null;
  }
  return user;
}

async function signOutUser() {
  await supabaseClient.auth.signOut();
  window.location.href = "login.html";
}
