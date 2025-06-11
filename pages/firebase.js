import { initializeApp } from "https://www.gstatic.com/firebasejs/11.8.1/firebase-app.js";
import { getAnalytics } from "https://www.gstatic.com/firebasejs/11.8.1/firebase-analytics.js";
import { getAuth } from "https://www.gstatic.com/firebasejs/11.8.1/firebase-auth.js";

const firebaseConfig = {
  apiKey: "AIzaSyDn04LCckI_-sxQvHe4frnheCcvQSa6gCc",
  authDomain: "mybookspace-jennifer.firebaseapp.com",
  projectId: "mybookspace-jennifer",
  storageBucket: "mybookspace-jennifer.firebasestorage.app",
  messagingSenderId: "842011822044",
  appId: "1:842011822044:web:d801617e044c86be98f119",
  measurementId: "G-S48BPR0TDX"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const analytics = getAnalytics(app);
const auth = getAuth(app);


export { app, analytics, auth }; 