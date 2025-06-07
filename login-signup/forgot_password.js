import { initializeApp } from "https://www.gstatic.com/firebasejs/11.8.1/firebase-app.js";
import { getAnalytics } from "https://www.gstatic.com/firebasejs/11.8.1/firebase-analytics.js";
import { getAuth, sendPasswordResetEmail } from "https://www.gstatic.com/firebasejs/11.8.1/firebase-auth.js";

// Firebase configuration
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

// Get DOM elements
const resetForm = document.getElementById("resetForm");
const resetButton = document.getElementById("resetButton");
const emailInput = document.getElementById("email");
const successMessage = document.getElementById("success-message");
const errorMessage = document.getElementById("error-message");
const errorText = document.getElementById("error-text");
const buttonText = document.getElementById("button-text");
const loadingText = document.getElementById("loading-text");


// Password reset function
resetForm.addEventListener("submit", async (e) => {
    e.preventDefault();
    
    const email = emailInput.value.trim();
    
    if (!email) {
        showError("Please enter your email address.");
        return;
    }

    // Show loading state
    resetButton.disabled = true;
    buttonText.classList.add("hidden");
    loadingText.classList.remove("hidden");
    hideMessages();

    try {
        await sendPasswordResetEmail(auth, email);
        showSuccess();
        emailInput.value = ""; // Clear the form
    } catch (error) {
        console.error("Password reset error:", error);
        handleResetError(error);
    } finally {
        // Reset button state
        resetButton.disabled = false;
        buttonText.classList.remove("hidden");
        loadingText.classList.add("hidden");
    }
});

function showSuccess() {
    successMessage.classList.remove("hidden");
    errorMessage.classList.add("hidden");
}

function showError(message) {
    errorText.textContent = message;
    errorMessage.classList.remove("hidden");
    successMessage.classList.add("hidden");
}

function hideMessages() {
    successMessage.classList.add("hidden");
    errorMessage.classList.add("hidden");
}

function handleResetError(error) {
    switch (error.code) {
        case 'auth/user-not-found':
            showError("No account found with this email address.");
            break;
        case 'auth/invalid-email':
            showError("Please enter a valid email address.");
            break;
        case 'auth/too-many-requests':
            showError("Too many attempts. Please try again later.");
            break;
        default:
            showError("An error occurred. Please try again.");
            break;
    }
}