(() => {
  const client = window.luminaSupabase;

  const status = document.getElementById("account-status");
  const form = document.getElementById("account-form");
  const message = document.getElementById("form-message");
  const saveButton = document.getElementById("save-button");
  const logoutButton = document.getElementById("logout-button");

  const fullNameInput = document.getElementById("full-name");
  const usernameInput = document.getElementById("username");
  const emailInput = document.getElementById("email");

  const headerAvatar = document.getElementById("account-avatar");
  const summaryAvatar = document.getElementById("summary-avatar");
  const summaryName = document.getElementById("summary-name");
  const summaryUsername = document.getElementById("summary-username");
  const summaryEmail = document.getElementById("summary-email");

  let currentUser = null;

  function showStatus(text) {
    status.textContent = text;
    status.hidden = !text;
  }

  function showMessage(text, type) {
    message.textContent = text;
    message.className = "form-message " + (type || "");
  }

  function refreshSummary(fullName, username, email) {
    const initial = (fullName.trim().charAt(0) || email.charAt(0) || "S").toUpperCase();
    headerAvatar.textContent = initial;
    summaryAvatar.textContent = initial;
    summaryName.textContent = fullName || "Student";
    summaryUsername.textContent = username ? "@" + username : "";
    summaryEmail.textContent = email;
  }

  if (!client) {
    showStatus("LuminaED could not connect to its authentication service. Refresh the page.");
    return;
  }

  async function loadAccount(session) {
    if (!session || !session.user) {
      window.location.replace("login.html?reason=session");
      return;
    }

    currentUser = session.user;
    const email = currentUser.email || "";
    emailInput.value = email;

    // Fallback values from signup, used if the profile row is missing.
    let fullName = (currentUser.user_metadata && currentUser.user_metadata.full_name) || "";
    let username = (currentUser.user_metadata && currentUser.user_metadata.username) || "";

    const { data: profile, error } = await client
      .from("profiles")
      .select("full_name, username")
      .eq("id", currentUser.id)
      .maybeSingle();

    if (error) {
      console.warn("LuminaED account lookup:", error.message);
      showStatus("We could not load your saved profile. Showing the details from sign-up instead.");
    } else if (profile) {
      fullName = profile.full_name || fullName;
      username = profile.username || username;
    } else {
      showStatus("Your student profile was not found. Saving this form will create it.");
    }

    fullNameInput.value = fullName;
    usernameInput.value = username;
    refreshSummary(fullName, username, email);
    saveButton.disabled = false;
  }

  form.addEventListener("submit", async (event) => {
    event.preventDefault();
    if (!currentUser) return;

    const fullName = fullNameInput.value.trim();
    const username = usernameInput.value.trim();

    if (!fullName) {
      showMessage("Please enter your full name.", "error");
      fullNameInput.focus();
      return;
    }
    if (username.length < 3 || username.length > 30) {
      showMessage("Your username must be between 3 and 30 characters.", "error");
      usernameInput.focus();
      return;
    }
    if (/\s/.test(username)) {
      showMessage("Your username cannot contain spaces.", "error");
      usernameInput.focus();
      return;
    }

    saveButton.disabled = true;
    saveButton.textContent = "Saving...";
    showMessage("", "");

    try {
      const { data, error } = await client
        .from("profiles")
        .upsert(
          { id: currentUser.id, full_name: fullName, username: username },
          { onConflict: "id" }
        )
        .select("full_name, username")
        .maybeSingle();

      if (error) throw error;
      if (!data) throw new Error("NO_ROWS");

      refreshSummary(data.full_name || "", data.username || "", currentUser.email || "");
      showStatus("");
      showMessage("Your details have been saved.", "success");
    } catch (error) {
      console.error("LuminaED account save error:", error);
      let text = "We could not save your changes. Please try again.";
      if (error.code === "23505" || /duplicate key|unique/i.test(error.message || "")) {
        text = "That username is already taken. Please choose another.";
      } else if (error.message === "NO_ROWS" || error.code === "42501" || /row-level security/i.test(error.message || "")) {
        text = "Saving is not permitted yet. Run the account policies SQL in Supabase, then try again.";
      }
      showMessage(text, "error");
    } finally {
      saveButton.disabled = false;
      saveButton.textContent = "Save changes";
    }
  });

  logoutButton.addEventListener("click", async () => {
    logoutButton.disabled = true;
    logoutButton.textContent = "Signing out...";
    const { error } = await client.auth.signOut();
    if (error) {
      showMessage("Sign-out failed. Please try again.", "error");
      logoutButton.disabled = false;
      logoutButton.textContent = "Sign out";
      return;
    }
    window.location.replace("login.html");
  });

  client.auth.onAuthStateChange((event, session) => {
    if (event === "SIGNED_OUT" || !session) {
      window.location.replace("login.html?reason=session");
    }
  });

  client.auth.getSession()
    .then(({ data, error }) => {
      if (error) throw error;
      return loadAccount(data.session);
    })
    .catch((error) => {
      console.error("LuminaED account error:", error);
      window.location.replace("login.html?reason=session");
    });
})();
