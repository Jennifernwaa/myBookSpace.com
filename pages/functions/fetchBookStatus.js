import { collection, query, getDocs, where } from "https://www.gstatic.com/firebasejs/11.8.1/firebase-firestore.js";
import { db } from '../../login-signup/firebase-config.js';

export async function fetchBooksByStatus(userId, status) {
    const books = [];
    const q = query(
        collection(db, "users", userId, "books"),
        where("status", "==", status)
    );
    const querySnapshot = await getDocs(q);
    querySnapshot.forEach((doc) => {
        books.push({ id: doc.id, ...doc.data() });
    });
    return books;
}