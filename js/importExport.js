// Import/Export module for handling task data import and export
const ImportExport = {
    // Initialize import/export functionality
    init() {
        this.initializeExportButton();
        this.initializeImportInput();
        this.createToastContainer();
    },

    // Create toast container if it doesn't exist
    createToastContainer() {
        if (!document.getElementById('toast-container')) {
            const container = document.createElement('div');
            container.id = 'toast-container';
            document.body.appendChild(container);
        }
    },

    // Show toast notification
    showToast(message, type = 'success') {
        const container = document.getElementById('toast-container');
        const toast = document.createElement('div');
        toast.className = `toast ${type}`;
        toast.innerHTML = `
            <div class="toast-content">${message}</div>
            <button class="toast-close">&times;</button>
        `;

        // Add close button functionality
        toast.querySelector('.toast-close').addEventListener('click', () => {
            toast.remove();
        });

        // Auto-remove after 5 seconds
        setTimeout(() => {
            toast.remove();
        }, 5000);

        container.appendChild(toast);
    },

    // Initialize export button
    initializeExportButton() {
        const exportButton = document.getElementById('export-tasks');
        if (!exportButton) return;

        exportButton.addEventListener('click', () => {
            this.exportTasks();
        });
    },

    // Initialize import input
    initializeImportInput() {
        const importInput = document.getElementById('import-tasks');
        if (!importInput) return;

        importInput.addEventListener('change', (e) => {
            const file = e.target.files[0];
            if (file) {
                this.importTasks(file);
            }
        });
    },

    // Export tasks to JSON file
    exportTasks() {
        try {
            const tasks = TaskManager.tasks;
            const data = JSON.stringify(tasks, null, 2);
            const blob = new Blob([data], { type: 'application/json' });
            const url = URL.createObjectURL(blob);
            
            // Create download link
            const a = document.createElement('a');
            a.href = url;
            a.download = `tasks_${new Date().toISOString().split('T')[0]}.json`;
            document.body.appendChild(a);
            a.click();
            
            // Clean up
            document.body.removeChild(a);
            URL.revokeObjectURL(url);
            
            this.showToast('Tasks exported successfully!');
        } catch (error) {
            console.error('Export error:', error);
            this.showToast('Failed to export tasks. Please try again.', 'error');
        }
    },

    // Import tasks from JSON file
    importTasks(file) {
        const reader = new FileReader();
        
        reader.onload = (e) => {
            try {
                const importedTasks = JSON.parse(e.target.result);
                
                // Validate imported data
                if (!this.validateImportedData(importedTasks)) {
                    this.showToast('Invalid task data format.', 'error');
                    return;
                }

                // Prompt user for import mode
                const mode = confirm(
                    'Choose import mode:\n\n' +
                    'OK - Replace all existing tasks\n' +
                    'Cancel - Merge with existing tasks'
                );

                if (mode) {
                    // Replace mode
                    TaskManager.tasks = importedTasks;
                } else {
                    // Merge mode
                    const existingIds = new Set(TaskManager.tasks.map(task => task.id));
                    const newTasks = importedTasks.filter(task => !existingIds.has(task.id));
                    TaskManager.tasks = [...TaskManager.tasks, ...newTasks];
                }

                // Save and update UI
                TaskManager.saveTasks();
                TaskManager.updateUI();
                
                this.showToast(
                    `Successfully imported ${importedTasks.length} tasks!`,
                    'success'
                );
            } catch (error) {
                console.error('Import error:', error);
                this.showToast('Failed to import tasks. Invalid file format.', 'error');
            }
        };

        reader.onerror = () => {
            this.showToast('Failed to read file. Please try again.', 'error');
        };

        reader.readAsText(file);
    },

    // Validate imported data structure
    validateImportedData(data) {
        if (!Array.isArray(data)) return false;

        return data.every(task => {
            // Check required fields
            const hasRequiredFields = 
                typeof task.id === 'number' &&
                typeof task.title === 'string' &&
                typeof task.dueDate === 'string' &&
                typeof task.priority === 'string' &&
                typeof task.completed === 'boolean' &&
                typeof task.createdAt === 'string';

            // Check subtasks if they exist
            const hasValidSubtasks = !task.subtasks || (
                Array.isArray(task.subtasks) &&
                task.subtasks.every(subtask => 
                    typeof subtask.id === 'number' &&
                    typeof subtask.title === 'string' &&
                    typeof subtask.completed === 'boolean'
                )
            );

            return hasRequiredFields && hasValidSubtasks;
        });
    }
}; 