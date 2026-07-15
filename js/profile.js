let currentProfileUser = null;
let selectedAvatarId = 1;

function makeFriendCode() {
  const alphabet = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  let code = "";
  for (let i = 0; i < 8; i += 1) {
    code += alphabet[Math.floor(Math.random() * alphabet.length)];
  }
  return code;
}

function defaultUsername(user) {
  const emailName = String(user.email || "AnimeFan").split("@")[0];
  const cleaned = emailName.replace(/[^a-zA-Z0-9_]/g, "").slice(0, 20);
  return cleaned || `AnimeFan${Math.floor(Math.random() * 9000 + 1000)}`;
}

async function createProfile(user) {
  for (let attempt = 0; attempt < 5; attempt += 1) {
    const payload = {
      user_id: user.id,
      username: attempt === 0 ? defaultUsername(user) : `${defaultUsername(user)}${attempt}`,
      avatar_id: 1,
      friend_code: makeFriendCode()
    };

    const { data, error } = await supabaseClient
      .from("profiles")
      .insert(payload)
      .select()
      .single();

    if (!error) return data;
    if (error.code !== "23505") throw error;
  }

  throw new Error("Could not generate a unique profile. Please try again.");
}

async function getOrCreateProfile(user) {
  const { data, error } = await supabaseClient
    .from("profiles")
    .select("*")
    .eq("user_id", user.id)
    .maybeSingle();

  if (error) throw error;
  return data || createProfile(user);
}

function renderProfile(profile) {
  selectedAvatarId = Number(profile.avatar_id) || 1;
  const root = document.getElementById("profileRoot");

  const avatars = Array.from({ length: PROFILE_AVATAR_COUNT }, (_, index) => index + 1)
    .map((id) => `
      <button class="avatar-choice ${id === selectedAvatarId ? "selected" : ""}" type="button" data-avatar-id="${id}" aria-label="Choose avatar ${id}">
        <img src="${profileAvatarPath(id)}" alt="Avatar option ${id}" />
      </button>
    `).join("");

  root.innerHTML = `
    <section class="profile-card profile-preview-card">
      <img class="profile-main-avatar" id="profileMainAvatar" src="${profileAvatarPath(selectedAvatarId)}" alt="Your profile avatar" />
      <h2 id="profilePreviewName">${escapeProfileHtml(profile.username || "Anime Fan")}</h2>
      <p>Your private profile is visible only to accepted friends.</p>
    </section>

    <section class="profile-card profile-editor-card">
      <form id="profileForm">
        <label for="profileUsername">Username</label>
        <input class="search-box" id="profileUsername" type="text" maxlength="24" value="${escapeProfileHtml(profile.username || "")}" required />

        <label>Choose a profile picture</label>
        <div class="avatar-grid">${avatars}</div>

        <label>Your friend code</label>
        <div class="friend-code-row">
          <code id="friendCode">${escapeProfileHtml(profile.friend_code)}</code>
          <button class="secondary-btn" id="copyFriendCodeBtn" type="button">Copy</button>
        </div>
        <p class="field-help">Share this code with someone so they can send you a friend request. They cannot view your profile until you accept.</p>

        <a class="secondary-btn profile-friends-btn" href="friends.html">Friends & Requests</a>

        <button class="primary-btn profile-save-btn" type="submit">Save Profile</button>
        <div class="profile-message" id="profileMessage"></div>
      </form>
    </section>
  `;

  bindProfileEvents();
}

function escapeProfileHtml(value) {
  return String(value ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

function bindProfileEvents() {
  const username = document.getElementById("profileUsername");
  const previewName = document.getElementById("profilePreviewName");
  const mainAvatar = document.getElementById("profileMainAvatar");

  username.addEventListener("input", () => {
    previewName.textContent = username.value.trim() || "Anime Fan";
  });

  document.querySelectorAll(".avatar-choice").forEach((button) => {
    button.addEventListener("click", () => {
      selectedAvatarId = Number(button.dataset.avatarId);
      document.querySelectorAll(".avatar-choice").forEach((item) => item.classList.remove("selected"));
      button.classList.add("selected");
      mainAvatar.src = profileAvatarPath(selectedAvatarId);
    });
  });

  document.getElementById("copyFriendCodeBtn").addEventListener("click", async () => {
    const code = document.getElementById("friendCode").textContent.trim();
    await navigator.clipboard.writeText(code);
    const button = document.getElementById("copyFriendCodeBtn");
    button.textContent = "Copied";
    setTimeout(() => { button.textContent = "Copy"; }, 1400);
  });

  document.getElementById("profileForm").addEventListener("submit", saveProfile);
}

async function saveProfile(event) {
  event.preventDefault();
  const message = document.getElementById("profileMessage");
  const username = document.getElementById("profileUsername").value.trim();

  if (username.length < 3) {
    message.textContent = "Username must be at least 3 characters.";
    message.className = "profile-message profile-error";
    return;
  }

  message.textContent = "Saving…";
  message.className = "profile-message";

  const { error } = await supabaseClient
    .from("profiles")
    .update({
      username,
      avatar_id: selectedAvatarId,
      updated_at: new Date().toISOString()
    })
    .eq("user_id", currentProfileUser.id);

  if (error) {
    message.textContent = error.code === "23505" ? "That username is already taken." : error.message;
    message.className = "profile-message profile-error";
    return;
  }

  document.getElementById("navProfileAvatar").src = profileAvatarPath(selectedAvatarId);
  message.textContent = "Profile saved.";
  message.className = "profile-message profile-success";
}

async function initProfile(user) {
  currentProfileUser = user;
  try {
    const profile = await getOrCreateProfile(user);
    renderProfile(profile);
  } catch (error) {
    console.error(error);
    document.getElementById("profileRoot").innerHTML = `<div class="error">${escapeProfileHtml(error.message || "Could not load profile.")}</div>`;
  }
}
