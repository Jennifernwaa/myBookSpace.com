// Firebase imports

import { initializeApp } from "https://www.gstatic.com/firebasejs/11.8.1/firebase-app.js";
import { getAnalytics } from "https://www.gstatic.com/firebasejs/11.8.1/firebase-analytics.js";
import { getAuth, onAuthStateChanged, signOut} from "https://www.gstatic.com/firebasejs/11.8.1/firebase-auth.js";
import { getFirestore, doc, getDoc, setDoc, collection, query, orderBy, limit, getDocs, where, updateDoc, deleteDoc, arrayUnion, arrayRemove } from "https://www.gstatic.com/firebasejs/11.8.1/firebase-firestore.js";

// Your Firebase config
const firebaseConfig = {
    apiKey: "AIzaSyDn04LCckI_-sxQvHe4frnheCcvQSa6gCc",
    authDomain: "mybookspace-jennifer.firebaseapp.com",
    projectId: "mybookspace-jennifer",
    storageBucket: "mybookspace-jennifer.firebasestorage.app",
    messagingSenderId: "842011822044",
    appId: "1:842011822044:web:d801617e044c86be98f119",
    measurementId: "G-S48BPR0TDX"
};

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

let currentUser = null;    

onAuthStateChanged(auth, async (user) => {
    if (!user) return;
    currentUser = user.uid;
    const navUserName = document.getElementById('nav-user-name');

    // Fetch current user's friends object
    const currentUserRef = doc(db, "users", currentUser);
    const currentUserSnap = await getDoc(currentUserRef);
    const currentUserData = currentUserSnap.data();
    if (navUserName && navUserName.textContent === 'Reader') {
        navUserName.textContent = currentUserData.userName || 'Reader';
    }
});