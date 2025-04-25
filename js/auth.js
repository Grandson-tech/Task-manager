// Authentication module for handling user authentication
const Auth = {
    currentUser: null,

    // Initialize authentication
    init() {
        this.initializeAuthForms();
        this.initializeAuthStateListener();
        this.initializeLogoutButton();
    },

    // Initialize authentication forms
    initializeAuthForms() {
        // Login form
        const loginForm = document.getElementById('login-form');
        if (loginForm) {
            loginForm.addEventListener('submit', (e) => {
                e.preventDefault();
                const email = document.getElementById('login-email').value;
                const password = document.getElementById('login-password').value;
                this.login(email, password);
            });
        }

        // Register form
        const registerForm = document.getElementById('register-form');
        if (registerForm) {
            registerForm.addEventListener('submit', (e) => {
                e.preventDefault();
                const name = document.getElementById('register-name').value;
                const email = document.getElementById('register-email').value;
                const password = document.getElementById('register-password').value;
                this.register(name, email, password);
            });
        }

        // Auth tabs
        const authTabs = document.querySelectorAll('.auth-tab');
        authTabs.forEach(tab => {
            tab.addEventListener('click', () => {
                const tabName = tab.dataset.tab;
                this.switchAuthTab(tabName);
            });
        });
    },

    // Initialize authentication state listener
    initializeAuthStateListener() {
        auth.onAuthStateChanged((user) => {
            if (user) {
                this.currentUser = user;
                this.showApp();
                this.updateUserInfo(user);
                TaskManager.loadUserTasks(user.uid);
            } else {
                this.currentUser = null;
                this.showAuth();
            }
        });
    },

    // Initialize logout button
    initializeLogoutButton() {
        const logoutBtn = document.getElementById('logout-btn');
        if (logoutBtn) {
            logoutBtn.addEventListener('click', () => {
                this.logout();
            });
        }
    },

    // Switch between login and register tabs
    switchAuthTab(tabName) {
        const tabs = document.querySelectorAll('.auth-tab');
        const forms = document.querySelectorAll('.auth-form');

        tabs.forEach(tab => {
            tab.classList.toggle('active', tab.dataset.tab === tabName);
        });

        forms.forEach(form => {
            form.classList.toggle('active', form.id === `${tabName}-form`);
        });
    },

    // Show authentication container
    showAuth() {
        document.getElementById('auth-container').style.display = 'flex';
        document.getElementById('app-container').style.display = 'none';
    },

    // Show app container
    showApp() {
        document.getElementById('auth-container').style.display = 'none';
        document.getElementById('app-container').style.display = 'block';
    },

    // Update user information in the UI
    updateUserInfo(user) {
        const userNameElement = document.getElementById('user-name');
        if (userNameElement) {
            userNameElement.textContent = user.displayName || user.email;
        }
    },

    // Login with email and password
    async login(email, password) {
        try {
            await auth.signInWithEmailAndPassword(email, password);
            UI.showToast('Logged in successfully!', 'success');
        } catch (error) {
            console.error('Login error:', error);
            UI.showToast(error.message, 'error');
        }
    },

    // Register new user
    async register(name, email, password) {
        try {
            const userCredential = await auth.createUserWithEmailAndPassword(email, password);
            await userCredential.user.updateProfile({
                displayName: name
            });
            UI.showToast('Account created successfully!', 'success');
        } catch (error) {
            console.error('Registration error:', error);
            UI.showToast(error.message, 'error');
        }
    },

    // Logout user
    async logout() {
        try {
            await auth.signOut();
            UI.showToast('Logged out successfully!', 'success');
        } catch (error) {
            console.error('Logout error:', error);
            UI.showToast(error.message, 'error');
        }
    }
}; 