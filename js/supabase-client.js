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

  return data.session.user;
}

async function signOutUser() {
  await supabaseClient.auth.signOut();
  window.location.href = "login.html";
}
