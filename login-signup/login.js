import { auth } from './firebase-config.js';
import { signInWithEmailAndPassword, GoogleAuthProvider, signInWithPopup, signInWithRedirect, getRedirectResult } from "https://www.gstatic.com/firebasejs/11.8.1/firebase-auth.js";
// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional

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
});

function googleLogin(){
    const provider = new GoogleAuthProvider();
    signInWithPopup(auth, provider)
        .then((result) => {
            // This gives you a Google Access Token. You can use it to access the Google API.
            const credential = GoogleAuthProvider.credentialFromResult(result);
            const token = credential.accessToken;
            // The signed-in user info.
            const user = result.user;
            console.log("Successfully signed in with google",user);
            window.alert("Success! Welcome back!");
            window.location.href = '../pages/dashboard.html';
        }).catch((error) => {
            // Handle Errors here.
            const errorCode = error.code;
            const errorMessage = error.message;
            // The email of the user's account used.
            const email = error.customData.email;
            // The AuthCredential type that was used.
            const credential = GoogleAuthProvider.credentialFromError(error);
            console.log("Error occurred. Try again.");
            window.alert("Error occurred. Try again.");
        });
}
// Function to initiate Google Sign-In via redirect
function signInWithGoogleRedirect() {
  const provider = new GoogleAuthProvider();
  signInWithRedirect(auth, provider);
}

window.googleLogin = googleLogin; // Expose the function to the global scope