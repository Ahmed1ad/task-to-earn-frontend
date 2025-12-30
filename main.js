const API = 'https://task-to-earn.onrender.com';

// ======================
// AUTO LOGIN
// ======================
const savedToken =
  localStorage.getItem('token') || sessionStorage.getItem('token');

if (savedToken && window.location.pathname.includes('index.html')) {
  window.location.href = 'ads.html';
}

// ======================
// FORM TOGGLE
// ======================
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

  document.getElementById('msg').innerText = '';
}

// ======================
// LOGIN / REGISTER
// ======================
async function submitForm() {
  const email = document.getElementById('email').value.trim();
  const password = document.getElementById('password').value.trim();
  const username = document.getElementById('username').value.trim();
  const remember = document.getElementById('remember').checked;

  if (!email || !password || (!isLogin && !username)) {
    document.getElementById('msg').innerText = 'من فضلك املأ كل البيانات';
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

    // Register success (no token returned)
    if (!isLogin && data.status === 'success') {
      document.getElementById('msg').innerText =
        'تم إنشاء الحساب بنجاح، يمكنك تسجيل الدخول الآن';
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
        data.message || 'فشل الدخول';
    }
  } catch (err) {
    document.getElementById('msg').innerText = 'خطأ في الاتصال بالسيرفر';
  }
}

// ======================
// LOAD ADS
// ======================
async function loadAds() {
  const token =
    localStorage.getItem('token') || sessionStorage.getItem('token');

  if (!token) {
    window.location.href = 'index.html';
    return;
  }

  const res = await fetch(`${API}/tasks/ads`, {
    headers: {
      'Authorization': 'Bearer ' + token
    }
  });

  const data = await res.json();
  const adsDiv = document.getElementById('ads');
  adsDiv.innerHTML = '';

  data.tasks.forEach(ad => {
    adsDiv.innerHTML += `
      <div style="border:1px solid #ccc;padding:10px;margin:10px">
        <h3>${ad.title}</h3>
        <p>${ad.description || ''}</p>
        <p>المدة: ${ad.duration_seconds} ثانية</p>
        <button onclick="startAd(${ad.id}, ${ad.duration_seconds})">
          بدء الإعلان
        </button>
        <button id="complete-${ad.id}" disabled
          onclick="completeAd(${ad.id})">
          إكمال
        </button>
        <p id="timer-${ad.id}"></p>
      </div>
    `;
  });
}

// ======================
// START AD
// ======================
async function startAd(id, duration) {
  const token =
    localStorage.getItem('token') || sessionStorage.getItem('token');

  await fetch(`${API}/tasks/ads/start/${id}`, {
    method: 'POST',
    headers: {
      'Authorization': 'Bearer ' + token
    }
  });

  let timeLeft = duration;
  const timerEl = document.getElementById(`timer-${id}`);
  const btn = document.getElementById(`complete-${id}`);

  const interval = setInterval(() => {
    timeLeft--;
    timerEl.innerText = `الوقت المتبقي: ${timeLeft} ثانية`;

    if (timeLeft <= 0) {
      clearInterval(interval);
      btn.disabled = false;
      timerEl.innerText = 'يمكنك إكمال الإعلان';
    }
  }, 1000);
}

// ======================
// COMPLETE AD
// ======================
async function completeAd(id) {
  const token =
    localStorage.getItem('token') || sessionStorage.getItem('token');

  const res = await fetch(`${API}/tasks/ads/complete/${id}`, {
    method: 'POST',
    headers: {
      'Authorization': 'Bearer ' + token
    }
  });

  const data = await res.json();

  if (data.status === 'success') {
    alert(`تمت إضافة ${data.reward_points} نقطة`);
    location.reload();
  } else {
    alert(data.message || 'حدث خطأ');
  }
}
