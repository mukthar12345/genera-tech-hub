// ============================================================
// GENERA TECH HUB — AUTHENTICATION
// Version: 3.0 — CLEAN (only handles login/signup)
// Does NOT load main.js (that causes duplicate variable errors)
// Does NOT load supabase.js (that's already loaded by pages)
// ============================================================

(function() {
    // Prevent double initialization
    if (window.gthAuthInitialized) return;
    window.gthAuthInitialized = true;

    console.log('🔐 Auth.js loaded');

    // ============================================================
    // 1. INITIALIZE ON DOM READY
    // ============================================================

    function initializeAuth() {
        // Only run on pages with auth forms
        const loginForm = document.getElementById('loginFormElement');
        const signupForm = document.getElementById('signupFormElement');

        if (!loginForm && !signupForm) {
            // Not on login page — silently exit
            return;
        }

        console.log('🔐 Auth: Initializing login/signup handlers');

        // Tab switching
        const loginTab = document.getElementById('loginTab');
        const signupTab = document.getElementById('signupTab');

        if (loginTab) loginTab.addEventListener('click', () => switchAuthTab('login'));
        if (signupTab) signupTab.addEventListener('click', () => switchAuthTab('signup'));

        // Password toggles
        document.querySelectorAll('.toggle-password').forEach(btn => {
            btn.addEventListener('click', function () {
                const input = this.parentElement.querySelector('input');
                if (!input) return;

                const type = input.type === 'password' ? 'text' : 'password';
                input.type = type;
                this.textContent = type === 'password' ? '👁️' : '👁️‍🗨️';
            });
        });

        // Login form submit
        if (loginForm) {
            loginForm.addEventListener('submit', handleLogin);
        }

        // Signup form submit
        if (signupForm) {
            signupForm.addEventListener('submit', handleSignup);
        }

        // Forgot password
        const forgotPassword = document.getElementById('forgotPassword');
        if (forgotPassword) {
            forgotPassword.addEventListener('click', handleForgotPassword);
        }

        // Check URL hash for signup
        if (window.location.hash === '#signup') {
            switchAuthTab('signup');
        }

        // Autofill remembered email
        autofillRememberedEmail();

        // Check if already logged in
        setTimeout(checkAuthAndRedirect, 800);

        console.log('✅ Auth: Login/signup handlers ready');
    }

    // Run on DOM ready
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', initializeAuth, { once: true });
    } else {
        initializeAuth();
    }

    // ============================================================
    // 2. TAB SWITCHING
    // ============================================================

    function switchAuthTab(tab) {
        const loginTab = document.getElementById('loginTab');
        const signupTab = document.getElementById('signupTab');
        const loginForm = document.getElementById('loginForm');
        const signupForm = document.getElementById('signupForm');

        if (!loginTab || !signupTab || !loginForm || !signupForm) return;

        if (tab === 'login') {
            loginTab.classList.add('active');
            signupTab.classList.remove('active');
            loginForm.classList.add('active');
            signupForm.classList.remove('active');
            window.location.hash = '';
        } else {
            signupTab.classList.add('active');
            loginTab.classList.remove('active');
            signupForm.classList.add('active');
            loginForm.classList.remove('active');
            window.location.hash = 'signup';
        }

        clearAlerts();
    }

    // Expose globally
    window.switchAuthTab = switchAuthTab;

    // ============================================================
    // 3. LOGIN HANDLER
    // ============================================================

    async function handleLogin(e) {
        e.preventDefault();
        console.log('🔐 Login form submitted');

        const emailInput = document.getElementById('loginEmail');
        const passwordInput = document.getElementById('loginPassword');
        const rememberMeInput = document.getElementById('rememberMe');
        const alert = document.getElementById('loginAlert');

        const email = emailInput ? emailInput.value.trim().toLowerCase() : '';
        const password = passwordInput ? passwordInput.value : '';
        const rememberMe = rememberMeInput ? rememberMeInput.checked : false;

        // Validate
        if (!email || !password) {
            showAlert(alert, '⚠️ Please fill in all fields.', 'error');
            return;
        }

        if (!isValidEmail(email)) {
            showAlert(alert, '⚠️ Please enter a valid email address.', 'error');
            return;
        }

        // Prepare button
        const submitBtn = e.target.querySelector('button[type="submit"]');
        const originalText = submitBtn.innerHTML;
        submitBtn.disabled = true;
        submitBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Logging in...';
        clearAlerts();

        try {
            // Use global signInUser if available
            if (typeof window.signInUser === 'undefined') {
                throw new Error('Authentication not ready. Please refresh the page.');
            }

            console.log('📡 Calling signInUser...');
            const result = await window.signInUser(email, password);

            if (result.success) {
                console.log('✅ Login successful');
                showAlert(alert, '✅ Login successful! Redirecting...', 'success');

                if (rememberMe) {
                    localStorage.setItem('gth_remember_email', email);
                } else {
                    localStorage.removeItem('gth_remember_email');
                }

                // Redirect based on role
                setTimeout(() => {
                    const isCeo = typeof window.isCeoEmail === 'function'
                        ? window.isCeoEmail(email)
                        : email === 'mudasirumukthar@gmail.com';

                    if (isCeo) {
                        window.location.href = '/src/pages/admin.html';
                    } else {
                        window.location.href = '/src/pages/index.html';
                    }
                }, 900);
            } else {
                console.warn('Login failed:', result.error);
                showAlert(alert, '❌ ' + (result.error || 'Login failed'), 'error');
                submitBtn.disabled = false;
                submitBtn.innerHTML = originalText;
            }
        } catch (error) {
            console.error('❌ Login error:', error);
            showAlert(alert, '❌ ' + error.message, 'error');
            submitBtn.disabled = false;
            submitBtn.innerHTML = originalText;
        }
    }

    // ============================================================
    // 4. SIGNUP HANDLER
    // ============================================================

    async function handleSignup(e) {
        e.preventDefault();
        console.log('📝 Signup form submitted');

        const nameInput = document.getElementById('signupName');
        const emailInput = document.getElementById('signupEmail');
        const phoneInput = document.getElementById('signupPhone');
        const passwordInput = document.getElementById('signupPassword');
        const confirmInput = document.getElementById('signupConfirmPassword');
        const termsInput = document.getElementById('termsCheck');
        const alert = document.getElementById('signupAlert');

        const fullName = nameInput ? nameInput.value.trim() : '';
        const email = emailInput ? emailInput.value.trim().toLowerCase() : '';
        const phone = phoneInput ? phoneInput.value.trim() : '';
        const password = passwordInput ? passwordInput.value : '';
        const confirmPassword = confirmInput ? confirmInput.value : '';
        const termsAccepted = termsInput ? termsInput.checked : false;

        // Validate
        if (!fullName || !email || !phone || !password || !confirmPassword) {
            showAlert(alert, '⚠️ Please fill in all fields.', 'error');
            return;
        }

        if (fullName.length < 2) {
            showAlert(alert, '⚠️ Please enter your full name.', 'error');
            return;
        }

        if (!isValidEmail(email)) {
            showAlert(alert, '⚠️ Please enter a valid email address.', 'error');
            return;
        }

        if (!isValidNigerianPhone(phone)) {
            showAlert(alert, '⚠️ Please enter a valid Nigerian phone number.', 'error');
            return;
        }

        if (password.length < 6) {
            showAlert(alert, '⚠️ Password must be at least 6 characters.', 'error');
            return;
        }

        if (password !== confirmPassword) {
            showAlert(alert, '⚠️ Passwords do not match.', 'error');
            return;
        }

        if (!termsAccepted) {
            showAlert(alert, '⚠️ Please accept the Terms & Privacy Policy.', 'error');
            return;
        }

        // Prepare button
        const submitBtn = e.target.querySelector('button[type="submit"]');
        const originalText = submitBtn.innerHTML;
        submitBtn.disabled = true;
        submitBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Creating account...';
        clearAlerts();

        try {
            if (typeof window.signUpUser === 'undefined') {
                throw new Error('Authentication not ready. Please refresh the page.');
            }

            console.log('📡 Calling signUpUser...');
            const result = await window.signUpUser(email, password, fullName, phone);

            if (result.success) {
                console.log('✅ Account created');
                showAlert(alert, '✅ Account created! Check your email to verify.', 'success');

                // Switch to login after 2 seconds
                setTimeout(() => {
                    switchAuthTab('login');
                    const loginEmail = document.getElementById('loginEmail');
                    if (loginEmail) loginEmail.value = email;
                    const loginAlert = document.getElementById('loginAlert');
                    showAlert(loginAlert, '✅ Account created! Please login.', 'success');
                }, 2200);
            } else {
                console.warn('Signup failed:', result.error);
                showAlert(alert, '❌ ' + (result.error || 'Signup failed'), 'error');
                submitBtn.disabled = false;
                submitBtn.innerHTML = originalText;
            }
        } catch (error) {
            console.error('❌ Signup error:', error);
            showAlert(alert, '❌ ' + error.message, 'error');
            submitBtn.disabled = false;
            submitBtn.innerHTML = originalText;
        }
    }

    // ============================================================
    // 5. FORGOT PASSWORD
    // ============================================================

    async function handleForgotPassword(e) {
        e.preventDefault();

        const emailInput = document.getElementById('loginEmail');
        const alert = document.getElementById('loginAlert');
        const email = emailInput ? emailInput.value.trim() : '';

        if (!email || !isValidEmail(email)) {
            showAlert(alert, '⚠️ Please enter your email address first.', 'error');
            if (emailInput) emailInput.focus();
            return;
        }

        if (typeof window.supabaseClient === 'undefined') {
            showAlert(alert, '⚠️ System not ready. Please refresh.', 'error');
            return;
        }

        const link = e.target;
        const originalText = link.textContent;
        link.textContent = 'Sending...';
        link.style.pointerEvents = 'none';
        clearAlerts();

        try {
            const { error } = await window.supabaseClient.auth.resetPasswordForEmail(email, {
                redirectTo: `${window.location.origin}/src/pages/login.html`
            });

            if (error) throw error;

            showAlert(alert, '✅ Password reset link sent! Check your email.', 'success');
        } catch (error) {
            console.error('Reset password error:', error);
            showAlert(alert, '❌ ' + error.message, 'error');
        } finally {
            link.textContent = originalText;
            link.style.pointerEvents = 'auto';
        }
    }

    // ============================================================
    // 6. CHECK AUTH & REDIRECT
    // ============================================================

    async function checkAuthAndRedirect() {
        try {
            if (typeof window.getCurrentUser === 'undefined') return;

            const result = await window.getCurrentUser();

            if (result.success && result.user) {
                const user = result.user;
                const email = String(user.email || '').toLowerCase();
                const name = user.user_metadata?.full_name || email;

                const alert = document.getElementById('loginAlert');
                showAlert(alert, `👋 Welcome back, ${name}! Redirecting...`, 'info');

                setTimeout(() => {
                    const isCeo = typeof window.isCeoEmail === 'function'
                        ? window.isCeoEmail(email)
                        : email === 'mudasirumukthar@gmail.com';

                    if (isCeo) {
                        window.location.href = '/src/pages/admin.html';
                    } else {
                        window.location.href = '/src/pages/index.html';
                    }
                }, 1200);
            }
        } catch (error) {
            console.error('Auth check error:', error);
        }
    }

    // ============================================================
    // 7. AUTOFILL REMEMBERED EMAIL
    // ============================================================

    function autofillRememberedEmail() {
        const remembered = localStorage.getItem('gth_remember_email');
        if (!remembered) return;

        const emailInput = document.getElementById('loginEmail');
        const rememberInput = document.getElementById('rememberMe');

        if (emailInput && !emailInput.value) {
            emailInput.value = remembered;
        }
        if (rememberInput) {
            rememberInput.checked = true;
        }
    }

    // ============================================================
    // 8. HELPERS
    // ============================================================

    function isValidEmail(email) {
        return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
    }

    function isValidNigerianPhone(phone) {
        const cleaned = phone.replace(/\s/g, '');
        return /^(0|\+234)?[789][01]\d{8}$/.test(cleaned);
    }

    function showAlert(element, message, type = 'error') {
        if (!element) return;
        element.textContent = message;
        element.className = `alert alert-${type} show`;
        element.style.display = 'block';
    }

    function clearAlerts() {
        const loginAlert = document.getElementById('loginAlert');
        const signupAlert = document.getElementById('signupAlert');
        if (loginAlert) {
            loginAlert.className = 'alert';
            loginAlert.style.display = 'none';
        }
        if (signupAlert) {
            signupAlert.className = 'alert';
            signupAlert.style.display = 'none';
        }
    }

    // ============================================================
    // 9. EXPOSE GLOBALLY
    // ============================================================

    window.handleLogin = handleLogin;
    window.handleSignup = handleSignup;
    window.handleForgotPassword = handleForgotPassword;
    window.checkAuthAndRedirect = checkAuthAndRedirect;

})();

console.log('✅ Genera Tech Hub: Auth.js loaded!');