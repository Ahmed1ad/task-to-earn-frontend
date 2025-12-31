/* =================================================
   TaskToEarn - main.js (NO REFRESH LOOP)
================================================= */

const API = "https://task-to-earn.onrender.com";
const token = localStorage.getItem("token");
const page = location.pathname;

/* =========================
   PAGE GUARDS (IMPORTANT)
========================= */

// ✅ لو احنا في صفحة home ومفيش توكن → رجوع للوجن
if (page.includes("home") && !token) {
  location.replace("index.html");
}

// ❌ ممنوع أي redirect في صفحة اللوجن
// صفحة index.html لازم تفضل ساكنة

/* =========================
   LOGIN (index.html)
========================= */
const loginBtn = document.getElementById("loginBtn");

if (loginBtn) {
  loginBtn.addEventListener("click", login);
}

async function login() {
  const email = document.getElementById("email")?.value.trim();
  const password = document.getElementById("password")?.value.trim();
  const msg = document.getElementById("msg");

  if (!email || !password) {
    msg.innerText = "من فضلك أدخل البريد الإلكتروني وكلمة المرور";
    return;
  }

  msg.innerText = "جاري تسجيل الدخول...";

  try {
    const res = await fetch(`${API}/auth/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password })
    });

    const data = await res.json();

    if (data.status === "success") {
      localStorage.setItem("token", data.token);
      location.replace("home.html");
    } else {
      msg.innerText = data.message || "بيانات الدخول غير صحيحة";
    }

  } catch (e) {
    msg.innerText = "خطأ في الاتصال بالسيرفر";
  }
}

/* =========================
   HOME PAGE (home.html)
========================= */
if (page.includes("home") && token) {

  document.addEventListener("DOMContentLoaded", () => {
    loadUser();
  });

  async function loadUser() {
    try {
      const res = await fetch(`${API}/me`, {
        headers: { Authorization: "Bearer " + token }
      });
      const data = await res.json();

      if (data.status === "success") {
        document.getElementById("userPoints").innerText = data.user.points;
      }
    } catch (e) {
      console.error("Load user failed");
    }
  }

  window.startTask = async function (taskId) {
    const btn = document.getElementById("startBtn");
    if (btn.disabled) return;

    btn.disabled = true;
    btn.innerText = "⏳ جاري المشاهدة...";

    try {
      const res = await fetch(`${API}/tasks/ads/start/${taskId}`, {
        method: "POST",
        headers: { Authorization: "Bearer " + token }
      });

      const data = await res.json();
      if (data.status !== "success") throw new Error();

      setTimeout(() => completeTask(taskId), 5000);

    } catch {
      btn.disabled = false;
      btn.innerText = "ابدأ المهمة";
    }
  };

  async function completeTask(taskId) {
    const btn = document.getElementById("startBtn");

    try {
      const res = await fetch(`${API}/tasks/ads/complete/${taskId}`, {
        method: "POST",
        headers: { Authorization: "Bearer " + token }
      });

      const data = await res.json();

      if (data.status === "success") {
        alert("🎉 تم تنفيذ المهمة");
        location.reload();
      } else {
        throw new Error();
      }

    } catch {
      btn.disabled = false;
      btn.innerText = "ابدأ المهمة";
    }
  }

  window.logout = function () {
    localStorage.removeItem("token");
    location.replace("index.html");
  };
}