/* ================= CONFIG & STATE ================= */
let currentTask = null;
let timerInterval = null;
let secondsLeft = 0;
let activeTab = 'available';

/* ================= INIT ================= */
(async function initTasks() {
  // Auth Check
  const user = await loadGlobalUserData();
  if (!user) return;

  // Initial Load
  switchTab('available');

  // Check active ad task
  checkActiveTask();

  // Proof Form Listener
  setupProofForm();
})();

/* ================= TABS LOGIC ================= */
window.switchTab = function (tab) {
  activeTab = tab;

  // Update buttons
  const tabs = ['available', 'manual', 'completed'];
  tabs.forEach(t => {
    const btn = document.getElementById(`tab${t.charAt(0).toUpperCase() + t.slice(1)}`);
    const container = document.getElementById(`${t}Container`);

    if (t === tab) {
      btn.className = "flex-1 py-3 px-4 rounded-xl bg-gray-900 text-white shadow-lg font-bold transition-all whitespace-nowrap active-tab scale-105";
      container.classList.remove('hidden');
    } else {
      btn.className = "flex-1 py-3 px-4 rounded-xl text-gray-500 font-medium hover:bg-gray-200 transition-all whitespace-nowrap";
      container.classList.add('hidden');
    }
  });

  // Content Loaders
  if (tab === 'available') loadAvailableTasksTab();
  if (tab === 'manual') loadManualTasksTab();
  if (tab === 'completed') loadCompletedTasksTab();
};

/* ================= LOADING FUNCTIONS ================= */
async function loadAvailableTasksTab() {
  const container = document.getElementById('availableContainer');
  showSkeleton(container);

  try {
    const data = await getAvailableTasks();
    if (!data.tasks || !data.tasks.length) {
      showEmpty(container, "لا توجد مهام إعلانات متاحة حالياً");
      return;
    }

    container.innerHTML = data.tasks.map((t, i) => renderTaskCard(t, i, 'ad')).join('');
  } catch (e) {
    showEmpty(container, "خطأ في تحميل المهام");
  }
}

async function loadManualTasksTab() {
  const container = document.getElementById('manualContainer');
  showSkeleton(container);

  try {
    const data = await getManualTasks();
    if (!data.tasks || !data.tasks.length) {
      showEmpty(container, "لا توجد مهام يدوية متاحة حالياً");
      return;
    }

    container.innerHTML = data.tasks.map((t, i) => renderTaskCard(t, i, 'manual')).join('');
  } catch (e) {
    showEmpty(container, "خطأ في تحميل المهام اليدوية");
  }
}

async function loadCompletedTasksTab() {
  const container = document.getElementById('completedTasks');
  const parent = document.getElementById('completedContainer');
  showSkeleton(container);

  try {
    const data = await getMyTasks();
    if (!data.tasks || !data.tasks.length) {
      showEmpty(parent, "سجلك فارغ، ابدأ العمل الآن!");
      return;
    }

    container.innerHTML = data.tasks.reverse().map((t, i) => `
            <div class="bg-white rounded-2xl p-4 border border-gray-100 flex items-center justify-between animate-slide-up shadow-sm">
                <div class="flex items-center gap-3">
                    <div class="w-10 h-10 rounded-full bg-emerald-50 text-emerald-600 flex items-center justify-center">
                        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" class="w-5 h-5"><path fill-rule="evenodd" d="M2.25 12c0-5.385 4.365-9.75 9.75-9.75s9.75 4.365 9.75 9.75-4.365 9.75-9.75 9.75S2.25 17.385 2.25 12zm13.36-1.814a.75.75 0 10-1.22-.872l-3.236 4.53L9.53 12.22a.75.75 0 00-1.06 1.06l2.25 2.25a.75.75 0 001.14-.094l3.75-5.25z" clip-rule="evenodd" /></svg>
                    </div>
                    <div>
                        <h4 class="font-bold text-gray-800">${t.title}</h4>
                        <p class="text-[10px] text-gray-400 font-mono">${new Date(t.completed_at || t.updated_at).toLocaleString('ar-EG')}</p>
                    </div>
                </div>
                <div class="text-emerald-600 font-black">+${t.reward_points}</div>
            </div>
        `).join('');
  } catch (e) {
    showEmpty(parent, "خطأ في تحميل السجل");
  }
}

/* ================= RENDERING CARDS ================= */
function renderTaskCard(t, i, type) {
  const isAd = type === 'ad';
  return `
    <div class="bg-white rounded-2xl p-5 shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all duration-300 border border-gray-100 flex flex-col group relative overflow-hidden animate-slide-up" style="animation-delay: ${i * 100}ms">
        <div class="absolute top-0 right-0 ${isAd ? 'bg-emerald-100 text-emerald-600' : 'bg-blue-100 text-blue-600'} px-3 py-1 rounded-bl-xl text-xs font-bold backdrop-blur-sm">
            ${isAd ? 'إعلان سريع' : 'مهمة يدوية'}
        </div>
        
        <div class="flex items-start gap-4 mb-4">
            <div class="w-12 h-12 rounded-full ${isAd ? 'bg-emerald-50 text-emerald-500' : 'bg-blue-50 text-blue-500'} flex items-center justify-center shrink-0 group-hover:scale-110 transition-transform duration-300">
                ${isAd ?
      '<svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z"></path></svg>' :
      '<svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"></path></svg>'}
            </div>
            <div>
                <h3 class="font-bold text-gray-800 text-lg leading-tight mb-1 transition-colors">${t.title}</h3>
                <p class="text-sm text-gray-400 line-clamp-2">${t.description}</p>
            </div>
        </div>
        
        <div class="mt-auto flex items-center justify-between p-3 bg-gray-50 rounded-xl">
            <div class="flex flex-col">
                <span class="text-[10px] text-gray-400 uppercase font-semibold">المكافأة</span>
                <span class="${isAd ? 'text-emerald-600' : 'text-blue-600'} font-black text-xl">+${t.reward_points}</span>
            </div>
            <div class="flex flex-col items-end">
                <span class="text-[10px] text-gray-400 uppercase font-semibold">${isAd ? 'الوقت' : 'النوع'}</span>
                <span class="font-bold text-gray-700">${isAd ? t.duration_seconds + 's' : 'إثبات صورة'}</span>
            </div>
        </div>

        <button onclick='${isAd ? `startAdTask(${JSON.stringify(t)})` : `openManualTask(${JSON.stringify(t)})`}'
            class="mt-4 w-full py-3.5 ${isAd ? 'bg-gray-900' : 'bg-blue-600'} text-white rounded-xl font-bold transition-all active:scale-95 flex items-center justify-center gap-2">
            <span>${isAd ? 'مشاهدة الآن' : 'تنفيذ المهمة'}</span>
            <svg class="h-5 w-5 rtl:-scale-x-100" viewBox="0 0 20 20" fill="currentColor"><path d="M10.293 3.293a1 1 0 011.414 0l6 6a1 1 0 010 1.414l-6 6a1 1 0 01-1.414-1.414L14.586 11H3a1 1 0 110-2h11.586l-4.293-4.293a1 1 0 010-1.414z" /></svg>
        </button>
    </div>`;
}

/* ================= AD TASKS LOGIC ================= */
window.startAdTask = async function (task) {
  currentTask = task;
  try {
    await fetch(`${API}/tasks/ads/start/${task.id}`, {
      method: "POST",
      headers: { Authorization: "Bearer " + token }
    });
  } catch (e) { }

  localStorage.setItem("activeTask", JSON.stringify({
    taskId: task.id,
    startTime: Date.now(),
    duration: task.duration_seconds
  }));

  secondsLeft = task.duration_seconds;
  document.getElementById("taskModal").classList.remove("hidden");
  document.getElementById("taskModal").classList.add("flex");
  window.open(task.ad_url, "_blank");

  initAdTimer();
};

function initAdTimer() {
  const btn = document.getElementById("completeBtn");
  btn.disabled = true;

  clearInterval(timerInterval);
  timerInterval = setInterval(() => {
    secondsLeft--;
    document.getElementById("timer").innerText = secondsLeft > 0 ? secondsLeft : 0;
    btn.innerText = `انتظر ${secondsLeft} ثانية...`;

    if (secondsLeft <= 0) {
      clearInterval(timerInterval);
      btn.disabled = false;
      btn.innerText = "تحقق وإستلام المكافأة";
      btn.className = "w-full py-4 rounded-xl bg-emerald-600 text-white font-bold shadow-lg transition-all active:scale-95";
    }
  }, 1000);
}

window.completeTask = async function () {
  if (!currentTask) return;
  const btn = document.getElementById("completeBtn");
  btn.innerText = "جاري التحقق...";
  btn.disabled = true;

  try {
    const res = await fetch(`${API}/tasks/ads/complete/${currentTask.id}`, {
      method: "POST",
      headers: { Authorization: "Bearer " + token }
    });
    const data = await res.json();

    if (data.status === "success") {
      alert(`مبروك! حصلت على ${currentTask.reward_points} نقطة 🎉`);
      loadGlobalUserData();
      closeModal();
      loadAvailableTasksTab();
    } else {
      alert("خطأ: " + data.message);
    }
  } catch (e) { alert("خطأ في الاتصال بالسيرفر"); }
};

window.closeModal = function () {
  document.getElementById("taskModal").classList.add("hidden");
  localStorage.removeItem("activeTask");
  clearInterval(timerInterval);
  currentTask = null;
};

/* ================= MANUAL TASKS LOGIC ================= */
window.openManualTask = function (task) {
  document.getElementById("manualTaskId").value = task.id;
  document.getElementById("manualTaskTitle").innerText = task.title;
  document.getElementById("manualTaskDesc").innerText = task.description;
  document.getElementById("manualModal").classList.remove("hidden");
  document.getElementById("manualModal").classList.add("flex");
};

window.closeManualModal = function () {
  document.getElementById("manualModal").classList.add("hidden");
  resetFile();
};

function setupProofForm() {
  const proofInput = document.getElementById("proofInput");
  const proofForm = document.getElementById("proofForm");

  if (proofInput) {
    proofInput.onchange = function () {
      const file = this.files[0];
      if (file) {
        if (file.size > 5 * 1024 * 1024) {
          alert("حجم الملف كبير جداً (الأقصى 5MB)");
          this.value = ""; return;
        }
        const reader = new FileReader();
        reader.onload = e => {
          document.getElementById("imagePreview").src = e.target.result;
          document.getElementById("uploadPlaceholder").classList.add('hidden');
          document.getElementById("previewContainer").classList.remove('hidden');
        };
        reader.readAsDataURL(file);
      }
    };
  }

  if (proofForm) {
    proofForm.onsubmit = async function (e) {
      e.preventDefault();
      const taskId = document.getElementById("manualTaskId").value;
      const file = document.getElementById("proofInput").files[0];

      if (!file) { alert("يرجى اختيار صورة الإثبات"); return; }

      const btn = document.getElementById("submitProofBtn");
      btn.disabled = true;
      btn.innerText = "جاري الرفع...";

      const formData = new FormData();
      formData.append("proof", file);

      try {
        const res = await fetch(`${API}/tasks/manual/upload/${taskId}`, {
          method: "POST",
          headers: { Authorization: "Bearer " + token },
          body: formData
        });
        const data = await res.json();

        if (data.status === "success") {
          alert("تم إرسال الإثبات بنجاح! سيتم المراجعة قريباً.");
          closeManualModal();
          loadManualTasksTab();
        } else {
          alert("خطأ: " + data.message);
        }
      } catch (e) { alert("حدث خطأ أثناء الرفع"); }
      btn.disabled = false;
      btn.innerText = "إرسال الإثبات";
    };
  }
}

window.resetFile = function () {
  document.getElementById("proofInput").value = "";
  document.getElementById("uploadPlaceholder").classList.remove('hidden');
  document.getElementById("previewContainer").classList.add('hidden');
};

/* ================= UI HELPERS ================= */
function showSkeleton(container) {
  container.innerHTML = `<div class="h-40 bg-gray-100 rounded-2xl animate-pulse col-span-full"></div>`;
}

function showEmpty(container, text) {
  container.innerHTML = `
        <div class="col-span-full py-12 text-center text-gray-500 font-bold">
            <svg class="w-12 h-12 mx-auto mb-2 opacity-20" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0a2 2 0 012 2v4a2 2 0 01-2 2H4a2 2 0 01-2-2v-4a2 2 0 012-2m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4"></path></svg>
            ${text}
        </div>`;
}

function checkActiveTask() {
  const saved = localStorage.getItem("activeTask");
  if (!saved) return;
  const task = JSON.parse(saved);
  const elapsed = Math.floor((Date.now() - task.startTime) / 1000);
  if (elapsed < task.duration) {
    // Optionally restore the timer, but usually user stays on page
  } else { localStorage.removeItem("activeTask"); }
}
