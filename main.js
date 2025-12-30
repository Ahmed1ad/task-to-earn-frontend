const API = 'https://task-to-earn.onrender.com';

// =====================
// LOGIN
// =====================
async function login() {
  const email = document.getElementById('email').value;
  const password = document.getElementById('password').value;

  const res = await fetch(`${API}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password })
  });

  const data = await res.json();

  if (data.token) {
    localStorage.setItem('token', data.token);
    window.location.href = 'ads.html';
  } else {
    alert('Login failed');
  }
}

// =====================
// LOAD ADS
// =====================
async function loadAds() {
  const token = localStorage.getItem('token');

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
        <p>${ad.description}</p>
        <button onclick="startAd(${ad.id}, ${ad.duration_seconds})">
          Start Ad
        </button>
        <button id="complete-${ad.id}" disabled
          onclick="completeAd(${ad.id})">
          Complete
        </button>
        <p id="timer-${ad.id}"></p>
      </div>
    `;
  });
}

// =====================
// START AD
// =====================
async function startAd(id, duration) {
  const token = localStorage.getItem('token');

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
    timerEl.innerText = `الوقت المتبقي: ${timeLeft}s`;

    if (timeLeft <= 0) {
      clearInterval(interval);
      btn.disabled = false;
      timerEl.innerText = 'يمكنك إكمال الإعلان';
    }
  }, 1000);
}

// =====================
// COMPLETE AD
// =====================
async function completeAd(id) {
  const token = localStorage.getItem('token');

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
    alert(data.message);
  }
}
