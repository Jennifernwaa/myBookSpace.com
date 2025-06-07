
import { initializeApp } from "https://www.gstatic.com/firebasejs/11.8.1/firebase-app.js";
import { getAnalytics } from "https://www.gstatic.com/firebasejs/11.8.1/firebase-analytics.js";
import { getAuth, createUserWithEmailAndPassword, sendEmailVerification,  updateProfile} from "https://www.gstatic.com/firebasejs/11.8.1/firebase-auth.js"
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

registerButton.addEventListener("click", async (e) => { // Added 'async' because we'll use 'await'
    e.preventDefault();

    const fullName = document.getElementById("fullName").value;
    const email = document.getElementById("email").value;
    const password = document.getElementById("password").value;
    const confirmPassword = document.getElementById("confirmPassword").value;
    var isValid = true; // Let's use isValid for the overall form state

    if (password !== confirmPassword) {
        window.alert("Passwords do not match. Please try again.");
        isValid = false;
    }

    if(isValid) {
        try {
            const userCredential = await createUserWithEmailAndPassword(auth, email, password);
            const user = userCredential.user;

            // --- NEW PART: Send the email verification! ---
            // You can customize the verification email link behavior if you want,
            // for example, making it open within your app.
            // The actionCodeSettings object (like in the facts we saw) is used for this.
            // For a basic flow, you don't need actionCodeSettings.
             await sendEmailVerification(user);
            // ---------------------------------------------

            // Optional: You can update the user's profile display name here
            // if you want to store the full name with the Firebase user.
            // if (fullName) {
            //     await updateProfile(user, { displayName: fullName });
            // }


            window.alert("Success! Account created. Please check your email to verify your address.");
            // Instead of going straight to the dashboard, maybe redirect them
            // to a page that reminds them to check their email.
            window.location.href = '../pages/dashboard.html'; // Example: create a check-email page

        } catch (error) {
            const errorCode = error.code;
            const errorMessage = error.message;
            // Better logging for debugging
            console.error("Error during sign-up:", errorCode, errorMessage);
            // Provide a more user-friendly error message
            window.alert(`Error occurred: ${errorMessage}. Please try again.`);
        }
    }
});
