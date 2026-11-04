(() => {
  const client = window.luminaSupabase;
  const status = document.getElementById("dashboard-status");
  const welcomeTitle = document.getElementById("welcome-title");
  const accountName = document.getElementById("account-name");
  const avatar = document.getElementById("account-avatar");
  const logoutButton = document.getElementById("logout-button");

  function showStatus(text) {
    if (status) {
      status.textContent = text;
      status.hidden = !text;
    }
  }

  if (!client) {
    showStatus("LuminaED could not connect to its authentication service. Refresh the page.");
    return;
  }

  async function loadDashboard(session) {
    if (!session?.user) {
      window.location.replace("login.html?reason=session");
      return;
    }

    const user = session.user;
    let displayName = user.user_metadata?.full_name || user.email?.split("@")[0] || "Student";
    let username = user.user_metadata?.username || "";

    // The profile trigger may not have been activated yet. Metadata is a safe fallback.
    const { data: profile, error } = await client
      .from("profiles")
      .select("full_name, username")
      .eq("id", user.id)
      .maybeSingle();

    if (profile) {
      displayName = profile.full_name || displayName;
      username = profile.username || username;
    } else if (error) {
      console.warn("LuminaED profile lookup:", error.message);
      showStatus("You're signed in. Your profile details will appear once your student profile is available.");
    } else {
      showStatus("You're signed in. Your student profile is still being prepared.");
    }

    if (welcomeTitle) {
      welcomeTitle.innerHTML = `Welcome, <span>${escapeHtml(displayName)}</span>`;
    }
    if (accountName) {
      accountName.textContent = username ? `@${username}` : displayName;
    }
    if (avatar) {
      avatar.textContent = (displayName.trim().charAt(0) || "S").toUpperCase();
    }
    document.body.classList.add("authenticated");
  }

  function escapeHtml(value) {
    return String(value).replace(/[&<>"']/g, (char) => ({
      "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;"
    }[char]));
  }

  async function start() {
    const { data, error } = await client.auth.getSession();
    if (error) {
      showStatus("We couldn't verify your session. Please sign in again.");
      window.location.replace("login.html?reason=session");
      return;
    }
    await loadDashboard(data.session);
  }

  if (logoutButton) {
    logoutButton.addEventListener("click", async () => {
      logoutButton.disabled = true;
      logoutButton.textContent = "Signing out...";
      const { error } = await client.auth.signOut();
      if (error) {
        showStatus("Sign-out failed. Please try again.");
        logoutButton.disabled = false;
        logoutButton.textContent = "Sign out";
        return;
      }
      window.location.replace("login.html");
    });
  }

  client.auth.onAuthStateChange((event, session) => {
    if (event === "SIGNED_OUT" || !session) {
      window.location.replace("login.html?reason=session");
    }
  });

  start().catch((error) => {
    console.error("LuminaED dashboard error:", error);
    window.location.replace("login.html?reason=session");
  });
})();
