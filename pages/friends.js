
import { initializeApp } from "https://www.gstatic.com/firebasejs/11.8.1/firebase-app.js";
import { getAnalytics } from "https://www.gstatic.com/firebasejs/11.8.1/firebase-analytics.js";
import { getAuth, onAuthStateChanged, signOut} from "https://www.gstatic.com/firebasejs/11.8.1/firebase-auth.js";
import { getFirestore, doc, getDoc, setDoc, collection, query, orderBy, limit, getDocs, where, updateDoc, deleteDoc, arrayUnion, arrayRemove, addDoc, serverTimestamp, onSnapshot }  from "https://www.gstatic.com/firebasejs/11.8.1/firebase-firestore.js";

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

// DOM elements
const searchInput = document.getElementById("searchInput");
const searchResults = document.getElementById("searchResults");
const friendsList = document.getElementById("friends-list");
const friendCount = document.getElementById("friendCount");
const friendCountDisplay = document.getElementById("friendCountDisplay");
const emptyState = document.getElementById("emptyState");
const logoutBtn = document.getElementById('logout');
const postContent = document.getElementById('postContent');
const createPostBtn = document.getElementById('createPostBtn');
const charCount = document.getElementById('charCount');
const postsFeed = document.getElementById('postsFeed');
const loadingState = document.getElementById('loadingState');
const emptyFeedState = document.getElementById('emptyFeedState');
const currentUserInitial = document.getElementById('currentUserInitial');

let currentUserId = null;
let currentUserData = null;
let currentUserFriends = {};
let allUsers = {};
let feedUnsubscribe = null;

onAuthStateChanged(auth, async (user) => {
    if (!user) {
        window.location.href = '../index.html';
        return;
    }
    
    currentUserId = user.uid;
    const navUserName = document.getElementById('nav-user-name');

    // Fetch all users
    const allUsersSnap = await getDocs(collection(db, "users"));
    allUsers = {};
    allUsersSnap.forEach(docSnap => {
        allUsers[docSnap.id] = { id: docSnap.id, ...docSnap.data() };
    });

    // Fetch current user's data
    const currentUserRef = doc(db, "users", currentUserId);
    const currentUserSnap = await getDoc(currentUserRef);
    currentUserData = currentUserSnap.data();
    currentUserFriends = currentUserData.friends || {};

    // Update UI with user info
    if (navUserName && navUserName.textContent === 'Reader') {
        navUserName.textContent = currentUserData.userName || 'Reader';
    }
    
    if (currentUserInitial) {
        currentUserInitial.textContent = (currentUserData.userName || 'U').charAt(0).toUpperCase();
    }
    
    renderFriendsList();
    setupFeedListener();
    updateFriendCounts();
});

// Logout function
async function logout() {
    try {
        if (feedUnsubscribe) {
            feedUnsubscribe();
        }
        await signOut(auth);
        window.location.href = '../index.html';
    } catch (error) {
        console.error('Logout error:', error);
        alert('Error logging out. Please try again.');
    }
}

// Post creation function
async function createPost() {
    const content = postContent.value.trim();
    
    if (!content) {
        showNotification("Please write something before posting! ✨", "info");
        return;
    }
    
    if (content.length > 500) {
        showNotification("Post is too long! Please keep it under 500 characters. 📝", "error");
        return;
    }
    
    try {
        createPostBtn.disabled = true;
        createPostBtn.innerHTML = '<span>Posting...</span> <span class="text-lg">⏳</span>';
        
        const postData = {
            content: content,
            authorId: currentUserId,
            authorName: currentUserData.userName || 'Anonymous',
            timestamp: serverTimestamp(),
            createdAt: new Date().toISOString()
        };
        
        // Save to user's posts collection
        const userPostsRef = collection(db, "users", currentUserId, "posts");
        const newPostRef = await addDoc(userPostsRef, postData);
        
        // Fan-out to followers' feeds
        await fanOutPost(newPostRef.id, postData);
        
        // Clear the form
        postContent.value = '';
        charCount.textContent = '0/500 characters';
        
        showNotification("Post shared with your reading circle! 🚀", "success");
        
    } catch (error) {
        console.error('Error creating post:', error);
        showNotification("Failed to create post. Please try again. 😔", "error");
    } finally {
        createPostBtn.disabled = false;
        createPostBtn.innerHTML = '<span>Post</span> <span class="text-lg">🚀</span>';
    }
}

// Fan-out post to followers' feeds
async function fanOutPost(postId, postData) {
    try {
        // Get all users who have this user as a friend
        const allUsersSnap = await getDocs(collection(db, "users"));
        const followers = [];
        
        allUsersSnap.forEach(docSnap => {
            const userData = docSnap.data();
            const userFriends = userData.friends || {};
            
            // If this user follows the poster
            if (userFriends[currentUserId]) {
                followers.push(docSnap.id);
            }
        });
        
        // Also add to current user's own feed
        followers.push(currentUserId);
        
        // Add post to each follower's feed
        const promises = followers.map(async (followerId) => {
            const feedPostData = {
                ...postData,
                postId: postId,
                originalAuthorId: currentUserId
            };
            
            const feedRef = collection(db, "feed", followerId, "feedPosts");
            await addDoc(feedRef, feedPostData);
        });
        
        await Promise.all(promises);
        
    } catch (error) {
        console.error('Error fanning out post:', error);
        throw error;
    }
}

// Setup real-time feed listener
function setupFeedListener() {
    if (feedUnsubscribe) {
        feedUnsubscribe();
    }
    
    loadingState.classList.remove('hidden');
    emptyFeedState.classList.add('hidden');
    
    const feedRef = collection(db, "feed", currentUserId, "feedPosts");
    const feedQuery = query(feedRef, orderBy("timestamp", "desc"), limit(50));
    
    feedUnsubscribe = onSnapshot(feedQuery, (snapshot) => {
        loadingState.classList.add('hidden');
        
        if (snapshot.empty) {
            emptyFeedState.classList.remove('hidden');
            postsFeed.innerHTML = '';
            return;
        }
        
        emptyFeedState.classList.add('hidden');
        renderFeedPosts(snapshot.docs);
    }, (error) => {
        console.error('Error listening to feed:', error);
        loadingState.classList.add('hidden');
        showNotification("Error loading feed. Please refresh the page. 😔", "error");
    });
}

// Render feed posts
function renderFeedPosts(docs) {
    postsFeed.innerHTML = '';
    
    docs.forEach((doc, index) => {
        const post = doc.data();
        const postElement = createPostElement(post, doc.id);
        postElement.style.animationDelay = `${index * 0.1}s`;
        postsFeed.appendChild(postElement);
    });
}

// Create post element
function createPostElement(post, postId) {
    const postDiv = document.createElement('div');
    postDiv.className = 'glass-card rounded-2xl p-6 animate-fade-in-up hover:shadow-lg transition-all duration-300';
    
    const timeAgo = getTimeAgo(post.timestamp?.toDate() || new Date(post.createdAt));
    const isOwnPost = post.authorId === currentUserId;
    
    postDiv.innerHTML = `
        <div class="flex items-start space-x-4">
            <div class="w-12 h-12 bg-gradient-to-br from-peach to-salmon rounded-full flex items-center justify-center shadow-lg flex-shrink-0">
                <span class="text-white font-semibold">${(post.authorName || 'U').charAt(0).toUpperCase()}</span>
            </div>
            <div class="flex-1 min-w-0">
                <div class="flex items-center space-x-2 mb-2">
                    <h4 class="font-semibold text-space-brown">${post.authorName || 'Anonymous'}</h4>
                    ${isOwnPost ? '<span class="text-xs bg-cream-light px-2 py-1 rounded-full text-warm-brown">You</span>' : ''}
                    <span class="text-sm text-warm-brown opacity-70">•</span>
                    <time class="text-sm text-warm-brown opacity-70">${timeAgo}</time>
                </div>
                <p class="text-space-brown leading-relaxed whitespace-pre-wrap break-words">${post.content}</p>
                <div class="flex items-center space-x-4 mt-4 pt-3 border-t border-cream-medium">
                    <button class="flex items-center space-x-2 text-warm-brown hover:text-rose-red transition-colors group">
                        <span class="text-lg group-hover:animate-pulse">💕</span>
                        <span class="text-sm font-medium">Like</span>
                    </button>
                    <button class="flex items-center space-x-2 text-warm-brown hover:text-rose-red transition-colors group">
                        <span class="text-lg group-hover:animate-pulse">💬</span>
                        <span class="text-sm font-medium">Comment</span>
                    </button>
                    <button class="flex items-center space-x-2 text-warm-brown hover:text-rose-red transition-colors group">
                        <span class="text-lg group-hover:animate-pulse">📚</span>
                        <span class="text-sm font-medium">Recommend</span>
                    </button>
                    ${isOwnPost ? `
                        <button class="ml-auto flex items-center space-x-2 text-red-600 hover:text-red-700 transition-colors group" onclick="deletePost('${post.postId}', '${post.authorId}')">
                            <span class="text-sm font-medium">Delete</span>
                            <span class="text-sm group-hover:animate-pulse">🗑️</span>
                        </button>
                    ` : ''}
                </div>
            </div>
        </div>
    `;
    
    return postDiv;
}

// Delete post function
window.deletePost = async function(postId, authorId) {
    if (!confirm('Are you sure you want to delete this post? This action cannot be undone.')) {
        return;
    }
    try {
        // Delete from user's original posts collection
        const userPostRef = doc(db, "users", authorId, "posts", postId);
        await deleteDoc(userPostRef);

        // Delete from all feeds where this post appears
        const allUsersSnap = await getDocs(collection(db, "users"));
        const deletePromises = [];

        allUsersSnap.forEach(userDoc => {
            const userId = userDoc.id;
            const feedPostQuery = query(
                collection(db, "feed", userId, "feedPosts"),
                where("postId", "==", postId)
            );
            deletePromises.push(
                getDocs(feedPostQuery).then(snapshot => {
                    const feedDeletePromises = [];
                    snapshot.forEach(feedDoc => {
                        feedDeletePromises.push(deleteDoc(feedDoc.ref));
                    });
                    return Promise.all(feedDeletePromises);
                })
            );
        });

        await Promise.all(deletePromises);

        showNotification("Post deleted successfully! 🗑️", "success");
    } catch (error) {
        console.error('Error deleting post:', error);
        showNotification("Failed to delete post. Please try again. 😔", "error");
    }
};

// Get time ago string
function getTimeAgo(date) {
    const now = new Date();
    const diffInSeconds = Math.floor((now - date) / 1000);
    
    if (diffInSeconds < 60) return 'just now';
    if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)}m ago`;
    if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)}h ago`;
    if (diffInSeconds < 604800) return `${Math.floor(diffInSeconds / 86400)}d ago`;
    
    return date.toLocaleDateString();
}

// Update friend counts
function updateFriendCounts() {
    const count = Object.keys(currentUserFriends).length;
    if (friendCount) friendCount.textContent = count;
    if (friendCountDisplay) friendCountDisplay.textContent = `${count} wonderful friend${count !== 1 ? 's' : ''}`;
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
                // Remove friend
                actionBtn.innerHTML = '<span class="relative z-10">Removing... </span>';
                actionBtn.disabled = true;
                
                try {
                    // Update current user's friends
                    delete currentUserFriends[targetId];
                    await updateDoc(doc(db, "users", currentUserId), {
                        friends: currentUserFriends
                    });
                    
                    updateFriendCounts();
                    renderFriendsList();
                    if (searchInput.value.trim()) {
                        renderSearchResults(searchInput.value.trim());
                    }
                    
                    showNotification("Friend removed successfully", "info");
                } catch (error) {
                    console.error('Error removing friend:', error);
                    showNotification("Failed to remove friend. Please try again.", "error");
                }
            } else {
                // Add friend
                actionBtn.innerHTML = '<span class="relative z-10">Adding... </span>';
                actionBtn.disabled = true;
                
                try {
                    // Update current user's friends
                    currentUserFriends[targetId] = true;
                    await updateDoc(doc(db, "users", currentUserId), {
                        friends: currentUserFriends
                    });
                    
                    updateFriendCounts();
                    renderFriendsList();
                    if (searchInput.value.trim()) {
                        renderSearchResults(searchInput.value.trim());
                    }
                    
                    showNotification("New friend added! Welcome to the circle! 🎉", "success");
                } catch (error) {
                    console.error('Error adding friend:', error);
                    showNotification("Failed to add friend. Please try again.", "error");
                }
            }
        });
    }
    
    return card;
}

// Render friends list
function renderFriendsList() {
    if (!friendsList) return;
    
    friendsList.innerHTML = "";
    const friendIds = Object.keys(currentUserFriends || {});
    
    if (friendIds.length === 0) {
        if (emptyState) emptyState.classList.remove('hidden');
        return;
    } else {
        if (emptyState) emptyState.classList.add('hidden');
    }
    
    friendIds.forEach((uid, index) => {
        const user = allUsers[uid];
        if (!user) return;
        
        const card = createUserCard(user, true, false);
        card.style.animationDelay = `${index * 0.1}s`;
        friendsList.appendChild(card);

        // Add click event to redirect to friend's profile
        card.addEventListener('click', function(e) {
            // Prevent click if Remove button is clicked
            if (e.target.closest('button')) return;
            window.location.href = `profile.html?uid=${user.id}`;
        });
    });
}


// Render search results
function renderSearchResults(keyword) {
    if (!searchResults) return;
    
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

// Event Listeners
if (postContent) {
    postContent.addEventListener('input', () => {
        const length = postContent.value.length;
        if (charCount) {
            charCount.textContent = `${length}/500 characters`;
            charCount.style.color = length > 450 ? '#dc2626' : length > 400 ? '#f59e0b' : '';
        }
    });
}

if (createPostBtn) {
    createPostBtn.addEventListener('click', createPost);
}

if (searchInput) {
    let searchTimeout;
    searchInput.addEventListener("input", () => {
        clearTimeout(searchTimeout);
        const keyword = searchInput.value.trim();
        
        searchTimeout = setTimeout(() => {
            if (keyword.length > 0) {
                renderSearchResults(keyword);
            } else {
                if (searchResults) searchResults.innerHTML = "";
            }
        }, 300);
    });
    
    searchInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') {
            const searchBtn = document.querySelector('.search-btn');
            if (searchBtn) searchBtn.click();
        }
    });
}

// Enhanced search button
const searchBtn = document.querySelector('.search-btn');
if (searchBtn) {
    searchBtn.addEventListener('click', () => {
        const keyword = searchInput?.value.trim() || '';
        if (keyword.length > 0) {
            renderSearchResults(keyword);
            showNotification(`Searching for "${keyword}"... 🔍`, "info");
        } else {
            if (searchInput) searchInput.focus();
            showNotification("Please enter a username to search! ✨", "info");
        }
    });
}

if (logoutBtn) {
    logoutBtn.addEventListener('click', logout);
}

// Initialize
setTimeout(() => {
    showNotification("Welcome to your cozy reading circle! 🫂✨", "success");
}, 1000);

// Cleanup on page unload
window.addEventListener('beforeunload', () => {
    if (feedUnsubscribe) {
        feedUnsubscribe();
    }
});