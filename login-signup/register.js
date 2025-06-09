
import { auth } from './firebase-config.js';
import { createUserWithEmailAndPassword, sendEmailVerification,  updateProfile} from "https://www.gstatic.com/firebasejs/11.8.1/firebase-auth.js"

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
