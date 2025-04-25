// Firebase configuration
const firebaseConfig = {
    apiKey: "AIzaSyDzFWw6j-vXvJok1fKXhTGWCeAJHo-DrIg",
    authDomain: "task-manager-193d4.firebaseapp.com",
    projectId: "task-manager-193d4",
    storageBucket: "task-manager-193d4.firebasestorage.app",
    messagingSenderId: "869578023528",
    appId: "1:869578023528:web:7d1b2da64224da467751dd",
    measurementId: "G-203CSXPVTB"
};

// Initialize Firebase
firebase.initializeApp(firebaseConfig);

// Initialize Firebase services
const auth = firebase.auth();
const db = firebase.firestore();

// Enable offline persistence
db.enablePersistence()
    .catch((err) => {
        if (err.code === 'failed-precondition') {
            console.warn('Multiple tabs open, persistence can only be enabled in one tab at a time.');
        } else if (err.code === 'unimplemented') {
            console.warn('The current browser does not support persistence.');
        }
    }); 