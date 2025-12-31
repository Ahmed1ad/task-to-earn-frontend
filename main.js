/* =====================================
   TaskToEarn - main.js (SIMPLE VERSION)
===================================== */

const API = "https://task-to-earn.onrender.com";
const token = localStorage.getItem("token");
const page = location.pathname;

/* =========================
   1️⃣ حماية صفحة home فقط
========================= */
if (page.includes("home.html") && !token) {
  location.replace("index.html");
}

/* =========================
   2️⃣ تسجيل الدخول (index.html)
========================= */
const loginBtn = document.getElementById("loginBtn");

if (loginBtn) {
  loginBtn.onclick = async () => {
    const email = document.getElementById("email").value.trim();
    const password = document.getElementById("password").value.trim();
    const msg = document.getElementById("msg");

    if (!email || !password) {
      msg.innerText = "من فضلك أدخل الإيميل والباسورد";
      return;
    }

    msg.innerText = "جاري تسجيل الدخول...";

    try {
      const res = await fetch(API + "/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password })
      });

      const data = await res.json();

      if (data.status === "success") {
        localStorage.setItem("token", data.token);
        location.replace("home.html");
      } else {
        msg.innerText = data.message || "بيانات غير صحيحة";
      }

    } catch {
      msg.innerText = "خطأ في الاتصال";
    }
  };
}

/* =========================
   3️⃣ تحميل بيانات المستخدم (home)
========================= */
if (page.includes("home.html") && token) {
  fetch(API + "/me", {
    headers: { Authorization: "Bearer " + token }
  })
  .then(res => res.json())
  .then(data => {
    if (data.status === "success") {
      document.getElementById("userPoints").innerText = data.user.points;
    }
  });
}

/* =========================
   4️⃣ تسجيل الخروج
========================= */
function logout() {
  localStorage.removeItem("token");
  location.replace("index.html");
}

window.logout = logout;