/* ================= CONFIG ================= */
let currentTask = null;
let timerInterval = null;
let secondsLeft = 0;

/* ================= INIT ================= */
(async function initTasks() {
  const user = await authCheck();
  if (!user) return;

  // Render User Points
  updateUserPoints(user.points);

  // Tab Listeners
  const tabAvailable = document.getElementById("tabAvailable");
  const tabCompleted = document.getElementById("tabCompleted");

  if (tabAvailable) tabAvailable.onclick = loadAvailableTasks;
  if (tabCompleted) tabCompleted.onclick = loadCompletedTasks;

  // Initial Load
  await loadAvailableTasks();

  // Check for active task in background
  checkActiveTask();
})();


function updateUserPoints(points) {
  const pointsEl = document.getElementById("userPoints");
  if (pointsEl) pointsEl.innerText = points;
}

/* ================= LOADING & ABS ================= */
async function loadAvailableTasks() {
  setActiveTab("available");
  showSkeleton();

  try {
    const data = await getAvailableTasks();

    if (!data.tasks || data.tasks.length === 0) {
      showEmpty("لا توجد مهام متاحة حاليًا، عد لاحقًا!");
      return;
    }

    renderTasks(data.tasks, "available");
  } catch (e) {
    showEmpty("حدث خطأ في تحميل المهام");
  }
}

async function loadCompletedTasks() {
  setActiveTab("completed");
  showSkeleton();

  try {
    const data = await getMyTasks();
    if (!data.tasks) {
      showEmpty("لم تقم بإتمام أي مهام بعد");
      return;
    }

    // Filter truly completed
    const completed = data.tasks.filter(t =>
      t.status === "completed" || t.is_completed === true || t.completed_at
    );

    if (completed.length === 0) {
      showEmpty("سجلك نظيف! لم تكمل أي مهام بعد.");
      return;
    }

    renderTasks(completed, "completed");
  } catch (e) {
    showEmpty("حدث خطأ في تحميل السجل");
  }
}


/* ================= RENDERING ================= */
/* ================= RENDERING ================= */
function renderTasks(tasks, type) {
  const container = document.getElementById("tasksContainer");
  container.innerHTML = tasks.map((t, i) => {
    if (type === "available") return availableTaskCard(t, i);
    return completedTaskCard(t, i);
  }).join("");
}

function availableTaskCard(t, i) {
  return `
  <div class="bg-white rounded-2xl p-5 shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all duration-300 border border-gray-100 flex flex-col group relative overflow-hidden animate-slide-up opacity-0" style="animation-delay: ${i * 100}ms">
    <!-- Icon/Badge -->
    <div class="absolute top-0 right-0 bg-emerald-100/50 text-emerald-600 px-3 py-1 rounded-bl-xl text-xs font-bold backdrop-blur-sm">
      مهمة جديدة
    </div>

    <div class="flex items-start gap-4 mb-4">
      <div class="w-12 h-12 rounded-full bg-emerald-50 text-emerald-500 flex items-center justify-center shrink-0 group-hover:bg-emerald-500 group-hover:text-white transition-colors duration-300 shadow-sm layer-shadow">
        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" class="w-6 h-6">
          <path stroke-linecap="round" stroke-linejoin="round" d="M9 17.25v1.007a3 3 0 01-.879 2.122L7.5 21h9l-.621-.621A3 3 0 0115 18.257V17.25m-9 0V18a2.25 2.25 0 002.25 2.25h13.5A2.25 2.25 0 0021 18v-5.25c0-.621-.504-1.125-1.125-1.125H4.125C3.504 11.625 3 12.129 3 12.75V18z" />
          <path stroke-linecap="round" stroke-linejoin="round" d="M12 3a3 3 0 00-3 3v4.5c0 .621.504 1.125 1.125 1.125h3.75c.621 0 1.125-.504 1.125-1.125V6a3 3 0 00-3-3z" />
        </svg>
      </div>
      <div>
         <h3 class="font-bold text-gray-800 text-lg leading-tight mb-1 group-hover:text-emerald-600 transition-colors">${t.title}</h3>
         <p class="text-sm text-gray-400 line-clamp-2">${t.description}</p>
      </div>
    </div>
    
    <div class="mt-auto flex items-center justify-between p-3 bg-gray-50 rounded-xl">
      <div class="flex flex-col">
        <span class="text-[10px] text-gray-400 uppercase tracking-wider font-semibold">المكافأة</span>
        <span class="text-emerald-600 font-black text-xl">+${t.reward_points}</span>
      </div>
      
      <div class="flex flex-col items-end">
        <span class="text-[10px] text-gray-400 uppercase tracking-wider font-semibold">الوقت</span>
        <span class="font-bold text-gray-700 font-mono">${t.duration_seconds}s</span>
      </div>
    </div>

    <button onclick='startTask(${JSON.stringify(t)})'
      class="mt-4 w-full py-3.5 bg-gray-900 text-white rounded-xl font-bold shadow-lg hover:bg-emerald-600 hover:shadow-emerald-500/30 active:scale-95 transition-all duration-300 flex items-center justify-center gap-2 group-hover:shadow-xl">
      <span>ابدأ الآن</span>
      <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5 rtl:-scale-x-100 transition-transform group-hover:translate-x-1" viewBox="0 0 20 20" fill="currentColor">
        <path fill-rule="evenodd" d="M10.293 3.293a1 1 0 011.414 0l6 6a1 1 0 010 1.414l-6 6a1 1 0 01-1.414-1.414L14.586 11H3a1 1 0 110-2h11.586l-4.293-4.293a1 1 0 010-1.414z" clip-rule="evenodd" />
      </svg>
    </button>
  </div>`;
}

function completedTaskCard(t, i) {
  return `
  <div class="bg-gray-50 rounded-2xl p-5 border border-gray-100 flex flex-col opacity-0 hover:opacity-100 transition duration-500 animate-slide-up" style="animation-delay: ${i * 100}ms">
    <div class="flex justify-between items-start mb-2">
      <h3 class="font-bold text-gray-700">${t.title}</h3>
      <div class="bg-green-100 text-green-700 px-3 py-1 rounded-full text-xs font-bold flex items-center gap-1">
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" class="w-3.5 h-3.5">
          <path fill-rule="evenodd" d="M2.25 12c0-5.385 4.365-9.75 9.75-9.75s9.75 4.365 9.75 9.75-4.365 9.75-9.75 9.75S2.25 17.385 2.25 12zm13.36-1.814a.75.75 0 10-1.22-.872l-3.236 4.53L9.53 12.22a.75.75 0 00-1.06 1.06l2.25 2.25a.75.75 0 001.14-.094l3.75-5.25z" clip-rule="evenodd" />
        </svg>
        مكتملة
      </div>
    </div>
    <div class="text-emerald-600 font-bold text-lg mt-auto">
      +${t.reward_points} نقطة
    </div>
    <div class="text-xs text-gray-400 mt-1 flex items-center gap-1">
      <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" class="w-3 h-3">
        <path stroke-linecap="round" stroke-linejoin="round" d="M12 6v6h4.5m4.5 0a9 9 0 11-18 0 9 9 0 0118 0z" />
      </svg>
      ${t.completed_at ? new Date(t.completed_at).toLocaleDateString("ar-EG") : ""}
    </div>
  </div>`;
}

/* ================= LOGIC ================= */
async function startTask(task) {
  currentTask = task;

  // Start backend tracking
  try {
    await fetch(API + `/tasks/ads/start/${task.id}`, {
      method: "POST",
      headers: { Authorization: "Bearer " + token }
    });
  } catch (e) {
    console.error("Start task error", e);
  }

  // Save state
  localStorage.setItem("activeTask", JSON.stringify({
    taskId: task.id,
    startTime: Date.now(),
    duration: task.duration_seconds
  }));

  // Setup UI
  secondsLeft = task.duration_seconds;
  updateTimerUI();

  const btn = document.getElementById("completeBtn");
  if (btn) {
    btn.disabled = true;
    btn.innerText = `انتظر ${secondsLeft} ثانية...`;
    btn.className = "w-full py-4 rounded-xl bg-gray-200 text-gray-400 font-bold cursor-not-allowed";
  }

  const modal = document.getElementById("taskModal");
  if (modal) {
    modal.classList.remove("hidden");
    modal.classList.add("flex");
  }

  // Open AD
  if (task.ad_url) {
    window.open(task.ad_url, "_blank");
  }

  // Interval
  clearInterval(timerInterval);
  timerInterval = setInterval(() => {
    secondsLeft--;
    updateTimerUI();

    if (secondsLeft <= 0) {
      clearInterval(timerInterval);
      enableCompleteBtn();
    }
  }, 1000);
}

function updateTimerUI() {
  const timerEl = document.getElementById("timer");
  if (timerEl) timerEl.innerText = secondsLeft > 0 ? secondsLeft : 0;

  const btn = document.getElementById("completeBtn");
  if (btn && secondsLeft > 0) {
    btn.innerText = `انتظر ${secondsLeft} ثانية...`;
  }
}

function enableCompleteBtn() {
  const btn = document.getElementById("completeBtn");
  if (!btn) return;

  btn.disabled = false;
  btn.innerText = "";
  btn.innerHTML = `
    <span>تحقق وحصل النقاط</span>
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" class="w-6 h-6">
      <path stroke-linecap="round" stroke-linejoin="round" d="M12 6v12m-3-2.818l.879.659c1.171.879 3.07.879 4.242 0 1.172-.879 1.172-2.303 0-3.182C13.536 12.219 12.768 12 12 12c-.725 0-1.45-.22-2.003-.659-1.106-.879-1.106-2.303 0-3.182s2.9-.879 4.006 0l.415.33M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
    </svg>
  `;
  btn.className = "w-full py-4 rounded-xl bg-gradient-to-r from-emerald-500 to-green-500 text-white font-bold shadow-lg shadow-green-500/30 hover:scale-[1.02] transition flex items-center justify-center gap-2";
}

// ... existing code ...

function showEmpty(text) {
  document.getElementById("tasksContainer").innerHTML = `
    <div class="col-span-full flex flex-col items-center justify-center py-20 text-center">
      <div class="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center text-gray-400 mb-4">
        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" class="w-10 h-10">
          <path stroke-linecap="round" stroke-linejoin="round" d="M2.25 13.5h3.86a2.25 2.25 0 012.012 1.244l.256.512a2.25 2.25 0 002.013 1.244h3.218a2.25 2.25 0 002.013-1.244l.256-.512a2.25 2.25 0 012.013-1.244h3.859m-19.5.338V18a2.25 2.25 0 002.25 2.25h15A2.25 2.25 0 0021.75 18v-4.162c0-.224-.034-.447-.1-.661L19.24 5.338a2.25 2.25 0 00-2.15-1.588H6.911a2.25 2.25 0 00-2.15 1.588L2.35 13.177a2.25 2.25 0 00-.1.661z" />
        </svg>
      </div>
      <div class="text-gray-800 text-lg font-bold">${text}</div>
    </div>
  `;
}

/* ================= SIDEBAR ================= */
const menuBtn = document.getElementById("menuBtn");
const sidebar = document.getElementById("sidebar");
const overlay = document.getElementById("overlay");

if (menuBtn) {
  menuBtn.onclick = () => {
    sidebar.classList.remove("translate-x-full");
    overlay.classList.remove("hidden");
  };
}

function closeSidebar() {
  if (sidebar) sidebar.classList.add("translate-x-full");
  if (overlay) overlay.classList.add("hidden");
}

if (overlay) {
  overlay.onclick = closeSidebar;
}
