import { initializeApp } from "https://www.gstatic.com/firebasejs/11.8.1/firebase-app.js";
import { getAnalytics } from "https://www.gstatic.com/firebasejs/11.8.1/firebase-analytics.js";
import { getAuth, onAuthStateChanged, signOut} from "https://www.gstatic.com/firebasejs/11.8.1/firebase-auth.js";
import { getFirestore, doc, getDoc, setDoc, collection, query, orderBy, limit, getDocs, where, updateDoc, deleteDoc } from "https://www.gstatic.com/firebasejs/11.8.1/firebase-firestore.js";
import { fetchBooksByStatus } from './functions/fetchBookStatus.js';

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
let allBooks = [];


// Auth state observer
onAuthStateChanged(auth, async (user) => {

    if (user) {
        if (user.emailVerified){
            currentUser = user;

            console.log("Current user:", user);
            // Fetch all books
            const q = query(collection(db, "users", currentUser.uid, "books"));
            const snapshot = await getDocs(q);
            allBooks = [];
            snapshot.forEach(docSnap => {
            allBooks.push({ id: docSnap.id, ...docSnap.data() });
            });

            await loadUserData();
            handleReadingFormModal();
        } 
    } else {
        window.location.href = '../index.html';
    }
});

// Load user data from Firestore
async function loadUserData() {
    try {
        const userDoc = await getDoc(doc(db, 'users', currentUser.uid));
        if (userDoc.exists()) {
            userData = userDoc.data();
            const userName = userData.userName || userData.userName;
            if (!userName) {
                showNameEntryModal();
            } else {
                // Fetch books by status
                    userData.reading = await fetchBooksByStatus(currentUser.uid, "reading");
                    userData.booksRead = await fetchBooksByStatus(currentUser.uid, "finished");
                    userData.wantToRead = await fetchBooksByStatus(currentUser.uid, "wantToRead");
                showDashboard();
            }

        } else {
            console.error('User document not found');
            showNameEntryModal();
        }
        console.log('Loaded userData:', userData);
    } catch (error) {
        console.error('Error loading user data:', error);
        showNameEntryModal();
    }
}
// Show/hide dashboard functions
function hideDashboard() {
    const mainContent = document.querySelector('main');
    const nav = document.querySelector('nav');
    const mobileNav = document.querySelector('.md\\:hidden');
    const footer = document.querySelector('footer');
    
    if (mainContent) mainContent.style.display = 'none';
    if (nav) nav.style.display = 'none';
    if (mobileNav) mobileNav.style.display = 'none';
    if (footer) footer.style.display = 'none';
}

function showDashboard() {
    const mainContent = document.querySelector('main');
    const nav = document.querySelector('nav');
    const mobileNav = document.querySelector('.md\\:hidden');
    const footer = document.querySelector('footer');
    
    if (mainContent) mainContent.style.display = 'block';
    if (nav) nav.style.display = 'block';
    if (mobileNav) mobileNav.style.display = 'flex';
    if (footer) footer.style.display = 'block';

    showWelcomeAnimation();
}

// Show name entry modal
function showNameEntryModal() {
    hideDashboard();
    // Create modal HTML
    const modalHTML = `
        <div id="name-entry-modal" class="fixed inset-0 z-50 flex items-center justify-center">
            <!-- Background overlay -->
            <div class="absolute inset-0 bg-gradient-to-br from-cream-light via-space-pink-light to-peach opacity-95"></div>
            
            <!-- Floating background elements -->
            <div class="absolute top-10 left-10 text-6xl opacity-20 animate-float">📚</div>
            <div class="absolute bottom-20 right-16 text-5xl opacity-15 animate-float-delayed">📖</div>
            <div class="absolute top-1/3 right-8 text-4xl opacity-10 animate-float-delayed-2">✨</div>
            <div class="absolute bottom-1/3 left-12 text-5xl opacity-15 animate-float">🌸</div>
            
            <!-- Modal content -->
            <div class="relative z-10 bg-white bg-opacity-95 backdrop-blur-lg rounded-3xl p-8 md:p-12 max-w-md w-full mx-4 shadow-2xl border border-space-pink-dark border-opacity-30">
                <div class="text-center mb-8">
                    <div class="text-6xl mb-4 animate-pulse-gentle">🌟</div>
                    <h1 class="text-3xl md:text-4xl font-bold gradient-text mb-4 font-serif">Welcome to</h1>
                    <h2 class="text-2xl md:text-3xl font-bold text-space-red mb-2 font-serif">myBookSpace!</h2>
                    <p class="text-warm-brown opacity-80 text-lg">Let's personalize your reading journey</p>
                </div>
                
                <form id="name-entry-form" class="space-y-6">
                    <div>
                        <label for="fullName" class="block text-space-brown font-semibold mb-3 text-lg">Whats your Full Name?</label>
                        <input 
                            type="text" 
                            id="fullName" 
                            name="fullName" 
                            placeholder="Enter your full name..." 
                            class="w-full px-4 py-3 border-2 border-cream-medium rounded-xl focus:border-space-red focus:outline-none transition-colors text-space-brown bg-white bg-opacity-80 backdrop-blur-sm text-lg"
                            required
                            autocomplete="name"
                        >
                    </div>

                    <div>
                        <label for="userName" class="block text-space-brown font-semibold mb-3 text-lg">What should we call you? (Public)</label>
                        <input 
                            type="text" 
                            id="userName" 
                            name="userName" 
                            placeholder="Enter your  username..." 
                            class="w-full px-4 py-3 border-2 border-cream-medium rounded-xl focus:border-space-red focus:outline-none transition-colors text-space-brown bg-white bg-opacity-80 backdrop-blur-sm text-lg"
                            required
                            autocomplete="username"
                        >
                    </div>
                    
                    <div>
                        <label for="readingGoal" class="block text-space-brown font-semibold mb-3 text-lg">Books you'd like to read this year?</label>
                        <select 
                            id="readingGoal" 
                            name="readingGoal" 
                            class="w-full px-4 py-3 border-2 border-cream-medium rounded-xl focus:border-space-red focus:outline-none transition-colors text-space-brown bg-white bg-opacity-80 backdrop-blur-sm text-lg"
                        >
                            <option value="12">12 books (1 per month)</option>
                            <option value="24">24 books (2 per month)</option>
                            <option value="36">36 books (3 per month)</option>
                            <option value="50">50 books (Challenge yourself!)</option>
                            <option value="60" selected>60 books (Power reader!)</option>
                            <option value="100">100 books (Bookworm extraordinaire!)</option>
                        </select>
                    </div>
                    
                    <button 
                        type="submit" 
                        class="w-full bg-gradient-to-r from-space-red to-rose-red text-white py-4 px-6 rounded-xl font-bold text-lg hover:from-rose-red hover:to-space-red transition-all duration-300 transform hover:scale-105 shadow-lg hover:shadow-xl"
                        id="submit-name-btn"
                    >
                        <span id="btn-text">Start My Reading Journey 🚀</span>
                        <span id="btn-loading" class="hidden">Setting up your space... ✨</span>
                    </button>
                </form>
                
                <div class="text-center mt-6">
                    <p class="text-sm text-warm-brown opacity-70">
                        Don't worry, you can change these settings later!
                    </p>
                </div>
            </div>
        </div>
    `;
    
    // Insert modal into body
    document.body.insertAdjacentHTML('beforeend', modalHTML);
    
    // Add event listener for form submission
    const form = document.getElementById('name-entry-form');
    form.addEventListener('submit', handleNameSubmission);
    
    // Focus on name input
    setTimeout(() => {
        document.getElementById('fullName').focus();
        document.getElementById('userName').focus();
    }, 500);
}

// Handle name submission
async function handleNameSubmission(e) {
    e.preventDefault();
    
    const submitBtn = document.getElementById('submit-name-btn');
    const btnText = document.getElementById('btn-text');
    const btnLoading = document.getElementById('btn-loading');
    const fullNameInput = document.getElementById('fullName');
    const userNameInput = document.getElementById('userName');
    const readingGoalInput = document.getElementById('readingGoal');
    
    const fullName = fullNameInput.value.trim();
    const userName = userNameInput.value.trim();
    const readingGoal = parseInt(readingGoalInput.value);

    // Validate inputs
    if (!fullName) {
        fullNameInput.focus();
        fullNameInput.classList.add('border-red-500');
        return;
    }
    if (!userName) {
        userNameInput.focus();
        userNameInput.classList.add('border-red-500');
        return;
    }
    
    // Show loading state
    submitBtn.disabled = true;
    btnText.classList.add('hidden');
    btnLoading.classList.remove('hidden');
    
    try {
        // Save user data to Firestore
        const userRef = doc(db, 'users', currentUser.uid);
        await setDoc(userRef, {
            fullName: fullName,
            userId: currentUser.uid,
            userName: userName,
            readingGoal: readingGoal,
            dateJoined: new Date().toISOString(),
            lastActive: new Date().toISOString(),
            friends: {}
        }, { merge: true });
        
        // Update local userData
        userData = {
            fullName: fullName,
            userId: currentUser.uid,
            userName: userName,
            readingGoal: readingGoal,
            dateJoined: new Date().toISOString(),
            lastActive: new Date().toISOString(),
            friends: {}
        };
        
        // Remove modal with animation
        const modal = document.getElementById('name-entry-modal');
        modal.style.opacity = '0';
        modal.style.transform = 'scale(0.95)';
        modal.style.transition = 'all 0.3s ease-out';
        
        setTimeout(() => {
            modal.remove();
            showDashboard();
            
            // Show welcome animation
            showWelcomeAnimation(userName);
        }, 300);
        
    } catch (error) {
        console.error('Error saving user data:', error);
        alert('Sorry, there was an error setting up your profile. Please try again.');
        
        // Reset button state
        submitBtn.disabled = false;
        btnText.classList.remove('hidden');
        btnLoading.classList.add('hidden');
    }
}

// Show welcome animation after setup
function showWelcomeAnimation() {
    // Update welcome message
    const welcomeElement = document.querySelector('.gradient-text');
    if (welcomeElement) {
        const userName = userData.userName;
        welcomeElement.textContent = `Welcome back, ${userName}! 🌸`;
    }

    // Update user name in nav
    const navUserName = document.getElementById('nav-user-name');
    if (navUserName && navUserName.textContent === 'Reader') {
        navUserName.textContent = userData.userName || 'Reader';
    }

    // Calculate and update stats
    updateReadingStats();
    updateCurrentlyReadingSection();
    updateReadingGoalSection();
}

// Update reading statistics
function updateReadingStats() {
    const booksRead = userData.booksRead?.length || 0;
    const currentlyReading = userData.reading?.length || 0;
    const wantToRead = userData.wantToRead?.length || 0;

    // Update Books Read stat
    const booksReadElements = document.querySelectorAll('.stat-card');
    if (booksReadElements[0]) {
        const countElement = booksReadElements[0].querySelector('.text-4xl.font-bold');
        const monthlyElement = booksReadElements[0].querySelector('.text-xs.text-warm-brown.opacity-70');
        if (countElement) countElement.textContent = booksRead;
        
        // Calculate books read this month (if dateCompleted exists)
        const thisMonth = new Date().getMonth();
        const thisYear = new Date().getFullYear();
        const booksThisMonth = userData.booksRead?.filter(book => {
            if (book.dateCompleted) {
                const bookDate = new Date(book.dateCompleted);
                return bookDate.getMonth() === thisMonth && bookDate.getFullYear() === thisYear;
            }
            return false;
        }).length || 0;
        
        // if (monthlyElement) {
        //     monthlyElement.textContent = `+${booksThisMonth} this month`;
        // }
    }

    // Update Currently Reading stat
    if (booksReadElements[1]) {
        const countElement = booksReadElements[1].querySelector('.text-4xl.font-bold');
        if (countElement) countElement.textContent = currentlyReading;
    }

    // Update Want to Read stat
    if (booksReadElements[2]) {
        const countElement = booksReadElements[2].querySelector('.text-4xl.font-bold');
        if (countElement) countElement.textContent = wantToRead;
    }
}

// // Update reading statistics
// async function updateReadingStats() {
//     // Fetch all books for the current user
//     const booksRef = collection(db, "users", currentUser.uid, "books");
//     const booksSnapshot = await getDocs(booksRef);
//     let booksRead = 0;
//     let reading = 0;
//     let wantToRead = 0;
//     let booksThisMonth = 0;

//     const thisMonth = new Date().getMonth();
//     const thisYear = new Date().getFullYear();

//     booksSnapshot.forEach((doc) => {
//         const book = doc.data();
//         if (book.status === "finished") {
//             booksRead++;
//             if (book.dateCompleted) {
//                 const bookDate = new Date(book.dateCompleted);
//                 if (bookDate.getMonth() === thisMonth && bookDate.getFullYear() === thisYear) {
//                     booksThisMonth++;
//                 }
//             }
//         } else if (book.status === "reading") {
//             currentlyReading++;
//         } else if (book.status === "wantToRead") {
//             wantToRead++;
//         }
//     });

//     // Update Books Read stat
//     const booksReadElements = document.querySelectorAll('.stat-card');
//     if (booksReadElements[0]) {
//         const countElement = booksReadElements[0].querySelector('.text-4xl.font-bold');
//         const monthlyElement = booksReadElements[0].querySelector('.text-xs.text-warm-brown.opacity-70');
//         if (countElement) countElement.textContent = booksRead;
//         if (monthlyElement) {
//             monthlyElement.textContent = `+${booksThisMonth} this month`;
//         }
//     }

//     // Update Currently Reading stat
//     if (booksReadElements[1]) {
//         const countElement = booksReadElements[1].querySelector('.text-4xl.font-bold');
//         if (countElement) countElement.textContent = currentlyReading;
//     }

//     // Update Want to Read stat
//     if (booksReadElements[2]) {
//         const countElement = booksReadElements[2].querySelector('.text-4xl.font-bold');
//         if (countElement) countElement.textContent = wantToRead;
//     }
// }

// Update Currently Reading section the continue your journey part
function updateCurrentlyReadingSection() {
    const currentlyReadingContainer = document.querySelector('.grid.grid-cols-1.md\\:grid-cols-2.lg\\:grid-cols-3.gap-8');
    
    if (!currentlyReadingContainer) return;

    const currentBooks = userData.reading || [];
    
    if (currentBooks.length === 0) {
        currentlyReadingContainer.innerHTML = `
            <div class="col-span-full text-center py-12">
                <div class="text-6xl mb-4 opacity-50">📚</div>
                <h3 class="text-2xl font-semibold text-space-brown mb-4">No books in progress</h3>
                <p class="text-warm-brown opacity-75 mb-6">Ready to start your next reading adventure?</p>
                <button onclick="window.location.href='add_books.html'" class="bg-space-red text-white px-8 py-3 rounded-full font-semibold hover:bg-opacity-90 transition-all transform hover:scale-105 shadow-lg">
                    Add Your First Book
                </button>
            </div>
        `;
        return;
        
    }

    // Display up to 3 currently reading books
    const displayBooks = currentBooks.slice(0, 3);
    
    currentlyReadingContainer.innerHTML = displayBooks.map((book, index) => {
        // Prefer the 'progress' field from Firestore if it exists, else calculate from currentPage/totalPages
        const progress = book.progress || 0;
           
        // Use the cover_url if available, else fallback
        const coverUrl = book.cover_url || "https://via.placeholder.com/150?text=No+Cover";

        const gradients = [
            'from-peach to-salmon',
            'from-salmon to-rose-red',
            'from-space-pink-dark to-space-red'
        ];
        
        // const icons = ['📖', '📚', '✨'];
        
        return `
            <div class="book-preview-card rounded-2xl p-6 group cursor-pointer" onclick="window.openReadingModalFromDashboard('${book.id || index}')">
                <div class="h-50 bg-gradient-to-br ${gradients[index % 3]} rounded-xl mb-4 flex items-center justify-center shadow-lg group-hover:scale-105 transition-transform duration-300">
                    <img src="${coverUrl}" alt="Cover for ${book.title}" class="object-cover h-full w-full rounded-xl" style="max-height:100%;max-width:100%;" onerror="this.onerror=null;this.src='https://via.placeholder.com/150?text=No+Cover';">
                </div>
                <h3 class="font-bold text-space-brown mb-2 text-lg truncate">${book.title}</h3>
                <p class="text-warm-brown text-sm opacity-75 mb-3 truncate">by ${book.author}</p>
                <div class="mb-2">

                    <div class="flex justify-between text-xs mb-1">
                        <span class="text-warm-brown">Progress</span>
                        <span class="text-space-red font-semibold">${progress}%</span>
                    </div>
                    <div class="w-full bg-cream-medium rounded-full h-2">
                        <div class="progress-bar rounded-full transition-all duration-500" style="width: ${progress}%"></div>
                    </div>
                </div>
                <p class="text-xs text-warm-brown opacity-60 mt-2">
                    ${book.currentPage || 0} of ${book.totalPages || 0} pages
                </p>
            </div>
        `;
    }).join('');

    // If there are more than 3 books, add a "View All" card
    if (currentBooks.length > 3) {
        currentlyReadingContainer.innerHTML += `
            <div class="book-preview-card rounded-2xl p-6 group cursor-pointer flex items-center justify-center text-center bg-opacity-50" onclick="window.location.href='mybooks.html'">
                <div>
                    <div class="text-4xl mb-2 opacity-60">📚</div>
                    <p class="text-space-brown font-semibold">+${currentBooks.length - 3} more books</p>
                    <p class="text-sm text-warm-brown opacity-75">View all reading</p>
                </div>
            </div>
        `;
    }
}

// Update Reading Goal section
function updateReadingGoalSection() {
    const goalSection = document.querySelector('.glass-card.rounded-3xl.p-8.text-center');
    if (!goalSection) return;

    const booksRead = userData.booksRead?.length || 0;
    const readingGoal = userData.readingGoal || 60;
    // Calculate progress based on books read and reading goal
    const progress = readingGoal > 0 ? (booksRead / readingGoal) * 100 : 0;

    // Update the numbers
    const currentCountElement = goalSection.querySelector('.text-5xl.font-bold');
    const goalCountElement = goalSection.querySelector('.text-3xl.font-semibold');
    const progressBar = goalSection.querySelector('.progress-bar');
    const progressText = goalSection.querySelector('p.text-warm-brown.text-sm');

    if (currentCountElement) currentCountElement.textContent = booksRead;
    if (goalCountElement) goalCountElement.textContent = readingGoal;
    if (progressBar) progressBar.style.width = `${progress}%`;
    
    if (progressText) {
        const roundedProgress = Math.round(progress);
        if (roundedProgress >= 100) {
            progressText.textContent = "🎉 Congratulations! You've reached your reading goal! 🎉";
        } else if (roundedProgress >= 75) {
            progressText.textContent = `You're ${roundedProgress}% of the way to your goal! Almost there! 🌟`;
        } else if (roundedProgress >= 50) {
            progressText.textContent = `You're ${roundedProgress}% of the way to your goal! Keep it up! 📚`;
        } else {
            progressText.textContent = `You're ${roundedProgress}% of the way to your goal! Every book counts! 💪`;
        }
    }
}

function openReadingModal(bookData = {}) {
    window.editingBookId = bookData.id;
    document.getElementById('reading-modal').classList.remove('hidden');
    // Populate modal fields
    document.getElementById('reading-title').value = bookData.title || '';
    document.getElementById('reading-author').value = bookData.author || '';
    document.getElementById('reading-progress').value = bookData.progress || 0;
    document.getElementById('progress-display').textContent = (bookData.progress || 0) + '%';
    document.getElementById('reading-status').value = bookData.status || 'reading';
}
function closeReadingModal() {
    document.getElementById('reading-modal').classList.add('hidden');
}

// Handle book details (placeholder function)
function handleReadingFormModal() {
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
        closeReadingModal();
        window.location.reload();
    };


}

// Add click handlers for Continue Reading button
function setupContinueReadingButton() {
    const continueReadingBtn = document.querySelector('button:contains("Continue Reading")');
    if (continueReadingBtn) {
        continueReadingBtn.addEventListener('click', () => {
            const currentBooks = userData.reading || [];
            if (currentBooks.length > 0) {
                // Scroll to currently reading section
                document.querySelector('.glass-card.rounded-3xl.p-8').scrollIntoView({ behavior: 'smooth' });
            } else {
                window.location.href = '.html';
            }
        });
    }
}

// Add click handlers for navigation and buttons
function setupEventListeners() {
    // Continue Reading button
    const continueBtn = document.querySelector('button');
    if (continueBtn && continueBtn.textContent.includes('Continue Reading')) {
        continueBtn.addEventListener('click', () => {
            const currentBooks = userData.reading || [];
            if (currentBooks.length > 0) {
                document.querySelector('.glass-card.rounded-3xl.p-8').scrollIntoView({ behavior: 'smooth' });
            } else {
                window.location.href = 'add_books.html';
            }
        });
    }

    // Add New Book button
    const addBookBtn = document.querySelectorAll('button')[1];
    if (addBookBtn && addBookBtn.textContent.includes('Add New Book')) {
        addBookBtn.addEventListener('click', () => {
            window.location.href = 'add_books.html';
        });
    }

    // Quick Action buttons
    const actionButtons = document.querySelectorAll('.action-button');
    actionButtons.forEach(button => {
        const buttonText = button.querySelector('.button-text').textContent.trim();
        button.addEventListener('click', (e) => {
            e.preventDefault();
            switch(buttonText) {
                case 'Add Book':
                    window.location.href = 'add_books.html';
                    break;
                case 'My Books':
                    window.location.href = 'mybooks.html';
                    break;
                case 'Recommendations':
                    window.location.href = '../recommendations.html';
                    break;
            }
        });
    });

    // Logout button
    const logoutBtn = document.getElementById('logout');
    if (logoutBtn) {
        logoutBtn.addEventListener('click', logout);
    }

    // Mobile navigation
    const mobileNavLinks = document.querySelectorAll('.md\\:hidden a');
    mobileNavLinks.forEach(link => {
        const text = link.querySelector('span:last-child').textContent;
        link.addEventListener('click', (e) => {
            e.preventDefault();
            switch(text) {
                case 'Dashboard':
                    window.location.href = 'dashboard.html';
                    break;
                case 'Friends & Feed':
                    window.location.href = 'friends.html';
                    break;
                case 'Recommendations':
                    window.location.href = '../recommendations.html';
                    break;
            }
        });
    });
}

// Logout function
async function logout() {
    try {
        await signOut(auth);
        window.location.href = '../index.html';
    } catch (error) {
        console.error('Logout error:', error);
        alert('Error logging out. Please try again.');
    }
}

// Utility function to find elements by text content
function findElementByText(selector, text) {
    const elements = document.querySelectorAll(selector);
    return Array.from(elements).find(el => el.textContent.includes(text));
}

// Dropdown toggle function
function toggleDropdown() {
    const dropdown = document.getElementById('user-dropdown');
    dropdown.classList.toggle('hidden');
}

// Close dropdown when clicking outside
document.addEventListener('click', function(event) {
    const dropdown = document.getElementById('user-dropdown');
    const button = event.target.closest('button');
    
    if (!button || !button.onclick || button.onclick.toString().indexOf('toggleDropdown') === -1) {
        dropdown.classList.add('hidden');
    }
})
// Progress slider update
document.getElementById('reading-progress').addEventListener('input', function() {
    document.getElementById('progress-display').textContent = `${this.value}%`;
});

// Initialize dashboard when DOM is loaded
document.addEventListener('DOMContentLoaded', function() {
    console.log('Dashboard initialized');
    
    // Set up event listeners (will be called after dashboard is shown)
    setTimeout(setupEventListeners, 1000);
});

window.openReadingModalFromDashboard = function(bookId) {
    // Find the book in currently reading
    const book = (userData.reading || []).find(b => b.id === bookId);
    if (book) {
        openReadingModal(book);
    } else {
        alert('Book not found!');
    }
};

window.openReadingModal = openReadingModal;
window.closeReadingModal = closeReadingModal;

// Export functions for global access
window.logout = logout;
window.toggleDropdown = toggleDropdown;