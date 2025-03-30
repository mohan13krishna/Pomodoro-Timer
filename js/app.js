// DOM Elements
const minutesElement = document.getElementById('minutes');
const secondsElement = document.getElementById('seconds');
const timerLabelElement = document.getElementById('timer-label');
const startButton = document.getElementById('start-btn');
const pauseButton = document.getElementById('pause-btn');
const resetButton = document.getElementById('reset-btn');
const focusTimeInput = document.getElementById('focus-time');
const shortBreakInput = document.getElementById('short-break');
const longBreakInput = document.getElementById('long-break');
const pomodoroCountInput = document.getElementById('pomodoro-count');
const currentSessionElement = document.getElementById('current-session');
const completedPomodorosElement = document.getElementById('completed-pomodoros');
const progressRing = document.querySelector('.progress-ring-circle');
const notificationElement = document.getElementById('notification');
const notificationTextElement = document.getElementById('notification-text');
const notificationCloseButton = document.getElementById('notification-close');
const alarmSound = document.getElementById('alarm-sound');

// Timer state
const timerState = {
    minutes: 25,
    seconds: 0,
    isRunning: false,
    timerId: null,
    totalSeconds: 25 * 60,
    initialTotalSeconds: 25 * 60,
    currentMode: 'focus',
    currentSession: 0,
    maxSessions: 4,
    completedPomodoros: 0
};

// Cached values for session settings
const settings = {
    focusTime: 25,
    shortBreak: 5,
    longBreak: 15,
    pomodoroCount: 4
};

// Initialize the progress ring
const circumference = 2 * Math.PI * 120; // 2πr
progressRing.style.strokeDasharray = `${circumference} ${circumference}`;
progressRing.style.strokeDashoffset = '0';

// Set up event listeners
function setupEventListeners() {
    startButton.addEventListener('click', startTimer);
    pauseButton.addEventListener('click', pauseTimer);
    resetButton.addEventListener('click', resetTimer);
    notificationCloseButton.addEventListener('click', hideNotification);
    
    // Number input controls
    document.querySelectorAll('.decrease-btn, .increase-btn').forEach(button => {
        button.addEventListener('click', handleNumberInputChange);
    });
    
    // Input change handlers
    focusTimeInput.addEventListener('change', updateSettings);
    shortBreakInput.addEventListener('change', updateSettings);
    longBreakInput.addEventListener('change', updateSettings);
    pomodoroCountInput.addEventListener('change', updateSettings);
}

// Start Timer
function startTimer() {
    if (timerState.isRunning) return;
    
    timerState.isRunning = true;
    startButton.disabled = true;
    pauseButton.disabled = false;
    
    timerState.timerId = setInterval(() => {
        updateTimer();
    }, 1000);
}

// Pause Timer
function pauseTimer() {
    if (!timerState.isRunning) return;
    
    timerState.isRunning = false;
    clearInterval(timerState.timerId);
    startButton.disabled = false;
    pauseButton.disabled = true;
}

// Reset Timer
function resetTimer() {
    pauseTimer();
    
    setTimerMode(timerState.currentMode, true);
    updateDisplay();
}

// Update Timer (countdown)
function updateTimer() {
    if (timerState.seconds === 0) {
        if (timerState.minutes === 0) {
            timerComplete();
            return;
        }
        timerState.minutes--;
        timerState.seconds = 59;
    } else {
        timerState.seconds--;
    }
    
    timerState.totalSeconds--;
    updateProgressRing();
    updateDisplay();
}

// Handle Timer Completion
function timerComplete() {
    pauseTimer();
    playAlarm();
    
    if (timerState.currentMode === 'focus') {
        timerState.completedPomodoros++;
        timerState.currentSession++;
        
        if (timerState.currentSession >= settings.pomodoroCount) {
            showNotification('Great job! Time for a long break.');
            setTimerMode('longBreak');
            timerState.currentSession = 0;
        } else {
            showNotification('Focus session complete! Take a short break.');
            setTimerMode('shortBreak');
        }
    } else {
        showNotification(timerState.currentMode === 'shortBreak' 
            ? 'Break complete! Ready to focus?' 
            : 'Long break complete! Ready for a new session?');
        setTimerMode('focus');
    }
    
    updateStats();
    updateDisplay();
}

// Set Timer Mode (focus, shortBreak, longBreak)
function setTimerMode(mode, resetOnly = false) {
    const previousMode = timerState.currentMode;
    timerState.currentMode = mode;
    
    // Only change body class if the mode actually changed or it's a reset
    if (previousMode !== mode || resetOnly) {
        document.body.classList.remove('focus-mode', 'short-break-mode', 'long-break-mode');
        
        switch (mode) {
            case 'focus':
                document.body.classList.add('focus-mode');
                timerState.minutes = settings.focusTime;
                timerLabelElement.textContent = 'Focus Time';
                break;
            case 'shortBreak':
                document.body.classList.add('short-break-mode');
                timerState.minutes = settings.shortBreak;
                timerLabelElement.textContent = 'Short Break';
                break;
            case 'longBreak':
                document.body.classList.add('long-break-mode');
                timerState.minutes = settings.longBreak;
                timerLabelElement.textContent = 'Long Break';
                break;
        }
        
        timerState.seconds = 0;
        timerState.totalSeconds = timerState.minutes * 60;
        timerState.initialTotalSeconds = timerState.totalSeconds;
        updateProgressRing();
    }
}

// Update Display
function updateDisplay() {
    minutesElement.textContent = timerState.minutes.toString().padStart(2, '0');
    secondsElement.textContent = timerState.seconds.toString().padStart(2, '0');
}

// Update Progress Ring
function updateProgressRing() {
    const offset = circumference - (timerState.totalSeconds / timerState.initialTotalSeconds) * circumference;
    progressRing.style.strokeDashoffset = offset.toString();
}

// Update Stats
function updateStats() {
    currentSessionElement.textContent = `${timerState.currentSession}/${settings.pomodoroCount}`;
    completedPomodorosElement.textContent = timerState.completedPomodoros.toString();
    
    // Save to local storage
    saveStats();
}

// Handle Number Input Changes (+/- buttons)
function handleNumberInputChange(e) {
    const button = e.target;
    const targetId = button.dataset.target;
    const input = document.getElementById(targetId);
    
    let value = parseInt(input.value, 10);
    
    if (button.classList.contains('increase-btn')) {
        value = Math.min(value + 1, parseInt(input.max, 10));
    } else {
        value = Math.max(value - 1, parseInt(input.min, 10));
    }
    
    input.value = value;
    updateSettings();
}

// Update Settings
function updateSettings() {
    settings.focusTime = parseInt(focusTimeInput.value, 10);
    settings.shortBreak = parseInt(shortBreakInput.value, 10);
    settings.longBreak = parseInt(longBreakInput.value, 10);
    settings.pomodoroCount = parseInt(pomodoroCountInput.value, 10);
    
    // If timer is not running, update the current display
    if (!timerState.isRunning) {
        setTimerMode(timerState.currentMode, true);
        updateDisplay();
    }
    
    updateStats();
    saveSettings();
}

// Show Notification
function showNotification(message) {
    notificationTextElement.textContent = message;
    notificationElement.classList.add('show');
}

// Hide Notification
function hideNotification() {
    notificationElement.classList.remove('show');
}

// Play Alarm Sound
function playAlarm() {
    alarmSound.currentTime = 0;
    alarmSound.play().catch(err => console.error('Error playing alarm:', err));
}

// Save Settings to Local Storage
function saveSettings() {
    localStorage.setItem('pomodoroSettings', JSON.stringify(settings));
}

// Save Stats to Local Storage
function saveStats() {
    const date = new Date().toISOString().split('T')[0]; // YYYY-MM-DD
    
    const stats = {
        date,
        completedPomodoros: timerState.completedPomodoros,
        currentSession: timerState.currentSession
    };
    
    localStorage.setItem('pomodoroStats', JSON.stringify(stats));
}

// Load Settings from Local Storage
function loadSettings() {
    const storedSettings = localStorage.getItem('pomodoroSettings');
    
    if (storedSettings) {
        const parsedSettings = JSON.parse(storedSettings);
        
        // Update input values
        focusTimeInput.value = parsedSettings.focusTime || 25;
        shortBreakInput.value = parsedSettings.shortBreak || 5;
        longBreakInput.value = parsedSettings.longBreak || 15;
        pomodoroCountInput.value = parsedSettings.pomodoroCount || 4;
        
        // Update settings object
        Object.assign(settings, parsedSettings);
    }
}

// Load Stats from Local Storage
function loadStats() {
    const storedStats = localStorage.getItem('pomodoroStats');
    
    if (storedStats) {
        const parsedStats = JSON.parse(storedStats);
        const today = new Date().toISOString().split('T')[0];
        
        // Only load stats if they're from today
        if (parsedStats.date === today) {
            timerState.completedPomodoros = parsedStats.completedPomodoros || 0;
            timerState.currentSession = parsedStats.currentSession || 0;
        }
    }
}

// Initialize the App
function initializeApp() {
    loadSettings();
    loadStats();
    updateStats();
    setTimerMode('focus', true);
    updateDisplay();
    setupEventListeners();
    document.body.classList.add('focus-mode');
}

// Start the app when the DOM is loaded
document.addEventListener('DOMContentLoaded', initializeApp);