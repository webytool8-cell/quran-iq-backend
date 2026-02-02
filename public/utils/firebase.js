/**
 * Firebase Configuration for QuranIQ
 * Replace with your actual Firebase project credentials
 */

import { initializeApp } from 'https://www.gstatic.com/firebasejs/10.7.1/firebase-app.js';
import { 
  getAuth, 
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
  GoogleAuthProvider,
  signInWithPopup
} from 'https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js';

// TODO: Replace with your Firebase project config
// Get from: Firebase Console → Project Settings → General → Your apps → Web app
const firebaseConfig = {
  apiKey: "AIzaSyCJ-y09Nc7Zt3OCeanRJkn_3iA6SddjSb8",
  authDomain: "quraniq-deb47.firebaseapp.com",
  projectId: "quraniq-deb47",
  storageBucket: "quraniq-deb47.firebasestorage.app",
  messagingSenderId: "1062085300745",
  appId: "1:1062085300745:web:2a45920402f22b3aff9ed8"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const googleProvider = new GoogleAuthProvider();

// Export for use in other files
export { 
  auth, 
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
  googleProvider,
  signInWithPopup
};
