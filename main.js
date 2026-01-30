// ================= GLOBAL =================
window.API = location.hostname === "localhost" || location.hostname === "127.0.0.1"
  ? "http://localhost:3000"
  : "https://task-to-earn.onrender.com";
window.token = localStorage.getItem("token");

const page = location.pathname;

// الصفحات المحمية فقط
const protectedPages = ["home.html", "tasks.html"];

if (protectedPages.some(p => page.includes(p)) && !token) {
  location.replace("login.html");
}


// لو المستخدم مسجل دخول بالفعل وهو في صفحة اللوجن، نوديه الهوم
if (page.includes("login.html") && token) {
  location.replace("home.html");
}

// ================= AUTH CHECK =================
// (Auth check definition was here, removed duplicate)



// عناصر الصفحة
const actionBtn = document.getElementById("actionBtn");
const switchText = document.getElementById("switchText");
const msg = document.getElementById("msg");
const usernameInput = document.getElementById("username");
const usernameField = document.getElementById("usernameField");

let mode = "login"; // login | register

if (actionBtn && switchText) {
  actionBtn.onclick = submit;
  switchText.onclick = toggleMode;
}

// تغيير الوضع
function toggleMode() {
  mode = mode === "login" ? "register" : "login";

  document.getElementById("title").innerText =
    mode === "login"
      ? "تسجيل الدخول إلى حسابك"
      : "إنشاء حساب جديد";

  actionBtn.innerText =
    mode === "login" ? "تسجيل دخول" : "إنشاء حساب";

  switchText.innerText =
    mode === "login"
      ? "ليس لديك حساب؟ إنشاء حساب"
      : "لديك حساب بالفعل؟ تسجيل دخول";

  // إظهار / إخفاء username field
  if (usernameField) {
    if (mode === "register") {
      usernameField.classList.remove("hidden");
    } else {
      usernameField.classList.add("hidden");
    }
  }

  msg.innerText = "";
}

// إرسال Login / Register
async function submit() {
  const email = document.getElementById("email").value.trim();
  const password = document.getElementById("password").value.trim();
  const username = usernameInput.value.trim();

  if (!email || !password || (mode === "register" && !username)) {
    msg.innerText = "من فضلك أدخل جميع البيانات المطلوبة";
    return;
  }

  msg.innerText = "جاري التنفيذ...";

  const endpoint =
    mode === "login" ? "/auth/login" : "/auth/register";

  const body =
    mode === "login"
      ? { email, password }
      : { username, email, password };

  try {
    const res = await fetch(API + endpoint, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body)
    });

    const data = await res.json();

    if (data.status === "success") {
      if (mode === "login") {
        localStorage.setItem("token", data.token);
        location.replace("home.html");
      } else {
        msg.innerText = "✅ تم إنشاء الحساب، يمكنك تسجيل الدخول الآن";
        toggleMode();
      }
    } else {
      msg.innerText = data.message || "حدث خطأ";
    }

  } catch {
    msg.innerText = "خطأ في الاتصال بالسيرفر";
  }
}




// ================= GLOBAL DATA LOAD =================
window.loadGlobalUserData = async function () {
  const user = await authCheck();
  if (!user) return null;

  // Update UI Elements across pages
  const elements = {
    username: document.querySelectorAll("#username, #profileUsername"),
    points: document.querySelectorAll("#userPoints, #walletPoints, #totalPoints"),
    email: document.querySelectorAll("#profileEmail"),
    joinDate: document.querySelectorAll("#joinDate")
  };

  elements.username.forEach(el => el.innerText = user.username);
  elements.points.forEach(el => el.innerText = user.points);

  if (user.email) elements.email.forEach(el => el.innerText = user.email);

  // Format join date if needed
  if (user.created_at) {
    const date = new Date(user.created_at).toLocaleDateString("ar-EG", {
      year: 'numeric', month: 'long', day: 'numeric'
    });
    elements.joinDate.forEach(el => el.innerText = date);
  }

  return user;
};

// ================= SIDEBAR & OVERLAY =================
window.setupSidebar = function () {
  const menuBtn = document.getElementById("menuBtn");
  const sidebar = document.getElementById("sidebar");
  const overlay = document.getElementById("overlay");

  if (menuBtn && sidebar && overlay) {
    menuBtn.onclick = () => {
      sidebar.classList.remove("translate-x-full");
      overlay.classList.remove("hidden");
    };

    window.closeSidebar = () => {
      sidebar.classList.add("translate-x-full");
      overlay.classList.add("hidden");
    };

    overlay.onclick = window.closeSidebar;
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

// auto-init common features
document.addEventListener("DOMContentLoaded", () => {
  if (token) {
    loadGlobalUserData();
    setupSidebar();
    setupProfileDropdown();
  }
});

// ================= LOGOUT =================
window.logout = function () {
  localStorage.removeItem("token");
  localStorage.removeItem("activeTask");
  location.replace("login.html");
};

// ================= AUTH CHECK =================
window.authCheck = async function () {
  if (!token) return null;

  try {
    const res = await fetch(API + "/auth/check", {
      headers: { Authorization: "Bearer " + token }
    });

    const data = await res.json();

    if (data.status === "banned") {
      alert("تم حظر حسابك");
      logout();
      return null;
    }

    if (data.status !== "success") {
      return null;
    }

    return data.user;
  } catch (e) {
    return null;
  }
};

// ================= TASKS API =================
window.getAvailableTasks = async function () {
  const res = await fetch(API + "/tasks/ads", {
    headers: { Authorization: "Bearer " + token }
  });
  return res.json();
};

window.getManualTasks = async function () {
  const res = await fetch(API + "/tasks/manual", {
    headers: { Authorization: "Bearer " + token }
  });
  return res.json();
};

window.getMyTasks = async function () {
  const res = await fetch(API + "/tasks/my", {
    headers: { Authorization: "Bearer " + token }
  });
  return res.json();
};
