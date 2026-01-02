// ================= INIT =================
(async function initTasks() {
  const user = await authCheck();
  if (!user) return;

  document.getElementById("userPoints").innerText = user.points;

  document.getElementById("tabAvailable").onclick = loadAvailableTasks;
  document.getElementById("tabCompleted").onclick = loadCompletedTasks;

  loadAvailableTasks();
})();

// ================= LOAD AVAILABLE =================
async function loadAvailableTasks() {
  setActiveTab("available");
  showSkeleton();

  const res = await fetch(API + "/tasks/ads", {
    headers: { Authorization: "Bearer " + token }
  });

  const data = await res.json();

  if (!data.tasks || data.tasks.length === 0) {
    showEmpty("لا توجد مهام متاحة حاليًا");
    return;
  }

  document.getElementById("tasksContainer").innerHTML =
    data.tasks.map(taskCard).join("");
}

// ================= LOAD COMPLETED =================
async function loadCompletedTasks() {
  setActiveTab("completed");
  showSkeleton();

  const res = await fetch(API + "/tasks/my", {
    headers: { Authorization: "Bearer " + token }
  });

  const data = await res.json();

  const completed = (data.tasks || []).filter(t =>
    t.status === "completed" ||
    t.is_completed === true ||
    t.completed_at
  );

  if (!completed.length) {
    showEmpty("لا توجد مهام مكتملة");
    return;
  }

  document.getElementById("tasksContainer").innerHTML =
    completed.map(completedCard).join("");
}