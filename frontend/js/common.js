// common.js - basic front-end behavior and validation

document.addEventListener('DOMContentLoaded', () => {
    const signupForm = document.getElementById('signupForm');
    const loginForm = document.getElementById('loginForm');
    const registerForm = document.getElementById('registerForm');

    if (signupForm) {
        signupForm.addEventListener('submit', (e) => {
            e.preventDefault();
            const pwd = signupForm.password.value;
            const confirm = signupForm.confirmPassword.value;
            if (pwd !== confirm) {
                alert('Passwords do not match.');
                return;
            }
            // TODO: send data to backend
            alert('Sign up successful!');
            signupForm.reset();
        });
    }

    if (loginForm) {
        loginForm.addEventListener('submit', (e) => {
            e.preventDefault();
            // TODO: validate credentials with backend
            alert('Logged in!');
            loginForm.reset();
        });
    }

    if (registerForm) {
        registerForm.addEventListener('submit', (e) => {
            e.preventDefault();
            // TODO: validate & submit driver registration
            alert('Registered as driver!');
            registerForm.reset();
        });
    }
});