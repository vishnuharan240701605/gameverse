/* ============================================
   firebase-config.js — Firebase Initialization
   Brain Boost Challenge
   ============================================ */

const firebaseConfig = {
  apiKey: "AIzaSyCwa8mCPT1Y2E4eidBqz4bUGoVYGTLnn80",
  authDomain: "my-site-13111.firebaseapp.com",
  projectId: "my-site-13111",
  storageBucket: "my-site-13111.firebasestorage.app",
  messagingSenderId: "1090293638023",
  appId: "1:1090293638023:web:4bf7fb951b1803f895a922",
  measurementId: "G-10BDR3D8P8"
};

// Initialize Firebase (compat mode — works with script tags, no bundler needed)
firebase.initializeApp(firebaseConfig);

// Export Firebase services
const firebaseAuth = firebase.auth();
const firebaseDB = firebase.firestore();

// Enable offline persistence for Firestore
firebaseDB.enablePersistence({ synchronizeTabs: true }).catch(err => {
  if (err.code === 'failed-precondition') {
    console.warn('Firebase: Multiple tabs open, persistence enabled in first tab only.');
  } else if (err.code === 'unimplemented') {
    console.warn('Firebase: Persistence not available in this browser.');
  }
});

console.log('🔥 Firebase initialized successfully');
