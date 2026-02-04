// ================= GLOBAL CONFIG =================
window.API = (location.hostname === "localhost" || location.hostname === "127.0.0.1" || location.protocol === "file:")
  ? "http://localhost:3000"
  : "http://localhost:3000";

window.token = localStorage.getItem("token");

// ================= AUTH PROTECTION =================
const currentPage = location.pathname;
const protectedPages = ["home.html", "tasks.html", "profile.html", "withdraw.html"];

// Improved check for protected pages to handle file paths
const isProtected = protectedPages.some(pageName => currentPage.endsWith(pageName));
const isLogin = currentPage.endsWith("login.html");

if (isProtected && !window.token) {
  location.replace("login.html");
}

if (isLogin && window.token) {
  location.replace("home.html");
}

// ================= CORE FUNCTIONS =================

// Auth Check from Server
window.authCheck = async function () {
  if (!window.token) return null;
  try {
    const res = await fetch(window.API + "/auth/check", {
      headers: { Authorization: "Bearer " + window.token }
    });

    // Handle 401/403 explicitly
    if (res.status === 401 || res.status === 403) {
      window.logout();
      return null;
    }

    if (!res.ok) throw new Error("Auth failed");
    const data = await res.json();

    if (data.status === "banned") {
      alert("تم حظر حسابك");
      window.logout();
      return null;
    }
    return data.user;
  } catch (e) {
    console.error("Auth check error:", e);
    // Return null mostly, but don't logout on network error immediately to avoid bad UX
    return null;
  }
};

// Singleton user data loading
let cachedUser = null;
let userLoadingPromise = null;

window.loadGlobalUserData = async function () {
  if (cachedUser) return cachedUser;
  if (userLoadingPromise) return await userLoadingPromise;

  userLoadingPromise = window.authCheck();
  const user = await userLoadingPromise;
  userLoadingPromise = null;

  if (user) {
    cachedUser = user;
    updateUIPoints(user);
    updateUIUsernames(user);
    updateUIExtra(user);
  }
  return user;
};

function updateUIPoints(user) {
  const pointsEls = document.querySelectorAll("#userPoints, #walletPoints, #totalPoints");
  pointsEls.forEach(el => {
    if (el.innerHTML.includes('🪙')) {
      el.childNodes[0].textContent = user.points + " ";
    } else {
      el.innerText = user.points;
    }
  });
}

function updateUIUsernames(user) {
  const nameEls = document.querySelectorAll("#username, #profileUsername");
  nameEls.forEach(el => el.innerText = user.username);
}

function updateUIExtra(user) {
  const emailEls = document.querySelectorAll("#profileEmail");
  emailEls.forEach(el => el.innerText = user.email || "");

  const dateEls = document.querySelectorAll("#joinDate");
  // Check if dateEls exist (might not be on every page)
  if (dateEls.length && user.created_at) {
    const date = new Date(user.created_at).toLocaleDateString("ar-EG", {
      year: 'numeric', month: 'long', day: 'numeric'
    });
    dateEls.forEach(el => el.innerText = date);
  }
}

// ================= SIDEBAR LOGIC =================
// Define closeSidebar globally first to allow calling from HTML if needed
window.closeSidebar = function () {
  const sidebar = document.getElementById("sidebar");
  const overlay = document.getElementById("overlay");
  if (sidebar) sidebar.classList.add("translate-x-full");
  if (overlay) overlay.classList.add("hidden");
};

window.setupSidebar = function () {
  const menuBtn = document.getElementById("menuBtn");
  const sidebar = document.getElementById("sidebar");
  const overlay = document.getElementById("overlay");

  if (menuBtn && sidebar && overlay) {
    // Remove existing listeners if any (by replacing node - optional, but simple assignment is enough for onclick)
    menuBtn.onclick = (e) => {
      e.stopPropagation();
      sidebar.classList.remove("translate-x-full");
      overlay.classList.remove("hidden");
    };

    overlay.onclick = window.closeSidebar;

    // Handle escape key
    document.addEventListener('keydown', (e) => {
      if (e.key === "Escape") window.closeSidebar();
    });
  } else {
    console.warn("Sidebar elements not found on this page.");
  }
};

// ================= PROFILE DROPDOWN =================
window.setupProfileDropdown = function () {
  const profileBtn = document.getElementById("profileBtn");
  const profileMenu = document.getElementById("profileMenu");

  if (profileBtn && profileMenu) {
    profileBtn.onclick = (e) => {
      e.stopPropagation();
      profileMenu.classList.toggle("hidden");
    };

    // Close when clicking outside
    document.addEventListener("click", () => {
      if (!profileMenu.classList.contains("hidden")) {
        profileMenu.classList.add("hidden");
      }
    });

    // Prevent closing when clicking inside the menu
    profileMenu.onclick = (e) => e.stopPropagation();
  }
};

// ================= LOGOUT =================
window.logout = function () {
  localStorage.removeItem("token");
  localStorage.removeItem("activeTask");
  cachedUser = null;
  location.replace("login.html");
};

// ================= GLOBAL API HELPERS =================
window.getAvailableTasks = async function () {
  if (!window.token) return { status: 'error', tasks: [] };
  try {
    const res = await fetch(window.API + "/tasks/ads", {
      headers: { Authorization: "Bearer " + window.token }
    });
    return await res.json();
  } catch (e) { return { status: 'error', tasks: [] }; }
};

window.getManualTasks = async function () {
  if (!window.token) return { status: 'error', tasks: [] };
  try {
    const res = await fetch(window.API + "/tasks/manual", {
      headers: { Authorization: "Bearer " + window.token }
    });
    return await res.json();
  } catch (e) { return { status: 'error', tasks: [] }; }
};

window.getMyTasks = async function () {
  if (!window.token) return { status: 'error', tasks: [] };
  try {
    const res = await fetch(window.API + "/tasks/my", {
      headers: { Authorization: "Bearer " + window.token }
    });
    return await res.json();
  } catch (e) { return { status: 'error', tasks: [] }; }
};

// ================= INIT ON LOAD =================
(function init() {
  const runSetup = () => {
    try {
      window.setupSidebar();
      window.setupProfileDropdown();
      if (window.token) window.loadGlobalUserData();
    } catch (err) {
      console.error("Initialization error:", err);
    }
  };

  // Check if DOM is already ready
  if (document.readyState === "interactive" || document.readyState === "complete") {
    runSetup();
  } else {
    document.addEventListener("DOMContentLoaded", runSetup);
  }
})();

// ================= LOGIN/REGISTER PAGE LOGIC =================
const authFormInit = () => {
  const actionBtn = document.getElementById("actionBtn");
  const switchText = document.getElementById("switchText");
  const msg = document.getElementById("msg");
  const usernameInput = document.getElementById("usernameField");

  if (!actionBtn) return;

  let authMode = "login";

  const toggleAuthMode = () => {
    authMode = authMode === "login" ? "register" : "login";
    document.getElementById("title").innerText = authMode === "login" ? "تسجيل الدخول إلى حسابك" : "إنشاء حساب جديد";
    actionBtn.innerText = authMode === "login" ? "تسجيل دخول" : "إنشاء حساب";
    switchText.innerText = authMode === "login" ? "ليس لديك حساب؟ إنشاء حساب" : "لديك حساب بالفعل؟ تسجيل دخول";

    if (usernameInput) {
      authMode === "register" ? usernameInput.classList.remove("hidden") : usernameInput.classList.add("hidden");
    }
    msg.innerText = "";
  };

  switchText.onclick = toggleAuthMode;

  actionBtn.onclick = async () => {
    const email = document.getElementById("email").value.trim();
    const password = document.getElementById("password").value.trim();
    const username = document.getElementById("username") ? document.getElementById("username").value.trim() : "";

    if (!email || !password || (authMode === "register" && !username)) {
      msg.innerText = "من فضلك أدخل جميع البيانات المطلوبة";
      return;
    }

    msg.innerText = "جاري التنفيذ...";
    const endpoint = authMode === "login" ? "/auth/login" : "/auth/register";
    const body = authMode === "login" ? { email, password } : { username, email, password };

    try {
      const res = await fetch(window.API + endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body)
      });
      const data = await res.json();

      if (data.status === "success") {
        if (authMode === "login") {
          localStorage.setItem("token", data.token);
          location.replace("home.html");
        } else {
          msg.innerText = "✅ تم إنشاء الحساب، يمكنك تسجيل الدخول الآن";
          toggleAuthMode();
        }
      } else {
        msg.innerText = data.message || "حدث خطأ";
      }
    } catch (e) {
      msg.innerText = "خطأ في الاتصال بالسيرفر";
    }
  };
};

if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", authFormInit);
} else {
  authFormInit();
}
