// firebase-config.js
// Firebase configuration for Movana application.
// Replace the values below with your Firebase project configuration from the Firebase Console.
// Go to Firebase Console -> Project Settings -> General -> Your apps -> Web app config.

const firebaseConfig = {
  apiKey: "AIzaSyCJzYUMbt6g6pXz-rPSruGQOYuKrkPs7b0",
  authDomain: "movana-17a3b.firebaseapp.com",
  projectId: "movana-17a3b",
  storageBucket: "movana-17a3b.firebasestorage.app",
  messagingSenderId: "40151762555",
  appId: "1:40151762555:web:beeac7a400a052e51204de",
  measurementId: "G-9J62X3E2VY"
};

// Initialize Firebase if credentials are provided
let db = null;
let auth = null;
let useFirebase = false;

if (firebaseConfig.projectId && firebaseConfig.projectId !== "YOUR_PROJECT_ID") {
  try {
    firebase.initializeApp(firebaseConfig);
    db = firebase.firestore();
    auth = firebase.auth();
    useFirebase = true;
    console.log("Firebase initialized successfully. Syncing with Cloud Firestore and Auth.");
  } catch (error) {
    console.error("Firebase initialization failed:", error);
  }
} else {
  console.log("Using LocalStorage fallback. Please configure firebase-config.js with your project credentials to enable multi-device sync.");
}

window.db = db;
window.auth = auth;
window.useFirebase = useFirebase;

