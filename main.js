// ================= GLOBAL =================
window.API = "https://task-to-earn.onrender.com";
window.token = localStorage.getItem("token");

const page = location.pathname;

// الصفحات المحمية فقط
const protectedPages = ["home.html", "tasks.html"];

if (protectedPages.some(p => page.includes(p)) && !token) {
  location.replace("login.html");
}

// ================= LOGOUT =================
window.logout = function () {
  localStorage.removeItem("token");
  location.replace("login.html");
};

// ================= AUTH CHECK =================
window.authCheck = async function () {
  if (!token) return null;

  const res = await fetch(API + "/auth/check", {
    headers: { Authorization: "Bearer " + token }
  });

  const data = await res.json();

  if (data.status !== "success") {
    logout();
    return null;
  }

  return data.user;
};



// عناصر الصفحة
const actionBtn = document.getElementById("actionBtn");
const switchText = document.getElementById("switchText");
const msg = document.getElementById("msg");
const usernameInput = document.getElementById("username");

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

  // إظهار / إخفاء username
  if (mode === "register") {
    usernameInput.classList.remove("hidden");
  } else {
    usernameInput.classList.add("hidden");
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




// ================= LOGOUT =================
window.logout = function () {
  localStorage.removeItem("token");
  location.replace("login.html");
};

// ================= AUTH CHECK =================
window.authCheck = async function () {
  if (!token) {
    logout();
    return null;
  }

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
      logout();
      return null;
    }

    return data.user;
  } catch (e) {
    logout();
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

window.getMyTasks = async function () {
  const res = await fetch(API + "/tasks/my", {
    headers: { Authorization: "Bearer " + token }
  });
  return res.json();
};
