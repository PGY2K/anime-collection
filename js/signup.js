let selectedSignupAvatarId = 1;

function escapeSignupHtml(value) {
  return String(value ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

function renderSignupAvatars() {
  const grid = document.getElementById("signupAvatarGrid");

  grid.innerHTML = Array.from(
    { length: PROFILE_AVATAR_COUNT },
    (_, index) => index + 1
  )
    .map(
      (id) => `
        <button
          class="signup-avatar-choice ${id === selectedSignupAvatarId ? "selected" : ""}"
          type="button"
          data-avatar-id="${id}"
          aria-label="Choose avatar ${id}"
        >
          <img src="${profileAvatarPath(id)}" alt="Avatar option ${id}" />
          <span class="avatar-check">✓</span>
        </button>
      `
    )
    .join("");

  grid.querySelectorAll(".signup-avatar-choice").forEach((button) => {
    button.addEventListener("click", () => {
      selectedSignupAvatarId = Number(button.dataset.avatarId);

      grid.querySelectorAll(".signup-avatar-choice").forEach((item) => {
        item.classList.remove("selected");
      });

      button.classList.add("selected");
    });
  });
}

function validateSignup(username, password, confirmPassword) {
  if (!/^[A-Za-z0-9_]{3,20}$/.test(username)) {
    return "Username must be 3–20 characters using only letters, numbers, or underscores.";
  }

  if (password.length < 6) {
    return "Password must be at least 6 characters.";
  }

  if (password !== confirmPassword) {
    return "Passwords do not match.";
  }

  return "";
}

async function createAccount(event) {
  event.preventDefault();

  const message = document.getElementById("authMessage");
  const button = document.getElementById("createAccountBtn");
  const email = document.getElementById("signupEmail").value.trim();
  const password = document.getElementById("signupPassword").value;
  const confirmPassword = document.getElementById("confirmPassword").value;
  const username = document.getElementById("signupUsername").value.trim();
  const validationError = validateSignup(username, password, confirmPassword);

  if (validationError) {
    message.textContent = validationError;
    message.className = "auth-message auth-error";
    return;
  }

  button.disabled = true;
  button.textContent = "Creating Account...";
  message.textContent = "Creating your account...";
  message.className = "auth-message";

  const { data, error } = await supabaseClient.auth.signUp({
    email,
    password,
    options: {
      data: {
        username,
        avatar_id: selectedSignupAvatarId
      }
    }
  });

  if (error) {
    button.disabled = false;
    button.textContent = "Create Account";
    message.textContent = error.message;
    message.className = "auth-message auth-error";
    return;
  }

  if (data?.session) {
    window.location.href = "index.html";
    return;
  }

  button.textContent = "Account Created";
  message.textContent = "Account created. Check your email to confirm it, then sign in.";
  message.className = "auth-message auth-success";
}

document.addEventListener("DOMContentLoaded", async () => {
  const { data } = await supabaseClient.auth.getSession();

  if (data?.session) {
    window.location.href = "index.html";
    return;
  }

  renderSignupAvatars();
  document.getElementById("signupForm").addEventListener("submit", createAccount);
});
