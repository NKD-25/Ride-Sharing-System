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
// --- Rides storage and helpers ---
function getRides() {
    const raw = localStorage.getItem('rides');
    if (!raw) return [];
    try {
        const parsed = JSON.parse(raw);
        if (Array.isArray(parsed)) return parsed;
        if (parsed && typeof parsed === 'object') return Object.values(parsed);
        return [];
    } catch (err) {
        console.error('getRides parse error:', err, raw);
        return [];
    }
}
function saveRides(rides) {
    const toSave = Array.isArray(rides) ? rides : (rides ? [rides] : []);
    localStorage.setItem('rides', JSON.stringify(toSave));
}
function generateId(prefix = 'r') {
    return prefix + Date.now() + Math.floor(Math.random() * 1000);
}
function seatsLeft(ride) {
    return Math.max(0, (ride.seats || 0) - ((ride.bookings && ride.bookings.length) || 0));
}

function renderRides() {
    const container = document.getElementById('ridesList');
    if (!container) return;
    let rides = getRides().slice().sort((a, b) => (b.createdAt || 0) - (a.createdAt || 0));
    const filter = document.getElementById('searchRoute')?.value?.trim()?.toLowerCase();
    if (filter) {
        rides = rides.filter(r => (r.from || '').toLowerCase().includes(filter) || (r.to || '').toLowerCase().includes(filter));
    }
    if (!rides.length) {
        container.innerHTML = '<p>No rides available.</p>';
        return;
    }
    const current = getCurrentUser();
    const drivers = getDrivers();
    container.innerHTML = rides.map(r => {
        const left = seatsLeft(r);
        const drv = drivers.find(d => d.email === r.driverEmail);
        const driverName = drv ? drv.name : (r.driverEmail || 'Driver');
        const alreadyBooked = current && (r.bookings || []).some(b => b.email === current.email);
        const isOwner = current && r.driverEmail === current.email;
        const actionHtml = (() => {
            if (isOwner) return '<span class="owner-label">Your ride</span>';
            if (alreadyBooked) return '<span class="booked-label">Booked</span>';
            if (left <= 0) return '<span class="full-label">Full</span>';
            return `<button class="btn" data-action="book" data-id="${r.id}">Book</button>`;
        })();
        return `
            <div class="ride-card">
                <div class="ride-route"><strong>${escapeHtml(r.from)}</strong> → <strong>${escapeHtml(r.to)}</strong></div>
                <div class="ride-meta">${escapeHtml(r.date || '')} @ ${escapeHtml(r.time || '')} · ${left} seats · ₹${r.price || 0}</div>
                <div class="ride-driver">Driver: ${escapeHtml(driverName)}</div>
                <div class="ride-actions">${actionHtml}</div>
            </div>
        `;
    }).join('');
}

function renderMyRides() {
    const container = document.getElementById('myRides');
    if (!container) return;
    const current = getCurrentUser();
    if (!current) {
        container.innerHTML = '<p>Please log in to view your rides or bookings.</p>';
        return;
    }
    const rides = getRides();
    const myCreated = rides.filter(r => r.driverEmail === current.email);
    const myBooked = rides.filter(r => (r.bookings || []).some(b => b.email === current.email));
    let html = '';
    if (myCreated.length) {
        html += '<h4>Your created rides</h4>' + myCreated.map(r => `
            <div class="ride-card small">
                <div class="ride-route"><strong>${escapeHtml(r.from)}</strong> → <strong>${escapeHtml(r.to)}</strong></div>
                <div class="ride-meta">${escapeHtml(r.date || '')} @ ${escapeHtml(r.time || '')} · ${seatsLeft(r)} seats left</div>
            </div>
        `).join('');
    }
    if (myBooked.length) {
        html += '<h4>Your bookings</h4>' + myBooked.map(r => `
            <div class="ride-card small">
                <div class="ride-route"><strong>${escapeHtml(r.from)}</strong> → <strong>${escapeHtml(r.to)}</strong></div>
                <div class="ride-meta">${escapeHtml(r.date || '')} @ ${escapeHtml(r.time || '')}</div>
                <div class="ride-driver">Driver: ${escapeHtml((getDrivers().find(d => d.email === r.driverEmail) || {}).name || r.driverEmail)}</div>
            </div>
        `).join('');
    }
    if (!html) html = '<p>No rides or bookings yet.</p>';
    container.innerHTML = html;
}

function createRideFromForm() {
    const current = getCurrentUser();
    if (!current) {
        if (confirm('You must be logged in to create a ride. Go to login?')) window.location.href = 'login.html';
        return;
    }
    const drivers = getDrivers();
    const isDriver = drivers.find(d => d.email === current.email);
    if (!isDriver) {
        if (confirm('You need to register as a driver to create rides. Register now?')) window.location.href = 'register.html';
        return;
    }
    const from = document.getElementById('rideFrom')?.value.trim();
    const to = document.getElementById('rideTo')?.value.trim();
    const date = document.getElementById('rideDate')?.value;
    const time = document.getElementById('rideTime')?.value;
    const seats = parseInt(document.getElementById('rideSeats')?.value || '0', 10);
    const price = parseFloat(document.getElementById('ridePrice')?.value || '0') || 0;
    const notes = document.getElementById('rideNotes')?.value.trim();
    if (!from || !to || !date || !time || seats <= 0) {
        alert('Please fill required fields (from, to, date, time, seats).');
        return;
    }
    const rides = getRides();
    const ride = {
        id: generateId('ride'),
        driverEmail: current.email,
        from,
        to,
        date,
        time,
        seats,
        price,
        notes,
        bookings: [],
        createdAt: Date.now()
    };
    rides.push(ride);
    saveRides(rides);
    document.getElementById('createRideForm')?.reset();
    renderRides();
    renderMyRides();
    alert('Ride created successfully.');
}

function bookRide(id) {
    const current = getCurrentUser();
    if (!current) {
        if (confirm('You must be logged in to book a ride. Go to login?')) window.location.href = 'login.html';
        return;
    }
    const rides = getRides();
    const ride = rides.find(r => r.id === id);
    if (!ride) { alert('Ride not found.'); return; }
    if (ride.driverEmail === current.email) { alert('You cannot book your own ride.'); return; }
    if ((ride.bookings || []).some(b => b.email === current.email)) { alert('You have already booked this ride.'); return; }
    if (seatsLeft(ride) <= 0) { alert('No seats available.'); return; }
    ride.bookings = ride.bookings || [];
    ride.bookings.push({ email: current.email, name: current.firstName + (current.lastName ? (' ' + current.lastName) : ''), bookedAt: Date.now() });
    saveRides(rides);
    alert('Ride booked successfully.');
    renderRides();
    renderMyRides();
}

function escapeHtml(str) {
    if (!str && str !== 0) return '';
    return String(str)
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/\"/g, '&quot;')
        .replace(/'/g, '&#039;');
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
        // --- Rides UI bindings (index page) ---
        const ridesContainer = document.getElementById('ridesList');
        const myRidesContainer = document.getElementById('myRides');
        const createRideForm = document.getElementById('createRideForm');
        const searchRoute = document.getElementById('searchRoute');

        if (searchRoute) {
            searchRoute.addEventListener('input', () => renderRides());
        }
        if (createRideForm) {
            createRideForm.addEventListener('submit', (e) => {
                e.preventDefault();
                createRideFromForm();
            });
        }
        if (ridesContainer) {
            ridesContainer.addEventListener('click', (ev) => {
                const btn = ev.target.closest && ev.target.closest('button[data-action]');
                if (!btn) return;
                const action = btn.dataset.action;
                const id = btn.dataset.id;
                if (action === 'book') bookRide(id);
            });
        }
        // seed sample data when empty (developer demo)
        if (ridesContainer && getRides().length === 0) {
            const demoDriverEmail = 'demo@driver.local';
            const drivers = getDrivers();
            if (!drivers.find(d => d.email === demoDriverEmail)) {
                drivers.push({ name: 'Demo Driver', email: demoDriverEmail, phone: '9999999999', license: 'DEMO123', vehicle: 'Demo Car' });
                saveDrivers(drivers);
            }
            const sample = [
                { id: generateId('ride'), driverEmail: demoDriverEmail, from: 'Downtown', to: 'Airport', date: new Date(Date.now()+86400000).toISOString().slice(0,10), time: '09:00', seats: 3, price: 350, notes: 'No smoking', bookings: [], createdAt: Date.now() },
                { id: generateId('ride'), driverEmail: demoDriverEmail, from: 'College', to: 'Mall', date: new Date(Date.now()+172800000).toISOString().slice(0,10), time: '18:30', seats: 2, price: 100, notes: 'Evening ride', bookings: [], createdAt: Date.now()-1000 }
            ];
            saveRides(sample);
        }

        // initial render
        renderRides();
        renderMyRides();
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