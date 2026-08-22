import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-app.js";
import { 
    getAuth, 
    onAuthStateChanged, 
    signInWithPopup, 
    GoogleAuthProvider, 
    signOut 
} from "https://www.gstatic.com/firebasejs/10.12.0/firebase-auth.js";
import {
    getFirestore,
    doc,
    setDoc,
    getDoc,
    collection,
    addDoc,
    query,
    where,
    getDocs,
    orderBy
} from "https://www.gstatic.com/firebasejs/10.12.0/firebase-firestore.js";

// ----------------------------------------------------
// Firebase Configuration
// REPLACE THESE WITH YOUR ACTUAL FIREBASE CONFIG
// ----------------------------------------------------
const firebaseConfig = {
  projectId: "shavilivinayaksarees",
  appId: "1:61508421532:web:c82636f06f75719bbaea59",
  storageBucket: "shavilivinayaksarees.firebasestorage.app",
  apiKey: "AIzaSyCgkx_cKOZhBXJRuAP4a8FoawL6QXhkgKI",
  authDomain: "shavilivinayaksarees.firebaseapp.com",
  messagingSenderId: "61508421532"
};

let app, auth, db;
try {
    app = initializeApp(firebaseConfig);
    auth = getAuth(app);
    db = getFirestore(app);
} catch (e) {
    console.warn('Firebase client not initialized properly. Ensure keys are set.');
}

// Global Auth State
let currentUser = null;

// UI Elements
const navAuthBtn = document.getElementById('nav-auth-btn');
const navAuthText = document.getElementById('nav-auth-text');

// Login Page Elements (will be null on other pages)
const phoneStep = document.getElementById('auth-phone-step');
const verifyStep = document.getElementById('auth-verify-step');
const accountView = document.getElementById('auth-account-view');
const loadingView = document.getElementById('auth-loading');
const authHeader = document.getElementById('auth-header-text');
const authError = document.getElementById('auth-error');
const userIdentifier = document.getElementById('user-identifier');

const btnGoogleLogin = document.getElementById('btn-google-login');
const btnLogout = document.getElementById('btn-logout');
const btnContinue = document.getElementById('btn-continue');

// Check current session on load
function checkSession() {
    if (!auth) return;
    
    onAuthStateChanged(auth, (user) => {
        if (user) {
            currentUser = user;
            updateUIAfterLogin();
        } else {
            currentUser = null;
            updateUIAfterLogout();
        }
    });
}

function showStep(stepElement) {
    if (!stepElement) return;
    if (phoneStep) phoneStep.style.display = 'none';
    if (accountView) accountView.style.display = 'none';
    if (loadingView) loadingView.style.display = 'none';
    if (authHeader) authHeader.style.display = stepElement === accountView ? 'none' : 'block';
    
    stepElement.style.display = 'block';
}

function showError(msg) {
    if (authError) authError.textContent = msg;
    // Don't arbitrarily change step if an error happens, just show it
}

// ---- AUTH ACTIONS ----

async function loginWithGoogle() {
    if (!auth) return;
    showStep(loadingView);
    if (authError) authError.textContent = '';
    
    try {
        const provider = new GoogleAuthProvider();
        await signInWithPopup(auth, provider);
        handleSuccessfulLogin();
    } catch (error) {
        showError(error.message);
        showStep(phoneStep);
    }
}

async function logout() {
    if (!auth) return;
    showStep(loadingView);
    try {
        await signOut(auth);
        if (window.location.pathname.includes('login.html')) {
            showStep(phoneStep);
        }
    } catch (error) {
        console.error("Logout error", error);
    }
}

function handleSuccessfulLogin() {
    const urlParams = new URLSearchParams(window.location.search);
    if (urlParams.get('redirect') === 'cart') {
        window.location.href = 'index.html?open=cart';
    } else {
        window.location.href = 'index.html';
    }
}

function updateUIAfterLogin() {
    if (navAuthText) navAuthText.textContent = "Account";
    const navAccountLink = document.getElementById('nav-account-link');
    if (navAccountLink) navAccountLink.style.display = 'inline-block';
    
    // If we are on the login page, show the account view instead
    if (window.location.pathname.includes('login.html') && userIdentifier && currentUser) {
        showStep(accountView);
        userIdentifier.textContent = currentUser.email || "User";
        renderOrders();
    }
    window.dispatchEvent(new Event('user-logged-in'));
}

async function renderOrders() {
    const container = document.getElementById('orders-container');
    const loading = document.getElementById('orders-loading');
    if (!container || !loading) return;

    // Reset container (keep loading spinner)
    container.innerHTML = '';
    container.appendChild(loading);
    loading.style.display = 'block';

    const orders = await window.getUserOrders();
    loading.style.display = 'none';

    if (orders.length === 0) {
        container.innerHTML = '<div class="no-orders">You haven\'t placed any orders yet.</div>';
        return;
    }

    orders.forEach(order => {
        const date = new Date(order.createdAt).toLocaleDateString('en-IN', { year: 'numeric', month: 'short', day: 'numeric' });
        
        // Generate item images HTML
        const itemsHtml = order.items.map(item => `<img src="${item.image}" alt="${item.name}" class="order-item-img" title="${item.name}">`).join('');

        const orderEl = document.createElement('div');
        orderEl.className = 'order-card';
        orderEl.innerHTML = `
            <div class="order-header">
                <span>Ordered on: ${date}</span>
                <span class="order-status">${order.status}</span>
            </div>
            <div class="order-items">
                ${itemsHtml}
            </div>
            <div class="order-total">
                Total: ₹${order.total.toLocaleString('en-IN')}
            </div>
        `;
        container.appendChild(orderEl);
    });
}

function updateUIAfterLogout() {
    if (navAuthText) navAuthText.textContent = "Login";
    const navAccountLink = document.getElementById('nav-account-link');
    if (navAccountLink) navAccountLink.style.display = 'none';
    
    // If we are on the login page, show the initial phone step
    if (window.location.pathname.includes('login.html')) {
        showStep(phoneStep);
    }
    window.dispatchEvent(new Event('user-logged-out'));
}

// Redirect to login page
function goToLogin(redirect = null) {
    let url = 'login.html';
    if (redirect) {
        url += '?redirect=' + redirect;
    }
    window.location.href = url;
}

// Event Listeners
if (navAuthBtn) {
    navAuthBtn.addEventListener('click', (e) => {
        e.preventDefault();
        goToLogin();
    });
}

if (btnGoogleLogin) btnGoogleLogin.addEventListener('click', loginWithGoogle);
if (btnLogout) btnLogout.addEventListener('click', logout);
if (btnContinue) btnContinue.addEventListener('click', () => window.location.href = 'index.html');

// Initialize session check
checkSession();

// Export check function for main.js to use
window.isUserLoggedIn = () => {
    return currentUser !== null;
};
window.goToLogin = goToLogin;

// Cloud Sync Helpers
window.syncCartToCloud = async (cart) => {
    if (!currentUser || !db) return;
    try {
        await setDoc(doc(db, "users", currentUser.uid), { cart }, { merge: true });
    } catch (e) {
        console.error("Error saving cart to cloud:", e);
    }
};

window.loadCartFromCloud = async () => {
    if (!currentUser || !db) return [];
    try {
        const docSnap = await getDoc(doc(db, "users", currentUser.uid));
        if (docSnap.exists()) {
            return docSnap.data().cart || [];
        }
    } catch (e) {
        console.error("Error loading cart from cloud:", e);
    }
    return [];
};

window.placeOrder = async (cart, total) => {
    if (!currentUser || !db) return null;
    try {
        const docRef = await addDoc(collection(db, "orders"), {
            userId: currentUser.uid,
            userEmail: currentUser.email,
            items: cart,
            total: total,
            status: "pending",
            createdAt: new Date().toISOString()
        });
        return docRef.id;
    } catch (e) {
        console.error("Error placing order:", e);
        return null;
    }
};

// NOTE: there is intentionally NO client-side order-status updater.
// Order status transitions (pending -> paid / payment_failed) happen only
// via the Stripe webhook using the Admin SDK. See api/stripe-webhook.js.

window.getUserOrders = async () => {
    if (!currentUser || !db) return [];
    try {
        // Simple query without compound ordering to avoid needing an index immediately
        const q = query(collection(db, "orders"), where("userId", "==", currentUser.uid));
        const querySnapshot = await getDocs(q);
        let orders = [];
        querySnapshot.forEach((doc) => {
            orders.push({ id: doc.id, ...doc.data() });
        });
        // Sort client-side to avoid needing a Firestore composite index
        orders.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
        return orders;
    } catch (e) {
        console.error("Error fetching orders:", e);
        return [];
    }
};
