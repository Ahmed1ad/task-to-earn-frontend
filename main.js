/* =================================================
   TaskToEarn - main.js (Final)
   Works with home.html (HTML + CSS only)
================================================= */

const API = "https://task-to-earn.onrender.com";
const token = localStorage.getItem("token");

/* =========================
   Auth Guard
========================= */
if (!token) {
  location.href = "index.html";
}

/* =========================
   DOM Elements
========================= */
const pointsEl = document.getElementById("userPoints");
const startBtn = document.getElementById("startBtn");

/* =========================
   Init
========================= */
document.addEventListener("DOMContentLoaded", () => {
  loadUser();
});

/* =========================
   Load User Data
========================= */
async function loadUser() {
  try {
    const res = await fetch(`${API}/me`, {
      headers: {
        Authorization: `Bearer ${token}`
      }
    });

    const data = await res.json();

    if (data.status === "success" && pointsEl) {
      pointsEl.innerText = data.user.points;
    }

  } catch (err) {
    console.error("Failed to load user", err);
  }
}

/* =========================
   Start Task
========================= */
async function startTask(taskId) {
  if (!startBtn || startBtn.disabled) return;

  startBtn.disabled = true;
  startBtn.innerText = "⏳ جاري المشاهدة...";

  try {
    const res = await fetch(`${API}/tasks/ads/start/${taskId}`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`
      }
    });

    const data = await res.json();

    if (data.status !== "success") {
      throw new Error(data.message || "فشل بدء المهمة");
    }

    startCountdown(taskId, 5);

  } catch (err) {
    alert(err.message);
    resetButton();
  }
}

/* =========================
   Countdown + Progress
========================= */
function startCountdown(taskId, duration) {
  let remaining = duration;
  let elapsed = 0;

  startBtn.innerHTML = `
    <div style="font-size:14px;margin-bottom:6px">⏱ ${remaining} ثواني</div>
    <div style="width:100%;height:6px;background:#e5e7eb;border-radius:999px;overflow:hidden">
      <div id="progressBar" style="
        width:0%;
        height:100%;
        background:#22c55e;
        transition:width 1s linear
      "></div>
    </div>
  `;

  const bar = document.getElementById("progressBar");

  const timer = setInterval(() => {
    elapsed++;
    remaining--;

    bar.style.width = `${(elapsed / duration) * 100}%`;
    startBtn.querySelector("div").innerText = `⏱ ${remaining} ثواني`;

    if (elapsed >= duration) {
      clearInterval(timer);
      completeTask(taskId);
    }
  }, 1000);
}

/* =========================
   Complete Task
========================= */
async function completeTask(taskId) {
  try {
    const res = await fetch(`${API}/tasks/ads/complete/${taskId}`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`
      }
    });

    const data = await res.json();

    if (data.status === "success") {
      alert("🎉 تم تنفيذ المهمة بنجاح");
      await loadUser();
      resetButton("✅ تمت");
    } else {
      throw new Error(data.message || "فشل إكمال المهمة");
    }

  } catch (err) {
    alert(err.message);
    resetButton();
  }
}

/* =========================
   Reset Button
========================= */
function resetButton(text = "ابدأ المهمة") {
  startBtn.disabled = false;
  startBtn.innerText = text;
}

/* =========================
   Logout
========================= */
function logout() {
  localStorage.removeItem("token");
  location.href = "index.html";
}

/* =========================
   Expose Functions
========================= */
window.startTask = startTask;
window.logout = logout;







const loginBtn = document.getElementById("loginBtn");

if (loginBtn) {
  loginBtn.addEventListener("click", login);
}

async function login() {
  const email = document.getElementById("email").value.trim();
  const password = document.getElementById("password").value.trim();

  if (!email || !password) {
    alert("من فضلك أدخل البريد الإلكتروني وكلمة المرور");
    return;
  }

  try {
    const res = await fetch("https://task-to-earn.onrender.com/auth/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password })
    });

    const data = await res.json();

    if (data.status === "success") {
      localStorage.setItem("token", data.token);
      location.href = "home.html";
    } else {
      alert(data.message || "بيانات الدخول غير صحيحة");
    }

  } catch (err) {
    alert("خطأ في الاتصال بالسيرفر");
  }
}