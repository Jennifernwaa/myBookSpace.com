
import { initializeApp } from "https://www.gstatic.com/firebasejs/11.8.1/firebase-app.js";
import { getAnalytics } from "https://www.gstatic.com/firebasejs/11.8.1/firebase-analytics.js";
import { getAuth, onAuthStateChanged, signOut} from "https://www.gstatic.com/firebasejs/11.8.1/firebase-auth.js";
import { getFirestore, doc, getDoc, setDoc, collection, query, orderBy, limit, getDocs, where, updateDoc, deleteDoc, arrayUnion, arrayRemove } from "https://www.gstatic.com/firebasejs/11.8.1/firebase-firestore.js";

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


const searchInput = document.getElementById("searchInput");
const searchResults = document.getElementById("searchResults");
const friendsList = document.getElementById("friends-list");
const friendCount = document.getElementById("friendCount");
const friendCountDisplay = document.getElementById("friendCountDisplay");
const emptyState = document.getElementById("emptyState");


let currentUserId = null;
let currentUserFriends = {};
let allUsers = {};

onAuthStateChanged(auth, async (user) => {
    if (!user) return;
    currentUserId = user.uid;
    const navUserName = document.getElementById('nav-user-name');

    // Fetch all users
    const allUsersSnap = await getDocs(collection(db, "users"));
    allUsers = {};
    allUsersSnap.forEach(docSnap => {
        allUsers[docSnap.id] = { id: docSnap.id, ...docSnap.data() };
    });

    // Fetch current user's friends object
    const currentUserRef = doc(db, "users", currentUserId);
    const currentUserSnap = await getDoc(currentUserRef);
    const currentUserData = currentUserSnap.data();
    currentUserFriends = currentUserData.friends || {};
    if (navUserName && navUserName.textContent === 'Reader') {
        navUserName.textContent = currentUserData.userName || 'Reader';
    }
    
    renderFriendsList();
});
        // Update friend counts
        function updateFriendCounts() {
            const count = Object.keys(currentUserFriends).length;
            friendCount.textContent = count;
            friendCountDisplay.textContent = `${count} wonderful friend${count !== 1 ? 's' : ''}`;
        }

        // Create user card for search/friends list
        function createUserCard(user, isFriend, isSearch = false) {
            const card = document.createElement("div");
            
            if (isSearch) {
                card.className = "search-result-card rounded-xl p-6 flex justify-between items-center animate-fade-in-up";
                card.innerHTML = `
                    <div class="flex items-center space-x-4">
                        <div class="w-12 h-12 bg-gradient-to-br from-peach to-salmon rounded-full flex items-center justify-center shadow-lg">
                            <span class="text-white font-semibold text-lg">${user.userName.charAt(0).toUpperCase()}</span>
                        </div>
                        <div>
                            <p class="font-semibold text-space-brown text-lg">${user.userName || "Unnamed"}</p>
                            <p class="text-sm text-warm-brown opacity-70">${user.email || ""}</p>
                        </div>
                    </div>
                    <button class="${isFriend ? "bg-gradient-to-r from-red-600 to-red-600 hover:from-red-500 hover:to-red-700" : "add-friend-btn"} text-white px-6 py-3 rounded-xl font-semibold transition-all relative z-10"
                        data-userid="${user.id}">
                        <span class="relative z-10">${isFriend ? "Remove Friend" : "Add Friend"}</span>
                    </button>
                `;
            } else {
                card.className = "friend-card rounded-2xl p-6 animate-fade-in-up";
                card.innerHTML = `
                    <div class="relative z-10 py-4 px-3 rounded-xl shadow-lg" style="border: 2px solid #cb766633;">
                        <div class="flex items-center space-x-4 mb-4">
                            <div class="w-16 h-16 bg-gradient-to-br from-peach to-salmon rounded-full flex items-center justify-center shadow-lg animate-pulse-gentle">
                                <span class="text-white font-bold text-xl">${user.userName.charAt(0).toUpperCase()}</span>
                            </div>
                            <div class="flex-1">
                                <h3 class="font-bold text-space-brown text-xl">${user.userName || "Unnamed"}</h3>
                                <p class="text-warm-brown opacity-75">${user.email || ""}</p>
                                <div class="flex items-center space-x-2 mt-2">
                                    <span class="text-xs bg-cream-light px-2 py-1 rounded-full text-warm-brown">📚 Reading Buddy</span>
                                    <span class="text-xs bg-space-pink-light px-2 py-1 rounded-full text-rose-red">✨ Book Lover</span>
                                </div>
                            </div>
                        </div>
                        <div class="bg-cream-light bg-opacity-50 rounded-xl p-4 mb-4">
                            <p class="text-sm text-warm-brown opacity-80 italic">
                                "Currently reading: The Midnight Library ✨"
                            </p>
                        </div>
                        <div class="flex justify-between items-center">
                            <div class="flex space-x-2">
                                <button class="bg-gradient-to-r from-peach to-salmon text-white px-6 py-2 rounded-lg font-medium hover:scale-105 transition-all">
                                    Chat
                                </button>
                                <button class="bg-salmon text-white px-5 py-2 rounded-lg font-medium hover:scale-105 transition-all">
                                    View Books
                                </button>
                            </div>
                            <button class="bg-gradient-to-r from-red-600 to-red-600 hover:from-red-500 hover:to-red-700 text-white px-7 py-2 rounded-lg font-medium transition-all hover:scale-105"
                                data-userid="${user.id}">
                                Remove
                            </button>
                        </div>
                    </div>
                `;
            }
            
            // Add click event for friend actions
            const actionBtn = card.querySelector(`button[data-userid="${user.id}"]`);
            if (actionBtn) {
                actionBtn.addEventListener("click", async (e) => {
                    const targetId = e.target.closest('button').dataset.userid;
                    
                    if (isFriend) {
                        // Remove friend with animation
                        actionBtn.innerHTML = '<span class="relative z-10">Removing... </span>';
                        actionBtn.disabled = true;
                        
                        setTimeout(() => {
                            delete currentUserFriends[targetId];
                            updateFriendCounts();
                            renderFriendsList();
                            if (searchInput.value.trim()) {
                                renderSearchResults(searchInput.value.trim());
                            }
                            
                            // Show success message
                            showNotification("Friend removed successfully ", "info");
                        }, 1000);
                    } else {
                        // Add friend with animation
                        actionBtn.innerHTML = '<span class="relative z-10">Adding... </span>';
                        actionBtn.disabled = true;
                        
                        setTimeout(() => {
                            currentUserFriends[targetId] = true;
                            updateFriendCounts();
                            renderFriendsList();
                            if (searchInput.value.trim()) {
                                renderSearchResults(searchInput.value.trim());
                            }
                            
                            // Show success message
                            showNotification("New friend added! Welcome to the circle! 🎉", "success");
                        }, 1000);
                    }
                });
            }
            
            return card;
        }

        // Render friends list
        function renderFriendsList() {
            friendsList.innerHTML = "";
            const friendIds = Object.keys(currentUserFriends || {});
            
            if (friendIds.length === 0) {
                emptyState.classList.remove('hidden');
                return;
            } else {
                emptyState.classList.add('hidden');
            }
            
            friendIds.forEach((uid, index) => {
                const user = allUsers[uid];
                if (!user) return;
                
                const card = createUserCard(user, true, false);
                card.style.animationDelay = `${index * 0.1}s`;
                friendsList.appendChild(card);
            });

        }

        // Render search results
        function renderSearchResults(keyword) {
            searchResults.innerHTML = "";
            const keywordLower = keyword.toLowerCase();
            const filtered = Object.values(allUsers).filter(u =>
                u.id !== currentUserId &&
                u.userName &&
                u.userName.toLowerCase().includes(keywordLower)
            );
            
            if (filtered.length === 0) {
                searchResults.innerHTML = `
                    <div class="text-center py-8">
                        <div class="text-6xl mb-4 opacity-60">🔍</div>
                        <p class="text-warm-brown opacity-75 text-lg">No reading buddies found with that search. Try a different username! ✨</p>
                    </div>
                `;
                return;
            }
            
            filtered.forEach((user, index) => {
                const isFriend = !!currentUserFriends[user.id];
                const card = createUserCard(user, isFriend, true);
                card.style.animationDelay = `${index * 0.1}s`;
                searchResults.appendChild(card);
            });

        }

        // Show notification
        function showNotification(message, type = "info") {
            const notification = document.createElement("div");
            notification.className = `fixed top-20 right-6 z-50 px-6 py-4 rounded-2xl shadow-lg animate-fade-in-up ${
                type === "success" ? "bg-gradient-to-r from-green-400 to-green-600" : 
                type === "error" ? "bg-gradient-to-r from-red-400 to-red-600" : 
                "bg-gradient-to-r from-salmon to-rose-red"
            } text-white font-semibold`;
            notification.textContent = message;
            
            document.body.appendChild(notification);
            
            setTimeout(() => {
                notification.style.opacity = "0";
                notification.style.transform = "translateX(100%)";
                setTimeout(() => notification.remove(), 300);
            }, 3000);
        }

        // Search input event with debounce
        let searchTimeout;
        searchInput.addEventListener("input", () => {
            clearTimeout(searchTimeout);
            const keyword = searchInput.value.trim();
            
            searchTimeout = setTimeout(() => {
                if (keyword.length > 0) {
                    renderSearchResults(keyword);
                } else {
                    searchResults.innerHTML = "";
                }
            }, 300);
        });

        // Enhanced search button
        document.querySelector('.search-btn').addEventListener('click', () => {
            const keyword = searchInput.value.trim();
            if (keyword.length > 0) {
                renderSearchResults(keyword);
                showNotification(`Searching for "${keyword}"... 🔍`, "info");
            } else {
                searchInput.focus();
                showNotification("Please enter a username to search! ✨", "info");
            }
        });

        // Add reading activity simulation
        function addRandomActivity() {
            const activities = [
                { user: "Alice", activity: "finished reading 'The House in the Cerulean Sea'", time: "1 hour ago", emoji: "📚" },
                { user: "Bob", activity: "shared a cozy reading corner at the local café", time: "3 hours ago", emoji: "☕" },
                { user: "Carol", activity: "started a new book club discussion", time: "5 hours ago", emoji: "💬" },
                { user: "Dave", activity: "recommended 'Project Hail Mary' to the group", time: "8 hours ago", emoji: "🌟" },
                { user: "Eva", activity: "posted a beautiful book quote", time: "12 hours ago", emoji: "✨" }
            ];
            
            const randomActivity = activities[Math.floor(Math.random() * activities.length)];
            const activityFeed = document.getElementById('activityFeed');
            
            if (activityFeed.children.length >= 5) {
                activityFeed.removeChild(activityFeed.lastChild);
            }
            
            const newActivity = document.createElement('div');
            newActivity.className = "friend-activity rounded-xl p-4 flex items-center space-x-4 animate-fade-in-up";
            newActivity.innerHTML = `
                <div class="w-12 h-12 bg-gradient-to-br from-peach to-salmon rounded-full flex items-center justify-center">
                    <span class="text-white font-semibold">${randomActivity.user.charAt(0)}</span>
                </div>
                <div class="flex-1">
                    <p class="text-space-brown font-medium">${randomActivity.user} ${randomActivity.activity}</p>
                    <p class="text-warm-brown opacity-75 text-sm">${randomActivity.time}</p>
                </div>
                <div class="text-2xl">${randomActivity.emoji}</div>
            `;
            
            activityFeed.insertBefore(newActivity, activityFeed.firstChild);
        }

        // Initialize the page
        updateFriendCounts();
        renderFriendsList();
        
        // Add periodic activity updates
        setInterval(addRandomActivity, 15000);
        
        // Welcome message
        setTimeout(() => {
            showNotification("Welcome to your cozy reading circle! 🫂✨", "success");
        }, 1000);

        // Add enter key support for search
        searchInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
                document.querySelector('.search-btn').click();
            }
        });

        // Add some cozy interactive elements
        document.addEventListener('mousemove', (e) => {
            const floatingElements = document.querySelectorAll('.floating-element');
            floatingElements.forEach((element, index) => {
                const speed = (index + 1) * 0.02;
                const x = (e.clientX * speed) / 100;
                const y = (e.clientY * speed) / 100;
                element.style.transform = `translate(${x}px, ${y}px) rotate(${x * 0.1}deg)`;
            });
        });