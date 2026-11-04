(() => {
  const form = document.getElementById("signup-form");
  if (!form) return;

  const message = document.getElementById("form-message");
  const submitButton = form.querySelector('button[type="submit"]');

  function showMessage(text, type) {
    message.textContent = text;
    message.className = `form-message ${type || ""}`;
  }

  document.querySelectorAll(".toggle-password").forEach((button) => {
    button.addEventListener("click", () => {
      const input = document.getElementById(button.dataset.target);
      const showing = input.type === "text";
      input.type = showing ? "password" : "text";
      button.textContent = showing ? "Show" : "Hide";
      button.setAttribute("aria-label", showing ? "Show password" : "Hide password");
    });
  });

  form.addEventListener("submit", async (event) => {
    event.preventDefault();

    const fullName = document.getElementById("fullname").value.trim();
    const username = document.getElementById("username").value.trim();
    const email = document.getElementById("email").value.trim();
    const password = document.getElementById("password").value;
    const confirmation = document.getElementById("confirm-password").value;

    if (password !== confirmation) {
      showMessage("Your passwords do not match. Please check and try again.", "error");
      document.getElementById("confirm-password").focus();
      return;
    }
    if (username.length < 3 || username.length > 30 || !/^[a-zA-Z0-9_.-]+$/.test(username)) {
      showMessage("Use a username of 3–30 characters containing only letters, numbers, dots, underscores or hyphens.", "error");
      document.getElementById("username").focus();
      return;
    }

    const client = window.luminaSupabase;
    if (!client) {
      showMessage("LuminaED could not connect to Supabase. Check your internet connection and refresh.", "error");
      return;
    }

    submitButton.disabled = true;
    submitButton.textContent = "Creating account...";
    showMessage("", "");

    try {
      const siteRoot = new URL("./", window.location.href).href;
      const { data, error } = await client.auth.signUp({
        email,
        password,
        options: {
          emailRedirectTo: `${siteRoot}login.html?confirmed=1`,
          data: { full_name: fullName, username }
        }
      });

      if (error) throw error;

      // Supabase's default email confirmation link remains enabled for now.
      // The welcome page is shown whether confirmation is required immediately or not.
      window.location.replace("pop-up.html");
    } catch (error) {
      console.error("LuminaED signup error:", error);
      let errorText = error.message || "Something went wrong. Please try again.";
      if (/already registered|already exists/i.test(errorText)) {
        errorText = "An account with this email may already exist. Try signing in instead.";
      } else if (/password should be at least|weak password/i.test(errorText)) {
        errorText = "Please choose a stronger password that meets the password requirements.";
      }
      showMessage(errorText, "error");
    } finally {
      submitButton.disabled = false;
      submitButton.innerHTML = 'Create account <span aria-hidden="true">→</span>';
    }
  });
})();
