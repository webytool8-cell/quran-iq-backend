// Initialize Firebase using the config from index.html
firebase.initializeApp(window.FIREBASE_CONFIG);

// Auth object available globally
const auth = firebase.auth();
window.firebaseAuth = auth;

// Optional: simple helper to check if Firebase loaded
console.log("Firebase initialized. Auth available:", !!window.firebaseAuth);
