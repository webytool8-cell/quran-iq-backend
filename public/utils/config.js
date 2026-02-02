/**
 * Application Configuration
 * Runtime + App metadata
 * Works with Vercel Environment Variables
 */

/* ============================
   Runtime ENV (REQUIRED)
   ============================ */

window.__ENV = {
  // 🔥 Firebase (from Vercel → Environment Variables)
  FIREBASE_API_KEY: "__VITE_FIREBASE_API_KEY__",
  FIREBASE_AUTH_DOMAIN: "__VITE_FIREBASE_AUTH_DOMAIN__",
  FIREBASE_PROJECT_ID: "__VITE_FIREBASE_PROJECT_ID__",
  FIREBASE_STORAGE_BUCKET: "__VITE_FIREBASE_STORAGE_BUCKET__",
  FIREBASE_MESSAGING_SENDER_ID: "__VITE_FIREBASE_MESSAGING_SENDER_ID__",
  FIREBASE_APP_ID: "__VITE_FIREBASE_APP_ID__",

  // 🌐 Backend
  API_BASE_URL: "https://quraniq.app/api"
};

/* ============================
   App Metadata (Play Store)
   ============================ */

window.APP_CONFIG = {
  name: "QuranIQ",
  version: "1.0.0",
  environment: "production",
  supportEmail: "support@quraniq.app",
  privacyPolicyUrl: "/privacy.html",
  storeListingUrl: "https://play.google.com/store/apps/details?id=com.quraniq.app"
};

console.log("✅ Config loaded", window.__ENV, window.APP_CONFIG);

