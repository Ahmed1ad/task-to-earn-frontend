const API = 'https://task-to-earn.onrender.com';

function getToken() {
  return localStorage.getItem('token') || sessionStorage.getItem('token');
}

let isLogin = true;

function toggleForm() {
  isLogin = !isLogin;

  document.getElementById('formTitle').innerText =
    isLogin ? 'تسجيل الدخول' : 'إنشاء حساب';

  document.getElementById('username').style.display =
    isLogin ? 'none' : 'block';

  document.getElementById('submitBtn').innerText =
    isLogin ? 'دخول' : 'إنشاء حساب';

  document.getElementById('switchText').innerText =
    isLogin ? 'ليس لديك حساب؟' : 'لديك حساب بالفعل؟';

  document.querySelector('.switch a').innerText =
    isLogin ? 'إنشاء حساب' : 'تسجيل الدخول';

  document.getElementById('msg').innerText = '';
}

async function submitForm() {
  const email = document.getElementById('email').value.trim();
  const password = document.getElementById('password').value.trim();
  const username = document.getElementById('username').value.trim();
  const remember = document.getElementById('remember').checked;

  if (!email || !password || (!isLogin && !username)) {
    document.getElementById('msg').innerText = 'يرجى ملء جميع البيانات';
    return;
  }

  const url = isLogin ? '/auth/login' : '/auth/register';
  const body = isLogin
    ? { email, password }
    : { username, email, password };

  try {
    const res = await fetch(API + url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body)
    });

    const data = await res.json();

    // Register success
    if (!isLogin && data.status === 'success') {
      document.getElementById('msg').style.color = 'green';
      document.getElementById('msg').innerText =
        'تم إنشاء الحساب بنجاح، سجل الدخول الآن';
      toggleForm();
      return;
    }

    // Login success
    if (data.token) {
      if (remember) {
        localStorage.setItem('token', data.token);
      } else {
        sessionStorage.setItem('token', data.token);
      }
      window.location.href = 'ads.html';
    } else {
      document.getElementById('msg').innerText =
        data.message || 'فشل تسجيل الدخول';
    }

  } catch {
    document.getElementById('msg').innerText = 'خطأ في الاتصال بالخادم';
  }
}
