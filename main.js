const API = 'https://task-to-earn.onrender.com';

let isLogin = true;

function toggleForm() {
  isLogin = !isLogin;

  document.getElementById('formTitle').innerText =
    isLogin ? 'تسجيل الدخول' : 'إنشاء حساب';

  document.getElementById('username').style.display =
    isLogin ? 'none' : 'block';

  document.querySelector('button').innerText =
    isLogin ? 'دخول' : 'إنشاء حساب';

  document.getElementById('switchText').innerText =
    isLogin ? 'ليس لديك حساب؟' : 'لديك حساب بالفعل؟';

  document.querySelector('.switch a').innerText =
    isLogin ? 'إنشاء حساب' : 'تسجيل الدخول';
}

async function submitForm() {
  const email = emailInput.value;
  const password = passwordInput.value;
  const username = usernameInput.value;
  const remember = document.getElementById('remember').checked;

  const url = isLogin ? '/auth/login' : '/auth/register';
  const body = isLogin
    ? { email, password }
    : { username, email, password };

  const res = await fetch(API + url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body)
  });

  const data = await res.json();

  if (data.token) {
    if (remember) {
      localStorage.setItem('token', data.token);
    } else {
      sessionStorage.setItem('token', data.token);
    }
    window.location.href = 'ads.html';
  } else {
    document.getElementById('msg').innerText = data.message || 'خطأ';
  }
}

// Auto login
const savedToken =
  localStorage.getItem('token') || sessionStorage.getItem('token');

if (savedToken) {
  window.location.href = 'ads.html';
}
