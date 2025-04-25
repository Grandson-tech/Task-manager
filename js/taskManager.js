// Task Manager module for handling task operations
const TaskManager = {
    tasks: [],
    reminderCheckInterval: null,
    currentUserId: null,
    isOnline: navigator.onLine,

    // Initialize tasks from storage
    init() {
        this.initializeOnlineStatus();
        this.initializeTaskForm();
        this.tasks = Storage.getTasks();
        this.updateUI();
        this.startReminderChecks();
    },

    // Initialize online status monitoring
    initializeOnlineStatus() {
        window.addEventListener('online', () => {
            this.isOnline = true;
            this.syncTasks();
        });

        window.addEventListener('offline', () => {
            this.isOnline = false;
            UI.showToast('You are offline. Changes will be synced when you reconnect.', 'warning');
        });
    },

    // Load user tasks from Firebase
    async loadUserTasks(userId) {
        this.currentUserId = userId;
        
        try {
            if (this.isOnline) {
                // Load from Firebase
                const snapshot = await db.collection('users').doc(userId).collection('tasks').get();
                this.tasks = snapshot.docs.map(doc => ({
                    id: doc.id,
                    ...doc.data()
                }));
            } else {
                // Load from localStorage
                this.tasks = Storage.getTasks();
            }
            
            this.updateUI();
        } catch (error) {
            console.error('Error loading tasks:', error);
            UI.showToast('Failed to load tasks. Using local data.', 'warning');
            this.tasks = Storage.getTasks();
            this.updateUI();
        }
    },

    // Sync tasks with Firebase
    async syncTasks() {
        if (!this.currentUserId || !this.isOnline) return;

        try {
            const batch = db.batch();
            const tasksRef = db.collection('users').doc(this.currentUserId).collection('tasks');

            // Update all tasks
            for (const task of this.tasks) {
                const taskRef = tasksRef.doc(task.id.toString());
                batch.set(taskRef, task);
            }

            await batch.commit();
            UI.showToast('Tasks synced successfully!', 'success');
        } catch (error) {
            console.error('Sync error:', error);
            UI.showToast('Failed to sync tasks. Please try again.', 'error');
        }
    },

    // Start checking for reminders
    startReminderChecks() {
        // Clear any existing interval
        if (this.reminderCheckInterval) {
            clearInterval(this.reminderCheckInterval);
        }

        // Check for reminders every minute
        this.reminderCheckInterval = setInterval(() => {
            this.checkReminders();
        }, 60000);

        // Initial check
        this.checkReminders();
    },

    // Check for upcoming and overdue reminders
    checkReminders() {
        const now = new Date();
        this.tasks.forEach(task => {
            if (task.reminder && !task.completed) {
                const reminderTime = new Date(task.reminder);
                const timeDiff = reminderTime - now;

                // If reminder is due within the next minute
                if (timeDiff > 0 && timeDiff <= 60000) {
                    this.triggerReminder(task);
                }

                // Update task status if reminder is overdue
                if (timeDiff < 0 && !task.reminderTriggered) {
                    task.reminderTriggered = true;
                    this.saveTasks();
                    this.updateUI();
                }
            }
        });
    },

    // Trigger a reminder for a task
    triggerReminder(task) {
        // Show in-app notification
        UI.showNotification(task);

        // Try to show system notification if permission is granted
        if (Notification.permission === 'granted') {
            new Notification('Task Reminder', {
                body: `It's time for: ${task.title}`,
                icon: '/path/to/icon.png' // Add your app icon path
            });
        }

        // Mark reminder as triggered
        task.reminderTriggered = true;
        this.saveTasks();
    },

    // Add a new task
    async addTask(task) {
        try {
            const newTask = {
                id: Date.now().toString(),
                ...task,
                completed: false,
                createdAt: new Date().toISOString(),
                order: this.tasks.length,
                reminderTriggered: false,
                subtasks: task.subtasks || []
            };

            this.tasks.push(newTask);
            
            if (this.isOnline && this.currentUserId) {
                try {
                    await db.collection('users').doc(this.currentUserId).collection('tasks')
                        .doc(newTask.id).set(newTask);
                } catch (error) {
                    console.error('Error adding task to Firebase:', error);
                    UI.showToast('Task added locally. Will sync when online.', 'warning');
                }
            }

            this.saveTasks();
            this.updateUI();
            return newTask;
        } catch (error) {
            console.error('Error adding task:', error);
            UI.showToast('Failed to add task. Please try again.', 'error');
            return null;
        }
    },

    // Initialize task form
    initializeTaskForm() {
        const taskForm = document.getElementById('task-form');
        if (taskForm) {
            taskForm.addEventListener('submit', async (e) => {
                e.preventDefault();
                
                const title = document.getElementById('task-title').value.trim();
                const description = document.getElementById('task-description').value.trim();
                const dueDate = document.getElementById('task-due-date').value;
                const priority = document.getElementById('task-priority').value;
                const reminder = document.getElementById('task-reminder').value;
                
                if (!title) {
                    UI.showToast('Please enter a task title', 'error');
                    return;
                }

                const task = {
                    title,
                    description,
                    dueDate,
                    priority,
                    reminder,
                    subtasks: []
                };

                const newTask = await this.addTask(task);
                if (newTask) {
                    taskForm.reset();
                    UI.showToast('Task added successfully!', 'success');
                }
            });
        }
    },

    // Update an existing task
    async updateTask(id, updates) {
        const taskIndex = this.tasks.findIndex(task => task.id === id);
        if (taskIndex !== -1) {
            // Reset reminder trigger if reminder time is changed
            if (updates.reminder && updates.reminder !== this.tasks[taskIndex].reminder) {
                updates.reminderTriggered = false;
            }
            
            // Preserve existing subtasks if not provided in updates
            if (!updates.subtasks) {
                updates.subtasks = this.tasks[taskIndex].subtasks;
            }
            
            this.tasks[taskIndex] = { ...this.tasks[taskIndex], ...updates };
            
            if (this.isOnline && this.currentUserId) {
                try {
                    await db.collection('users').doc(this.currentUserId).collection('tasks')
                        .doc(id.toString()).update(updates);
                } catch (error) {
                    console.error('Error updating task in Firebase:', error);
                    UI.showToast('Task updated locally. Will sync when online.', 'warning');
                }
            }

            this.saveTasks();
            this.updateUI();
            return true;
        }
        return false;
    },

    // Delete a task
    async deleteTask(id) {
        const taskIndex = this.tasks.findIndex(task => task.id === id);
        if (taskIndex !== -1) {
            this.tasks.splice(taskIndex, 1);
            
            if (this.isOnline && this.currentUserId) {
                try {
                    await db.collection('users').doc(this.currentUserId).collection('tasks')
                        .doc(id.toString()).delete();
                } catch (error) {
                    console.error('Error deleting task from Firebase:', error);
                    UI.showToast('Task deleted locally. Will sync when online.', 'warning');
                }
            }

            this.saveTasks();
            this.updateUI();
            return true;
        }
        return false;
    },

    // Toggle task completion status
    async toggleTaskCompletion(id) {
        const task = this.tasks.find(task => task.id === id);
        if (task) {
            task.completed = !task.completed;
            
            if (this.isOnline && this.currentUserId) {
                try {
                    await db.collection('users').doc(this.currentUserId).collection('tasks')
                        .doc(id.toString()).update({ completed: task.completed });
                } catch (error) {
                    console.error('Error updating task completion in Firebase:', error);
                    UI.showToast('Task updated locally. Will sync when online.', 'warning');
                }
            }

            this.saveTasks();
            this.updateUI();
            return true;
        }
        return false;
    },

    // Get tasks for today
    getTodayTasks() {
        const today = new Date().toDateString();
        return this.tasks
            .filter(task => {
                const taskDate = new Date(task.dueDate).toDateString();
                return taskDate === today && !task.completed;
            })
            .sort((a, b) => a.order - b.order);
    },

    // Get upcoming tasks
    getUpcomingTasks() {
        const today = new Date().toDateString();
        return this.tasks
            .filter(task => {
                const taskDate = new Date(task.dueDate).toDateString();
                return taskDate > today && !task.completed;
            })
            .sort((a, b) => a.order - b.order);
    },

    // Get completed tasks
    getCompletedTasks() {
        return this.tasks
            .filter(task => task.completed)
            .sort((a, b) => a.order - b.order);
    },

    // Save tasks to storage
    saveTasks() {
        Storage.saveTasks(this.tasks);
    },

    // Update task order
    updateTaskOrder(taskId, newOrder) {
        const task = this.tasks.find(t => t.id === taskId);
        if (task) {
            task.order = newOrder;
            this.saveTasks();
            this.updateUI();
            return true;
        }
        return false;
    },

    // Reorder tasks within a section
    reorderTasks(taskId, newIndex, section) {
        const tasks = this.getTasksBySection(section);
        const taskIndex = tasks.findIndex(t => t.id === taskId);
        
        if (taskIndex !== -1) {
            // Remove task from current position
            const [task] = tasks.splice(taskIndex, 1);
            
            // Insert task at new position
            tasks.splice(newIndex, 0, task);
            
            // Update order for all tasks in the section
            tasks.forEach((t, index) => {
                t.order = index;
            });
            
            this.saveTasks();
            this.updateUI();
            return true;
        }
        return false;
    },

    // Get tasks by section
    getTasksBySection(section) {
        switch (section) {
            case 'today':
                return this.getTodayTasks();
            case 'upcoming':
                return this.getUpcomingTasks();
            case 'completed':
                return this.getCompletedTasks();
            default:
                return [];
        }
    },

    // Update UI with current task state
    updateUI() {
        try {
            // Update task counts
            const todayCount = document.getElementById('today-count');
            const upcomingCount = document.getElementById('upcoming-count');
            const completedCount = document.getElementById('completed-count');

            if (todayCount) todayCount.textContent = this.getTodayTasks().length;
            if (upcomingCount) upcomingCount.textContent = this.getUpcomingTasks().length;
            if (completedCount) completedCount.textContent = this.getCompletedTasks().length;

            // Update task lists
            const todayTasks = document.getElementById('today-tasks');
            const upcomingTasks = document.getElementById('upcoming-tasks');
            const completedTasks = document.getElementById('completed-tasks');

            if (todayTasks) UI.updateTaskList('today-tasks', this.getTodayTasks());
            if (upcomingTasks) UI.updateTaskList('upcoming-tasks', this.getUpcomingTasks());
            if (completedTasks) UI.updateTaskList('completed-tasks', this.getCompletedTasks());

            // Update analytics
            if (typeof Analytics !== 'undefined') {
                Analytics.updateCharts(this.tasks);
            }
        } catch (error) {
            console.error('Error updating UI:', error);
        }
    },

    // Add a subtask to a task
    async addSubtask(taskId, subtaskTitle) {
        const task = this.tasks.find(t => t.id === taskId);
        if (task) {
            const newSubtask = {
                id: Date.now() + Math.random(),
                title: subtaskTitle,
                completed: false
            };
            task.subtasks.push(newSubtask);
            
            if (this.isOnline && this.currentUserId) {
                try {
                    await db.collection('users').doc(this.currentUserId).collection('tasks')
                        .doc(taskId.toString()).update({
                            subtasks: firebase.firestore.FieldValue.arrayUnion(newSubtask)
                        });
                } catch (error) {
                    console.error('Error adding subtask to Firebase:', error);
                    UI.showToast('Subtask added locally. Will sync when online.', 'warning');
                }
            }

            this.saveTasks();
            this.updateUI();
            return newSubtask;
        }
        return null;
    },

    // Update a subtask
    async updateSubtask(taskId, subtaskId, updates) {
        const task = this.tasks.find(t => t.id === taskId);
        if (task) {
            const subtaskIndex = task.subtasks.findIndex(st => st.id === subtaskId);
            if (subtaskIndex !== -1) {
                task.subtasks[subtaskIndex] = { ...task.subtasks[subtaskIndex], ...updates };
                
                if (this.isOnline && this.currentUserId) {
                    try {
                        await db.collection('users').doc(this.currentUserId).collection('tasks')
                            .doc(taskId.toString()).update({
                                subtasks: task.subtasks
                            });
                    } catch (error) {
                        console.error('Error updating subtask in Firebase:', error);
                        UI.showToast('Subtask updated locally. Will sync when online.', 'warning');
                    }
                }

                this.saveTasks();
                this.updateUI();
                return true;
            }
        }
        return false;
    },

    // Delete a subtask
    async deleteSubtask(taskId, subtaskId) {
        const task = this.tasks.find(t => t.id === taskId);
        if (task) {
            const subtaskIndex = task.subtasks.findIndex(st => st.id === subtaskId);
            if (subtaskIndex !== -1) {
                task.subtasks.splice(subtaskIndex, 1);
                
                if (this.isOnline && this.currentUserId) {
                    try {
                        await db.collection('users').doc(this.currentUserId).collection('tasks')
                            .doc(taskId.toString()).update({
                                subtasks: task.subtasks
                            });
                    } catch (error) {
                        console.error('Error deleting subtask from Firebase:', error);
                        UI.showToast('Subtask deleted locally. Will sync when online.', 'warning');
                    }
                }

                this.saveTasks();
                this.updateUI();
                return true;
            }
        }
        return false;
    },

    // Toggle subtask completion
    async toggleSubtaskCompletion(taskId, subtaskId) {
        const task = this.tasks.find(t => t.id === taskId);
        if (task) {
            const subtask = task.subtasks.find(st => st.id === subtaskId);
            if (subtask) {
                subtask.completed = !subtask.completed;
                
                if (this.isOnline && this.currentUserId) {
                    try {
                        await db.collection('users').doc(this.currentUserId).collection('tasks')
                            .doc(taskId.toString()).update({
                                subtasks: task.subtasks
                            });
                    } catch (error) {
                        console.error('Error updating subtask completion in Firebase:', error);
                        UI.showToast('Subtask updated locally. Will sync when online.', 'warning');
                    }
                }

                this.saveTasks();
                this.updateUI();
                return true;
            }
        }
        return false;
    },

    // Get subtask progress
    getSubtaskProgress(task) {
        if (!task.subtasks || task.subtasks.length === 0) return null;
        const completed = task.subtasks.filter(st => st.completed).length;
        return {
            completed,
            total: task.subtasks.length,
            percentage: (completed / task.subtasks.length) * 100
        };
    },

    // Add Pomodoro integration to task card
    addPomodoroButton(taskCard, task) {
        const actions = taskCard.querySelector('.task-actions');
        const pomodoroBtn = document.createElement('button');
        pomodoroBtn.className = 'btn-icon start-pomodoro';
        pomodoroBtn.title = 'Start Pomodoro';
        pomodoroBtn.innerHTML = '<i class="fas fa-clock"></i>';
        pomodoroBtn.addEventListener('click', () => {
            pomodoroManager.setCurrentTask(task);
            document.getElementById('pomodoro-widget').classList.remove('minimized');
        });
        actions.appendChild(pomodoroBtn);
    },

    // Update task card creation
    createTaskCard(task) {
        const template = document.getElementById('task-template');
        const taskCard = template.content.cloneNode(true);
        
        // ... existing task card setup code ...

        // Add Pomodoro button
        this.addPomodoroButton(taskCard, task);

        return taskCard;
    },

    // Update task completion to log time
    async completeTask(taskId) {
        const task = this.tasks.find(t => t.id === taskId);
        if (task) {
            task.status = 'completed';
            task.completedAt = new Date().toISOString();
            
            // Log time if task was being tracked
            if (pomodoroManager.currentTask && pomodoroManager.currentTask.id === taskId) {
                pomodoroManager.logTimeSpent();
                pomodoroManager.setCurrentTask(null);
            }
            
            await this.saveTasks();
            this.renderTasks();
        }
    }
}; 