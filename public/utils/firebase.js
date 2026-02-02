/**
 * Firebase Auth – UMD / Browser Safe
 * No modules, no bundler, works on Vercel + Trickle
 */

/* global firebase */

(function () {
  // 🔐 Firebase config (from Vercel env → injected at build time)
  const firebaseConfig = {
    apiKey: window.__ENV?.FIREBASE_API_KEY,
    authDomain: window.__ENV?.FIREBASE_AUTH_DOMAIN,
    projectId: window.__ENV?.FIREBASE_PROJECT_ID,
    storageBucket: window.__ENV?.FIREBASE_STORAGE_BUCKET,
    messagingSenderId: window.__ENV?.FIREBASE_MESSAGING_SENDER_ID,
    appId: window.__ENV?.FIREBASE_APP_ID,
  };

  if (!firebaseConfig.apiKey) {
    console.error("🔥 Firebase config missing. Check Vercel env vars.");
    return;
  }

  // Prevent re-init
  if (!firebase.apps.length) {
    firebase.initializeApp(firebaseConfig);
  }

  const auth = firebase.auth();

  // Expose globally
  window.firebaseAuth = auth;

  console.log("✅ Firebase Auth initialized");
})();
