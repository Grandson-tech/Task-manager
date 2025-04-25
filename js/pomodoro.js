// Pomodoro Timer Management
class PomodoroManager {
    constructor() {
        this.workDuration = 25 * 60; // 25 minutes in seconds
        this.shortBreakDuration = 5 * 60; // 5 minutes in seconds
        this.longBreakDuration = 15 * 60; // 15 minutes in seconds
        this.currentTime = this.workDuration;
        this.isRunning = false;
        this.timer = null;
        this.currentMode = 'work'; // 'work', 'shortBreak', 'longBreak'
        this.pomodorosCompleted = 0;
        this.currentTask = null;
        this.startTime = null;
        this.timeLogs = [];
        
        // Wait for DOM to be ready
        document.addEventListener('DOMContentLoaded', () => {
            this.initializeEventListeners();
            this.initializeAudio();
            this.updateDisplay();
            this.requestNotificationPermission();
        });
    }

    requestNotificationPermission() {
        if (Notification.permission !== 'granted' && Notification.permission !== 'denied') {
            Notification.requestPermission();
        }
    }

    initializeEventListeners() {
        // Timer controls
        const startBtn = document.getElementById('startPomodoro');
        const pauseBtn = document.getElementById('pausePomodoro');
        const resetBtn = document.getElementById('resetPomodoro');
        
        if (startBtn) startBtn.addEventListener('click', () => this.startTimer());
        if (pauseBtn) pauseBtn.addEventListener('click', () => this.pauseTimer());
        if (resetBtn) resetBtn.addEventListener('click', () => this.resetTimer());
        
        // Mode selection
        const workMode = document.getElementById('workMode');
        const shortBreakMode = document.getElementById('shortBreakMode');
        const longBreakMode = document.getElementById('longBreakMode');
        
        if (workMode) workMode.addEventListener('click', () => this.setMode('work'));
        if (shortBreakMode) shortBreakMode.addEventListener('click', () => this.setMode('shortBreak'));
        if (longBreakMode) longBreakMode.addEventListener('click', () => this.setMode('longBreak'));
        
        // Custom duration
        const customDuration = document.getElementById('customDuration');
        if (customDuration) {
            customDuration.addEventListener('change', (e) => {
                const minutes = parseInt(e.target.value);
                if (minutes > 0) {
                    this.setCustomDuration(minutes);
                }
            });
        }

        // Minimize button
        const minimizeBtn = document.getElementById('minimizePomodoro');
        if (minimizeBtn) {
            minimizeBtn.addEventListener('click', () => {
                const widget = document.getElementById('pomodoro-widget');
                widget.classList.toggle('minimized');
            });
        }

        // Close button
        const closeBtn = document.getElementById('closePomodoro');
        if (closeBtn) {
            closeBtn.addEventListener('click', () => {
                const widget = document.getElementById('pomodoro-widget');
                widget.style.display = 'none';
            });
        }

        // Make Pomodoro widget draggable
        const widget = document.getElementById('pomodoro-widget');
        const header = widget.querySelector('.pomodoro-header');
        let isDragging = false;
        let currentX;
        let currentY;
        let initialX;
        let initialY;
        let xOffset = 0;
        let yOffset = 0;

        header.addEventListener('mousedown', dragStart);
        document.addEventListener('mousemove', drag);
        document.addEventListener('mouseup', dragEnd);

        // Touch events for mobile
        header.addEventListener('touchstart', dragStart);
        document.addEventListener('touchmove', drag);
        document.addEventListener('touchend', dragEnd);

        function dragStart(e) {
            if (e.type === 'touchstart') {
                initialX = e.touches[0].clientX - xOffset;
                initialY = e.touches[0].clientY - yOffset;
            } else {
                initialX = e.clientX - xOffset;
                initialY = e.clientY - yOffset;
            }

            if (e.target === header) {
                isDragging = true;
            }
        }

        function drag(e) {
            if (isDragging) {
                e.preventDefault();

                if (e.type === 'touchmove') {
                    currentX = e.touches[0].clientX - initialX;
                    currentY = e.touches[0].clientY - initialY;
                } else {
                    currentX = e.clientX - initialX;
                    currentY = e.clientY - initialY;
                }

                xOffset = currentX;
                yOffset = currentY;

                setTranslate(currentX, currentY, widget);
            }
        }

        function dragEnd(e) {
            initialX = currentX;
            initialY = currentY;
            isDragging = false;
        }

        function setTranslate(xPos, yPos, el) {
            // Get viewport dimensions
            const viewportWidth = window.innerWidth;
            const viewportHeight = window.innerHeight;
            const widgetWidth = el.offsetWidth;
            const widgetHeight = el.offsetHeight;

            // Constrain to viewport bounds
            xPos = Math.min(Math.max(0, xPos), viewportWidth - widgetWidth);
            yPos = Math.min(Math.max(0, yPos), viewportHeight - widgetHeight);

            el.style.transform = `translate(${xPos}px, ${yPos}px)`;
        }

        // Handle window resize
        window.addEventListener('resize', () => {
            const viewportWidth = window.innerWidth;
            const viewportHeight = window.innerHeight;
            const widgetWidth = widget.offsetWidth;
            const widgetHeight = widget.offsetHeight;

            // Ensure widget stays within viewport
            if (xOffset + widgetWidth > viewportWidth) {
                xOffset = viewportWidth - widgetWidth;
            }
            if (yOffset + widgetHeight > viewportHeight) {
                yOffset = viewportHeight - widgetHeight;
            }

            setTranslate(xOffset, yOffset, widget);
        });
    }

    initializeAudio() {
        try {
            this.workEndSound = new Audio('sounds/work-end.mp3');
            this.breakEndSound = new Audio('sounds/break-end.mp3');
        } catch (error) {
            console.error('Error initializing audio:', error);
        }
    }

    startTimer() {
        if (!this.isRunning) {
            this.isRunning = true;
            this.startTime = new Date();
            this.timer = setInterval(() => this.updateTimer(), 1000);
            
            const startBtn = document.getElementById('startPomodoro');
            const pauseBtn = document.getElementById('pausePomodoro');
            
            if (startBtn) startBtn.style.display = 'none';
            if (pauseBtn) pauseBtn.style.display = 'block';
        }
    }

    pauseTimer() {
        if (this.isRunning) {
            this.isRunning = false;
            clearInterval(this.timer);
            
            const startBtn = document.getElementById('startPomodoro');
            const pauseBtn = document.getElementById('pausePomodoro');
            
            if (startBtn) startBtn.style.display = 'block';
            if (pauseBtn) pauseBtn.style.display = 'none';
        }
    }

    resetTimer() {
        this.pauseTimer();
        this.currentTime = this.getDurationForMode(this.currentMode);
        this.updateDisplay();
    }

    updateTimer() {
        if (this.currentTime > 0) {
            this.currentTime--;
            this.updateDisplay();
        } else {
            this.handleTimerComplete();
        }
    }

    handleTimerComplete() {
        this.pauseTimer();
        this.playNotificationSound();
        this.showNotification();
        
        if (this.currentMode === 'work') {
            this.pomodorosCompleted++;
            this.logTimeSpent();
            if (this.pomodorosCompleted % 4 === 0) {
                this.setMode('longBreak');
            } else {
                this.setMode('shortBreak');
            }
        } else {
            this.setMode('work');
        }
        
        // Add completion animation
        const timerDisplay = document.getElementById('timerDisplay');
        if (timerDisplay) {
            timerDisplay.classList.add('complete');
            setTimeout(() => timerDisplay.classList.remove('complete'), 500);
        }
    }

    setMode(mode) {
        this.currentMode = mode;
        this.currentTime = this.getDurationForMode(mode);
        this.updateDisplay();
        this.updateModeButtons();
    }

    getDurationForMode(mode) {
        switch (mode) {
            case 'work':
                return this.workDuration;
            case 'shortBreak':
                return this.shortBreakDuration;
            case 'longBreak':
                return this.longBreakDuration;
            default:
                return this.workDuration;
        }
    }

    setCustomDuration(minutes) {
        this.workDuration = minutes * 60;
        this.currentTime = this.workDuration;
        this.updateDisplay();
    }

    updateDisplay() {
        const minutes = Math.floor(this.currentTime / 60);
        const seconds = this.currentTime % 60;
        const timeString = `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
        
        const timerDisplay = document.getElementById('timerDisplay');
        const currentMode = document.getElementById('currentMode');
        const pomodoroCount = document.getElementById('pomodoroCount');
        
        if (timerDisplay) {
            timerDisplay.textContent = timeString;
            if (this.currentTime === 0) {
                timerDisplay.classList.add('complete');
                setTimeout(() => timerDisplay.classList.remove('complete'), 500);
            }
        }
        
        if (currentMode) {
            currentMode.textContent = this.currentMode === 'work' ? 'Work' : 
                                    this.currentMode === 'shortBreak' ? 'Short Break' : 'Long Break';
        }
        
        if (pomodoroCount) {
            pomodoroCount.textContent = this.pomodorosCompleted;
        }
        
        this.updateProgressCircle();
    }

    updateProgressCircle() {
        const totalDuration = this.getDurationForMode(this.currentMode);
        const progress = (totalDuration - this.currentTime) / totalDuration;
        const circle = document.getElementById('progressCircle');
        
        if (circle) {
            const circumference = 2 * Math.PI * 45; // radius = 45
            circle.style.strokeDasharray = `${circumference} ${circumference}`;
            circle.style.strokeDashoffset = circumference * (1 - progress);
        }
    }

    updateModeButtons() {
        const modes = ['work', 'shortBreak', 'longBreak'];
        modes.forEach(mode => {
            const button = document.getElementById(`${mode}Mode`);
            if (button) {
                if (mode === this.currentMode) {
                    button.classList.add('active');
                } else {
                    button.classList.remove('active');
                }
            }
        });
    }

    playNotificationSound() {
        try {
            if (this.currentMode === 'work') {
                this.workEndSound?.play();
            } else {
                this.breakEndSound?.play();
            }
        } catch (error) {
            console.error('Error playing notification sound:', error);
        }
    }

    showNotification() {
        if (Notification.permission === 'granted') {
            const title = this.currentMode === 'work' ? 'Break Time!' : 'Back to Work!';
            const message = this.currentMode === 'work' 
                ? 'Take a short break to refresh your mind.'
                : 'Time to focus on your tasks.';
            
            new Notification(title, { body: message });
        }
    }

    setCurrentTask(task) {
        this.currentTask = task;
        const taskNameElement = document.getElementById('currentTaskName');
        if (taskNameElement) {
            taskNameElement.textContent = task ? task.title : 'No task selected';
        }
    }

    logTimeSpent() {
        if (!this.currentTask || !this.startTime) return;

        const endTime = new Date();
        const duration = (endTime - this.startTime) / 1000; // in seconds

        const timeLog = {
            taskId: this.currentTask.id,
            startTime: this.startTime.toISOString(),
            endTime: endTime.toISOString(),
            duration: duration,
            mode: this.currentMode
        };

        this.timeLogs.push(timeLog);
        this.saveTimeLog(timeLog);
    }

    async saveTimeLog(timeLog) {
        try {
            const db = firebase.firestore();
            await db.collection('timeLogs').add(timeLog);
        } catch (error) {
            console.error('Error saving time log:', error);
        }
    }

    async getTimeLogsForTask(taskId) {
        try {
            const db = firebase.firestore();
            const snapshot = await db.collection('timeLogs')
                .where('taskId', '==', taskId)
                .get();
            
            return snapshot.docs.map(doc => doc.data());
        } catch (error) {
            console.error('Error fetching time logs:', error);
            return [];
        }
    }
}

// Initialize Pomodoro Manager
const pomodoroManager = new PomodoroManager(); 