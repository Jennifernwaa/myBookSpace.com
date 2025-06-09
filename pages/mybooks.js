
import { initializeApp } from "https://www.gstatic.com/firebasejs/11.8.1/firebase-app.js";
import { getAnalytics } from "https://www.gstatic.com/firebasejs/11.8.1/firebase-analytics.js";
import { getAuth, onAuthStateChanged, signOut} from "https://www.gstatic.com/firebasejs/11.8.1/firebase-auth.js";
import { getFirestore, doc, getDoc, setDoc, collection, query, orderBy, limit, getDocs, where, updateDoc, deleteDoc } from "https://www.gstatic.com/firebasejs/11.8.1/firebase-firestore.js";

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
let allBooks = [];

// Utility: Render star rating as HTML
function renderStars(rating = 0) {
    let html = '';
    for (let i = 1; i <= 5; i++) {
        html += `<span class="star-rating text-lg${i <= rating ? ' filled text-salmon' : ''}">★</span>`;
    }
    return html;
}

// Utility: Get status badge HTML
function statusBadge(status) {
    if (status === "reading" || status === "currentlyReading") return `<span class="status-badge reading px-3 py-1 rounded-full text-sm font-medium">Currently Reading</span>`;
    if (status === "finished") return `<span class="status-badge finished px-3 py-1 rounded-full text-sm font-medium">Finished</span>`;
    return `<span class="status-badge px-3 py-1 rounded-full text-sm font-medium">Want to Read</span>`;
}

// Render books in their respective tabs
function renderBooks() {
    const wantToRead = allBooks.filter(b => b.status === "wantToRead");
    const reading = allBooks.filter(b => b.status === "reading" || b.status === "currentlyReading");
    const finished = allBooks.filter(b => b.status === "finished");

    // Helper to render a book card
    function bookCard(book, tab) {
        return `
        <div class="book-card rounded-3xl p-6 shadow-lg" data-id="${book.id}">
            <div class="flex justify-between items-start mb-4">
                <div class="flex-1">
                    <div class="flex items-center justify-between mb-2">
                        <h3 class="font-bold text-space-brown text-xl font-serif">${book.title || ''}</h3>
                            ${
                                tab === "finished"
                                    ? `<button class="heart-button${book.favorite ? ' favorited' : ''}" onclick="toggleFavorite('${book.id}')">♥︎</button>`
                                    : ''
                            }
                    </div>
                    <p class="text-warm-brown opacity-75 mb-3">by ${book.author || ''}</p>
                    ${statusBadge(book.status)}
                </div>
                <div class="text-4xl opacity-20">${tab === "wantToRead" ? "📖" : tab === "reading" ? "📚" : "✅"}</div>
            </div>
            ${tab === "reading" ? `
            <div class="mb-4">
                <div class="flex justify-between text-sm mb-2">
                    <span class="text-warm-brown">Progress</span>
                    <span class="text-salmon font-semibold">${book.progress || 0}%</span>
                </div>
                <div class="w-full bg-cream-medium rounded-full h-2">
                    <div class="bg-gradient-to-r from-salmon to-rose-red h-2 rounded-full transition-all" style="width: ${(book.progress || 0)}%"></div>
                </div>
            </div>
            ` : ""}
            <div class="flex items-center mb-4">
                <span class="text-warm-brown text-sm mr-2">Rating:</span>
                <div class="flex">${renderStars(book.rating)}</div>
                <span class="text-warm-brown text-sm ml-2 opacity-75">${tab === "finished" ? (book.rating ? book.rating.toFixed(1) : "Not rated") : tab === "reading" ? "In progress" : "Not rated"}</span>
            </div>
            <div class="flex gap-3">
                <button class="edit-button flex-1 py-2 px-4 rounded-xl font-medium text-sm" data-action="edit" data-tab="${tab}">
                    ${tab === "finished" ? "Edit Rating" : "Edit Status"}
                </button>
                <button class="delete-button py-2 px-4 rounded-xl font-medium text-sm" data-action="delete">
                    Delete
                </button>
            </div>
        </div>`;
    }

    // Render each tab
    document.getElementById('wantToRead-books').querySelector('.grid').innerHTML =
        wantToRead.length ? wantToRead.map(b => bookCard(b, "wantToRead")).join('') :
        `<div class="col-span-full text-center py-12 text-warm-brown opacity-70">No books in your Want to Read list.</div>`;

    document.getElementById('reading-books').querySelector('.grid').innerHTML =
        reading.length ? reading.map(b => bookCard(b, "reading")).join('') :
        `<div class="col-span-full text-center py-12 text-warm-brown opacity-70">No books currently being read.</div>`;

    document.getElementById('finished-books').querySelector('.grid').innerHTML =
        finished.length ? finished.map(b => bookCard(b, "finished")).join('') :
        `<div class="col-span-full text-center py-12 text-warm-brown opacity-70">No finished books yet.</div>`;

    // Add event listeners for edit and delete
    addBookCardListeners();
    updateTabCounts();

    
}

// Add listeners for edit/delete buttons
function addBookCardListeners() {
    document.querySelectorAll('.edit-button').forEach(btn => {
        btn.onclick = function () {
            const card = btn.closest('.book-card');
            const id = card.getAttribute('data-id');
            const book = allBooks.find(b => b.id === id);
            if (!book) return;
            if (btn.dataset.tab === "wantToRead") openModal('wantToRead-modal', book);
            else if (btn.dataset.tab === "reading") openModal('reading-modal', book);
            else openModal('finished-modal', book);
            // Store the editing book id for saving
            window.editingBookId = id;
        };
    });
    document.querySelectorAll('.delete-button').forEach(btn => {
        btn.onclick = async function () {
            const card = btn.closest('.book-card');
            const id = card.getAttribute('data-id');
            const book = allBooks.find(b => b.id === id);
            if (!book) return;
            if (confirm(`Are you sure you want to delete "${book.title}"?`)) {
                await deleteDoc(doc(db, "users", currentUser.uid, "books", id));
                allBooks = allBooks.filter(b => b.id !== id);
                renderBooks();
            }
        };
    });
}

// Modal logic
function openModal(modalId, bookData = {}) {
    document.getElementById(modalId).classList.remove('hidden');
    // Populate modal fields
    if (modalId === 'wantToRead-modal') {
        document.getElementById('wtr-title').value = bookData.title || '';
        document.getElementById('wtr-author').value = bookData.author || '';
        document.getElementById('wtr-status').value = bookData.status || 'wantToRead';
    } else if (modalId === 'reading-modal') {
        document.getElementById('reading-title').value = bookData.title || '';
        document.getElementById('reading-author').value = bookData.author || '';
        document.getElementById('reading-progress').value = bookData.progress || 0;
        document.getElementById('progress-display').textContent = (bookData.progress || 0) + '%';
        document.getElementById('reading-status').value = bookData.status || 'reading';
    } else if (modalId === 'finished-modal') {
        document.getElementById('finished-title').value = bookData.title || '';
        document.getElementById('finished-author').value = bookData.author || '';
        document.getElementById('finished-status').value = bookData.status || 'finished';
        document.getElementById('finished-notes').value = bookData.notes || '';
        setStarRating(bookData.rating || 0);
    }
}
function closeModal(modalId) {
    document.getElementById(modalId).classList.add('hidden');
}

function updateTabCounts() {
    // Count books by status
    const wantToReadCount = allBooks.filter(b => b.status === "wantToRead").length;
    const readingCount = allBooks.filter(b => b.status === "reading" || b.status === "currentlyReading").length;
    const finishedCount = allBooks.filter(b => b.status === "finished").length;

    // Update the badge spans
    document.querySelector('#tab-wantToRead .ml-2').textContent = wantToReadCount;
    document.querySelector('#tab-reading .ml-2').textContent = readingCount;
    document.querySelector('#tab-finished .ml-2').textContent = finishedCount;
}

// Star rating for finished modal
function setStarRating(rating) {
    document.querySelectorAll('#finished-modal .star-button').forEach((star, idx) => {
        if (idx < rating) {
            star.classList.add('text-salmon');
            star.classList.remove('text-salmon/30');
        } else {
            star.classList.remove('text-salmon');
            star.classList.add('text-salmon/30');
        }
    });
    document.getElementById('book-rating').value = rating;
}

// Save modal changes
function setupModalForms() {
    // Want to Read
    document.querySelector('#wantToRead-modal form').onsubmit = async function (e) {
        e.preventDefault();
        const id = window.editingBookId;
        const ref = doc(db, "users", currentUser.uid, "books", id);
        await updateDoc(ref, {
            title: document.getElementById('wtr-title').value,
            author: document.getElementById('wtr-author').value,
            status: document.getElementById('wtr-status').value
        });
        // Update local
        const idx = allBooks.findIndex(b => b.id === id);
        if (idx !== -1) {
            allBooks[idx].title = document.getElementById('wtr-title').value;
            allBooks[idx].author = document.getElementById('wtr-author').value;
            allBooks[idx].status = document.getElementById('wtr-status').value;
        }
        closeModal('wantToRead-modal');
        renderBooks();
    };
    // Reading
    document.querySelector('#reading-modal form').onsubmit = async function (e) {
        e.preventDefault();
        const id = window.editingBookId;
        const ref = doc(db, "users", currentUser.uid, "books", id);
        await updateDoc(ref, {
            title: document.getElementById('reading-title').value,
            author: document.getElementById('reading-author').value,
            status: document.getElementById('reading-status').value,
            progress: parseInt(document.getElementById('reading-progress').value)
        });
        // Update local
        const idx = allBooks.findIndex(b => b.id === id);
        if (idx !== -1) {
            allBooks[idx].title = document.getElementById('reading-title').value;
            allBooks[idx].author = document.getElementById('reading-author').value;
            allBooks[idx].status = document.getElementById('reading-status').value;
            allBooks[idx].progress = parseInt(document.getElementById('reading-progress').value);
        }
        closeModal('reading-modal');
        renderBooks();
    };
    // Finished
    document.querySelector('#finished-modal form').onsubmit = async function (e) {
        e.preventDefault();
        const id = window.editingBookId;
        const ref = doc(db, "users", currentUser.uid, "books", id);
        await updateDoc(ref, {
            title: document.getElementById('finished-title').value,
            author: document.getElementById('finished-author').value,
            status: document.getElementById('finished-status').value,
            notes: document.getElementById('finished-notes').value,
            dateCompleted: new Date().toISOString(),
            rating: parseInt(document.getElementById('book-rating').value)
        });
        // Update local
        const idx = allBooks.findIndex(b => b.id === id);
        if (idx !== -1) {
            allBooks[idx].title = document.getElementById('finished-title').value;
            allBooks[idx].author = document.getElementById('finished-author').value;
            allBooks[idx].status = document.getElementById('finished-status').value;
            allBooks[idx].notes = document.getElementById('finished-notes').value;
            allBooks[idx].dateCompleted = new Date().toISOString();
            allBooks[idx].rating = parseInt(document.getElementById('book-rating').value);
        }
        closeModal('finished-modal');
        renderBooks();
    };
    // Star rating click
    document.querySelectorAll('#finished-modal .star-button').forEach(star => {
        star.onclick = function () {
            setStarRating(parseInt(star.dataset.rating));
        };
    });
}

// Tab switching
window.switchTab = function(tab) {
    ['wantToRead', 'reading', 'finished'].forEach(t => {
        document.getElementById(`${t}-books`).classList.toggle('hidden', t !== tab);
        document.getElementById(`tab-${t}`).classList.toggle('active', t === tab);
    });
};

// Modal close on background click
['wantToRead-modal', 'reading-modal', 'finished-modal'].forEach(id => {
    document.getElementById(id).addEventListener('click', function(e) {
        if (e.target === this) closeModal(id);
    });
});

// Progress slider update
document.getElementById('reading-progress').addEventListener('input', function() {
    const slider = document.getElementById('reading-progress');
    const display = document.getElementById('progress-display');
        
    function updateSliderBg() {
        const val = slider.value;
        slider.style.background = `linear-gradient(to right, #CB7666 ${val}%, #E8E2D5 ${val}%)`;
        display.textContent = `${val}%`;
    }
slider.addEventListener('input', updateSliderBg);
updateSliderBg();
});

window.toggleFavorite = async function(bookId) {
    // Find the book in local array
    const idx = allBooks.findIndex(b => b.id === bookId);
    if (idx === -1) return;

    // Toggle the favorite field (default to false if undefined)
    const currentFavorite = !!allBooks[idx].favorite;
    const newFavorite = !currentFavorite;

    // Update Firestore
    const bookRef = doc(db, "users", currentUser.uid, "books", bookId);
    await updateDoc(bookRef, { favorite: newFavorite });

    // Update local data and re-render
    allBooks[idx].favorite = newFavorite;
    renderBooks();
};


// Auth and load books
onAuthStateChanged(auth, async (user) => {
    if (!user) {
        window.location.href = '../index.html';
        return;
    }  
    currentUser = user;
    const navUserName = document.getElementById('nav-user-name');
    
    // Fetch current user's friends object
    const currentUserRef = doc(db, "users", currentUser.uid);
    const currentUserSnap = await getDoc(currentUserRef);
    const currentUserData = currentUserSnap.data();
    if (navUserName && navUserName.textContent === 'Reader') {
        navUserName.textContent = currentUserData.userName || 'Reader';
    }

    // Fetch all books
    const q = query(collection(db, "users", currentUser.uid, "books"));
    const snapshot = await getDocs(q);
    allBooks = [];
    snapshot.forEach(docSnap => {
        allBooks.push({ id: docSnap.id, ...docSnap.data() });
    });
    renderBooks();
    setupModalForms();
});

// ...existing code...

window.closeModal = closeModal;
window.openModal = openModal;
window.setStarRating = setStarRating;