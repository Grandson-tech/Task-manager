// Team Management
class TeamManager {
    constructor() {
        this.teams = JSON.parse(localStorage.getItem('teams')) || [];
        this.currentTeam = null;
        this.initializeEventListeners();
        this.renderTeams();
    }

    initializeEventListeners() {
        // Create Team Modal
        document.getElementById('createTeamBtn').addEventListener('click', () => {
            document.getElementById('createTeamModal').style.display = 'block';
        });

        document.getElementById('createTeamForm').addEventListener('submit', (e) => {
            e.preventDefault();
            this.createTeam();
        });

        // Close modals
        document.querySelectorAll('.close').forEach(btn => {
            btn.addEventListener('click', () => {
                document.getElementById('createTeamModal').style.display = 'none';
                document.getElementById('teamDetailsModal').style.display = 'none';
            });
        });

        // Add member input
        document.getElementById('addMemberBtn').addEventListener('click', () => {
            const memberInput = document.getElementById('memberInput');
            const email = memberInput.value.trim();
            if (email) {
                this.addMemberToForm(email);
                memberInput.value = '';
            }
        });
    }

    createTeam() {
        const name = document.getElementById('teamName').value.trim();
        const description = document.getElementById('teamDescription').value.trim();
        const members = Array.from(document.querySelectorAll('.team-member')).map(member => ({
            email: member.querySelector('.member-email').textContent,
            role: member.querySelector('.role-select').value
        }));

        if (!name) {
            alert('Please enter a team name');
            return;
        }

        const team = {
            id: Date.now().toString(),
            name,
            description,
            members,
            tasks: [],
            createdAt: new Date().toISOString()
        };

        this.teams.push(team);
        this.saveTeams();
        this.renderTeams();
        document.getElementById('createTeamModal').style.display = 'none';
        document.getElementById('createTeamForm').reset();
        document.getElementById('membersList').innerHTML = '';
    }

    addMemberToForm(email) {
        const membersList = document.getElementById('membersList');
        const memberTemplate = document.getElementById('teamMemberTemplate');
        const memberElement = memberTemplate.content.cloneNode(true);
        
        memberElement.querySelector('.member-email').textContent = email;
        memberElement.querySelector('.remove-member').addEventListener('click', (e) => {
            e.target.closest('.team-member').remove();
        });

        membersList.appendChild(memberElement);
    }

    renderTeams() {
        const teamsGrid = document.querySelector('.teams-grid');
        teamsGrid.innerHTML = '';

        this.teams.forEach(team => {
            const teamCard = document.createElement('div');
            teamCard.className = 'team-card';
            teamCard.innerHTML = `
                <div class="team-header">
                    <h3 class="team-name">${team.name}</h3>
                    <div class="team-actions">
                        <button class="btn btn-icon" onclick="teamManager.viewTeam('${team.id}')">
                            <i class="fas fa-eye"></i>
                        </button>
                        <button class="btn btn-icon" onclick="teamManager.editTeam('${team.id}')">
                            <i class="fas fa-edit"></i>
                        </button>
                        <button class="btn btn-icon" onclick="teamManager.deleteTeam('${team.id}')">
                            <i class="fas fa-trash"></i>
                        </button>
                    </div>
                </div>
                <p class="team-description">${team.description}</p>
                <div class="team-footer">
                    <div class="team-members-preview">
                        <i class="fas fa-users"></i>
                        <span>${team.members.length} members</span>
                    </div>
                    <div class="team-tasks-preview">
                        <i class="fas fa-tasks"></i>
                        <span>${team.tasks.length} tasks</span>
                    </div>
                </div>
            `;
            teamsGrid.appendChild(teamCard);
        });
    }

    viewTeam(teamId) {
        const team = this.teams.find(t => t.id === teamId);
        if (!team) return;

        this.currentTeam = team;
        const modal = document.getElementById('teamDetailsModal');
        const content = document.getElementById('teamDetailsContent');

        content.innerHTML = `
            <div class="team-info">
                <h3>${team.name}</h3>
                <p>${team.description}</p>
                <div class="team-members">
                    <h4>Members</h4>
                    <div id="team-members-list">
                        ${team.members.map(member => `
                            <div class="team-member">
                                <div class="member-info">
                                    <span class="member-name">${member.email}</span>
                                    <span class="member-email">${member.role}</span>
                                </div>
                            </div>
                        `).join('')}
                    </div>
                </div>
            </div>
            <div class="team-tasks">
                <h4>Tasks</h4>
                <div id="team-tasks-list">
                    ${team.tasks.map(task => `
                        <div class="task-item">
                            <span>${task.title}</span>
                            <span class="task-status">${task.status}</span>
                        </div>
                    `).join('')}
                </div>
            </div>
        `;

        modal.style.display = 'block';
    }

    editTeam(teamId) {
        const team = this.teams.find(t => t.id === teamId);
        if (!team) return;

        // TODO: Implement team editing functionality
        alert('Team editing functionality coming soon!');
    }

    deleteTeam(teamId) {
        if (confirm('Are you sure you want to delete this team?')) {
            this.teams = this.teams.filter(t => t.id !== teamId);
            this.saveTeams();
            this.renderTeams();
        }
    }

    saveTeams() {
        localStorage.setItem('teams', JSON.stringify(this.teams));
    }
}

// Initialize Team Manager
const teamManager = new TeamManager(); 