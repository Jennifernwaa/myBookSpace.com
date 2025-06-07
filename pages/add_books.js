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
        window.location.href = "../index.html";
    }
});

async function performSearch() {
    const queryInput = document.getElementById('searchInput').value.trim();
    if (!queryInput) return;

    document.getElementById('loadingState').classList.remove('hidden');
    document.getElementById('searchResults').classList.add('hidden');
    document.getElementById('noResults').classList.add('hidden');

    try {
        document.getElementById('loadingState').classList.add('hidden');
        const response = await fetch(`https://openlibrary.org/search.json?title=${encodeURIComponent(queryInput)}`);
        const data = await response.json();

        

        if (!data.docs || data.docs.length === 0) {
            document.getElementById('noResults').classList.remove('hidden');
            return;
        }

        displaySearchResults(data.docs.slice(0, 10)); // Show up to 10 results
        console.log("Search results:", data.docs.slice(0, 10)); // Log the results for debugging
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
        bookElement.className = 'result-card rounded-2xl p-6 flex items-center space-x-4 cursor-pointer hover:shadow-lg transition-all';
        bookElement.dataset.bookId = book.key; // Store book key for navigation

        bookElement.innerHTML = `
            <div class="w-16 h-20 bg-gradient-to-br from-peach to-salmon rounded-lg flex items-center justify-center text-white text-2xl shadow-lg overflow-hidden">
                <img src="${coverUrl}" alt="Cover for ${book.title}" style="max-height:100%;max-width:100%;" onerror="this.onerror=null;this.src='https://via.placeholder.com/80x120?text=No+Cover';">
            </div>
            <div class="flex-1">
                <h4 class="font-bold text-space-brown text-lg">${book.title}</h4>
                <p class="text-warm-brown opacity-75">by ${book.author_name?.[0] || "Unknown"}</p>
                <p class="text-sm text-warm-brown opacity-60 mt-1">Publisher: ${book.publisher?.[0] || "Unknown"}</p>
                <p class="text-sm text-warm-brown opacity-60 mt-1">First published: ${book.first_publish_year || "Unknown"}</p>
                <p class="text-sm text-warm-brown opacity-60 mt-1">ISBN: ${isbn || "Not available"}</p>
            </div>
            <button class="save-button text-white px-6 py-2 rounded-lg font-medium hover:shadow-lg transition-all" onclick="event.stopPropagation()">
                Save Book
            </button>
        `;

        // Add click handler to the entire book container
        bookElement.addEventListener('click', async (e) => {
            if (!e.target.classList.contains('save-button')) {
                console.log("Book card clicked!", book.key);
                // Store book data in sessionStorage for the books.html page
                const workKey = book.key; // e.g. "/works/OL12345W"
                let descriptionT = 'No description available';
                let averageRating = 0;
                let genres = [];
                
                try {
                    const details = await fetch(`https://openlibrary.org${workKey}.json`).then(res => res.json());
                    const ratingdetails = await fetch(`https://openlibrary.org${workKey}/ratings.json`).then(res => res.json());
                    // Get description
                    if (details.description) {
                        descriptionT = typeof details.description === 'string'
                            ? details.description
                            : details.description.value;
                    }
                    // Get genres/subjects: prefer details.subjects, fallback to book.subject
                    if (Array.isArray(details.subjects) && details.subjects.length > 0) {
                        genres = details.subjects.slice(0, 5);
                    } else if (Array.isArray(book.subject) && book.subject.length > 0) {
                        genres = book.subject.slice(0, 5);
                    } else {
                        genres = [];
                    }
                    // Get average rating
                    if (
                        ratingdetails &&
                        ratingdetails.summary &&
                        typeof ratingdetails.summary.average !== 'undefined' &&
                        ratingdetails.summary.average !== null &&
                        !isNaN(ratingdetails.summary.average)
                    ) {
                        averageRating = Math.round(Number(ratingdetails.summary.average));
                    }
                } catch (err) {
                    console.error("Error fetching work details:", err);
                }
                const bookData = {
                    title: book.title,
                    author: book.author_name?.[0] || "Unknown",
                    first_publish_year: book.first_publish_year || "Unknown",
                    isbn: isbn || "Not available",
                    cover_url: coverUrl,
                    subjects: genres,
                    publisher: book.publisher?.[0] || "Unknown",
                    pages: book.number_of_pages_median || "Unknown",
                    language: book.language?.[0] || "Unknown",
                    description: descriptionT,
                    rating: averageRating,
                    key: book.key
                };

                sessionStorage.setItem('selectedBook', JSON.stringify(bookData));
                window.location.href = 'books.html';
            }
        });

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