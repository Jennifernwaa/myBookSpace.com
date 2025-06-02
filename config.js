// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getAnalytics } from "firebase/analytics";
import { getAuth } from "firebase/auth";
// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
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