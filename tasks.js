// ================= INIT =================
(async function initTasks() {
  const user = await authCheck();
  if (!user) return;

  // عرض النقاط
  const pointsEl = document.getElementById("userPoints");
  if (pointsEl) {
    pointsEl.innerText = user.points;
  }

  // ربط التابات
  document.getElementById("tabAvailable").onclick = loadAvailableTasks;
  document.getElementById("tabCompleted").onclick = loadCompletedTasks;

  // تحميل المهام المتاحة افتراضيًا
  loadAvailableTasks();
})();

// ================= AVAILABLE TASKS =================
async function loadAvailableTasks() {
  setActiveTab("available");
  showSkeleton();

  const data = await getAvailableTasks();

  if (!data.tasks || data.tasks.length === 0) {
    showEmpty("لا توجد مهام متاحة حاليًا");
    return;
  }

  document.getElementById("tasksContainer").innerHTML =
    data.tasks.map(taskCard).join("");
}

// ================= COMPLETED TASKS =================
async function loadCompletedTasks() {
  setActiveTab("completed");
  showSkeleton();

  const data = await getMyTasks();

  if (!data.tasks) {
    showEmpty("لا توجد مهام مكتملة");
    return;
  }

  const completed = data.tasks.filter(t =>
    t.status === "completed" ||
    t.is_completed === true ||
    t.completed_at
  );

  if (completed.length === 0) {
    showEmpty("لا توجد مهام مكتملة");
    return;
  }

  document.getElementById("tasksContainer").innerHTML =
    completed.map(completedCard).join("");
}