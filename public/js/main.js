// ============================================================
// GENERA TECH HUB — MAIN JAVASCRIPT
// Version: 2.1 — Fixed admin paths
// ============================================================

function initializeMain() {
    if (window.gthMainInitialized) return;
    window.gthMainInitialized = true;

    console.log('🚀 Genera Tech Hub: Initializing...');

    initNavigation();
    initScrollEffects();
    initAnimations();
    initWhatsAppButton();
    initCeoButton();
    initChatbot();
    initFormHandlers();
    loadUserStatusWhenReady();
    autoTrackVisit();

    console.log('✅ Genera Tech Hub: Ready!');
}

if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initializeMain, { once: true });
} else {
    initializeMain();
}

// ============================================================
// NAVIGATION
// ============================================================
function initNavigation() {
    const hamburger = document.querySelector('.hamburger');
    const navPanel = document.querySelector('.nav-panel');

    if (hamburger && navPanel) {
        hamburger.addEventListener('click', function (e) {
            e.stopPropagation();
            navPanel.classList.toggle('active');
            this.classList.toggle('active');
            const isOpen = navPanel.classList.contains('active');
            this.setAttribute('aria-expanded', isOpen ? 'true' : 'false');
        });

        document.addEventListener('click', function (e) {
            if (navPanel.classList.contains('active') &&
                !navPanel.contains(e.target) &&
                !hamburger.contains(e.target)) {
                navPanel.classList.remove('active');
                hamburger.classList.remove('active');
                hamburger.setAttribute('aria-expanded', 'false');
            }
        });

        navPanel.querySelectorAll('a').forEach(link => {
            link.addEventListener('click', () => {
                navPanel.classList.remove('active');
                hamburger.classList.remove('active');
                hamburger.setAttribute('aria-expanded', 'false');
            });
        });
    }

    const header = document.querySelector('header');
    if (header) {
        window.addEventListener('scroll', function () {
            const currentScroll = window.pageYOffset || document.documentElement.scrollTop;
            header.classList.toggle('scrolled', currentScroll > 50);
        }, { passive: true });
    }

    const currentPage = window.location.pathname.split('/').pop() || 'index.html';
    document.querySelectorAll('.nav-links a').forEach(link => {
        const href = link.getAttribute('href') || '';
        const hrefPage = href.split('/').pop().split('#')[0];
        if (hrefPage && hrefPage === currentPage) {
            link.classList.add('active');
        }
    });
}

// ============================================================
// SCROLL EFFECTS
// ============================================================
function initScrollEffects() {
    const heroBg = document.querySelector('.hero-background');
    if (heroBg) {
        window.addEventListener('scroll', function () {
            const scrolled = window.pageYOffset;
            heroBg.style.transform = `translateY(${scrolled * 0.3}px)`;
        }, { passive: true });
    }
}

// ============================================================
// ANIMATIONS
// ============================================================
function initAnimations() {
    const fadeElements = document.querySelectorAll('.fade-in');

    if ('IntersectionObserver' in window) {
        const observer = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    entry.target.classList.add('visible');
                    observer.unobserve(entry.target);
                }
            });
        }, { threshold: 0.1, rootMargin: '0px 0px -50px 0px' });

        fadeElements.forEach(el => observer.observe(el));
    } else {
        fadeElements.forEach(el => el.classList.add('visible'));
    }

    document.querySelectorAll('.counter').forEach(counter => {
        const target = parseInt(counter.getAttribute('data-target'));
        if (target && target > 0) {
            animateCounter(counter, target);
        }
    });
}

function animateCounter(element, target) {
    const duration = 1800;
    const startTime = performance.now();

    function update(currentTime) {
        const elapsed = currentTime - startTime;
        const progress = Math.min(elapsed / duration, 1);
        const eased = 1 - Math.pow(1 - progress, 3);
        element.textContent = Math.floor(eased * target) + '+';

        if (progress < 1) {
            requestAnimationFrame(update);
        } else {
            element.textContent = target + '+';
        }
    }

    requestAnimationFrame(update);
}

// ============================================================
// WHATSAPP BUTTON
// ============================================================
function initWhatsAppButton() {
    if (document.querySelector('.whatsapp-float')) return;

    const btn = document.createElement('a');
    btn.className = 'whatsapp-float';
    btn.target = '_blank';
    btn.rel = 'noopener noreferrer';
    btn.setAttribute('aria-label', 'Chat on WhatsApp');
    btn.innerHTML = '💬';

    const phone = (typeof BUSINESS_CONFIG !== 'undefined' && BUSINESS_CONFIG.whatsapp) || '08081302228';
    const normalized = phone.replace(/\D/g, '').replace(/^0/, '234');
    btn.href = `https://wa.me/${normalized}?text=${encodeURIComponent('Hi Genera Tech Hub! I need assistance.')}`;

    document.body.appendChild(btn);
}

// ============================================================
// CEO FLOATING BUTTON
// ============================================================
async function initCeoButton() {
    if (window.location.pathname.includes('/admin')) return;

    let tries = 0;
    while (typeof getCurrentUser === 'undefined' && tries < 20) {
        await new Promise(r => setTimeout(r, 200));
        tries++;
    }

    if (typeof getCurrentUser === 'undefined') return;

    try {
      const email = String(result.user.email || '').toLowerCase();
const isCeo = typeof isCeoEmail === 'function'
    ? isCeoEmail(email)
    : email === 'mudasirumukthar@gmail.com';

if (!isCeo) return;  // ← This should exit if not CEO

        document.querySelector('.ceo-float')?.remove();

        const btn = document.createElement('a');
        btn.className = 'ceo-float';
        btn.href = '/src/pages/admin.html';  // ✅ FIXED
        btn.setAttribute('aria-label', 'CEO Dashboard');
        btn.setAttribute('title', 'Access CEO Dashboard');
        btn.innerHTML = '👑';

        document.body.appendChild(btn);
        console.log('👑 CEO floating button added');
    } catch (error) {
        console.warn('CEO button error:', error);
    }
}

// ============================================================
// CHATBOT
// ============================================================
window.chatbotProducts = window.chatbotProducts || [];

async function loadChatbotProducts() {
    try {
        if (typeof getProducts === 'undefined') return;
        const result = await getProducts();
        if (result.success) {
            window.chatbotProducts = result.products || [];
            console.log(`🤖 Assistant loaded ${window.chatbotProducts.length} products`);
        }
    } catch (error) {
        console.warn('Assistant product load failed:', error);
    }
}

function initChatbot() {
    if (document.querySelector('.chatbot-toggle')) return;
    createChatbot();
    setTimeout(loadChatbotProducts, 2000);
}

function createChatbot() {
    const toggle = document.createElement('button');
    toggle.className = 'chatbot-toggle';
    toggle.setAttribute('aria-label', 'Open Smart Assistant');
    toggle.innerHTML = '🤖';
    document.body.appendChild(toggle);

    const win = document.createElement('div');
    win.className = 'chatbot-window';
    win.setAttribute('role', 'dialog');
    win.setAttribute('aria-label', 'Genera Smart Assistant');
    win.innerHTML = `
        <div class="chatbot-header">
            <span>🤖 Genera Assistant</span>
            <button class="chatbot-close" aria-label="Close">✕</button>
        </div>
        <div class="chatbot-messages" id="chatMessages">
            <div class="chatbot-message ai">Hi! 👋 I'm the Genera Smart Assistant.<br><br>I can help with:<br>• Product prices &amp; availability<br>• Repairs<br>• Trade-ins<br>• Location &amp; hours<br><br>What do you need?</div>
        </div>
        <div class="chatbot-input">
            <input type="text" id="chatInput" placeholder="Ask me anything..." maxlength="200" aria-label="Message">
            <button id="chatSend" aria-label="Send">Send</button>
        </div>
    `;
    document.body.appendChild(win);

    const close = win.querySelector('.chatbot-close');
    const input = win.querySelector('#chatInput');
    const send = win.querySelector('#chatSend');
    const messages = win.querySelector('#chatMessages');

    toggle.addEventListener('click', (e) => {
        e.stopPropagation();
        win.classList.toggle('active');
        if (win.classList.contains('active')) {
            input.focus();
            if (window.chatbotProducts.length === 0) loadChatbotProducts();
        }
    });

    close.addEventListener('click', () => win.classList.remove('active'));

    document.addEventListener('click', (e) => {
        if (win.classList.contains('active') &&
            !win.contains(e.target) &&
            !toggle.contains(e.target)) {
            win.classList.remove('active');
        }
    });

    async function sendMessage() {
        const text = input.value.trim();
        if (!text) return;

        messages.innerHTML += `<div class="chatbot-message user">${escapeHtml(text)}</div>`;
        input.value = '';
        messages.scrollTop = messages.scrollHeight;

        const typing = document.createElement('div');
        typing.className = 'chatbot-message ai';
        typing.textContent = 'Typing...';
        messages.appendChild(typing);
        messages.scrollTop = messages.scrollHeight;

        const response = await getAssistantResponse(text);

        typing.remove();

        const responseEl = document.createElement('div');
        responseEl.className = 'chatbot-message ai';
        responseEl.innerHTML = response;
        messages.appendChild(responseEl);
        messages.scrollTop = messages.scrollHeight;
    }

    send.addEventListener('click', sendMessage);
    input.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') {
            e.preventDefault();
            sendMessage();
        }
    });
}

async function getAssistantResponse(question) {
    const q = question.toLowerCase().trim();

    if (window.chatbotProducts.length > 0) {
        const match = window.chatbotProducts.find(p => {
            const name = String(p.name || '').toLowerCase();
            const brand = String(p.brand || '').toLowerCase();
            const model = String(p.model || '').toLowerCase();
            return (name && q.includes(name)) ||
                   (brand && q.includes(brand)) ||
                   (model && q.includes(model));
        });

        if (match) {
            const price = new Intl.NumberFormat('en-NG', {
                style: 'currency', currency: 'NGN', minimumFractionDigits: 0
            }).format(match.price);

            const stock = match.stock_quantity > 0
                ? `✅ In stock (${match.stock_quantity} available)`
                : '❌ Out of stock';

            const waMsg = encodeURIComponent(
                `Hi Genera Tech Hub! I'm interested in ${match.name} - ${price}. Is it available?`
            );

            return `📱 <strong>${match.name}</strong><br><br>
💰 <strong style="color:#FFD700;">${price}</strong><br>
${stock}<br>
🏷️ ${match.condition || 'New'}<br>
${match.storage ? `💾 ${match.storage}<br>` : ''}
<br>
<a href="https://wa.me/2348081302228?text=${waMsg}" target="_blank" style="display:inline-block;padding:0.5rem 1rem;background:#25D366;color:#fff;border-radius:6px;text-decoration:none;font-weight:600;margin-top:0.4rem;">💬 Order on WhatsApp</a>`;
        }
    }

    if (q.includes('product') || q.includes('what do you sell') || q.includes('catalog')) {
        if (window.chatbotProducts.length === 0) {
            return `🛍️ We sell phones, laptops, tablets, and accessories.<br><br>Visit our <a href="/src/pagesproducts.html" style="color:#FFD700;">Products page</a> to see what's available!`;
        }
        const phones = window.chatbotProducts.filter(p => p.category === 'Phones').length;
        const laptops = window.chatbotProducts.filter(p => p.category === 'Laptops').length;
        return `🛍️ <strong>Our Products</strong> (${window.chatbotProducts.length} total)<br><br>📱 Phones: ${phones}<br>💻 Laptops: ${laptops}<br>🎧 Accessories<br><br><a href="/src/pagesproducts.html" style="color:#FFD700;">Browse all products →</a>`;
    }

    if (q.includes('price') || q.includes('cost') || q.includes('how much')) {
        if (window.chatbotProducts.length > 0) {
            const prices = window.chatbotProducts.map(p => p.price || 0).filter(p => p > 0);
            const min = Math.min(...prices);
            const max = Math.max(...prices);
            return `💰 Our price range is <strong>₦${min.toLocaleString()}</strong> to <strong>₦${max.toLocaleString()}</strong>.<br><br>Ask me about any specific product for exact pricing!`;
        }
        return `💰 For specific pricing, please <a href="https://wa.me/2348081302228" target="_blank" style="color:#FFD700;">chat with us on WhatsApp</a>.`;
    }

    if (q.includes('iphone')) {
        return `📱 Yes, we sell iPhones! Models depend on current stock.<br><br><a href="/src/pagesproducts.html" style="color:#FFD700;">Check products page</a> or <a href="https://wa.me/2348081302228" target="_blank" style="color:#25D366;">chat on WhatsApp</a>.`;
    }

    if (q.includes('samsung')) {
        return `📱 Yes, we sell Samsung phones!<br><br><a href="/src/pagesproducts.html" style="color:#FFD700;">Check products page</a> or <a href="https://wa.me/2348081302228" target="_blank" style="color:#25D366;">chat on WhatsApp</a>.`;
    }

    if (q.includes('laptop') || q.includes('macbook')) {
        return `💻 Yes, we sell laptops! Brands include HP, Dell, Lenovo, Apple, and more.<br><br><a href="/src/pagesproducts.html" style="color:#FFD700;">Browse laptops →</a>`;
    }

    if (q.includes('repair') || q.includes('fix') || q.includes('broken')) {
        return `🔧 We repair phones, laptops, and tablets.<br><br>Services include:<br>• Screen replacement<br>• Battery replacement<br>• Water damage<br>• Software issues<br><br><a href="/src/pagesrepair.html" style="color:#FFD700;">Book a repair →</a>`;
    }

    if (q.includes('trade') || q.includes('swap') || q.includes('sell')) {
        return `🔄 Yes, we offer trade-ins!<br><br>We buy used phones and laptops.<br><br><a href="/src/pagesswap.html" style="color:#FFD700;">Get a trade-in quote →</a>`;
    }

    if (q.includes('warranty') || q.includes('guarantee')) {
        return `🛡️ Warranty details depend on the specific product or service.<br><br>Please <a href="https://wa.me/2348081302228" target="_blank" style="color:#25D366;">chat on WhatsApp</a> for exact warranty terms.`;
    }

    if (q.includes('hour') || q.includes('open') || q.includes('close') || q.includes('time')) {
        return `🕐 For current business hours, please <a href="https://wa.me/2348081302228" target="_blank" style="color:#25D366;">contact us on WhatsApp</a>.`;
    }

    if (q.includes('location') || q.includes('where') || q.includes('address')) {
        return `📍 For our location and directions, please <a href="https://wa.me/2348081302228" target="_blank" style="color:#25D366;">chat with us on WhatsApp</a>.`;
    }

    if (q.includes('deliver') || q.includes('shipping')) {
        return `🚚 Yes, we offer delivery. Please <a href="https://wa.me/2348081302228" target="_blank" style="color:#25D366;">chat on WhatsApp</a> to arrange.`;
    }

    if (q.includes('contact') || q.includes('reach') || q.includes('call') || q.includes('phone')) {
        return `📞 Contact us:<br><br>💬 <strong>WhatsApp:</strong> 08081302228<br>📱 <strong>Phone:</strong> 08081302228<br><br><a href="https://wa.me/2348081302228" target="_blank" style="color:#25D366;">Chat now →</a>`;
    }

    if (q.match(/^(hi|hello|hey|good (morning|afternoon|evening))/)) {
        return `Hello! 👋 Welcome to <strong>Genera Tech Hub</strong>.<br><br>How can I help you today?`;
    }

    if (q.includes('thank')) {
        return `You're welcome! 😊<br><br><em>Genera Tech Hub — Technology You Can Trust</em>`;
    }

    return `I'm not sure I have the exact answer for that.<br><br>For the best help, please <a href="https://wa.me/2348081302228" target="_blank" style="color:#25D366;">chat with us on WhatsApp</a> — we reply fast!`;
}

// ============================================================
// FORM HANDLERS
// ============================================================
function initFormHandlers() {
    const repairForm = document.getElementById('repairForm');
    if (repairForm) repairForm.addEventListener('submit', handleRepairForm);

    const swapForm = document.getElementById('swapForm');
    if (swapForm) swapForm.addEventListener('submit', handleSwapForm);

    const contactForm = document.getElementById('contactForm');
    if (contactForm) contactForm.addEventListener('submit', handleContactForm);

    const reviewForm = document.getElementById('reviewForm');
    if (reviewForm) reviewForm.addEventListener('submit', handleReviewForm);
}

async function handleRepairForm(e) {
    e.preventDefault();
    const form = e.target;
    const btn = form.querySelector('button[type="submit"]');
    const originalText = btn.innerHTML;

    btn.disabled = true;
    btn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Sending...';

    try {
        const formData = new FormData(form);

        const data = {
            deviceType: formData.get('deviceType'),
            deviceBrand: formData.get('deviceBrand'),
            deviceModel: formData.get('deviceModel'),
            issueDescription: formData.get('issueDescription'),
            collectionMethod: formData.get('collectionMethod') || 'walk-in',
            preferredDate: formData.get('preferredDate') || null,
            preferredTime: formData.get('preferredTime') || null,
            pickupAddress: formData.get('pickupAddress') || null,
            pickupLandmark: formData.get('pickupLandmark') || null,
            deliveryMethod: formData.get('deliveryMethod') || 'pickup-in-person',
            deliveryAddress: formData.get('deliveryAddress') || null,
            customerName: formData.get('customerName'),
            customerPhone: formData.get('customerPhone'),
            customerEmail: formData.get('customerEmail') || null,
            customerWhatsApp: formData.get('customerWhatsApp') || formData.get('customerPhone')
        };

        let result = { success: true, referenceNumber: 'GTH-REP-' + Date.now() };
        if (typeof submitRepairRequest !== 'undefined') {
            result = await submitRepairRequest(data);
        }

        const refNumber = result.referenceNumber || 'GTH-REP-' + Date.now().toString().slice(-6);
        const message = buildRepairWhatsAppMessage(data, refNumber);

        if (typeof openWhatsApp === 'function') {
            openWhatsApp(message);
        } else {
            window.open(`https://wa.me/2348081302228?text=${encodeURIComponent(message)}`, '_blank');
        }

        showToast('✅ Repair request sent!', 'success');
        form.reset();
    } catch (error) {
        console.error('Repair form error:', error);
        showToast('❌ Something went wrong.', 'error');
    } finally {
        btn.disabled = false;
        btn.innerHTML = originalText;
    }
}

function buildRepairWhatsAppMessage(data, refNumber) {
    const collections = {
        'walk-in': '🏢 Walk-in to store',
        'pickup': '🚗 We pick up from you',
        'dropoff-courier': '📦 You send via courier'
    };
    const deliveries = {
        'pickup-in-person': '🏢 I\'ll pick up in person',
        'delivered-to-me': '🚚 Deliver to my address',
        'dispatched': '📦 Dispatch via courier'
    };

    return `🔧 *NEW REPAIR BOOKING*\n*GENERA TECH HUB*\n\n` +
        `━━━━━━━━━━━━━━━━━━━\n📱 *DEVICE*\n━━━━━━━━━━━━━━━━━━━\n` +
        `• Type: ${data.deviceType || 'N/A'}\n` +
        `• Brand: ${data.deviceBrand || 'N/A'}\n` +
        `• Model: ${data.deviceModel || 'N/A'}\n\n` +
        `*Issue:* ${data.issueDescription || 'N/A'}\n\n` +
        `━━━━━━━━━━━━━━━━━━━\n🚗 *COLLECTION*\n━━━━━━━━━━━━━━━━━━━\n` +
        `${collections[data.collectionMethod] || data.collectionMethod}\n` +
        `📅 ${data.preferredDate || 'Flexible'}\n` +
        `🕐 ${data.preferredTime || 'Flexible'}\n` +
        (data.pickupAddress ? `📍 ${data.pickupAddress}\n${data.pickupLandmark ? `🏠 ${data.pickupLandmark}\n` : ''}` : '') +
        `\n━━━━━━━━━━━━━━━━━━━\n📦 *DELIVERY*\n━━━━━━━━━━━━━━━━━━━\n` +
        `${deliveries[data.deliveryMethod] || data.deliveryMethod}\n` +
        (data.deliveryAddress ? `📍 ${data.deliveryAddress}\n` : '') +
        `\n━━━━━━━━━━━━━━━━━━━\n👤 *CUSTOMER*\n━━━━━━━━━━━━━━━━━━━\n` +
        `• Name: ${data.customerName}\n` +
        `• Phone: ${data.customerPhone}\n` +
        `• WhatsApp: ${data.customerWhatsApp}\n` +
        (data.customerEmail ? `• Email: ${data.customerEmail}\n` : '') +
        `\n━━━━━━━━━━━━━━━━━━━\n🆔 *REFERENCE: ${refNumber}*\n━━━━━━━━━━━━━━━━━━━\n\n` +
        `_Genera Tech Hub — Technology You Can Trust_ 👑`;
}

async function handleSwapForm(e) {
    e.preventDefault();
    const form = e.target;
    const btn = form.querySelector('button[type="submit"]');
    const originalText = btn.innerHTML;

    btn.disabled = true;
    btn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Sending...';

    try {
        const formData = new FormData(form);

        const data = {
            deviceType: formData.get('deviceType') || document.getElementById('deviceType')?.value,
            deviceBrand: formData.get('deviceBrand'),
            deviceModel: formData.get('deviceModel'),
            deviceStorage: formData.get('deviceStorage') || null,
            deviceAge: formData.get('deviceAge') || null,
            deviceCondition: formData.get('deviceCondition') || document.querySelector('input[name="deviceCondition"]:checked')?.value,
            deviceNotes: formData.get('deviceNotes') || null,
            swapPreference: formData.get('swapPreference') || document.querySelector('input[name="swapPreference"]:checked')?.value,
            targetDevice: formData.get('targetDevice') || null,
            customerName: formData.get('customerName'),
            customerPhone: formData.get('customerPhone'),
            customerWhatsApp: formData.get('customerWhatsApp') || formData.get('customerPhone'),
            customerEmail: formData.get('customerEmail') || null
        };

        let result = { success: true, referenceNumber: 'GTH-SWP-' + Date.now() };
        if (typeof submitSwapRequest !== 'undefined') {
            result = await submitSwapRequest(data);
        }

        const refNumber = result.referenceNumber || 'GTH-SWP-' + Date.now().toString().slice(-6);

        const message = `🔄 *NEW TRADE-IN REQUEST*\n*GENERA TECH HUB*\n\n` +
            `━━━━━━━━━━━━━━━━━━━\n📱 *DEVICE*\n━━━━━━━━━━━━━━━━━━━\n` +
            `• Type: ${data.deviceType || 'N/A'}\n` +
            `• Brand: ${data.deviceBrand}\n` +
            `• Model: ${data.deviceModel}\n` +
            (data.deviceStorage ? `• Storage: ${data.deviceStorage}\n` : '') +
            `• Condition: ${data.deviceCondition}\n` +
            `\n━━━━━━━━━━━━━━━━━━━\n🎯 *PREFERENCE*\n━━━━━━━━━━━━━━━━━━━\n` +
            `${data.swapPreference}\n` +
            (data.targetDevice ? `Upgrade to: ${data.targetDevice}\n` : '') +
            `\n━━━━━━━━━━━━━━━━━━━\n👤 *CUSTOMER*\n━━━━━━━━━━━━━━━━━━━\n` +
            `• Name: ${data.customerName}\n` +
            `• Phone: ${data.customerPhone}\n` +
            (data.customerEmail ? `• Email: ${data.customerEmail}\n` : '') +
            `\n🆔 *REF: ${refNumber}*\n\n` +
            `_Genera Tech Hub — Technology You Can Trust_ 👑`;

        if (typeof openWhatsApp === 'function') {
            openWhatsApp(message);
        } else {
            window.open(`https://wa.me/2348081302228?text=${encodeURIComponent(message)}`, '_blank');
        }

        showToast('✅ Trade-in request sent!', 'success');
        form.reset();
    } catch (error) {
        console.error('Swap form error:', error);
        showToast('❌ Something went wrong.', 'error');
    } finally {
        btn.disabled = false;
        btn.innerHTML = originalText;
    }
}

async function handleContactForm(e) {
    e.preventDefault();
    const form = e.target;
    const btn = form.querySelector('button[type="submit"]');
    const originalText = btn.innerHTML;

    btn.disabled = true;
    btn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Sending...';

    try {
        const formData = new FormData(form);

        const data = {
            name: formData.get('name'),
            phone: formData.get('phone'),
            email: formData.get('email') || null,
            subject: formData.get('subject') || 'General Inquiry',
            message: formData.get('message')
        };

        if (typeof submitContactMessage !== 'undefined') {
            await submitContactMessage(data);
        }

        const message = `📞 *CONTACT FORM*\n*GENERA TECH HUB*\n\n` +
            `👤 Name: ${data.name}\n` +
            `📞 Phone: ${data.phone}\n` +
            (data.email ? `✉️ Email: ${data.email}\n` : '') +
            `📋 Subject: ${data.subject}\n\n` +
            `💬 Message:\n${data.message}\n\n` +
            `_Genera Tech Hub — Technology You Can Trust_ 👑`;

        if (typeof openWhatsApp === 'function') {
            openWhatsApp(message);
        } else {
            window.open(`https://wa.me/2348081302228?text=${encodeURIComponent(message)}`, '_blank');
        }

        showToast('✅ Message sent!', 'success');
        form.reset();
    } catch (error) {
        console.error('Contact form error:', error);
        showToast('❌ Something went wrong.', 'error');
    } finally {
        btn.disabled = false;
        btn.innerHTML = originalText;
    }
}

async function handleReviewForm(e) {
    e.preventDefault();
    const form = e.target;
    const btn = form.querySelector('button[type="submit"]');
    const originalText = btn.innerHTML;

    btn.disabled = true;
    btn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Sending...';

    try {
        const formData = new FormData(form);

        const data = {
            rating: parseInt(formData.get('rating')) || 5,
            reviewText: formData.get('reviewText'),
            deviceService: formData.get('deviceService') || null,
            customerName: formData.get('customerName') || 'Anonymous'
        };

        if (typeof submitReview !== 'undefined') {
            await submitReview(data);
        }

        const message = `⭐ *NEW REVIEW*\n*GENERA TECH HUB*\n\n` +
            `${'⭐'.repeat(data.rating)} (${data.rating}/5)\n\n` +
            `💬 "${data.reviewText}"\n\n` +
            `👤 ${data.customerName}\n` +
            `📱 ${data.deviceService || 'Not specified'}\n\n` +
            `_Genera Tech Hub — Technology You Can Trust_ 👑`;

        if (typeof openWhatsApp === 'function') {
            openWhatsApp(message);
        } else {
            window.open(`https://wa.me/2348081302228?text=${encodeURIComponent(message)}`, '_blank');
        }

        showToast('✅ Thank you for your review!', 'success');
        form.reset();
    } catch (error) {
        console.error('Review form error:', error);
        showToast('❌ Something went wrong.', 'error');
    } finally {
        btn.disabled = false;
        btn.innerHTML = originalText;
    }
}

// ============================================================
// USER STATUS
// ============================================================
function loadUserStatusWhenReady(attempt = 0) {
    const authButtons = document.querySelector('.auth-buttons');
    if (authButtons && typeof getCurrentUser !== 'undefined') {
        loadUserStatus();
        return;
    }
    if (attempt < 15) {
        setTimeout(() => loadUserStatusWhenReady(attempt + 1), 300);
    }
}

async function loadUserStatus() {
    try {
        const authButtons = document.querySelector('.auth-buttons');
        if (!authButtons) return;

        const result = await getCurrentUser();

        if (result.success && result.user) {
            const user = result.user;
            const name = user.user_metadata?.full_name || user.email;
            const isCeo = typeof isCeoEmail === 'function' && isCeoEmail(user.email);

            authButtons.innerHTML = `
                <span>👋 ${escapeHtml(name)}</span>
                ${isCeo ? '<a href="/src/pages/admin.html" class="btn btn-primary btn-sm">👑 Dashboard</a>' : ''}
                <a href="#" onclick="handleLogout(event); return false;" class="btn btn-secondary btn-sm">Logout</a>
            `;
        } else {
            authButtons.innerHTML = `
                <a href="/src/pageslogin.html" class="btn btn-secondary btn-sm">Login</a>
                <a href="/src/pageslogin.html#signup" class="btn btn-primary btn-sm">Sign Up</a>
            `;
        }
    } catch (error) {
        console.warn('User status error:', error);
    }
}

async function handleLogout(event) {
    if (event) event.preventDefault();

    if (typeof signOutUser === 'undefined') {
        window.location.reload();
        return;
    }

    const result = await signOutUser();
    if (result.success) {
        showToast('👋 Logged out', 'success');
        setTimeout(() => window.location.reload(), 600);
    } else {
        showToast('❌ Logout failed', 'error');
    }
}

// ============================================================
// ANALYTICS
// ============================================================
function autoTrackVisit() {
    if (window.location.pathname.includes('/admin')) return;
    if (window.gthAnalyticsLoaded) return;
    window.gthAnalyticsLoaded = true;

    setTimeout(() => {
        if (typeof trackVisit === 'function') {
            trackVisit().catch(() => {});
        }
    }, 1500);
}

// ============================================================
// TOAST
// ============================================================
function showToast(message, type = 'success') {
    document.querySelectorAll('.toast').forEach(t => t.remove());

    const toast = document.createElement('div');
    toast.className = `toast toast-${type}`;
    toast.setAttribute('role', 'alert');
    toast.textContent = message;
    document.body.appendChild(toast);

    setTimeout(() => {
        toast.style.opacity = '0';
        toast.style.transform = 'translate(-50%, 100%)';
        setTimeout(() => toast.remove(), 400);
    }, 4000);
}

// ============================================================
// UTILITIES
// ============================================================
function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

function formatCurrency(amount) {
    return new Intl.NumberFormat('en-NG', {
        style: 'currency',
        currency: 'NGN',
        minimumFractionDigits: 0,
        maximumFractionDigits: 0
    }).format(amount);
}

function getUrlParams() {
    const params = new URLSearchParams(window.location.search);
    const result = {};
    for (const [key, value] of params) {
        result[key] = value;
    }
    return result;
}

// ============================================================
// EXPOSE GLOBALLY
// ============================================================
window.showToast = showToast;
window.escapeHtml = escapeHtml;
window.formatCurrency = formatCurrency;
window.getUrlParams = getUrlParams;
window.handleLogout = handleLogout;
window.loadUserStatus = loadUserStatus;
window.initializeMain = initializeMain;

console.log('✅ Genera Tech Hub: main.js loaded successfully!');