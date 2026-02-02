// utils/firebase.js

firebase.initializeApp({
  apiKey: "YOUR_API_KEY",
  authDomain: "quraniq.firebaseapp.com",
  projectId: "quraniq",
});

const auth = firebase.auth();

// make it accessible everywhere
window.firebaseAuth = auth;
