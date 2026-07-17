let adminCurrentUser = null;
let adminBadgeCatalog = [];
let adminTargetProfile = null;

function adminEscape(value) {
  return String(value ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

async function verifyBadgeManager(user) {
  const { data, error } = await supabaseClient
    .from("profiles")
    .select("can_manage_badges")
    .eq("user_id", user.id)
    .maybeSingle();
  if (error) throw error;
  return Boolean(data?.can_manage_badges);
}

function renderAdminShell() {
  const root = document.getElementById("adminRoot");
  root.innerHTML = `
    <section class="admin-card">
      <div class="admin-card-heading">
        <div>
          <h2>Badge Management</h2>
          <p>Enter a user's permanent friend code to award or remove any badge.</p>
        </div>
      </div>

      <form class="admin-friend-code-form" id="adminFriendCodeForm">
        <label for="adminFriendCode">Friend Code</label>
        <div class="admin-search-row">
          <input
            class="search-box"
            id="adminFriendCode"
            type="text"
            maxlength="8"
            placeholder="Example: A7K9X2P4"
            autocomplete="off"
            spellcheck="false"
            required />
          <button class="primary-btn" type="submit">Find User</button>
        </div>
      </form>

      <div class="admin-message" id="adminLookupMessage"></div>
      <section class="admin-badge-editor" id="adminBadgeEditor" hidden></section>
    </section>`;

  document.getElementById("adminFriendCodeForm").addEventListener("submit", findUserByFriendCode);
  document.getElementById("adminFriendCode").addEventListener("input", (event) => {
    event.target.value = event.target.value.toUpperCase().replace(/[^A-Z0-9]/g, "");
  });
}

async function findUserByFriendCode(event) {
  event.preventDefault();
  const code = document.getElementById("adminFriendCode").value.trim().toUpperCase();
  const message = document.getElementById("adminLookupMessage");
  const editor = document.getElementById("adminBadgeEditor");
  adminTargetProfile = null;
  editor.hidden = true;
  message.className = "admin-message";
  message.textContent = "Searching…";

  const { data, error } = await supabaseClient.rpc("badge_admin_get_profile_by_friend_code", {
    p_friend_code: code
  });

  if (error) {
    message.className = "admin-message error";
    message.textContent = error.message;
    return;
  }

  const profile = Array.isArray(data) ? data[0] : data;
  if (!profile) {
    message.className = "admin-message error";
    message.textContent = "No user was found with that friend code.";
    return;
  }

  adminTargetProfile = profile;
  message.textContent = "";
  await openBadgeEditor(profile);
}

async function openBadgeEditor(profile) {
  const editor = document.getElementById("adminBadgeEditor");
  editor.hidden = false;
  editor.innerHTML = '<div class="loading">Loading badges…</div>';

  const { data, error } = await supabaseClient.rpc("badge_admin_get_user_badges", {
    p_user_id: profile.user_id
  });
  if (error) {
    editor.innerHTML = `<div class="admin-message error">${adminEscape(error.message)}</div>`;
    return;
  }

  const assigned = new Set((data || []).map((item) => Number(item.badge_id)));
  editor.innerHTML = `
    <div class="admin-selected-user">
      <img src="${profileAvatarPath(profile.avatar_id || 1)}" alt="" />
      <div>
        <strong>${adminEscape(profile.username || "Anime Fan")}</strong>
        <small>Friend Code: ${adminEscape(profile.friend_code)}</small>
      </div>
    </div>

    <div class="admin-badge-options">
      ${adminBadgeCatalog.map((badge) => `
        <label class="admin-badge-option">
          <input type="checkbox" value="${badge.id}" ${assigned.has(Number(badge.id)) ? "checked" : ""} />
          <img src="${adminEscape(badge.image_path)}" alt="" />
          <span>
            <strong>${adminEscape(badge.name)}</strong>
            <small>${adminEscape(badge.description)}</small>
          </span>
        </label>`).join("")}
    </div>

    <button class="primary-btn" id="adminSaveBadgesBtn" type="button">Save Badge Changes</button>
    <div class="admin-message" id="adminSaveMessage"></div>`;

  document.getElementById("adminSaveBadgesBtn").addEventListener("click", saveBadgeChanges);
}

async function saveBadgeChanges() {
  if (!adminTargetProfile) return;
  const button = document.getElementById("adminSaveBadgesBtn");
  const message = document.getElementById("adminSaveMessage");
  const badgeIds = [...document.querySelectorAll('#adminBadgeEditor input[type="checkbox"]:checked')]
    .map((input) => Number(input.value));

  button.disabled = true;
  button.textContent = "Saving…";
  message.textContent = "";

  const { error } = await supabaseClient.rpc("badge_admin_set_user_badges", {
    p_user_id: adminTargetProfile.user_id,
    p_badge_ids: badgeIds
  });

  button.disabled = false;
  button.textContent = "Save Badge Changes";

  if (error) {
    message.className = "admin-message error";
    message.textContent = error.message;
    return;
  }

  message.className = "admin-message success";
  message.textContent = `Badges updated for ${adminTargetProfile.username || "this user"}.`;
}

async function initAdminPanel(user) {
  adminCurrentUser = user;
  const root = document.getElementById("adminRoot");
  try {
    const allowed = await verifyBadgeManager(user);
    if (!allowed) {
      root.innerHTML = `
        <section class="admin-card admin-denied">
          <h2>Access denied</h2>
          <p>This page is only available to the MAT owner.</p>
          <a class="primary-btn" href="profile.html">Return to Profile</a>
        </section>`;
      return;
    }

    adminBadgeCatalog = await matLoadBadgeCatalog();
    renderAdminShell();
  } catch (error) {
    console.error(error);
    root.innerHTML = `<div class="error">${adminEscape(error.message || "Could not load the Admin Control Panel.")}</div>`;
  }
}
