import { initializeApp } from "https://www.gstatic.com/firebasejs/11.8.1/firebase-app.js";
import { getAnalytics } from "https://www.gstatic.com/firebasejs/11.8.1/firebase-analytics.js";
import { getAuth, onAuthStateChanged, signOut} from "https://www.gstatic.com/firebasejs/11.8.1/firebase-auth.js";
import { getFirestore, doc, getDoc, collection, query, orderBy, limit, getDocs, where } from "https://www.gstatic.com/firebasejs/11.8.1/firebase-firestore.js";


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

    // Auth state observer
    onAuthStateChanged(auth, async (user) => {
        if (user) {
            currentUser = user;
            await loadUserData();
        } else {
            window.location.href = 'login.html';
        }
    });

    // Load user data from Firestore
    async function loadUserData() {
        try {
            const userDoc = await getDoc(doc(db, 'users', currentUser.uid));
            if (userDoc.exists()) {
                userData = userDoc.data();
                updateDashboard();
            } else {
                console.error('User document not found');
            }
        } catch (error) {
            console.error('Error loading user data:', error);
        }
    }

    // Update dashboard with user data
    function updateDashboard() {
        // Welcome message
        document.getElementById('welcome-message').textContent = 
            `Welcome back, ${userData.fullName || currentUser.displayName || 'Reader'}! 📚`;

        // Calculate stats
        const booksRead = userData.booksRead?.length || 0;
        const currentlyReading = userData.currentlyReading?.length || 0;
        const totalPages = userData.booksRead?.reduce((total, book) => total + (book.pages || 0), 0) || 0;
        const readingGoal = userData.readingGoal || 12; // Default goal of 12 books per year
        const goalProgress = Math.min((booksRead / readingGoal) * 100, 100);

        // Update stats
        document.getElementById('books-read').textContent = booksRead;
        document.getElementById('currently-reading').textContent = currentlyReading;
        document.getElementById('total-pages').textContent = totalPages.toLocaleString();
        document.getElementById('goal-progress').textContent = `${booksRead}/${readingGoal}`;
        
        // Update progress bar
        const progressBar = document.getElementById('progress-bar');
        const progressCircle = document.getElementById('progress-circle');
        progressBar.style.width = `${goalProgress}%`;
        
        // Update circular progress
        const circumference = 2 * Math.PI * 45;
        const strokeDasharray = `${(goalProgress / 100) * circumference} ${circumference}`;
        progressCircle.style.strokeDasharray = strokeDasharray;

        // Update continue reading section
        updateContinueReading();
        updateRecentActivity();
    }

    // Update continue reading section
    function updateContinueReading() {
        const continueReadingContainer = document.getElementById('continue-reading-books');
        const currentBooks = userData.currentlyReading || [];
        
        if (currentBooks.length === 0) {
            continueReadingContainer.innerHTML = `
                <div class="text-center py-8">
                    <div class="text-4xl mb-4">📖</div>
                    <p class="text-gray-600">No books in progress</p>
                    <a href="add-book.html" class="text-space-red hover:underline mt-2 inline-block">Add a book to start reading</a>
                </div>
            `;
            return;
        }

        continueReadingContainer.innerHTML = currentBooks.slice(0, 3).map(book => `
            <div class="glass-card rounded-xl p-4 hover:shadow-lg transition-all duration-300 cursor-pointer">
                <div class="flex items-center space-x-4">
                    <div class="book-spine w-12 h-16 rounded-sm flex-shrink-0"></div>
                    <div class="flex-grow">
                        <h4 class="font-semibold text-space-brown truncate">${book.title}</h4>
                        <p class="text-sm text-gray-600 truncate">${book.author}</p>
                        <div class="mt-2">
                            <div class="bg-gray-200 rounded-full h-2">
                                <div class="bg-space-red h-2 rounded-full transition-all duration-300" 
                                        style="width: ${(book.currentPage || 0) / (book.totalPages || 1) * 100}%"></div>
                            </div>
                            <p class="text-xs text-gray-500 mt-1">${book.currentPage || 0}/${book.totalPages || 0} pages</p>
                        </div>
                    </div>
                </div>
            </div>
        `).join('');
    }

    // Update recent activity
    function updateRecentActivity() {
        const recentActivityContainer = document.getElementById('recent-activity');
        const activities = [];
        
        // Add recently read books
        if (userData.booksRead && userData.booksRead.length > 0) {
            userData.booksRead.slice(-3).reverse().forEach(book => {
                activities.push({
                    type: 'completed',
                    message: `Finished reading "${book.title}"`,
                    time: book.dateCompleted || 'Recently',
                    icon: '✅'
                });
            });
        }

        // Add currently reading books
        if (userData.currentlyReading && userData.currentlyReading.length > 0) {
            userData.currentlyReading.slice(-2).forEach(book => {
                activities.push({
                    type: 'reading',
                    message: `Started reading "${book.title}"`,
                    time: book.dateStarted || 'Recently',
                    icon: '📖'
                });
            });
        }

        if (activities.length === 0) {
            recentActivityContainer.innerHTML = `
                <div class="text-center py-6">
                    <div class="text-3xl mb-2">🌟</div>
                    <p class="text-gray-600">No recent activity</p>
                    <p class="text-sm text-gray-500">Start adding books to see your reading journey!</p>
                </div>
            `;
            return;
        }

        recentActivityContainer.innerHTML = activities.slice(0, 5).map(activity => `
            <div class="flex items-center space-x-3 p-3 hover:bg-white hover:bg-opacity-50 rounded-lg transition-colors">
                <span class="text-2xl">${activity.icon}</span>
                <div class="flex-grow">
                    <p class="text-sm font-medium text-space-brown">${activity.message}</p>
                    <p class="text-xs text-gray-500">${activity.time}</p>
                </div>
            </div>
        `).join('');
    }

    // Logout function
    window.logout = async function() {
        try {
            await signOut(auth);
            window.location.href = 'login-signup/login.html';
        } catch (error) {
            console.error('Logout error:', error);
        }
    }

    // Initialize dashboard when DOM is loaded
    document.addEventListener('DOMContentLoaded', function() {
        // Add click handlers for navigation
        document.querySelectorAll('[data-nav]').forEach(item => {
            item.addEventListener('click', function(e) {
                const target = this.getAttribute('data-nav');
                if (target === 'logout') {
                    e.preventDefault();
                    logout();
                }
            });
        });
    });