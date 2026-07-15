let friendsPageUser = null;

function friendsEscape(value) {
  return String(value ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

function friendAvatar(avatarId) {
  return profileAvatarPath(Number(avatarId) || 1);
}

async function loadIncomingRequests() {
  const { data, error } = await supabaseClient.rpc("get_incoming_friend_requests");
  if (error) throw error;
  return data || [];
}

async function loadAcceptedFriends() {
  const { data, error } = await supabaseClient.rpc("get_friends");
  if (error) throw error;
  return data || [];
}

async function refreshFriendsPage() {
  const [requests, friends] = await Promise.all([
    loadIncomingRequests(),
    loadAcceptedFriends()
  ]);

  document.getElementById("friendCount").textContent = friends.length;
  document.getElementById("requestCount").textContent = requests.length;
  renderRequests(requests);
  renderFriends(friends);
}

function renderRequests(requests) {
  const root = document.getElementById("requestList");

  root.innerHTML = requests.length
    ? requests.map((request) => `
        <article class="request-card">
          <img class="friend-avatar" src="${friendAvatar(request.avatar_id)}" alt="${friendsEscape(request.username)} avatar" />
          <div>
            <h3 class="friend-name">${friendsEscape(request.username || "Anime Fan")}</h3>
            <div class="friend-subtext">Wants to add you as a friend</div>
          </div>
          <div class="request-actions">
            <button class="friend-action-btn accept" type="button" data-response="accept" data-id="${request.friendship_id}">Accept</button>
            <button class="friend-action-btn danger" type="button" data-response="decline" data-id="${request.friendship_id}">Decline</button>
          </div>
        </article>
      `).join("")
    : '<div class="empty-state">No incoming friend requests.</div>';

  root.querySelectorAll("[data-response]").forEach((button) => {
    button.addEventListener("click", async () => {
      const accept = button.dataset.response === "accept";
      button.disabled = true;
      button.textContent = accept ? "Accepting…" : "Declining…";

      const { error } = await supabaseClient.rpc("respond_to_friend_request", {
        p_friendship_id: Number(button.dataset.id),
        p_accept: accept
      });

      if (error) {
        alert(error.message);
        button.disabled = false;
        button.textContent = accept ? "Accept" : "Decline";
        return;
      }

      await refreshFriendsPage();
    });
  });
}

function renderFriends(friends) {
  const root = document.getElementById("friendsList");

  root.innerHTML = friends.length
    ? friends.map((friend) => `
        <article class="friend-list-card">
          <img class="friend-avatar" src="${friendAvatar(friend.avatar_id)}" alt="${friendsEscape(friend.username)} avatar" />
          <div>
            <h3 class="friend-name">${friendsEscape(friend.username || "Anime Fan")}</h3>
            <div class="friend-subtext">Accepted friend</div>
          </div>
          <div class="friend-actions">
            <a class="friend-action-btn" href="friend.html?user=${encodeURIComponent(friend.friend_user_id)}">View Profile</a>
            <button class="friend-action-btn danger remove-friend-btn" type="button" data-id="${friend.friendship_id}">Remove</button>
          </div>
        </article>
      `).join("")
    : '<div class="empty-state">You have not added any friends yet.</div>';

  root.querySelectorAll(".remove-friend-btn").forEach((button) => {
    button.addEventListener("click", async () => {
      if (!confirm("Remove this friend? You will no longer be able to view each other’s profiles.")) return;

      const { error } = await supabaseClient
        .from("friendships")
        .delete()
        .eq("id", Number(button.dataset.id));

      if (error) {
        alert(error.message);
        return;
      }

      await refreshFriendsPage();
    });
  });
}

async function sendFriendRequest(event) {
  event.preventDefault();
  const input = document.getElementById("friendCodeInput");
  const message = document.getElementById("addFriendMessage");
  const code = input.value.trim().toUpperCase();

  if (!code) return;

  message.textContent = "Sending request…";
  message.className = "friends-message";

  const { error } = await supabaseClient.rpc("send_friend_request_by_code", {
    p_friend_code: code
  });

  if (error) {
    message.textContent = error.message;
    message.className = "friends-message error";
    return;
  }

  input.value = "";
  message.textContent = "Friend request sent.";
  message.className = "friends-message success";
}

async function initFriendsPage(user) {
  friendsPageUser = user;
  document.getElementById("addFriendForm").addEventListener("submit", sendFriendRequest);
  initInviteFriends();

  try {
    await refreshFriendsPage();
  } catch (error) {
    console.error(error);
    document.getElementById("requestList").innerHTML = `<div class="error">${friendsEscape(error.message)}</div>`;
    document.getElementById("friendsList").innerHTML = `<div class="error">${friendsEscape(error.message)}</div>`;
  }
}


const MAT_SIGNUP_URL = "https://pgy2k.github.io/anime-collection/signup.html";
const MAT_INVITE_TEXT = "Join me on My Anime Tracker to track anime, compare ratings, and see what friends are watching.";

function initInviteFriends() {
  const inviteButton = document.getElementById("inviteFriendsBtn");
  const modal = document.getElementById("inviteFriendsModal");
  const closeButton = document.getElementById("closeInviteFriendsBtn");
  const copyButton = document.getElementById("copyInviteLinkBtn");
  const input = document.getElementById("inviteSignupLink");
  const message = document.getElementById("inviteFriendsMessage");

  if (!inviteButton || !modal || !closeButton || !copyButton || !input || !message) return;

  input.value = MAT_SIGNUP_URL;

  const openFallback = () => {
    modal.hidden = false;
    document.body.classList.add("modal-open");
    input.select();
  };

  const closeFallback = () => {
    modal.hidden = true;
    document.body.classList.remove("modal-open");
    message.textContent = "";
    inviteButton.focus();
  };

  inviteButton.addEventListener("click", async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: "Join My Anime Tracker",
          text: MAT_INVITE_TEXT,
          url: MAT_SIGNUP_URL
        });
        return;
      } catch (error) {
        if (error?.name === "AbortError") return;
      }
    }
    openFallback();
  });

  copyButton.addEventListener("click", async () => {
    try {
      await navigator.clipboard.writeText(MAT_SIGNUP_URL);
      message.textContent = "Signup link copied.";
      message.className = "friends-message success";
      copyButton.textContent = "Copied";
      setTimeout(() => { copyButton.textContent = "Copy Link"; }, 1600);
    } catch {
      input.focus();
      input.select();
      document.execCommand("copy");
      message.textContent = "Signup link copied.";
      message.className = "friends-message success";
    }
  });

  closeButton.addEventListener("click", closeFallback);
  modal.addEventListener("click", (event) => {
    if (event.target === modal) closeFallback();
  });
  document.addEventListener("keydown", (event) => {
    if (event.key === "Escape" && !modal.hidden) closeFallback();
  });
}
