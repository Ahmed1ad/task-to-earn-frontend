const API = "https://task-to-earn.onrender.com";
const token = localStorage.getItem("token");
const page = location.pathname;

/* حماية home فقط */
if (page.includes("home") && !token) {
  location.replace("login.html");
}

/* عناصر الصفحة */
const actionBtn = document.getElementById("actionBtn");
const switchText = document.getElementById("switchText");
const msg = document.getElementById("msg");

let mode = "login"; // login | register

if (actionBtn) {
  actionBtn.onclick = submit;
  switchText.onclick = toggleMode;
}

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

  msg.innerText = "";
}

async function submit() {
  const email = document.getElementById("email").value.trim();
  const password = document.getElementById("password").value.trim();

  if (!email || !password) {
    msg.innerText = "من فضلك أدخل الإيميل وكلمة المرور";
    return;
  }

  msg.innerText = "جاري التنفيذ...";

  const endpoint =
    mode === "login" ? "/auth/login" : "/auth/register";

  const body =
    mode === "login"
      ? { email, password }
      : { username: email.split("@")[0], email, password };

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
        msg.innerText = "✅ تم إنشاء الحساب، يمكنك تسجيل الدخول";
        toggleMode();
      }
    } else {
      msg.innerText = data.message || "حدث خطأ";
    }

  } catch {
    msg.innerText = "خطأ في الاتصال بالسيرفر";
  }
}