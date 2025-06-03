import { initializeApp } from "https://www.gstatic.com/firebasejs/11.8.1/firebase-app.js";
import { getAnalytics } from "https://www.gstatic.com/firebasejs/11.8.1/firebase-analytics.js";
import { getAuth, signInWithEmailAndPassword} from "https://www.gstatic.com/firebasejs/11.8.1/firebase-auth.js";
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
const auth = getAuth(app);

const loginButton = document.getElementById("loginButton");

// Firebase sign in function
loginButton.addEventListener("click", (e) => {
    e.preventDefault();

    const email = document.getElementById("email").value;
    const password = document.getElementById("password").value;
        // Sign in with email and password
        signInWithEmailAndPassword(auth, email, password)
        .then((userCredential) => {
            // Signed in 
            const user = userCredential.user;
            console.log("Success! Welcome back!");
            window.alert("Success! Welcome back!");

            window.location.href = '../pages/dashboard.html';
            // ...
        })
        .catch((error) => {
            const errorCode = error.code;
            const errorMessage = error.message;
            console.log("Error occurred. Try again.");
            window.alert("Error occurred. Try again.");
        });
                onAuthStateChanged(auth, (user) => {
        if (user) {
            // User is signed in, see docs for a list of available properties
            // https://firebase.google.com/docs/reference/js/auth.user
            const uid = user.uid;
            // ...
        } else {
            // User is signed out
            // ...
        }
        });
    });