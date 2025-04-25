// Time Tracking Analytics
class TimeAnalytics {
    constructor() {
        this.charts = {};
        this.initializeCharts();
    }

    async initializeCharts() {
        // Daily Completions Chart
        this.charts.dailyCompletions = new Chart(
            document.getElementById('daily-completions-chart'),
            {
                type: 'line',
                data: {
                    labels: [],
                    datasets: [{
                        label: 'Pomodoros Completed',
                        data: [],
                        borderColor: '#4a90e2',
                        tension: 0.4
                    }]
                },
                options: {
                    responsive: true,
                    maintainAspectRatio: false,
                    scales: {
                        y: {
                            beginAtZero: true,
                            ticks: {
                                stepSize: 1
                            }
                        }
                    }
                }
            }
        );

        // Task Distribution Chart
        this.charts.taskDistribution = new Chart(
            document.getElementById('task-distribution-chart'),
            {
                type: 'doughnut',
                data: {
                    labels: [],
                    datasets: [{
                        data: [],
                        backgroundColor: [
                            '#4a90e2',
                            '#50c878',
                            '#f5a623',
                            '#d0021b',
                            '#9013fe'
                        ]
                    }]
                },
                options: {
                    responsive: true,
                    maintainAspectRatio: false
                }
            }
        );

        // Time Spent Chart
        this.charts.timeSpent = new Chart(
            document.getElementById('time-spent-chart'),
            {
                type: 'bar',
                data: {
                    labels: [],
                    datasets: [{
                        label: 'Time Spent (minutes)',
                        data: [],
                        backgroundColor: '#4a90e2'
                    }]
                },
                options: {
                    responsive: true,
                    maintainAspectRatio: false,
                    scales: {
                        y: {
                            beginAtZero: true
                        }
                    }
                }
            }
        );

        await this.updateCharts();
    }

    async updateCharts() {
        const timeLogs = await this.fetchTimeLogs();
        this.updateDailyCompletionsChart(timeLogs);
        this.updateTaskDistributionChart(timeLogs);
        this.updateTimeSpentChart(timeLogs);
        this.updateStats(timeLogs);
    }

    async fetchTimeLogs() {
        try {
            const db = firebase.firestore();
            const snapshot = await db.collection('timeLogs').get();
            return snapshot.docs.map(doc => doc.data());
        } catch (error) {
            console.error('Error fetching time logs:', error);
            return [];
        }
    }

    updateDailyCompletionsChart(timeLogs) {
        const last7Days = this.getLast7Days();
        const dailyCompletions = this.groupByDay(timeLogs);

        this.charts.dailyCompletions.data.labels = last7Days.map(date => 
            date.toLocaleDateString('en-US', { weekday: 'short' })
        );
        this.charts.dailyCompletions.data.datasets[0].data = last7Days.map(date => 
            dailyCompletions[date.toISOString().split('T')[0]] || 0
        );
        this.charts.dailyCompletions.update();
    }

    updateTaskDistributionChart(timeLogs) {
        const taskDistribution = this.groupByTask(timeLogs);
        const topTasks = Object.entries(taskDistribution)
            .sort(([,a], [,b]) => b - a)
            .slice(0, 5);

        this.charts.taskDistribution.data.labels = topTasks.map(([taskId]) => 
            this.getTaskName(taskId)
        );
        this.charts.taskDistribution.data.datasets[0].data = topTasks.map(([,count]) => count);
        this.charts.taskDistribution.update();
    }

    updateTimeSpentChart(timeLogs) {
        const taskTimeSpent = this.calculateTimeSpent(timeLogs);
        const topTasks = Object.entries(taskTimeSpent)
            .sort(([,a], [,b]) => b - a)
            .slice(0, 5);

        this.charts.timeSpent.data.labels = topTasks.map(([taskId]) => 
            this.getTaskName(taskId)
        );
        this.charts.timeSpent.data.datasets[0].data = topTasks.map(([,minutes]) => 
            Math.round(minutes)
        );
        this.charts.timeSpent.update();
    }

    updateStats(timeLogs) {
        const stats = this.calculateStats(timeLogs);
        
        document.getElementById('total-pomodoros').textContent = stats.totalPomodoros;
        document.getElementById('total-time').textContent = `${Math.round(stats.totalTime)} minutes`;
        document.getElementById('avg-session').textContent = `${Math.round(stats.avgSessionTime)} minutes`;
        document.getElementById('most-focused-day').textContent = stats.mostFocusedDay;
    }

    getLast7Days() {
        const days = [];
        for (let i = 6; i >= 0; i--) {
            const date = new Date();
            date.setDate(date.getDate() - i);
            days.push(date);
        }
        return days;
    }

    groupByDay(timeLogs) {
        return timeLogs.reduce((acc, log) => {
            const date = log.startTime.split('T')[0];
            acc[date] = (acc[date] || 0) + 1;
            return acc;
        }, {});
    }

    groupByTask(timeLogs) {
        return timeLogs.reduce((acc, log) => {
            acc[log.taskId] = (acc[log.taskId] || 0) + 1;
            return acc;
        }, {});
    }

    calculateTimeSpent(timeLogs) {
        return timeLogs.reduce((acc, log) => {
            acc[log.taskId] = (acc[log.taskId] || 0) + (log.duration / 60);
            return acc;
        }, {});
    }

    calculateStats(timeLogs) {
        const totalPomodoros = timeLogs.length;
        const totalTime = timeLogs.reduce((sum, log) => sum + log.duration, 0) / 60;
        const avgSessionTime = totalTime / totalPomodoros;
        
        const dailyCompletions = this.groupByDay(timeLogs);
        const mostFocusedDay = Object.entries(dailyCompletions)
            .sort(([,a], [,b]) => b - a)[0][0];

        return {
            totalPomodoros,
            totalTime,
            avgSessionTime,
            mostFocusedDay: new Date(mostFocusedDay).toLocaleDateString('en-US', { 
                weekday: 'long', 
                month: 'long', 
                day: 'numeric' 
            })
        };
    }

    async getTaskName(taskId) {
        try {
            const db = firebase.firestore();
            const doc = await db.collection('tasks').doc(taskId).get();
            return doc.exists ? doc.data().title : 'Unknown Task';
        } catch (error) {
            console.error('Error fetching task name:', error);
            return 'Unknown Task';
        }
    }
}

// Initialize Time Analytics
const timeAnalytics = new TimeAnalytics(); 