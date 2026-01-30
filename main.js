// ================= GLOBAL CONFIG =================
window.API = (location.hostname === "localhost" || location.hostname === "127.0.0.1" || location.protocol === "file:")
  ? "http://localhost:3000"
  : "https://task-to-earn.onrender.com";

window.token = localStorage.getItem("token");

// ================= AUTH PROTECTION =================
const page = location.pathname;
const protectedPages = ["home.html", "tasks.html", "profile.html", "withdraw.html"];

if (protectedPages.some(p => page.includes(p)) && !token) {
  location.replace("login.html");
}

if (page.includes("login.html") && token) {
  location.replace("home.html");
}

// ================= CORE FUNCTIONS =================

// Auth Check from Server
window.authCheck = async function () {
  if (!token) return null;
  try {
    const res = await fetch(API + "/auth/check", {
      headers: { Authorization: "Bearer " + token }
    });
    if (!res.ok) throw new Error("Auth failed");
    const data = await res.json();

    if (data.status === "banned") {
      alert("تم حظر حسابك");
      logout();
      return null;
    }
    return data.user;
  } catch (e) {
    console.error("Auth check error:", e);
    return null;
  }
};

// Singleton user data loading
let cachedUser = null;
let userLoadingPromise = null;

window.loadGlobalUserData = async function () {
  if (cachedUser) return cachedUser;
  if (userLoadingPromise) return await userLoadingPromise;

  userLoadingPromise = authCheck();
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
    // Check if it's a badge with 🪙 or just text
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
  if (user.created_at) {
    const date = new Date(user.created_at).toLocaleDateString("ar-EG", {
      year: 'numeric', month: 'long', day: 'numeric'
    });
    dateEls.forEach(el => el.innerText = date);
  }
}

// ================= SIDEBAR LOGIC =================
// Safe default
window.closeSidebar = () => { };

window.setupSidebar = function () {
  const menuBtn = document.getElementById("menuBtn");
  const sidebar = document.getElementById("sidebar");
  const overlay = document.getElementById("overlay");

  if (menuBtn && sidebar && overlay) {
    menuBtn.onclick = (e) => {
      e.stopPropagation();
      sidebar.classList.remove("translate-x-full");
      overlay.classList.remove("hidden");
    };

    window.closeSidebar = () => {
      sidebar.classList.add("translate-x-full");
      overlay.classList.add("hidden");
    };

    overlay.onclick = window.closeSidebar;

    // Also handle escape key
    document.addEventListener('keydown', (e) => {
      if (e.key === "Escape") window.closeSidebar();
    });
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

    document.addEventListener("click", () => {
      profileMenu.classList.add("hidden");
    });
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
  try {
    const res = await fetch(API + "/tasks/ads", {
      headers: { Authorization: "Bearer " + token }
    });
    return await res.json();
  } catch (e) { return { status: 'error', tasks: [] }; }
};

window.getManualTasks = async function () {
  try {
    const res = await fetch(API + "/tasks/manual", {
      headers: { Authorization: "Bearer " + token }
    });
    return await res.json();
  } catch (e) { return { status: 'error', tasks: [] }; }
};

window.getMyTasks = async function () {
  try {
    const res = await fetch(API + "/tasks/my", {
      headers: { Authorization: "Bearer " + token }
    });
    return await res.json();
  } catch (e) { return { status: 'error', tasks: [] }; }
};

// ================= INIT ON LOAD =================
(function init() {
  // Setup UI elements immediately if they exist (don't wait for DOMContentLoaded if script is at end)
  const runSetup = () => {
    setupSidebar();
    setupProfileDropdown();
    if (token) loadGlobalUserData();
  };

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", runSetup);
  } else {
    runSetup();
  }
})();

// ================= LOGIN/REGISTER PAGE LOGIC =================
// Only runs if on login page
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
      const res = await fetch(API + endpoint, {
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

// Run auth form init on load
if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", authFormInit);
} else {
  authFormInit();
}
