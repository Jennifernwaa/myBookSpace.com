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
        document.getElementById('searchButton').addEventListener('click', performSearch);
        document.getElementById('searchInput').addEventListener('keypress', function(e) {
            if (e.key === 'Enter') {
                e.preventDefault();
                performSearch();
            }
        });
    } else {
        alert("Please log in to add books.");
        window.location.href = "../login.html";
    }
});

async function performSearch() {
    const queryInput = document.getElementById('searchInput').value.trim();
    if (!queryInput) return;

    document.getElementById('loadingState').classList.remove('hidden');
    document.getElementById('searchResults').classList.add('hidden');
    document.getElementById('noResults').classList.add('hidden');

    try {
        const response = await fetch(`https://openlibrary.org/search.json?title=${encodeURIComponent(queryInput)}`);
        const data = await response.json();

        document.getElementById('loadingState').classList.add('hidden');

        if (!data.docs || data.docs.length === 0) {
            document.getElementById('noResults').classList.remove('hidden');
            return;
        }

        displaySearchResults(data.docs.slice(0, 10)); // Show up to 10 results
    } catch (error) {
        document.getElementById('loadingState').classList.add('hidden');
        alert("Error searching for books.");
        console.error(error);
    }
}

function displaySearchResults(books) {
    const container = document.getElementById('resultsContainer');
    container.innerHTML = '';

    books.forEach(book => {
        const isbn = book.isbn?.[0];
        let coverUrl = "https://via.placeholder.com/80x120?text=No+Cover";
        if (isbn) {
            coverUrl = `https://covers.openlibrary.org/b/isbn/${isbn}-M.jpg?default=false`;
        } else if (book.cover_i) {
            coverUrl = `https://covers.openlibrary.org/b/id/${book.cover_i}-M.jpg?default=false`;
        }

        const bookElement = document.createElement('div');
        bookElement.className = 'result-card rounded-2xl p-6 flex items-center space-x-4';

        bookElement.innerHTML = `
            <div class="w-16 h-20 bg-gradient-to-br from-peach to-salmon rounded-lg flex items-center justify-center text-white text-2xl shadow-lg overflow-hidden">
                <img src="${coverUrl}" alt="Cover for ${book.title}" style="max-height:100%;max-width:100%;" onerror="this.onerror=null;this.src='https://via.placeholder.com/80x120?text=No+Cover';">
            </div>
            <div class="flex-1">
                <h4 class="font-bold text-space-brown text-lg">${book.title}</h4>
                <p class="text-warm-brown opacity-75">by ${book.author_name?.[0] || "Unknown"}</p>
                <p class="text-sm text-warm-brown opacity-60 mt-1">First published: ${book.first_publish_year || "Unknown"}</p>
                <p class="text-sm text-warm-brown opacity-60 mt-1">ISBN: ${isbn || "Not available"}</p>
            </div>
            <button class="save-button text-white px-6 py-2 rounded-lg font-medium hover:shadow-lg transition-all">
                Save Book
            </button>
        `;

        // Save button handler
        bookElement.querySelector('button').addEventListener('click', async () => {
            await saveBookToFirestore({
                title: book.title,
                author: book.author_name?.[0] || "Unknown",
                first_publish_year: book.first_publish_year || "Unknown",
                isbn: isbn || "Not available",
                cover_url: coverUrl,
                dateAdded: new Date().toISOString()
            });
        });

        container.appendChild(bookElement);
    });

    document.getElementById('searchResults').classList.remove('hidden');
}

async function saveBookToFirestore(bookData, status = "wantToRead") {
    // Check for duplicates by ISBN or title
    let exists = false;
    const q = bookData.isbn !== "Not available"
        ? query(
            collection(db, "users", currentUser.uid, "books"),
            where("isbn", "==", bookData.isbn)
          )
        : query(
            collection(db, "users", currentUser.uid, "books"),
            where("title", "==", bookData.title)
          );
    const querySnapshot = await getDocs(q);
    exists = !querySnapshot.empty;

    if (exists) {
        showSuccessMessage("This book is already in your library.");
        return;
    }

    await addDoc(
        collection(db, "users", currentUser.uid, "books"),
        { ...bookData, status }
    );
    showSuccessMessage("Book added successfully!");
}

// Show success message
function showSuccessMessage(msg = "Book added successfully!") {
    const message = document.getElementById('successMessage');
    message.querySelector('.font-medium').textContent = msg;
    message.classList.remove('hidden');
    setTimeout(() => {
        message.classList.add('hidden');
    }, 3000);
}

// Manual form submission (unchanged)
document.getElementById('manualBookForm').addEventListener('submit', async function(e) {
    e.preventDefault();
    const formData = new FormData(e.target);
    const bookData = {
        title: formData.get('title'),
        author: formData.get('author'),
        genre: formData.get('genre'),
        cover_url: "https://via.placeholder.com/150?text=No+Cover",
        dateAdded: new Date().toISOString()
    };
    const status = formData.get('status');
    await saveBookToFirestore(bookData, status);
    showSuccessMessage();
    e.target.reset();
});
