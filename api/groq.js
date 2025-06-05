import { Groq } from "groq-sdk";
// Firebase imports
import { initializeApp } from "https://www.gstatic.com/firebasejs/11.8.1/firebase-app.js";
import { getAuth, onAuthStateChanged } from "https://www.gstatic.com/firebasejs/11.8.1/firebase-auth.js";
import { getFirestore, collection, addDoc, query, where, getDocs } from "https://www.gstatic.com/firebasejs/11.8.1/firebase-firestore.js";

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

// Wait for auth before enabling search
onAuthStateChanged(auth, (user) => {
    if (user) {
        currentUser = user;
    } else {
        alert("Please log in to add books.");
        window.location.href = "../login.html";
    }
});

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method Not Allowed" });
  }

  const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });
  const { userInput } = req.body;

  if (!userInput) {
    return res.status(400).json({ error: "User input is required." });
  }

  try {
    // Fetch user's books and genres from Firestore
    const booksSnap = await db.collection("users").doc(currentUser.uid).collection("books").get();
    const userBooks = [];
    const userGenres = new Set();

    booksSnap.forEach(doc => {
      const data = doc.data();
      if (data.title) userBooks.push(data.title);
    });

    // If user has no books, fallback to userInput or error
    if (userBooks.length === 0 && !userInput) {
      return res.status(400).json({ error: "No reading history found. Please add books or provide preferences." });
    }

    // ------ START PROMPT --------
    let fullPrompt = "";
    if (userBooks.length > 0) {
      fullPrompt += `Here are books I’ve enjoyed: ${userBooks.join(", ")}.\n`;
    }
    if (userInput) {
      fullPrompt += `Additional preferences: ${userInput}\n`;
    }
    fullPrompt += "Based on this, recommend 5 new books I haven't read yet. Format your response ONLY as a valid JSON object like this:\n";
    fullPrompt += `{
      "books": [
        { "title": "Book Title 1", "author": "Author Name 1", "description": "A brief description of the book." },
        { "title": "Book Title 2", "author": "Author Name 2", "description": "Another brief description." }
      ]
    }
    Return ONLY the JSON and nothing else.`;
    // ------ END PROMPT --------



    const response = await groq.chat.completions.create({
      model: "llama3-8b-8192", 
      messages: [
        { role: "system", content: "You are a helpful book recommender. Your task is to provide book recommendations based on user preferences, formatted strictly as a JSON object containing an array of books under the 'books' key." },
        { role: "user", content: fullPrompt },
      ],
      temperature: 0.7,
      max_tokens: 1500,
      response_format: { type: "json_object" }, // This is now consistent with the prompt!
    });

    res.status(200).json(response);

  } catch (error) {
    console.error("Error communicating with Groq API:", error);
    res.status(500).json({ error: "Internal server error during recommendation process." });
  }
}