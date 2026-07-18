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
    <section class="admin-card admin-emergency-card">
      <div class="admin-card-heading">
        <div>
          <h2>Emergency Banner</h2>
          <p>Post a one-line message that scrolls across the top of every MAT screen until you clear it.</p>
        </div>
      </div>
      <form id="adminEmergencyBannerForm" class="admin-emergency-form">
        <label for="adminEmergencyBannerMessage">Banner Message</label>
        <input class="search-box" id="adminEmergencyBannerMessage" type="text" maxlength="300" autocomplete="off" />
        <div class="admin-emergency-actions">
          <button class="primary-btn" id="adminSaveEmergencyBannerBtn" type="submit">Save Banner</button>
          <button class="secondary-btn" id="adminClearEmergencyBannerBtn" type="button">Clear Banner</button>
        </div>
      </form>
      <div class="admin-message" id="adminEmergencyBannerMessageState"></div>
    </section>

    <section class="admin-card">
      <div class="admin-card-heading">
        <div>
          <h2>User Management</h2>
          <p>Enter a user's permanent friend code to manage badges or adjust Recommendation Points.</p>
        </div>
      </div>

      <form class="admin-friend-code-form" id="adminFriendCodeForm">
        <label for="adminFriendCode">Friend Code</label>
        <div class="admin-search-row">
          <input class="search-box" id="adminFriendCode" type="text" maxlength="8"
            placeholder="Example: A7K9X2P4" autocomplete="off" spellcheck="false" required />
          <button class="primary-btn" type="submit">Find User</button>
        </div>
      </form>

      <div class="admin-message" id="adminLookupMessage"></div>
      <section class="admin-user-editor" id="adminUserEditor" hidden>
        <div class="admin-selected-user" id="adminSelectedUser"></div>

        <section class="admin-tool-section">
          <div class="admin-section-heading">
            <h3>Recommendation Points</h3>
            <p>Add to or remove from the user's current RP balance. This does not set or replace their total.</p>
          </div>
          <div class="admin-points-balance">Current balance: <strong id="adminCurrentPoints">0 RP</strong></div>
          <form id="adminPointsForm" class="admin-points-form">
            <fieldset class="admin-operation-options">
              <legend>Adjustment</legend>
              <label><input type="radio" name="adminPointsOperation" value="add" checked /> Add Points</label>
              <label><input type="radio" name="adminPointsOperation" value="remove" /> Remove Points</label>
            </fieldset>
            <label for="adminPointsAmount">Points</label>
            <div class="admin-search-row">
              <input class="search-box" id="adminPointsAmount" type="number" min="0.01" step="0.01" inputmode="decimal" placeholder="10" required />
              <button class="primary-btn" id="adminSavePointsBtn" type="submit">Save Point Adjustment</button>
            </div>
          </form>
          <div class="admin-message" id="adminPointsMessage"></div>
        </section>

        <section class="admin-tool-section">
          <div class="admin-section-heading">
            <h3>Badge Management</h3>
            <p>Award or remove badges for the selected user.</p>
          </div>
          <section class="admin-badge-editor" id="adminBadgeEditor"></section>
        </section>
      </section>
    </section>`;

  document.getElementById("adminEmergencyBannerForm").addEventListener("submit", saveEmergencyBanner);
  document.getElementById("adminClearEmergencyBannerBtn").addEventListener("click", clearEmergencyBanner);
  document.getElementById("adminFriendCodeForm").addEventListener("submit", findUserByFriendCode);
  document.getElementById("adminPointsForm").addEventListener("submit", savePointAdjustment);
  document.getElementById("adminFriendCode").addEventListener("input", (event) => {
    event.target.value = event.target.value.toUpperCase().replace(/[^A-Z0-9]/g, "");
  });
}

async function loadEmergencyBannerAdmin() {
  const input = document.getElementById("adminEmergencyBannerMessage");
  const state = document.getElementById("adminEmergencyBannerMessageState");
  if (!input || !state) return;
  const { data, error } = await supabaseClient.from("app_emergency_banner").select("message").eq("id", 1).maybeSingle();
  if (error) { state.className = "admin-message error"; state.textContent = error.message; return; }
  const savedMessage = String(data?.message || "").trim();
  const cleanMessage = savedMessage.toLowerCase() === "emergency message" ? "" : savedMessage;
  input.value = cleanMessage;
  state.textContent = cleanMessage ? "A banner is currently active." : "No emergency banner is active.";
}

async function saveEmergencyBanner(event) {
  event.preventDefault();
  const input = document.getElementById("adminEmergencyBannerMessage");
  const state = document.getElementById("adminEmergencyBannerMessageState");
  const button = document.getElementById("adminSaveEmergencyBannerBtn");
  const message = input.value.trim();
  if (!message) { state.className = "admin-message error"; state.textContent = "Enter a message or use Clear Banner."; return; }
  button.disabled = true; button.textContent = "Saving…";
  const { error } = await supabaseClient.rpc("admin_set_emergency_banner", { p_message: message });
  button.disabled = false; button.textContent = "Save Banner";
  if (error) { state.className = "admin-message error"; state.textContent = error.message; return; }
  state.className = "admin-message success"; state.textContent = "Emergency banner saved for all users.";
}

async function clearEmergencyBanner() {
  const state = document.getElementById("adminEmergencyBannerMessageState");
  const button = document.getElementById("adminClearEmergencyBannerBtn");
  button.disabled = true; button.textContent = "Clearing…";
  const { error } = await supabaseClient.rpc("admin_set_emergency_banner", { p_message: null });
  button.disabled = false; button.textContent = "Clear Banner";
  if (error) { state.className = "admin-message error"; state.textContent = error.message; return; }
  document.getElementById("adminEmergencyBannerMessage").value = "";
  state.className = "admin-message success"; state.textContent = "Emergency banner cleared and hidden.";
}

async function findUserByFriendCode(event) {
  event.preventDefault();
  const code = document.getElementById("adminFriendCode").value.trim().toUpperCase();
  const message = document.getElementById("adminLookupMessage");
  const userEditor = document.getElementById("adminUserEditor");
  adminTargetProfile = null;
  userEditor.hidden = true;
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
  userEditor.hidden = false;
  document.getElementById("adminSelectedUser").innerHTML = `
    <img src="${profileAvatarPath(profile.avatar_id || 1)}" alt="" />
    <div>
      <strong>${adminEscape(profile.username || "Anime Fan")}</strong>
      <small>Friend Code: ${adminEscape(profile.friend_code)}</small>
    </div>`;
  await Promise.all([loadPointBalance(), openBadgeEditor(profile)]);
}

async function loadPointBalance() {
  if (!adminTargetProfile) return;
  const { data, error } = await supabaseClient
    .from("profiles")
    .select("recommendation_points")
    .eq("user_id", adminTargetProfile.user_id)
    .maybeSingle();
  if (error) throw error;
  const total = Number(data?.recommendation_points || 0);
  adminTargetProfile.recommendation_points = total;
  document.getElementById("adminCurrentPoints").textContent = `${Number.isInteger(total) ? total : total.toFixed(2)} RP`;
}

async function savePointAdjustment(event) {
  event.preventDefault();
  if (!adminTargetProfile) return;
  const button = document.getElementById("adminSavePointsBtn");
  const message = document.getElementById("adminPointsMessage");
  const operation = document.querySelector('input[name="adminPointsOperation"]:checked')?.value;
  const amount = Number(document.getElementById("adminPointsAmount").value);

  if (!Number.isFinite(amount) || amount <= 0) {
    message.className = "admin-message error";
    message.textContent = "Enter a point amount greater than zero.";
    return;
  }

  button.disabled = true;
  button.textContent = "Saving…";
  message.textContent = "";

  const { data, error } = await supabaseClient.rpc("admin_adjust_recommendation_points", {
    p_user_id: adminTargetProfile.user_id,
    p_operation: operation,
    p_amount: amount
  });

  button.disabled = false;
  button.textContent = "Save Point Adjustment";

  if (error) {
    message.className = "admin-message error";
    message.textContent = error.message;
    return;
  }

  const result = Array.isArray(data) ? data[0] : data;
  const newBalance = Number(result?.new_balance ?? 0);
  adminTargetProfile.recommendation_points = newBalance;
  document.getElementById("adminCurrentPoints").textContent = `${Number.isInteger(newBalance) ? newBalance : newBalance.toFixed(2)} RP`;
  document.getElementById("adminPointsAmount").value = "";
  message.className = "admin-message success";
  message.textContent = `${operation === "remove" ? "Removed" : "Added"} ${amount} RP. New balance: ${newBalance} RP.`;
}

async function openBadgeEditor(profile) {
  const editor = document.getElementById("adminBadgeEditor");
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
    <div class="admin-badge-options">
      ${adminBadgeCatalog.map((badge) => `
        <label class="admin-badge-option">
          <input type="checkbox" value="${badge.id}" ${assigned.has(Number(badge.id)) ? "checked" : ""} />
          <img src="${adminEscape(badge.image_path)}" alt="" />
          <span><strong>${adminEscape(badge.name)}</strong><small>${adminEscape(badge.description)}</small></span>
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
      root.innerHTML = `<section class="admin-card admin-denied"><h2>Access denied</h2><p>This page is only available to the MAT owner.</p><a class="primary-btn" href="profile.html">Return to Profile</a></section>`;
      return;
    }
    adminBadgeCatalog = await matLoadBadgeCatalog();
    renderAdminShell();
    await loadEmergencyBannerAdmin();
  } catch (error) {
    console.error(error);
    root.innerHTML = `<div class="error">${adminEscape(error.message || "Could not load the Admin Control Panel.")}</div>`;
  }
}
