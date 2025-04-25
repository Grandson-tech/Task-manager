// UI module for handling user interface operations
const UI = {
    // Initialize UI elements and event listeners
    init() {
        this.initializeTheme();
        this.initializeDateDisplay();
        this.initializeTaskForm();
        this.initializeThemeToggle();
        this.initializeDragAndDrop();
        this.initializeNotifications();
        this.initializeNavigation();
        this.initializeSubtaskForm();
    },

    // Initialize navigation between sections
    initializeNavigation() {
        const navButtons = document.querySelectorAll('.nav-btn');
        navButtons.forEach(button => {
            button.addEventListener('click', () => {
                // Update active button
                navButtons.forEach(btn => btn.classList.remove('active'));
                button.classList.add('active');

                // Show corresponding section
                const sectionId = button.dataset.section;
                document.querySelectorAll('.content-section').forEach(section => {
                    section.classList.remove('active');
                });
                document.getElementById(`${sectionId}-section`).classList.add('active');

                // Refresh charts if analytics section is shown
                if (sectionId === 'analytics') {
                    Analytics.updateCharts(TaskManager.tasks);
                }
            });
        });
    },

    // Initialize theme based on user preference
    initializeTheme() {
        const theme = Storage.getTheme();
        document.body.classList.toggle('dark-mode', theme === 'dark');
        this.updateThemeIcon(theme);
    },

    // Initialize current date display
    initializeDateDisplay() {
        const dateElement = document.getElementById('current-date');
        const options = { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' };
        dateElement.textContent = new Date().toLocaleDateString(undefined, options);
    },

    // Initialize subtask form
    initializeSubtaskForm() {
        const addSubtaskBtn = document.getElementById('add-subtask');
        const subtaskInput = document.getElementById('subtask-input');
        const subtasksList = document.getElementById('subtasks-list');

        if (!addSubtaskBtn || !subtaskInput || !subtasksList) {
            console.error('Subtask form elements not found');
            return;
        }

        addSubtaskBtn.addEventListener('click', () => {
            const title = subtaskInput.value.trim();
            if (title) {
                this.addSubtaskToForm(title);
                subtaskInput.value = '';
                subtaskInput.focus();
            }
        });

        subtaskInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
                e.preventDefault();
                const title = subtaskInput.value.trim();
                if (title) {
                    this.addSubtaskToForm(title);
                    subtaskInput.value = '';
                    subtaskInput.focus();
                }
            }
        });
    },

    // Add subtask to form
    addSubtaskToForm(title) {
        const subtasksList = document.getElementById('subtasks-list');
        if (!subtasksList) return;

        const subtaskItem = document.createElement('div');
        subtaskItem.className = 'subtask-item';
        subtaskItem.innerHTML = `
            <span class="subtask-title">${title}</span>
            <button class="btn-icon delete-subtask" type="button">
                <i class="fas fa-times"></i>
            </button>
        `;

        subtaskItem.querySelector('.delete-subtask').addEventListener('click', () => {
            subtaskItem.remove();
        });

        subtasksList.appendChild(subtaskItem);
    },

    // Get subtasks from form
    getSubtasksFromForm() {
        const subtasksList = document.getElementById('subtasks-list');
        if (!subtasksList) return [];

        return Array.from(subtasksList.children).map(item => ({
            id: Date.now() + Math.random(), // Generate unique ID
            title: item.querySelector('.subtask-title').textContent,
            completed: false
        }));
    },

    // Clear subtasks form
    clearSubtasksForm() {
        const subtasksList = document.getElementById('subtasks-list');
        if (subtasksList) {
            subtasksList.innerHTML = '';
        }
    },

    // Initialize task form
    initializeTaskForm() {
        const form = document.getElementById('task-form');
        if (!form) return;

        form.addEventListener('submit', (e) => {
            e.preventDefault();
            const task = {
                title: document.getElementById('task-title').value,
                description: document.getElementById('task-description').value,
                dueDate: document.getElementById('task-due-date').value,
                priority: document.getElementById('task-priority').value,
                reminder: document.getElementById('task-reminder').value,
                subtasks: this.getSubtasksFromForm()
            };
            TaskManager.addTask(task);
            form.reset();
            this.clearSubtasksForm();
        });
    },

    // Initialize theme toggle
    initializeThemeToggle() {
        const themeToggle = document.getElementById('theme-toggle');
        themeToggle.addEventListener('click', () => {
            const isDarkMode = document.body.classList.toggle('dark-mode');
            const theme = isDarkMode ? 'dark' : 'light';
            Storage.saveTheme(theme);
            this.updateThemeIcon(theme);
        });
    },

    // Initialize notifications
    initializeNotifications() {
        // Request notification permission
        if (Notification.permission !== 'granted' && Notification.permission !== 'denied') {
            Notification.requestPermission();
        }

        // Create notification container if it doesn't exist
        if (!document.getElementById('notification-container')) {
            const container = document.createElement('div');
            container.id = 'notification-container';
            document.body.appendChild(container);
        }
    },

    // Show notification for a task
    showNotification(task) {
        const container = document.getElementById('notification-container');
        const notification = document.createElement('div');
        notification.className = 'notification';
        notification.innerHTML = `
            <div class="notification-content">
                <h3>Task Reminder</h3>
                <p>${task.title}</p>
                <p class="notification-time">${new Date(task.reminder).toLocaleTimeString()}</p>
            </div>
            <button class="notification-close">&times;</button>
        `;

        // Add close button functionality
        notification.querySelector('.notification-close').addEventListener('click', () => {
            notification.remove();
        });

        // Auto-remove after 5 seconds
        setTimeout(() => {
            notification.remove();
        }, 5000);

        container.appendChild(notification);
    },

    // Initialize drag and drop functionality
    initializeDragAndDrop() {
        const taskLists = document.querySelectorAll('.task-list');
        
        taskLists.forEach(list => {
            list.addEventListener('dragover', (e) => {
                e.preventDefault();
                const draggingTask = document.querySelector('.dragging');
                if (!draggingTask) return;

                const closestTask = this.getClosestTask(list, e.clientY);
                if (closestTask) {
                    list.insertBefore(draggingTask, closestTask);
                } else {
                    list.appendChild(draggingTask);
                }
            });

            list.addEventListener('dragend', (e) => {
                const taskCard = e.target;
                if (!taskCard.classList.contains('task-card')) return;

                taskCard.classList.remove('dragging');
                const taskId = parseInt(taskCard.dataset.taskId);
                const newIndex = Array.from(list.children).indexOf(taskCard);
                const section = list.id.split('-')[0]; // Extract section name from list ID

                TaskManager.reorderTasks(taskId, newIndex, section);
            });
        });
    },

    // Get the closest task card to the current drag position
    getClosestTask(list, y) {
        const tasks = [...list.querySelectorAll('.task-card:not(.dragging)')];
        
        return tasks.reduce((closest, task) => {
            const box = task.getBoundingClientRect();
            const offset = y - box.top - box.height / 2;
            
            if (offset < 0 && offset > closest.offset) {
                return { offset, element: task };
            } else {
                return closest;
            }
        }, { offset: Number.NEGATIVE_INFINITY }).element;
    },

    // Update theme icon based on current theme
    updateThemeIcon(theme) {
        const icon = document.querySelector('#theme-toggle i');
        icon.className = theme === 'dark' ? 'fas fa-sun' : 'fas fa-moon';
    },

    // Update task list
    updateTaskList(containerId, tasks) {
        const container = document.getElementById(containerId);
        if (!container) return;

        container.innerHTML = '';
        
        if (tasks.length === 0) {
            container.innerHTML = '<p class="no-tasks">No tasks found</p>';
            return;
        }

        tasks.forEach(task => {
            const taskCard = this.createTaskCard(task);
            container.appendChild(taskCard);
        });
    },

    // Create task card
    createTaskCard(task) {
        const template = document.getElementById('task-template');
        if (!template) return document.createElement('div');

        const taskCard = template.content.cloneNode(true);
        const cardElement = taskCard.querySelector('.task-card');
        
        // Set task ID for reference
        cardElement.dataset.taskId = task.id;
        
        // Set task details
        const titleElement = taskCard.querySelector('.task-title');
        const descriptionElement = taskCard.querySelector('.task-description');
        const dueDateElement = taskCard.querySelector('.task-due-date');
        const priorityElement = taskCard.querySelector('.task-priority');
        
        if (titleElement) titleElement.textContent = task.title;
        if (descriptionElement) descriptionElement.textContent = task.description;
        if (dueDateElement) {
            const dueDate = new Date(task.dueDate);
            dueDateElement.textContent = dueDate.toLocaleDateString();
            
            // Add overdue indicator if applicable
            if (dueDate < new Date() && !task.completed) {
                dueDateElement.classList.add('overdue');
            }
        }
        
        if (priorityElement) {
            priorityElement.textContent = task.priority;
            priorityElement.classList.add(`priority-${task.priority}`);
        }

        // Add reminder if exists
        if (task.reminder) {
            const reminderElement = document.createElement('div');
            reminderElement.className = 'task-reminder';
            reminderElement.innerHTML = `
                <i class="fas fa-bell"></i>
                <span>${new Date(task.reminder).toLocaleTimeString()}</span>
            `;
            taskCard.querySelector('.task-footer').appendChild(reminderElement);
        }

        // Add subtasks if they exist
        if (task.subtasks && task.subtasks.length > 0) {
            const subtasksContainer = taskCard.querySelector('.subtasks-container');
            const subtasksList = subtasksContainer.querySelector('.subtasks-list');
            const progress = TaskManager.getSubtaskProgress(task);

            // Update progress display
            subtasksContainer.querySelector('.subtasks-progress').textContent = 
                `${progress.completed}/${progress.total} completed`;

            // Add progress bar
            const progressBar = document.createElement('div');
            progressBar.className = 'progress-bar';
            progressBar.innerHTML = `
                <div class="progress-bar-fill" style="width: ${progress.percentage}%"></div>
            `;
            subtasksContainer.appendChild(progressBar);

            // Add subtasks
            task.subtasks.forEach(subtask => {
                const subtaskElement = document.createElement('div');
                subtaskElement.className = 'subtask-item';
                subtaskElement.innerHTML = `
                    <label class="subtask-checkbox">
                        <input type="checkbox" class="subtask-complete" ${subtask.completed ? 'checked' : ''}>
                        <span class="checkmark"></span>
                    </label>
                    <span class="subtask-title ${subtask.completed ? 'completed' : ''}">${subtask.title}</span>
                    <button class="btn-icon delete-subtask">
                        <i class="fas fa-times"></i>
                    </button>
                `;

                // Add event listeners
                const checkbox = subtaskElement.querySelector('.subtask-complete');
                const deleteBtn = subtaskElement.querySelector('.delete-subtask');
                
                if (checkbox) {
                    checkbox.addEventListener('change', () => {
                        TaskManager.toggleSubtaskCompletion(task.id, subtask.id);
                    });
                }
                
                if (deleteBtn) {
                    deleteBtn.addEventListener('click', () => {
                        TaskManager.deleteSubtask(task.id, subtask.id);
                    });
                }

                subtasksList.appendChild(subtaskElement);
            });

            // Add toggle functionality
            const toggleBtn = subtasksContainer.querySelector('.toggle-subtasks');
            if (toggleBtn) {
                toggleBtn.addEventListener('click', () => {
                    subtasksList.classList.toggle('expanded');
                    toggleBtn.querySelector('i').classList.toggle('fa-chevron-down');
                    toggleBtn.querySelector('i').classList.toggle('fa-chevron-up');
                });
            }
        }

        // Add event listeners
        const editBtn = taskCard.querySelector('.edit-task');
        const deleteBtn = taskCard.querySelector('.delete-task');
        const completeBtn = taskCard.querySelector('.complete-task');
        
        if (editBtn) {
            editBtn.addEventListener('click', () => this.editTask(task));
        }
        
        if (deleteBtn) {
            deleteBtn.addEventListener('click', () => this.deleteTask(task.id));
        }
        
        if (completeBtn) {
            completeBtn.addEventListener('click', () => this.completeTask(task.id));
        }

        // Add Pomodoro button
        TaskManager.addPomodoroButton(taskCard, task);

        // Add drag and drop functionality
        cardElement.draggable = true;
        cardElement.addEventListener('dragstart', () => {
            cardElement.classList.add('dragging');
        });
        
        cardElement.addEventListener('dragend', () => {
            cardElement.classList.remove('dragging');
        });

        return taskCard;
    },

    // Show toast notification
    showToast(message, type = 'info') {
        const toast = document.createElement('div');
        toast.className = `toast ${type}`;
        toast.innerHTML = `
            <div class="toast-content">
                <p>${message}</p>
            </div>
            <button class="toast-close">&times;</button>
        `;

        const container = document.getElementById('notification-container');
        if (!container) return;

        container.appendChild(toast);

        // Add close button functionality
        const closeBtn = toast.querySelector('.toast-close');
        if (closeBtn) {
            closeBtn.addEventListener('click', () => {
                toast.remove();
            });
        }

        // Auto remove after 3 seconds
        setTimeout(() => {
            toast.remove();
        }, 3000);
    },

    // Edit task
    editTask(task) {
        // TODO: Implement task editing functionality
        console.log('Edit task:', task);
    },

    // Delete task
    async deleteTask(taskId) {
        if (confirm('Are you sure you want to delete this task?')) {
            const success = await TaskManager.deleteTask(taskId);
            if (success) {
                this.showToast('Task deleted successfully', 'success');
            } else {
                this.showToast('Failed to delete task', 'error');
            }
        }
    },

    // Complete task
    async completeTask(taskId) {
        const success = await TaskManager.completeTask(taskId);
        if (success) {
            this.showToast('Task completed successfully', 'success');
        } else {
            this.showToast('Failed to complete task', 'error');
        }
    },

    // Show edit task modal
    showEditTaskModal(task) {
        const title = prompt('Edit task title:', task.title);
        if (title === null) return;

        const description = prompt('Edit task description:', task.description);
        if (description === null) return;

        const dueDate = prompt('Edit due date (YYYY-MM-DD):', task.dueDate);
        if (dueDate === null) return;

        const priority = prompt('Edit priority (low/medium/high):', task.priority);
        if (priority === null) return;

        const reminder = prompt('Edit reminder time (HH:MM) or leave empty to remove:', 
            task.reminder ? new Date(task.reminder).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '');
        if (reminder === null) return;

        // Convert reminder time to ISO string if provided
        let reminderTime = null;
        if (reminder) {
            const [hours, minutes] = reminder.split(':');
            const reminderDate = new Date(task.dueDate);
            reminderDate.setHours(parseInt(hours), parseInt(minutes), 0, 0);
            reminderTime = reminderDate.toISOString();
        }

        TaskManager.updateTask(task.id, {
            title,
            description,
            dueDate,
            priority,
            reminder: reminderTime
        });
    }
}; 