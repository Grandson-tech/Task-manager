// Analytics module for handling task statistics and charts
const Analytics = {
    charts: {
        completions: null,
        status: null,
        priority: null
    },

    // Initialize analytics
    init() {
        this.initializeCharts();
    },

    // Initialize all charts
    initializeCharts() {
        this.initializeCompletionsChart();
        this.initializeStatusChart();
        this.initializePriorityChart();
    },

    // Initialize daily completions chart
    initializeCompletionsChart() {
        const ctx = document.getElementById('completions-chart').getContext('2d');
        this.charts.completions = new Chart(ctx, {
            type: 'line',
            data: {
                labels: [],
                datasets: [{
                    label: 'Completed Tasks',
                    data: [],
                    borderColor: 'rgba(76, 175, 80, 1)',
                    backgroundColor: 'rgba(76, 175, 80, 0.1)',
                    tension: 0.4,
                    fill: true
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: {
                        display: false
                    }
                },
                scales: {
                    y: {
                        beginAtZero: true,
                        ticks: {
                            stepSize: 1
                        }
                    }
                }
            }
        });
    },

    // Initialize task status chart
    initializeStatusChart() {
        const ctx = document.getElementById('status-chart').getContext('2d');
        this.charts.status = new Chart(ctx, {
            type: 'doughnut',
            data: {
                labels: ['Completed', 'Pending'],
                datasets: [{
                    data: [0, 0],
                    backgroundColor: [
                        'rgba(76, 175, 80, 0.8)',
                        'rgba(255, 152, 0, 0.8)'
                    ]
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: {
                        position: 'bottom'
                    }
                }
            }
        });
    },

    // Initialize priority distribution chart
    initializePriorityChart() {
        const ctx = document.getElementById('priority-chart').getContext('2d');
        this.charts.priority = new Chart(ctx, {
            type: 'bar',
            data: {
                labels: ['High', 'Medium', 'Low'],
                datasets: [{
                    label: 'Tasks by Priority',
                    data: [0, 0, 0],
                    backgroundColor: [
                        'rgba(244, 67, 54, 0.8)',
                        'rgba(255, 152, 0, 0.8)',
                        'rgba(76, 175, 80, 0.8)'
                    ]
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: {
                        display: false
                    }
                },
                scales: {
                    y: {
                        beginAtZero: true,
                        ticks: {
                            stepSize: 1
                        }
                    }
                }
            }
        });
    },

    // Update all charts with current task data
    updateCharts(tasks) {
        this.updateCompletionsChart(tasks);
        this.updateStatusChart(tasks);
        this.updatePriorityChart(tasks);
        this.updateStats(tasks);
    },

    // Update daily completions chart
    updateCompletionsChart(tasks) {
        const last7Days = this.getLast7Days();
        const completedTasksByDay = this.getCompletedTasksByDay(tasks, last7Days);

        this.charts.completions.data.labels = last7Days.map(date => 
            new Date(date).toLocaleDateString(undefined, { weekday: 'short' })
        );
        this.charts.completions.data.datasets[0].data = last7Days.map(date => 
            completedTasksByDay[date] || 0
        );

        this.charts.completions.update();
    },

    // Update task status chart
    updateStatusChart(tasks) {
        const completed = tasks.filter(task => task.completed).length;
        const pending = tasks.length - completed;

        this.charts.status.data.datasets[0].data = [completed, pending];
        this.charts.status.update();
    },

    // Update priority distribution chart
    updatePriorityChart(tasks) {
        const priorities = {
            high: tasks.filter(task => task.priority === 'high').length,
            medium: tasks.filter(task => task.priority === 'medium').length,
            low: tasks.filter(task => task.priority === 'low').length
        };

        this.charts.priority.data.datasets[0].data = [
            priorities.high,
            priorities.medium,
            priorities.low
        ];

        this.charts.priority.update();
    },

    // Update statistics
    updateStats(tasks) {
        const totalTasks = tasks.length;
        const completedTasks = tasks.filter(task => task.completed).length;
        const completionRate = totalTasks > 0 ? (completedTasks / totalTasks * 100).toFixed(1) : 0;
        const avgDailyTasks = this.calculateAverageDailyTasks(tasks);

        document.getElementById('total-tasks').textContent = totalTasks;
        document.getElementById('total-completed').textContent = completedTasks;
        document.getElementById('completion-rate').textContent = `${completionRate}%`;
        document.getElementById('avg-daily-tasks').textContent = avgDailyTasks.toFixed(1);
    },

    // Get last 7 days dates
    getLast7Days() {
        const dates = [];
        for (let i = 6; i >= 0; i--) {
            const date = new Date();
            date.setDate(date.getDate() - i);
            dates.push(date.toISOString().split('T')[0]);
        }
        return dates;
    },

    // Get completed tasks by day
    getCompletedTasksByDay(tasks, dates) {
        const completedTasks = tasks.filter(task => task.completed);
        const tasksByDay = {};

        dates.forEach(date => {
            tasksByDay[date] = completedTasks.filter(task => {
                const taskDate = new Date(task.dueDate).toISOString().split('T')[0];
                return taskDate === date;
            }).length;
        });

        return tasksByDay;
    },

    // Calculate average daily tasks
    calculateAverageDailyTasks(tasks) {
        if (tasks.length === 0) return 0;

        const taskDates = new Set(tasks.map(task => 
            new Date(task.dueDate).toISOString().split('T')[0]
        ));

        return tasks.length / taskDates.size;
    }
}; 