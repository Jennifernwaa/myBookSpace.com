import { auth } from './firebase-config.js';
import { sendPasswordResetEmail } from "https://www.gstatic.com/firebasejs/11.8.1/firebase-auth.js";


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