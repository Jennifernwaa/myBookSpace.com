import { auth } from './firebase-config.js';
import { confirmPasswordReset, verifyPasswordResetCode } from "https://www.gstatic.com/firebasejs/11.8.1/firebase-auth.js";

// Get DOM elements
const loadingState = document.getElementById("loading-state");
const invalidState = document.getElementById("invalid-state");
const formState = document.getElementById("form-state");
const newPasswordForm = document.getElementById("newPasswordForm");
const resetPasswordButton = document.getElementById("resetPasswordButton");
const newPasswordInput = document.getElementById("newPassword");
const confirmPasswordInput = document.getElementById("confirmPassword");
const successMessage = document.getElementById("success-message");
const errorMessage = document.getElementById("error-message");
const errorText = document.getElementById("error-text");
const buttonText = document.getElementById("button-text");
const loadingText = document.getElementById("loading-text");
const strengthBar = document.getElementById("strength-bar");
const strengthText = document.getElementById("strength-text");
const passwordMatch = document.getElementById("password-match");
const matchText = document.getElementById("match-text");

// Extract oobCode from URL
const urlParams = new URLSearchParams(window.location.search);
const oobCode = urlParams.get('oobCode');

// Initialize page
async function initializePage() {
    if (!oobCode) {
        showInvalidState();
        return;
    }

    try {
        // Verify the password reset code
        await verifyPasswordResetCode(auth, oobCode);
        showFormState();
    } catch (error) {
        console.error("Invalid reset code:", error);
        showInvalidState();
    }
}

function showInvalidState() {
    loadingState.classList.add("hidden");
    invalidState.classList.remove("hidden");
    formState.classList.add("hidden");
}

function showFormState() {
    loadingState.classList.add("hidden");
    invalidState.classList.add("hidden");
    formState.classList.remove("hidden");
}

// Password strength checker
function checkPasswordStrength(password) {
    let strength = 0;
    let feedback = [];

    if (password.length >= 6) strength += 1;
    else feedback.push("At least 6 characters");

    if (/[a-z]/.test(password) && /[A-Z]/.test(password)) strength += 1;
    else feedback.push("Upper and lowercase letters");

    if (/\d/.test(password)) strength += 1;
    else feedback.push("At least one number");

    if (/[!@#$%^&*(),.?":{}|<>]/.test(password)) strength += 1;
    else feedback.push("At least one special character");

    return { strength, feedback };
}

function updatePasswordStrength() {
    const password = newPasswordInput.value;
    const { strength } = checkPasswordStrength(password);

    strengthBar.className = "password-strength";
    
    if (strength === 0) {
        strengthBar.classList.add("bg-gray-300");
        strengthText.textContent = "Weak";
        strengthText.className = "text-gray-500";
    } else if (strength <= 2) {
        strengthBar.classList.add("strength-weak");
        strengthText.textContent = "Weak";
        strengthText.className = "text-red-600";
    } else if (strength === 3) {
        strengthBar.classList.add("strength-medium");
        strengthText.textContent = "Medium";
        strengthText.className = "text-yellow-600";
    } else {
        strengthBar.classList.add("strength-strong");
        strengthText.textContent = "Strong";
        strengthText.className = "text-green-600";
    }
}

function checkPasswordMatch() {
    const password = newPasswordInput.value;
    const confirmPassword = confirmPasswordInput.value;

    if (confirmPassword.length > 0) {
        passwordMatch.classList.remove("hidden");
        if (password === confirmPassword) {
            matchText.textContent = "✓ Passwords match";
            matchText.className = "text-green-600";
        } else {
            matchText.textContent = "✗ Passwords do not match";
            matchText.className = "text-red-600";
        }
    } else {
        passwordMatch.classList.add("hidden");
    }
}

// Event listeners
newPasswordInput.addEventListener("input", () => {
    updatePasswordStrength();
    checkPasswordMatch();
});

confirmPasswordInput.addEventListener("input", checkPasswordMatch);

// Form submission
newPasswordForm.addEventListener("submit", async (e) => {
    e.preventDefault();
    
    const newPassword = newPasswordInput.value;
    const confirmPassword = confirmPasswordInput.value;

    // Validation
    if (newPassword !== confirmPassword) {
        showError("Passwords do not match.");
        return;
    }

    if (newPassword.length < 6) {
        showError("Password must be at least 6 characters long.");
        return;
    }

    const { strength } = checkPasswordStrength(newPassword);
    if (strength < 2) {
        showError("Please choose a stronger password.");
        return;
    }

    // Show loading state
    resetPasswordButton.disabled = true;
    buttonText.classList.add("hidden");
    loadingText.classList.remove("hidden");
    hideMessages();

    try {
        await confirmPasswordReset(auth, oobCode, newPassword);
        showSuccess();
        
        // Redirect to login after 3 seconds
        setTimeout(() => {
            window.location.href = 'login.html';
        }, 3000);
        
    } catch (error) {
        console.error("Password reset error:", error);
        handleResetError(error);
    } finally {
        // Reset button state
        resetPasswordButton.disabled = false;
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
        case 'auth/expired-action-code':
            showError("This reset link has expired. Please request a new one.");
            break;
        case 'auth/invalid-action-code':
            showError("Invalid reset code. Please request a new reset link.");
            break;
        case 'auth/user-disabled':
            showError("This account has been disabled.");
            break;
        case 'auth/user-not-found':
            showError("No account found. Please contact support.");
            break;
        case 'auth/weak-password':
            showError("Password is too weak. Please choose a stronger password.");
            break;
        default:
            showError("An error occurred. Please try again.");
            break;
    }
}

// Initialize the page
initializePage();