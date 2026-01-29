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
function renderTasks(tasks, type) {
  const container = document.getElementById("tasksContainer");
  container.innerHTML = tasks.map(t => {
    if (type === "available") return availableTaskCard(t);
    return completedTaskCard(t);
  }).join("");
}

function availableTaskCard(t) {
  return `
  <div class="bg-white rounded-2xl p-5 shadow-sm hover:shadow-md transition border border-gray-100 flex flex-col group relative overflow-hidden">
    <!-- Icon/Badge -->
    <div class="absolute top-0 right-0 bg-emerald-100 text-emerald-600 px-3 py-1 rounded-bl-xl text-xs font-bold">
      مهمة جديدة
    </div>

    <div class="flex items-start gap-4 mb-4">
      <div class="w-12 h-12 rounded-full bg-emerald-50 text-2xl flex items-center justify-center shrink-0 group-hover:bg-emerald-100 transition">
        📺
      </div>
      <div>
         <h3 class="font-bold text-gray-800 text-lg leading-tight mb-1">${t.title}</h3>
         <p class="text-sm text-gray-400 line-clamp-2">${t.description}</p>
      </div>
    </div>
    
    <div class="mt-auto flex items-center justify-between">
      <div class="flex flex-col">
        <span class="text-xs text-gray-400">المكافأة</span>
        <span class="text-emerald-600 font-extrabold text-xl">+${t.reward_points}</span>
      </div>
      
      <div class="flex flex-col items-end">
        <span class="text-xs text-gray-400">الوقت</span>
        <span class="font-bold text-gray-700">${t.duration_seconds} ث</span>
      </div>
    </div>

    <button onclick='startTask(${JSON.stringify(t)})'
      class="mt-4 w-full py-3 bg-gray-900 text-white rounded-xl font-bold shadow-lg hover:bg-emerald-600 hover:shadow-emerald-500/30 active:scale-95 transition flex items-center justify-center gap-2">
      <span>ابدأ الآن</span>
      <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5 rtl:-scale-x-100" viewBox="0 0 20 20" fill="currentColor">
        <path fill-rule="evenodd" d="M10.293 3.293a1 1 0 011.414 0l6 6a1 1 0 010 1.414l-6 6a1 1 0 01-1.414-1.414L14.586 11H3a1 1 0 110-2h11.586l-4.293-4.293a1 1 0 010-1.414z" clip-rule="evenodd" />
      </svg>
    </button>
  </div>`;
}

function completedTaskCard(t) {
  return `
  <div class="bg-gray-50 rounded-2xl p-5 border border-gray-100 flex flex-col opacity-75 hover:opacity-100 transition">
    <div class="flex justify-between items-start mb-2">
      <h3 class="font-bold text-gray-700">${t.title}</h3>
      <div class="bg-green-100 text-green-700 px-2 py-0.5 rounded text-xs font-bold">✔ مكتملة</div>
    </div>
    <div class="text-emerald-600 font-bold text-lg mt-auto">
      +${t.reward_points} نقطة
    </div>
    <div class="text-xs text-gray-400 mt-1">
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
  btn.innerText = "تحقق وحصل النقاط 💰";
  btn.className = "w-full py-4 rounded-xl bg-gradient-to-r from-emerald-500 to-green-500 text-white font-bold shadow-lg shadow-green-500/30 hover:scale-[1.02] transition";
}

async function completeTask() {
  if (!currentTask) return;

  const btn = document.getElementById("completeBtn");
  btn.innerText = "جاري التحقق...";
  btn.disabled = true;

  try {
    const res = await fetch(API + `/tasks/ads/complete/${currentTask.id}`, {
      method: "POST",
      headers: { Authorization: "Bearer " + token }
    });
    const data = await res.json();

    if (data.status === "success") {
      // Success!
      const user = await authCheck();
      if (user) updateUserPoints(user.points); // Update points in UI

      localStorage.removeItem("activeTask");
      closeModal();
      loadAvailableTasks(); // Reload

      // Show success toast (simple alert for now or implement toast)
      alert(`مبروك! حصلت على ${data.reward_points} نقطة 🎉`);

    } else {
      alert("خطأ: " + (data.message || "فشلت العميلة"));
      closeModal();
    }

  } catch (e) {
    alert("خطأ في الاتصال");
    closeModal();
  }
}

async function failTask() {
  if (currentTask) {
    try {
      await fetch(`${API}/tasks/ads/fail/${currentTask.id}`, {
        method: "POST",
        headers: { Authorization: "Bearer " + token }
      });
    } catch (e) { }
  }
  closeModal();
}

function closeModal() {
  clearInterval(timerInterval);
  const modal = document.getElementById("taskModal");
  if (modal) {
    modal.classList.add("hidden");
    modal.classList.remove("flex");
  }
  localStorage.removeItem("activeTask");
  currentTask = null;
}


/* ================= RECOVERY ================= */
async function checkActiveTask() {
  const saved = localStorage.getItem("activeTask");
  if (!saved) return;

  const task = JSON.parse(saved);
  const elapsed = Math.floor((Date.now() - task.startTime) / 1000);

  // If task expired too long ago, fail it
  if (elapsed > (task.duration + 60)) {
    localStorage.removeItem("activeTask");
  }
  // Else we could theoretically restore the modal, but usually better to let user restart
}


/* ================= UI HELPERS ================= */
function setActiveTab(tab) {
  const avail = document.getElementById("tabAvailable");
  const comp = document.getElementById("tabCompleted");

  const activeClass = "flex-1 py-3 rounded-xl bg-gray-900 text-white font-bold shadow-lg transition-all";
  const inactiveClass = "flex-1 py-3 rounded-xl bg-white text-gray-500 font-medium hover:bg-gray-50 transition-all";

  if (tab === "available") {
    avail.className = activeClass;
    comp.className = inactiveClass;
  } else {
    avail.className = inactiveClass;
    comp.className = activeClass;
  }
}

function showSkeleton() {
  document.getElementById("tasksContainer").innerHTML = `
    <div class="h-40 bg-gray-200/50 rounded-2xl animate-pulse"></div>
    <div class="h-40 bg-gray-200/50 rounded-2xl animate-pulse"></div>
    <div class="h-40 bg-gray-200/50 rounded-2xl animate-pulse"></div>
  `;
}

function showEmpty(text) {
  document.getElementById("tasksContainer").innerHTML = `
    <div class="col-span-full flex flex-col items-center justify-center py-20 text-center">
      <div class="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center text-4xl mb-4">💤</div>
      <div class="text-gray-800 text-lg font-bold">${text}</div>
    </div>
  `;
}
