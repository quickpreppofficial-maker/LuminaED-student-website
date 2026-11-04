(() => {
  const form = document.getElementById("login-form");
  if (!form) return;

  const message = document.getElementById("form-message");
  const submitButton = form.querySelector('button[type="submit"]');

  function showMessage(text, type) {
    message.textContent = text;
    message.className = `form-message ${type || ""}`;
  }

  const params = new URLSearchParams(window.location.search);
  if (params.get("password-updated") === "1") {
    showMessage("Your password has been updated. Sign in with your new password.", "success");
  } else if (params.get("confirmed") === "1") {
    showMessage("Email confirmed. You can now sign in to LuminaED.", "success");
  } else if (params.get("error")) {
    showMessage("Your email confirmation could not be completed. Try the link again or request a new one.", "error");
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

  const forgotLink = document.getElementById("forgot-password");
  if (forgotLink) {
    forgotLink.addEventListener("click", async (event) => {
      event.preventDefault();
      const email = document.getElementById("email").value.trim();
      const client = window.luminaSupabase;
      if (!email) {
        showMessage("Enter your account email address first, then select Forgot password again.", "error");
        document.getElementById("email").focus();
        return;
      }
      if (!client) {
        showMessage("LuminaED could not connect to Supabase. Refresh and try again.", "error");
        return;
      }
      forgotLink.textContent = "Sending...";
      try {
        const redirectTo = new URL("update-password.html", window.location.href).href;
        const { error } = await client.auth.resetPasswordForEmail(email, { redirectTo });
        if (error) throw error;
        showMessage("If an account exists for this email, a password-reset link has been sent. Check your inbox.", "success");
      } catch (error) {
        console.error("LuminaED password reset:", error);
        showMessage(error.message || "We could not send the reset email. Please try again.", "error");
      } finally {
        forgotLink.textContent = "Forgot password?";
      }
    });
  }

  form.addEventListener("submit", async (event) => {
    event.preventDefault();
    const email = document.getElementById("email").value.trim();
    const password = document.getElementById("password").value;
    const client = window.luminaSupabase;

    if (!client) {
      showMessage("LuminaED could not connect to Supabase. Check your internet connection and refresh.", "error");
      return;
    }

    submitButton.disabled = true;
    submitButton.textContent = "Signing in...";
    showMessage("", "");

    try {
      const { error } = await client.auth.signInWithPassword({ email, password });
      if (error) throw error;
      showMessage("Sign-in successful. Opening your dashboard...", "success");
      window.location.replace("dashboard.html");
    } catch (error) {
      console.error("LuminaED login error:", error);
      let errorText = error.message || "Unable to sign in. Please try again.";
      if (/email not confirmed/i.test(errorText)) {
        errorText = "Please confirm your email address before signing in.";
      } else if (/invalid login credentials/i.test(errorText)) {
        errorText = "Incorrect email or password. Check your details and try again.";
      }
      showMessage(errorText, "error");
    } finally {
      submitButton.disabled = false;
      submitButton.innerHTML = 'Sign in <span aria-hidden="true">→</span>';
    }
  });
})();
