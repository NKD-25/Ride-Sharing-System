// common.js - front-end behavior and simple client-side storage

// helpers for localStorage
function getUsers() {
    const raw = localStorage.getItem('users');
    if (!raw) return [];
    try {
        const parsed = JSON.parse(raw);
        if (Array.isArray(parsed)) return parsed;
        if (parsed && typeof parsed === 'object') return Object.values(parsed);
        return [];
    } catch (err) {
        console.error('getUsers parse error:', err, raw);
        return [];
    }
}
function saveUsers(users) {
    const toSave = Array.isArray(users) ? users : (users ? [users] : []);
    localStorage.setItem('users', JSON.stringify(toSave));
}
function getDrivers() {
    const raw = localStorage.getItem('drivers');
    if (!raw) return [];
    try {
        const parsed = JSON.parse(raw);
        if (Array.isArray(parsed)) return parsed;
        if (parsed && typeof parsed === 'object') return Object.values(parsed);
        return [];
    } catch (err) {
        console.error('getDrivers parse error:', err, raw);
        return [];
    }
}
function saveDrivers(drivers) {
    const toSave = Array.isArray(drivers) ? drivers : (drivers ? [drivers] : []);
    localStorage.setItem('drivers', JSON.stringify(toSave));
}
function setCurrentUser(user) {
    localStorage.setItem('currentUser', JSON.stringify(user));
}
function getCurrentUser() {
    const raw = localStorage.getItem('currentUser');
    if (!raw) return null;
    try {
        return JSON.parse(raw);
    } catch (err) {
        console.error('getCurrentUser parse error:', err);
        return null;
    }
}
function logout() {
    localStorage.removeItem('currentUser');
    location.href = 'index.html';
}

function updateNav() {
    const nav = document.getElementById('mainNav');
    if (!nav) return;
    const current = getCurrentUser();
    if (current) {
        nav.innerHTML = `
            <a href="index.html">Home</a>
            <a href="profile.html">Profile</a>
            <a href="#" id="logoutLink">Logout</a>
        `;
        document.getElementById('logoutLink').addEventListener('click', (e) => {
            e.preventDefault();
            logout();
        });
    } else {
        nav.innerHTML = `
            <a href="index.html">Home</a>
            <a href="signup.html">Sign Up</a>
            <a href="login.html">Log In</a>
            <a href="register.html">Register</a>
        `;
    }
}

function initializeApp() {
    try {
        console.log('initializeApp start');
        updateNav();
        
        // Redirect logged-in users away from form pages
        const currentPage = window.location.pathname.split('/').pop() || 'index.html';
        const formPages = ['signup.html', 'login.html', 'register.html'];
        if (formPages.includes(currentPage) && getCurrentUser()) {
            console.log('redirecting logged-in user from', currentPage);
            window.location.href = 'profile.html';
            return;
        }

        const signupForm = document.getElementById('signupForm');
        const loginForm = document.getElementById('loginForm');
        const registerForm = document.getElementById('registerForm');

        if (signupForm) {
            signupForm.addEventListener('submit', (e) => {
                e.preventDefault();
                try {
                    console.log('signup submit event fired');
                    const firstName = document.getElementById('firstName').value.trim();
                    const lastName = document.getElementById('lastName').value.trim();
                    const email = document.getElementById('email').value.trim().toLowerCase();
                    const pwd = document.getElementById('password').value.trim();
                    const confirm = document.getElementById('confirmPassword').value.trim();
                    
                    console.log('signup values', { firstName, lastName, email });
                    if (!firstName || !lastName || !email || !pwd || !confirm) {
                        alert('All fields are required.');
                        return;
                    }
                    if (pwd !== confirm) {
                        alert('Passwords do not match.');
                        return;
                    }
                    const users = getUsers();
                    if (users.find(u => u.email === email)) {
                        alert('Email already registered. Please log in.');
                        return;
                    }
                    const newUser = {
                        firstName,
                        lastName,
                        email,
                        password: pwd
                    };
                    users.push(newUser);
                    saveUsers(users);
                    console.log('user saved', newUser);
                    alert('Sign up successful! Redirecting to log in...');
                    setTimeout(() => {
                        window.location.href = 'login.html';
                    }, 500);
                } catch (err) {
                    console.error('signup handler error:', err);
                    alert('An error occurred during signup. See console for details.');
                }
            });
        }

        if (loginForm) {
            loginForm.addEventListener('submit', (e) => {
                e.preventDefault();
                try {
                    const email = document.getElementById('email').value.trim().toLowerCase();
                    const pwd = document.getElementById('password').value.trim();
                    
                    if (!email || !pwd) {
                        alert('Email and password are required.');
                        return;
                    }
                    const users = getUsers();
                    const user = users.find(u => u.email === email && u.password === pwd);
                    if (!user) {
                        alert('Invalid email or password');
                        return;
                    }
                    setCurrentUser(user);
                    alert('Logged in! Redirecting to your profile...');
                    setTimeout(() => {
                        window.location.href = 'profile.html';
                    }, 500);
                } catch (err) {
                    console.error('login handler error:', err);
                    alert('An error occurred during login. See console for details.');
                }
            });
        }

        if (registerForm) {
            registerForm.addEventListener('submit', (e) => {
                e.preventDefault();
                try {
                    const name = document.getElementById('name').value.trim();
                    const email = document.getElementById('email').value.trim().toLowerCase();
                    const phone = document.getElementById('phone').value.trim();
                    const license = document.getElementById('license').value.trim();
                    const vehicle = document.getElementById('vehicle').value.trim();
                    
                    if (!name || !email || !phone || !license || !vehicle) {
                        alert('All fields are required.');
                        return;
                    }
                    const drivers = getDrivers();
                    const driver = {
                        name,
                        email,
                        phone,
                        license,
                        vehicle
                    };
                    drivers.push(driver);
                    saveDrivers(drivers);
                    alert('Registered as driver! Thank you.');
                    setTimeout(() => {
                        window.location.href = 'index.html';
                    }, 500);
                } catch (err) {
                    console.error('register handler error:', err);
                    alert('An error occurred during registration. See console for details.');
                }
            });
        }
    } catch (err) {
        console.error('initializeApp error:', err);
    }
}

// Handle both cases: DOM already loaded OR loading
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initializeApp);
} else {
    initializeApp();
}