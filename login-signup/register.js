
import { initializeApp } from "https://www.gstatic.com/firebasejs/11.8.1/firebase-app.js";
import { getAnalytics } from "https://www.gstatic.com/firebasejs/11.8.1/firebase-analytics.js";
import { getAuth, createUserWithEmailAndPassword} from "https://www.gstatic.com/firebasejs/11.8.1/firebase-auth.js"
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


const registerButton = document.getElementById("registerButton");

registerButton.addEventListener("click", (e) => {
    e.preventDefault();

    const email = document.getElementById("email").value;
    const password = document.getElementById("password").value;
    const confirmPassword = document.getElementById("confirmPassword").value;
    var isVerified = true;
    if (password !== confirmPassword) {
        window.alert("Passwords do not match. Please try again.");
        isVerified = false;
    }
    if(isVerified) {
        createUserWithEmailAndPassword(auth, email, password)
        .then((userCredential) => {
            // Signed up 
            const user = userCredential.user;
            // ...
            window.alert("Success! Account created.");
            window.location.href = 'dashboard.html';
        })
        .catch((error) => {
            const errorCode = error.code;
            const errorMessage = error.message;
            // ..
            window.alert("Error occurred. Try again.");
        });
    }
});
