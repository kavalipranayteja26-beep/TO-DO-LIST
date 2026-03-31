// State Object
let appState = {
  isPlanned: false,
  tasks: [], // { id, name, time, completed, notified: false, warned: false }
  waterGoal: 8,
  waterConsumed: 0,
  medicines: [] // { id, name, time, completed, notified: false }
};

const STORAGE_KEY = 'todo_app_state';

// Load initial state
const savedState = localStorage.getItem(STORAGE_KEY);
if (savedState) {
  appState = JSON.parse(savedState);
}

// Request Notification Permission
if ("Notification" in window) {
  Notification.requestPermission();
}

// DOM Elements
const setupScreen = document.getElementById('setup-screen');
const dashboardScreen = document.getElementById('dashboard-screen');

// Setup UI
const taskNameInput = document.getElementById('task-name');
const taskTimeInput = document.getElementById('task-time');
const addTaskBtn = document.getElementById('add-task-btn');
const setupTaskList = document.getElementById('setup-task-list');

const waterGoalInput = document.getElementById('water-goal');
const medNameInput = document.getElementById('med-name');
const medTimeInput = document.getElementById('med-time');
const addMedBtn = document.getElementById('add-med-btn');
const setupMedList = document.getElementById('setup-med-list');
const savePlanBtn = document.getElementById('save-plan-btn');

// Dashboard UI
const resetPlanBtn = document.getElementById('reset-plan-btn');
const progressCircle = document.getElementById('overall-progress');
const progressText = document.getElementById('progress-text');
const dashboardTaskList = document.getElementById('dashboard-task-list');
const waterGlassesContainer = document.getElementById('water-glasses');
const dashboardMedList = document.getElementById('dashboard-med-list');

// Temporary setup state before saving
let setupTasks = appState.tasks.length ? [...appState.tasks] : [];
let setupMeds = appState.medicines.length ? [...appState.medicines] : [];

function saveState() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(appState));
  renderDashboard();
}

// ---- Initialization ----
function init() {
  if (appState.isPlanned) {
    showDashboard();
  } else {
    showSetup();
  }
  startNotificationService();
}

// ---- Views ----
function showSetup() {
  setupScreen.classList.remove('hidden');
  dashboardScreen.classList.add('hidden');
  renderSetupLists();
}

function showDashboard() {
  setupScreen.classList.add('hidden');
  dashboardScreen.classList.remove('hidden');
  renderDashboard();
}

// ---- Setup Actions ----
addTaskBtn.addEventListener('click', () => {
  const name = taskNameInput.value.trim();
  const time = taskTimeInput.value;
  if (!name || !time) return alert("Please enter task name and time.");
  
  setupTasks.push({ id: Date.now().toString(), name, time, completed: false, notified: false, warned: false });
  taskNameInput.value = '';
  taskTimeInput.value = '';
  renderSetupLists();
});

addMedBtn.addEventListener('click', () => {
  const name = medNameInput.value.trim();
  const time = medTimeInput.value;
  if (!name || !time) return alert("Please enter medicine name and time.");
  
  setupMeds.push({ id: Date.now().toString(), name, time, completed: false, notified: false });
  medNameInput.value = '';
  medTimeInput.value = '';
  renderSetupLists();
});

savePlanBtn.addEventListener('click', () => {
  appState.isPlanned = true;
  appState.tasks = setupTasks;
  appState.waterGoal = parseInt(waterGoalInput.value) || 8;
  if(appState.waterGoal < appState.waterConsumed) appState.waterConsumed = 0; // reset if goal changes heavily
  appState.medicines = setupMeds;
  saveState();
  showDashboard();
});

function removeSetupTask(id) {
  setupTasks = setupTasks.filter(t => t.id !== id);
  renderSetupLists();
}

function removeSetupMed(id) {
  setupMeds = setupMeds.filter(m => m.id !== id);
  renderSetupLists();
}

function renderSetupLists() {
  setupTaskList.innerHTML = setupTasks.map(t => `
    <li>
      <div class="task-content">
        <span class="time-badge">${t.time}</span>
        <span class="task-text">${t.name}</span>
      </div>
      <button class="del-btn" onclick="removeSetupTask('${t.id}')">✕</button>
    </li>
  `).join('');

  setupMedList.innerHTML = setupMeds.map(m => `
    <li>
      <div class="task-content">
        <span class="time-badge">${m.time}</span>
        <span class="task-text">${m.name}</span>
      </div>
      <button class="del-btn" onclick="removeSetupMed('${m.id}')">✕</button>
    </li>
  `).join('');
}

// ---- Dashboard Actions ----

resetPlanBtn.addEventListener('click', () => {
  if (confirm('Are you sure you want to reset and plan a new day?')) {
    appState = { isPlanned: false, tasks: [], waterGoal: 8, waterConsumed: 0, medicines: [] };
    setupTasks = [];
    setupMeds = [];
    saveState();
    showSetup();
  }
});

function toggleTask(id) {
  const task = appState.tasks.find(t => t.id === id);
  if (task) {
    task.completed = !task.completed;
    saveState();
  }
}

function toggleMed(id) {
  const med = appState.medicines.find(m => m.id === id);
  if (med) {
    med.completed = !med.completed;
    saveState();
  }
}

function drinkWater() {
  if (appState.waterConsumed < appState.waterGoal) {
    appState.waterConsumed++;
    saveState();
  }
}

// Expose to window for inline onclick handlers
window.removeSetupTask = removeSetupTask;
window.removeSetupMed = removeSetupMed;
window.toggleTask = toggleTask;
window.toggleMed = toggleMed;
window.drinkWater = drinkWater;

function renderDashboard() {
  // Render Tasks
  dashboardTaskList.innerHTML = appState.tasks.length === 0 ? '<p>No tasks planned.</p>' : appState.tasks.map(t => `
    <li class="${t.completed ? 'completed' : ''}">
      <div class="task-content">
        <input type="checkbox" class="circular-checkbox" ${t.completed ? 'checked' : ''} onclick="toggleTask('${t.id}')">
        <span class="time-badge">${t.time}</span>
        <span class="task-text">${t.name}</span>
      </div>
    </li>
  `).join('');

  // Render Medicine
  dashboardMedList.innerHTML = appState.medicines.length === 0 ? '<p>No medicine scheduled.</p>' : appState.medicines.map(m => `
    <li class="${m.completed ? 'completed' : ''}">
      <div class="task-content">
        <input type="checkbox" class="circular-checkbox" ${m.completed ? 'checked' : ''} onclick="toggleMed('${m.id}')">
        <span class="time-badge">${m.time}</span>
        <span class="task-text">${m.name}</span>
      </div>
    </li>
  `).join('');

  // Render Water
  let glassesHTML = '';
  for (let i = 0; i < appState.waterGoal; i++) {
    const isFilled = i < appState.waterConsumed;
    glassesHTML += `<div class="water-glass ${isFilled ? 'filled' : ''}" onclick="${!isFilled ? 'drinkWater()' : ''}"></div>`;
  }
  waterGlassesContainer.innerHTML = glassesHTML;

  updateProgress();
}

function updateProgress() {
  let totalItems = appState.tasks.length + appState.medicines.length + appState.waterGoal;
  let completedItems = appState.tasks.filter(t => t.completed).length +
                       appState.medicines.filter(m => m.completed).length +
                       appState.waterConsumed;
  
  let percentage = totalItems === 0 ? 0 : Math.round((completedItems / totalItems) * 100);
  
  progressText.textContent = `${percentage}%`;
  progressCircle.setAttribute('stroke-dasharray', `${percentage}, 100`);
}

// ---- Notifications Service ----

function sendNotification(title, body) {
  if (Notification.permission === 'granted') {
    new Notification(title, { body, icon: '/favicon.ico' });
  } else if (Notification.permission !== 'denied') {
    Notification.requestPermission().then(permission => {
      if (permission === 'granted') new Notification(title, { body });
    });
  }
}

function checkTimes() {
  if (!appState.isPlanned) return;

  const now = new Date();
  const currentHours = now.getHours().toString().padStart(2, '0');
  const currentMinutes = now.getMinutes().toString().padStart(2, '0');
  const currentTime = `${currentHours}:${currentMinutes}`;
  
  // Create a time 10 mins from now for early warning
  const later = new Date(now.getTime() + 10 * 60000);
  const laterTime = `${later.getHours().toString().padStart(2, '0')}:${later.getMinutes().toString().padStart(2, '0')}`;

  let stateModified = false;

  // Check Tasks
  appState.tasks.forEach(task => {
    if (task.completed) return;
    
    if (task.time === currentTime && !task.notified) {
      sendNotification('Task Due Now!', `It is time to start: ${task.name}`);
      task.notified = true;
      stateModified = true;
    } else if (task.time === laterTime && !task.warned) {
      sendNotification('Task Reminder', `${task.name} starts in 10 minutes.`);
      task.warned = true;
      stateModified = true;
    }
  });

  // Check Medicine
  appState.medicines.forEach(med => {
    if (med.completed) return;
    
    if (med.time === currentTime && !med.notified) {
      sendNotification('Medicine Reminder', `It is time to take your medicine: ${med.name}`);
      med.notified = true;
      stateModified = true;
    }
  });

  if (stateModified) {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(appState));
  }
}

function startNotificationService() {
  // Check every 30 seconds
  setInterval(checkTimes, 30000);
  // Initial check
  checkTimes();
}

// Run app
init();
