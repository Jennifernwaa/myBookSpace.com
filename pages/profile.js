import { initializeApp } from "https://www.gstatic.com/firebasejs/11.8.1/firebase-app.js";
import { getAnalytics } from "https://www.gstatic.com/firebasejs/11.8.1/firebase-analytics.js";
import { getAuth, onAuthStateChanged, signOut} from "https://www.gstatic.com/firebasejs/11.8.1/firebase-auth.js";
import { getFirestore, doc, getDoc, setDoc, collection, query, orderBy, limit, getDocs, where, updateDoc } from "https://www.gstatic.com/firebasejs/11.8.1/firebase-firestore.js";

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
let userData = null;

const navUserName = document.getElementById('nav-user-name');
const userName = document.getElementById('username');
const bio = document.getElementById('bio');
const favoriteGenre = document.getElementById('favoriteGenre');

const usernameInput = document.getElementById('usernameModal');
const booksReadCard = document.getElementById('booksRead');
const friendsCountCard = document.getElementById('friendsCount');



// Utility to get query param
function getQueryParam(name) {
    const url = new URL(window.location.href);
    return url.searchParams.get(name);
}


// Fetch favorite books for a user (favorite === true)
async function fetchFavoriteBooks(uid) {
    const books = [];
    const q = query(
        collection(db, "users", uid, "books"),
        where("favorite", "==", true)
    );
    const querySnapshot = await getDocs(q);
    querySnapshot.forEach((doc) => {
        books.push({ id: doc.id, ...doc.data() });
    });
    return books;
}

// Render favorite books UI
async function renderFavoriteBooksSection(uid) {
    const section = document.getElementById('favorite-books-section');
    if (!section) return;

    const grid = document.createElement('div');
    grid.className = "grid grid-cols-2 md:grid-cols-4 gap-6";

    const favoriteBooks = await fetchFavoriteBooks(uid);

    // Make favoriteBooks globally accessible for viewBookDetails
    window.lastFavoriteBooks = favoriteBooks;
    if (favoriteBooks.length === 0) {
        grid.innerHTML = `<div class="col-span-full text-center text-warm-brown opacity-70 py-8">No favorite books yet.</div>`;
    } else {
        favoriteBooks.forEach(book => {
            grid.innerHTML += `
                <div class="text-center group cursor-pointer" onclick="viewBookDetails('${book.id}')">
                    <div class="h-58 md:h-60 bg-gradient-to-br from-peach to-salmon rounded-2xl mb-4 flex items-center justify-center shadow-lg group-hover:scale-105 transition-transform duration-300 overflow-hidden">
                        ${
                            book.cover_url
                                ? `<img src="${book.cover_url}" alt="${book.title}" class="object-cover w-full h-full rounded-2xl" />`
                                : `<span class="text-white font-bold text-4xl md:text-5xl">📖</span>`
                        }
                    </div>
                    <h4 class="font-semibold text-space-brown text-base md:text-lg truncate" title="${book.title}">${book.title || 'Untitled'}</h4>
                    <p class="text-warm-brown text-sm md:text-base opacity-75 truncate" title="${book.author}">${book.author || ''}</p>
                </div>
            `;
        });
    }

    // Replace the old grid with the new one
    const oldGrid = section.querySelector('.grid');
    if (oldGrid) {
        oldGrid.replaceWith(grid);
    } else {
        section.appendChild(grid);
    }
}
window.viewBookDetails = function(bookId) {
    // Find the book in the current favoriteBooks array
    // You may want to pass the whole book object instead of just the ID for sessionStorage
    const book = window.lastFavoriteBooks?.find(b => b.id === bookId);
    if (book) {
        sessionStorage.setItem('selectedBook', JSON.stringify(book));
        window.location.href = 'books.html';
    }
};

// Main profile loading logic
onAuthStateChanged(auth, async (user) => {
    if (!user) {
        window.location.href = '../index.html';
        return;
    }
    currentUser = user;

    // Get uid from URL, fallback to current user
    const profileUid = getQueryParam('uid') || currentUser.uid;

    // Fetch profile user's data
    const profileUserRef = doc(db, "users", profileUid);
    const profileUserSnap = await getDoc(profileUserRef);
    if (!profileUserSnap.exists()) {
        alert("User not found!");
        window.location.href = "friends.html";
        return;
    }
    const profileUserData = profileUserSnap.data();

    // After you fetch the logged-in user's data (not the profile being viewed)
    const currentUserDoc = await getDoc(doc(db, "users", currentUser.uid));
    const currentUserData = currentUserDoc.data();
    if (navUserName) {
        navUserName.textContent = currentUserData.userName || 'Reader';
    }

    if (userName) userName.textContent = profileUserData.userName || '';
    if (bio) bio.textContent = profileUserData.bio || 'No bio available';
    if (favoriteGenre) favoriteGenre.textContent = profileUserData.favoriteGenre || 'Not specified';

    // Show books read and friends count for this profile
    if (booksReadCard) {
        const booksRead = await fetchBooksByStatus(profileUid, "finished");
        booksReadCard.textContent = booksRead.length || 0;
    }
    if (friendsCountCard) {
        const friendsObj = profileUserData.friends || {};
        friendsCountCard.textContent = Object.keys(friendsObj).length;
    }

    // Hide edit controls if viewing someone else's profile
    if (profileUid !== currentUser.uid) {
        const editBtns = document.querySelectorAll('.action-btn, #editProfileModal');
        editBtns.forEach(btn => btn.style.display = 'none');
    }

    await renderFavoriteBooksSection(profileUid);

});

async function loadUserProfile() {
    try {
        const userDoc = await getDoc(doc(db, 'users', currentUser.uid));
        if (userDoc.exists()) {
            userData = userDoc.data();
            //update UI with user data
            userName.textContent = userData.userName || userData.userName;
            bio.textContent = userData.bio || 'No bio available';
            favoriteGenre.textContent = userData.favoriteGenre || 'Not specified';

            // Update modal form fields
            usernameInput.value = userData.userName || '';
            document.getElementById('bioModal').value = userData.bio || '';
            document.getElementById('favoriteGenreModal').value = userData.favoriteGenre || '';
            document.getElementById('readingGoalModal').value = userData.readingGoal || '';
            document.getElementById('favoriteAuthorModal').value = userData.favoriteAuthor || '';
            document.getElementById('publicReadingList').checked = !!userData.publicReadingList;
            document.getElementById('showProgress').checked = !!userData.showProgress;
            document.getElementById('friendRecs').checked = !!userData.friendRecs;

            userData.booksRead = await fetchBooksByStatus("finished");
            booksReadCard.textContent = userData.booksRead.length || 0;

        } else {
            console.error('User document not found');

        }
        console.log('Loaded userData:', userData);
    } catch (error) {
        console.error('Error loading user data:', error);

    }
}

// Helper to fetch books by status for any user
async function fetchBooksByStatus(uid, status) {
    const books = [];
    const q = query(
        collection(db, "users", uid, "books"),
        where("status", "==", status)
    );
    const querySnapshot = await getDocs(q);
    querySnapshot.forEach((doc) => {
        books.push({ id: doc.id, ...doc.data() });
    });
    return books;
}



// Add some interactive functionality
document.addEventListener('DOMContentLoaded', function() {
    const modal = document.getElementById('editProfileModal');
    const modalContent = document.getElementById('modalContent');
    const openEditBtn = document.querySelector('.action-btn:first-of-type');
    const closeModalBtn = document.getElementById('closeModal');
    const cancelBtn = document.getElementById('cancelEdit');
    const form = document.getElementById('editProfileForm');
    const bioTextarea = document.getElementById('bio');
    const charCount = document.getElementById('charCount');

    // Add hover effects to stat cards
    const statCards = document.querySelectorAll('.stat-card');
    statCards.forEach(card => {
        card.addEventListener('mouseenter', function() {
            this.style.transform = 'translateY(-10px) scale(1.02)';
        });
        card.addEventListener('mouseleave', function() {
            this.style.transform = 'translateY(0) scale(1)';
        });
    });

    // Open Modal functions
    function openModal() {
        loadUserProfile(); 
        modal.classList.remove('opacity-0', 'pointer-events-none');
        modal.classList.add('opacity-100');
        modalContent.classList.remove('scale-95');
        modalContent.classList.add('scale-100');
        document.body.style.overflow = 'hidden';
    }

    // Close modal function
    function closeModal() {
        modal.classList.add('opacity-0', 'pointer-events-none');
        modal.classList.remove('opacity-100');
        modalContent.classList.add('scale-95');
        modalContent.classList.remove('scale-100');
        document.body.style.overflow = 'auto';
    }

    // Event listeners
    openEditBtn.addEventListener('click', openModal);
    closeModalBtn.addEventListener('click', closeModal);
    cancelBtn.addEventListener('click', closeModal);

    // Close modal when clicking outside
    modal.addEventListener('click', function(e) {
        if (e.target === modal) {
            closeModal();
        }
    });

    // Close modal with Escape key
    document.addEventListener('keydown', function(e) {
        if (e.key === 'Escape' && !modal.classList.contains('pointer-events-none')) {
            closeModal();
        }
    });

    // Character counter for bio
    bioTextarea.addEventListener('input', function() {
        const count = this.value.length;
        charCount.textContent = count;
        if (count > 300) {
            charCount.classList.add('text-space-red');
        } else {
            charCount.classList.remove('text-space-red');
        }
    });

    // Toggle switches
    document.querySelectorAll('input[type="checkbox"]').forEach(checkbox => {
        const toggleBg = checkbox.nextElementSibling;
        const toggleDot = toggleBg.querySelector('.toggle-dot');

        function updateToggle() {
            if (checkbox.checked) {
                toggleBg.classList.add('bg-salmon');
                toggleBg.classList.remove('bg-cream-medium');
                toggleDot.classList.add('translate-x-6');
                toggleDot.classList.remove('translate-x-0');
            } else {
                toggleBg.classList.remove('bg-salmon');
                toggleBg.classList.add('bg-cream-medium');
                toggleDot.classList.remove('translate-x-6');
                toggleDot.classList.add('translate-x-0');
            }
        }

        updateToggle();

        toggleBg.addEventListener('click', function() {
            checkbox.checked = !checkbox.checked;
            updateToggle();
        });
    });

    // Form submission
    form.addEventListener('submit', async function(e) {
        e.preventDefault();

        const usernameInput = document.getElementById('usernameModal');
        const bioInput = document.getElementById('bioModal');
        const favoriteGenreInput = document.getElementById('favoriteGenreModal');
        const readingGoalInput = document.getElementById('readingGoalModal');
        const favoriteAuthorInput = document.getElementById('favoriteAuthorModal');
        const publicReadingListInput = document.getElementById('publicReadingList').checked;
        const showProgressInput = document.getElementById('showProgress').checked;
        const friendRecsInput = document.getElementById('friendRecs').checked;

        const userName = usernameInput.value.trim();
        const bio = bioInput.value.trim();
        const favoriteGenre = favoriteGenreInput.value.trim();
        const readingGoal = readingGoalInput.value.trim();
        const favoriteAuthor = favoriteAuthorInput.value.trim();

        //Validate inputs
        if (!userName) {
            alert('Please enter a username.');
            return;
        }
        if (!favoriteGenre) {
            alert('Please select a favorite genre.');
            return;
        }
        if (readingGoal && isNaN(readingGoal)) {
            alert('Reading goal must be a number.');
            return;
        }
        if (favoriteAuthor && favoriteAuthor.length > 100) {
            alert('Favorite author cannot exceed 100 characters.');
            return;
        }

        try {
                // Save user data to Firestore
                const userRef = doc(db, 'users', currentUser.uid);
                await updateDoc(userRef, {
                    userName: userName,
                    bio: bio,
                    favoriteGenre: favoriteGenre,
                    readingGoal: readingGoal,
                    favoriteAuthor: favoriteAuthor,
                    publicReadingList: publicReadingListInput,
                    showProgress: showProgressInput,
                    friendRecs: friendRecsInput,
                    lastActive: new Date().toISOString()
                }, { merge: true });
                
                // Update local userData
                userData = {
                    ...userData,
                    userName,
                    bio,
                    favoriteGenre,
                    readingGoal,
                    favoriteAuthor,
                    publicReadingList: publicReadingListInput,
                    showProgress: showProgressInput,
                    friendRecs: friendRecsInput,
                    lastActive: new Date().toISOString()
                };

        } catch (error) {
                console.error('Error saving user data:', error);
                alert('Sorry, there was an error setting up your profile. Please try again.');
            }
        // Show success message
        const submitBtn = form.querySelector('button[type="submit"]');
        const originalText = submitBtn.textContent;
        submitBtn.textContent = 'Saved! ✓';
        submitBtn.classList.add('bg-green-500');
        submitBtn.classList.remove('bg-space-red');

        setTimeout(() => {
            submitBtn.textContent = originalText;
            submitBtn.classList.remove('bg-green-500');
            submitBtn.classList.add('bg-space-red');
            closeModal();
            // Reload the page to show updated changes
            window.location.reload();
        }, 1500);
    });

    // Share Profile button
    document.querySelector('.action-btn:last-of-type').addEventListener('click', function() {
        if (navigator.share) {
            navigator.share({
                title: 'Sarah Johnson\'s Reading Profile - My Book Space',
                text: 'Check out my reading journey on My Book Space!',
                url: window.location.href
            });
        } else {
            // Fallback for browsers that don't support Web Share API
            navigator.clipboard.writeText(window.location.href).then(() => {
                alert('Profile link copied to clipboard!');
            });
        }
    });
});

