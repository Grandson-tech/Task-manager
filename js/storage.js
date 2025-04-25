// Storage module for handling localStorage operations
const Storage = {
    // Keys
    TASKS_KEY: 'tasks',
    THEME_KEY: 'theme',

    // Save tasks to localStorage
    saveTasks(tasks) {
        localStorage.setItem(this.TASKS_KEY, JSON.stringify(tasks));
    },

    // Get tasks from localStorage
    getTasks() {
        const tasks = localStorage.getItem(this.TASKS_KEY);
        return tasks ? JSON.parse(tasks) : [];
    },

    // Save theme preference
    saveTheme(theme) {
        localStorage.setItem(this.THEME_KEY, theme);
    },

    // Get theme preference
    getTheme() {
        return localStorage.getItem(this.THEME_KEY) || 'light';
    },

    // Save analytics data
    saveAnalytics(data) {
        localStorage.setItem('analytics', JSON.stringify(data));
    },

    // Get analytics data
    getAnalytics() {
        const data = localStorage.getItem('analytics');
        return data ? JSON.parse(data) : {};
    }
}; 