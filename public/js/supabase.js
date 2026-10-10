// ============================================================
// GENERA TECH HUB — SUPABASE CONNECTION
// Version: 2.0 — Production Ready
// Handles: Auth, Database, Storage, Analytics
// ============================================================

// ============================================================
// 1. CONFIGURATION
// ============================================================

const SUPABASE_URL = 'https://ofrvakghmlyidtelenib.supabase.co';

// Legacy anon key (kept as requested — safe for browser use)
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im9mcnZha2dobWx5aWR0ZWxlbmliIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODg0OTEwNTUsImV4cCI6MjEwNDA2NzA1NX0.r5ZgBb68YmKHlB0CnWfIP09YY5ehPt-A0-HWmxcWLvU';

// Business configuration
const BUSINESS_CONFIG = {
    name: 'Genera Tech Hub',
    tagline: 'Technology You Can Trust',
    whatsapp: '08081302228',
    email: 'info@generatechub.com',
    ceoEmail: 'mudasirumukthar@gmail.com'
};

// ============================================================
// 2. INITIALIZE SUPABASE CLIENT
// ============================================================

let supabaseClient = null;

(function initializeSupabaseClient() {
    if (window.supabaseClient && typeof window.supabaseClient.auth === 'object') {
        supabaseClient = window.supabaseClient;
        console.log('ℹ️ Supabase client already initialized');
        return;
    }

    let attempts = 0;
    const maxAttempts = 50; // 5 seconds max wait

    function tryInit() {
        attempts++;

        if (typeof window.supabase === 'undefined' || typeof window.supabase.createClient !== 'function') {
            if (attempts < maxAttempts) {
                // Wait 100ms and retry
                setTimeout(tryInit, 100);
                return;
            }
            console.error('❌ Supabase SDK failed to load after 5 seconds');
            console.error('   Make sure this is in <head>:');
            console.error('   <script src="https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2"></script>');
            return;
        }

        supabaseClient = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
        window.supabaseClient = supabaseClient;

        console.log('✅ Supabase client initialized');
        console.log('📍 Project:', SUPABASE_URL);
        console.log('👑 Business:', BUSINESS_CONFIG.name);
        console.log('🔑 Auth ready:', typeof supabaseClient.auth === 'object');
    }

    tryInit();
})();
// ============================================================
// 3. HELPER FUNCTIONS
// ============================================================

function getWhatsAppNumber() {
    const digits = BUSINESS_CONFIG.whatsapp.replace(/\D/g, '');
    return digits.startsWith('234') ? digits : `234${digits.replace(/^0/, '')}`;
}

function getWhatsAppLink(message) {
    return `https://wa.me/${getWhatsAppNumber()}?text=${encodeURIComponent(message)}`;
}

function openWhatsApp(message) {
    window.open(getWhatsAppLink(message), '_blank');
}

function isCeoEmail(email) {
    const normalized = String(email || '').trim().toLowerCase();
    const configured = String(BUSINESS_CONFIG.ceoEmail || '').trim().toLowerCase();
    return Boolean(configured) && normalized === configured;
}

function getSupabaseErrorMessage(error) {
    const message = String(error?.message || '').toLowerCase();

    if (message.includes('user already registered') || message.includes('already been registered')) {
        return 'This email is already registered. Try logging in or resetting your password.';
    }
    if (message.includes('password')) {
        return error.message;
    }
    if (message.includes('email provider') || message.includes('email confirmations')) {
        return 'Email confirmation is not configured. Check Supabase settings.';
    }
    if (message.includes('rate limit') || message.includes('too many requests')) {
        return 'Too many attempts. Please wait a few minutes and try again.';
    }
    if (message.includes('database error') || message.includes('trigger')) {
        return 'Could not save your account. Please try again.';
    }
    if (message.includes('invalid login') || message.includes('invalid credentials')) {
        return 'Invalid email or password. Please check and try again.';
    }
    if (message.includes('fetch') || message.includes('network')) {
        return 'Connection problem. Check your internet and try again.';
    }

    return error?.message || 'Something went wrong. Please try again.';
}

// ============================================================
// 4. AUTHENTICATION
// ============================================================

async function signUpUser(email, password, fullName, phone) {
    try {
        const normalizedEmail = email.trim().toLowerCase();
        const { data, error } = await supabaseClient.auth.signUp({
            email: normalizedEmail,
            password: password,
            options: {
                emailRedirectTo: `${window.location.origin}/src/pageslogin.html`,
                data: {
                    full_name: fullName,
                    phone: phone.trim(),
                    role: 'customer'
                }
            }
        });

        if (error) throw error;

        // Log activity (non-blocking)
        logActivity({
            activity_type: 'user_signup',
            activity_title: `New user: ${fullName}`,
            activity_description: `${normalizedEmail} just signed up`,
            user_email: normalizedEmail,
            user_name: fullName
        }).catch(() => {});

        return { success: true, data };
    } catch (error) {
        console.error('Sign up error:', error);
        return { success: false, error: getSupabaseErrorMessage(error) };
    }
}

async function signInUser(email, password) {
    try {
        const normalizedEmail = String(email || '').trim().toLowerCase();
        const { data, error } = await supabaseClient.auth.signInWithPassword({
            email: normalizedEmail,
            password: password
        });

        if (error) throw error;
        return { success: true, data };
    } catch (error) {
        console.error('Sign in error:', error.message);
        return { success: false, error: getSupabaseErrorMessage(error) };
    }
}

async function signOutUser() {
    try {
        const { error } = await supabaseClient.auth.signOut();
        if (error) throw error;
        return { success: true };
    } catch (error) {
        console.error('Sign out error:', error.message);
        return { success: false, error: error.message };
    }
}

async function getCurrentUser() {
    try {
        const { data: { user }, error } = await supabaseClient.auth.getUser();
        if (error) throw error;
        return { success: true, user };
    } catch (error) {
        if (error?.message === 'Auth session missing!') {
            return { success: true, user: null };
        }
        console.error('Get user error:', error.message);
        return { success: false, error: error.message };
    }
}

async function isAdminUser() {
    try {
        const { data: sessionData } = await supabaseClient.auth.getSession();
        if (!sessionData?.session) return false;

        const userResult = await getCurrentUser();
        if (!userResult.success || !userResult.user) return false;

        const user = userResult.user;
        const emailMatch = isCeoEmail(user.email);
        const appRole = String(user.app_metadata?.role || '').toLowerCase();

        return emailMatch || appRole === 'admin';
    } catch (error) {
        console.error('Admin check error:', error);
        return false;
    }
}

async function getAdminAccessStatus() {
    try {
        const { data: sessionData } = await supabaseClient.auth.getSession();
        if (!sessionData?.session) {
            return { isAdmin: false, reason: 'no-session' };
        }

        const userResult = await getCurrentUser();
        if (!userResult.success || !userResult.user) {
            return { isAdmin: false, reason: 'user-unavailable' };
        }

        const user = userResult.user;
        const emailMatch = isCeoEmail(user.email);
        const appRole = String(user.app_metadata?.role || '').toLowerCase();
        const isAdmin = emailMatch || appRole === 'admin';

        return {
            isAdmin,
            user,
            sessionEmail: user.email,
            role: appRole || null,
            reason: isAdmin ? 'admin' : 'not-admin'
        };
    } catch (error) {
        return { isAdmin: false, reason: 'error', error: error.message };
    }
}

// ============================================================
// 5. PRODUCT FUNCTIONS
// ============================================================

async function getProducts(filters = {}) {
    try {
        let query = supabaseClient
            .from('products')
            .select('*')
            .eq('is_available', true)
            .order('created_at', { ascending: false });

        if (filters.category) query = query.eq('category', filters.category);
        if (filters.brand) query = query.eq('brand', filters.brand);
        if (filters.condition) query = query.eq('condition', filters.condition);
        if (filters.minPrice) query = query.gte('price', parseFloat(filters.minPrice));
        if (filters.maxPrice) query = query.lte('price', parseFloat(filters.maxPrice));
        if (filters.search) query = query.ilike('name', `%${filters.search}%`);
        if (filters.isFeatured) query = query.eq('is_featured', true);

        const { data, error } = await query;
        if (error) throw error;
        return { success: true, products: data || [] };
    } catch (error) {
        console.error('Get products error:', error.message);
        return { success: false, error: error.message, products: [] };
    }
}

async function getProductById(productId) {
    try {
        const { data, error } = await supabaseClient
            .from('products')
            .select('*')
            .eq('id', productId)
            .single();

        if (error) throw error;
        return { success: true, product: data };
    } catch (error) {
        console.error('Get product error:', error.message);
        return { success: false, error: error.message };
    }
}

async function getFeaturedProducts(limit = 4) {
    try {
        const { data, error } = await supabaseClient
            .from('products')
            .select('*')
            .eq('is_featured', true)
            .eq('is_available', true)
            .limit(limit);

        if (error) throw error;
        return { success: true, products: data || [] };
    } catch (error) {
        console.error('Get featured error:', error.message);
        return { success: false, error: error.message, products: [] };
    }
}

async function addProduct(productData) {
    try {
        const isAdmin = await isAdminUser();
        if (!isAdmin) return { success: false, error: 'Unauthorized' };

        const { data, error } = await supabaseClient
            .from('products')
            .insert([{
                name: productData.name,
                description: productData.description || '',
                price: parseFloat(productData.price),
                category: productData.category || 'Other',
                condition: productData.condition || 'New',
                brand: productData.brand || '',
                model: productData.model || '',
                storage: productData.storage || '',
                color: productData.color || '',
                stock_quantity: parseInt(productData.stockQuantity) || 0,
                is_featured: productData.isFeatured || false,
                is_available: productData.isAvailable !== false,
                image_urls: productData.imageUrls || []
            }])
            .select();

        if (error) throw error;

        logActivity({
            activity_type: 'product_added',
            activity_title: `Product added: ${productData.name}`,
            activity_description: 'CEO added a new product',
            related_id: data?.[0]?.id,
            related_table: 'products'
        }).catch(() => {});

        return { success: true, data };
    } catch (error) {
        console.error('Add product error:', error.message);
        return { success: false, error: error.message };
    }
}

async function updateProduct(productId, productData) {
    try {
        const isAdmin = await isAdminUser();
        if (!isAdmin) return { success: false, error: 'Unauthorized' };

        const { data, error } = await supabaseClient
            .from('products')
            .update({
                name: productData.name,
                description: productData.description,
                price: parseFloat(productData.price),
                category: productData.category,
                condition: productData.condition,
                brand: productData.brand,
                model: productData.model,
                storage: productData.storage,
                color: productData.color,
                stock_quantity: parseInt(productData.stockQuantity),
                is_featured: productData.isFeatured,
                is_available: productData.isAvailable,
                image_urls: productData.imageUrls,
                updated_at: new Date().toISOString()
            })
            .eq('id', productId)
            .select();

        if (error) throw error;

        logActivity({
            activity_type: 'product_updated',
            activity_title: `Product updated: ${productData.name}`,
            related_id: productId,
            related_table: 'products'
        }).catch(() => {});

        return { success: true, data };
    } catch (error) {
        console.error('Update product error:', error.message);
        return { success: false, error: error.message };
    }
}

async function deleteProduct(productId) {
    try {
        const isAdmin = await isAdminUser();
        if (!isAdmin) return { success: false, error: 'Unauthorized' };

        const { error } = await supabaseClient
            .from('products')
            .delete()
            .eq('id', productId);

        if (error) throw error;

        logActivity({
            activity_type: 'product_deleted',
            activity_title: 'Product deleted',
            related_id: productId,
            related_table: 'products'
        }).catch(() => {});

        return { success: true };
    } catch (error) {
        console.error('Delete product error:', error.message);
        return { success: false, error: error.message };
    }
}

// ============================================================
// 6. REPAIR FUNCTIONS
// ============================================================

async function submitRepairRequest(data) {
    try {
        const refNumber = generateRefNumber('REP');

        const { data: result, error } = await supabaseClient
            .from('repair_requests')
            .insert([{
                reference_number: refNumber,
                device_type: data.deviceType,
                device_brand: data.deviceBrand,
                device_model: data.deviceModel,
                issue_description: data.issueDescription,
                collection_method: data.collectionMethod || 'walk-in',
                preferred_date: data.preferredDate || null,
                preferred_time: data.preferredTime || null,
                pickup_address: data.pickupAddress || null,
                pickup_landmark: data.pickupLandmark || null,
                delivery_method: data.deliveryMethod || 'pickup-in-person',
                delivery_address: data.deliveryAddress || null,
                customer_name: data.customerName,
                customer_phone: data.customerPhone,
                customer_whatsapp: data.customerWhatsApp || data.customerPhone,
                customer_email: data.customerEmail || null,
                status: 'pending',
                user_id: data.userId || null
            }])
            .select();

        if (error) throw error;

        logActivity({
            activity_type: 'repair_booked',
            activity_title: `Repair: ${data.deviceBrand || ''} ${data.deviceModel || ''}`.trim(),
            activity_description: `${data.customerName} booked a repair`,
            user_email: data.customerEmail || null,
            user_name: data.customerName,
            related_id: result?.[0]?.id,
            related_table: 'repair_requests'
        }).catch(() => {});

        return { success: true, data: result, referenceNumber: refNumber };
    } catch (error) {
        console.error('Submit repair error:', error.message);
        return { success: false, error: error.message };
    }
}

async function getRepairRequests(status = null) {
    try {
        const isAdmin = await isAdminUser();
        if (!isAdmin) return { success: false, error: 'Unauthorized', requests: [] };

        let query = supabaseClient
            .from('repair_requests')
            .select('*')
            .order('created_at', { ascending: false });

        if (status) query = query.eq('status', status);

        const { data, error } = await query;
        if (error) throw error;
        return { success: true, requests: data || [] };
    } catch (error) {
        console.error('Get repairs error:', error.message);
        return { success: false, error: error.message, requests: [] };
    }
}

async function updateRepairStatus(repairId, newStatus) {
    try {
        const isAdmin = await isAdminUser();
        if (!isAdmin) return { success: false, error: 'Unauthorized' };

        const { data, error } = await supabaseClient
            .from('repair_requests')
            .update({ status: newStatus, updated_at: new Date().toISOString() })
            .eq('id', repairId)
            .select();

        if (error) throw error;
        return { success: true, data };
    } catch (error) {
        console.error('Update repair error:', error.message);
        return { success: false, error: error.message };
    }
}

// ============================================================
// 7. TRADE-IN FUNCTIONS
// ============================================================

async function submitSwapRequest(data) {
    try {
        const refNumber = generateRefNumber('SWP');

        const { data: result, error } = await supabaseClient
            .from('swap_requests')
            .insert([{
                reference_number: refNumber,
                device_type: data.deviceType,
                device_brand: data.deviceBrand,
                device_model: data.deviceModel,
                device_storage: data.deviceStorage || null,
                device_age: data.deviceAge || null,
                device_condition: data.deviceCondition,
                device_notes: data.deviceNotes || null,
                swap_preference: data.swapPreference,
                target_device: data.targetDevice || null,
                customer_name: data.customerName,
                customer_phone: data.customerPhone,
                customer_whatsapp: data.customerWhatsApp || data.customerPhone,
                customer_email: data.customerEmail || null,
                status: 'pending',
                user_id: data.userId || null
            }])
            .select();

        if (error) throw error;

        logActivity({
            activity_type: 'swap_submitted',
            activity_title: `Trade-in: ${data.deviceBrand} ${data.deviceModel}`,
            activity_description: `${data.customerName} submitted a trade-in`,
            user_name: data.customerName,
            related_id: result?.[0]?.id,
            related_table: 'swap_requests'
        }).catch(() => {});

        return { success: true, data: result, referenceNumber: refNumber };
    } catch (error) {
        console.error('Submit swap error:', error.message);
        return { success: false, error: error.message };
    }
}

async function getSwapRequests() {
    try {
        const isAdmin = await isAdminUser();
        if (!isAdmin) return { success: false, error: 'Unauthorized', requests: [] };

        const { data, error } = await supabaseClient
            .from('swap_requests')
            .select('*')
            .order('created_at', { ascending: false });

        if (error) throw error;
        return { success: true, requests: data || [] };
    } catch (error) {
        console.error('Get swaps error:', error.message);
        return { success: false, error: error.message, requests: [] };
    }
}

// ============================================================
// 8. REVIEW FUNCTIONS
// ============================================================

async function submitReview(reviewData) {
    try {
        const { data, error } = await supabaseClient
            .from('reviews')
            .insert([{
                rating: reviewData.rating,
                review_text: reviewData.reviewText,
                device_service: reviewData.deviceService || null,
                customer_name: reviewData.customerName || 'Anonymous',
                is_approved: false,
                user_id: reviewData.userId || null
            }])
            .select();

        if (error) throw error;

        logActivity({
            activity_type: 'review_submitted',
            activity_title: `New ${reviewData.rating}-star review`,
            activity_description: `${reviewData.customerName || 'Anonymous'} left a review`,
            user_name: reviewData.customerName || 'Anonymous',
            related_id: data?.[0]?.id,
            related_table: 'reviews'
        }).catch(() => {});

        return { success: true, data };
    } catch (error) {
        console.error('Submit review error:', error.message);
        return { success: false, error: error.message };
    }
}

async function getApprovedReviews(limit = 20) {
    try {
        const { data, error } = await supabaseClient
            .from('reviews')
            .select('*')
            .eq('is_approved', true)
            .order('created_at', { ascending: false })
            .limit(limit);

        if (error) throw error;
        return { success: true, reviews: data || [] };
    } catch (error) {
        console.error('Get reviews error:', error.message);
        return { success: false, error: error.message, reviews: [] };
    }
}

async function getPendingReviews() {
    try {
        const isAdmin = await isAdminUser();
        if (!isAdmin) return { success: false, error: 'Unauthorized', reviews: [] };

        const { data, error } = await supabaseClient
            .from('reviews')
            .select('*')
            .eq('is_approved', false)
            .order('created_at', { ascending: false });

        if (error) throw error;
        return { success: true, reviews: data || [] };
    } catch (error) {
        console.error('Get pending reviews error:', error.message);
        return { success: false, error: error.message, reviews: [] };
    }
}

async function approveReview(reviewId) {
    try {
        const isAdmin = await isAdminUser();
        if (!isAdmin) return { success: false, error: 'Unauthorized' };

        const { data, error } = await supabaseClient
            .from('reviews')
            .update({ is_approved: true })
            .eq('id', reviewId)
            .select();

        if (error) throw error;
        return { success: true, data };
    } catch (error) {
        console.error('Approve review error:', error.message);
        return { success: false, error: error.message };
    }
}

// ============================================================
// 9. CONTACT FUNCTIONS
// ============================================================

async function submitContactMessage(messageData) {
    try {
        const { data, error } = await supabaseClient
            .from('contact_messages')
            .insert([{
                name: messageData.name,
                phone: messageData.phone,
                email: messageData.email || null,
                subject: messageData.subject || 'General Inquiry',
                message: messageData.message,
                status: 'unread',
                user_id: messageData.userId || null
            }])
            .select();

        if (error) throw error;

        logActivity({
            activity_type: 'contact_message',
            activity_title: `Contact: ${messageData.subject || 'New message'}`,
            activity_description: `${messageData.name} sent a message`,
            user_name: messageData.name,
            related_id: data?.[0]?.id,
            related_table: 'contact_messages'
        }).catch(() => {});

        return { success: true, data };
    } catch (error) {
        console.error('Submit contact error:', error.message);
        return { success: false, error: error.message };
    }
}

async function getContactMessages() {
    try {
        const isAdmin = await isAdminUser();
        if (!isAdmin) return { success: false, error: 'Unauthorized', messages: [] };

        const { data, error } = await supabaseClient
            .from('contact_messages')
            .select('*')
            .order('created_at', { ascending: false });

        if (error) throw error;
        return { success: true, messages: data || [] };
    } catch (error) {
        console.error('Get messages error:', error.message);
        return { success: false, error: error.message, messages: [] };
    }
}

// ============================================================
// 10. ANALYTICS & ACTIVITY
// ============================================================

function getVisitorId() {
    let id = localStorage.getItem('gth_visitor_id');
    if (!id) {
        id = 'v_' + Math.random().toString(36).substr(2, 16) + '_' + Date.now();
        localStorage.setItem('gth_visitor_id', id);
    }
    return id;
}

function getSessionId() {
    let id = sessionStorage.getItem('gth_session_id');
    if (!id) {
        id = 's_' + Math.random().toString(36).substr(2, 16) + '_' + Date.now();
        sessionStorage.setItem('gth_session_id', id);
    }
    return id;
}

function getDeviceType() {
    const ua = navigator.userAgent;
    if (/tablet|ipad|playbook|silk/i.test(ua)) return 'tablet';
    if (/mobile|iphone|ipod|android|blackberry|opera mini|iemobile/i.test(ua)) return 'mobile';
    return 'desktop';
}

async function trackVisit() {
    if (!navigator.onLine) return;
    if (window.location.pathname.includes('/admin')) return;

    try {
        const { error } = await supabaseClient.from('site_visits').insert([{
            visitor_id: getVisitorId(),
            session_id: getSessionId(),
            page_url: window.location.pathname,
            page_title: document.title,
            referrer: document.referrer || 'direct',
            user_agent: navigator.userAgent.substring(0, 500),
            device_type: getDeviceType()
        }]);

        if (error) console.warn('Visit tracking:', error.message);
    } catch (error) {
        console.warn('Analytics error:', error);
    }
}

async function trackProductView(productId, productName) {
    if (!navigator.onLine || !productId) return;

    try {
        await supabaseClient.from('product_views').insert([{
            product_id: productId,
            visitor_id: getVisitorId(),
            session_id: getSessionId()
        }]);

        logActivity({
            activity_type: 'product_view',
            activity_title: `Viewed: ${productName || 'Product'}`,
            related_id: productId,
            related_table: 'products'
        }).catch(() => {});
    } catch (error) {
        console.warn('Product view error:', error);
    }
}

async function logActivity(data) {
    if (!navigator.onLine) return;

    try {
        const { error } = await supabaseClient.from('activity_logs').insert([{
            activity_type: data.activity_type,
            activity_title: data.activity_title,
            activity_description: data.activity_description || null,
            user_email: data.user_email || null,
            user_name: data.user_name || null,
            related_id: data.related_id || null,
            related_table: data.related_table || null,
            metadata: data.metadata || {}
        }]);

        if (error) console.warn('Activity log:', error.message);
    } catch (error) {
        console.warn('Activity error:', error);
    }
}

async function getActivityLogs(limit = 20) {
    try {
        const isAdmin = await isAdminUser();
        if (!isAdmin) return { success: false, activities: [] };

        const { data, error } = await supabaseClient
            .from('activity_logs')
            .select('*')
            .order('created_at', { ascending: false })
            .limit(limit);

        if (error) throw error;
        return { success: true, activities: data || [] };
    } catch (error) {
        console.error('Get activity error:', error.message);
        return { success: false, activities: [] };
    }
}

async function getDashboardStats() {
    try {
        const isAdmin = await isAdminUser();
        if (!isAdmin) return { success: false };

        const today = new Date(); today.setHours(0, 0, 0, 0);
        const weekAgo = new Date(); weekAgo.setDate(weekAgo.getDate() - 7);
        const monthAgo = new Date(); monthAgo.setDate(monthAgo.getDate() - 30);

        const [todayVisits, weekVisits, monthVisits, totalProducts, pendingRepairs, unreadMessages, pendingReviews] = await Promise.all([
            supabaseClient.from('site_visits').select('*', { count: 'exact', head: true }).gte('created_at', today.toISOString()),
            supabaseClient.from('site_visits').select('*', { count: 'exact', head: true }).gte('created_at', weekAgo.toISOString()),
            supabaseClient.from('site_visits').select('*', { count: 'exact', head: true }).gte('created_at', monthAgo.toISOString()),
            supabaseClient.from('products').select('*', { count: 'exact', head: true }),
            supabaseClient.from('repair_requests').select('*', { count: 'exact', head: true }).eq('status', 'pending'),
            supabaseClient.from('contact_messages').select('*', { count: 'exact', head: true }).eq('status', 'unread'),
            supabaseClient.from('reviews').select('*', { count: 'exact', head: true }).eq('is_approved', false)
        ]);

        return {
            success: true,
            stats: {
                visitsToday: todayVisits.count || 0,
                visitsWeek: weekVisits.count || 0,
                visitsMonth: monthVisits.count || 0,
                totalProducts: totalProducts.count || 0,
                pendingRepairs: pendingRepairs.count || 0,
                unreadMessages: unreadMessages.count || 0,
                pendingReviews: pendingReviews.count || 0
            }
        };
    } catch (error) {
        console.error('Stats error:', error.message);
        return { success: false, error: error.message };
    }
}

async function getTopViewedProducts(limit = 5) {
    try {
        const isAdmin = await isAdminUser();
        if (!isAdmin) return { success: false, products: [] };

        const { data, error } = await supabaseClient
            .from('product_views')
            .select('product_id, products(name)')
            .limit(500);

        if (error) throw error;

        const counts = {};
        (data || []).forEach(v => {
            if (!v.product_id) return;
            if (!counts[v.product_id]) {
                counts[v.product_id] = { name: v.products?.name || 'Unknown', views: 0 };
            }
            counts[v.product_id].views++;
        });

        const sorted = Object.values(counts).sort((a, b) => b.views - a.views).slice(0, limit);
        return { success: true, products: sorted };
    } catch (error) {
        console.error('Top products error:', error.message);
        return { success: false, products: [] };
    }
}

// ============================================================
// 11. IMAGE UPLOAD
// ============================================================

async function uploadProductImage(file) {
    try {
        if (!file) return { success: false, error: 'No file provided' };

        const allowedTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];
        if (!allowedTypes.includes(file.type)) {
            return { success: false, error: 'Invalid file type. Use JPG, PNG, WEBP, or GIF.' };
        }

        if (file.size > 5 * 1024 * 1024) {
            return { success: false, error: 'File too large. Maximum 5MB.' };
        }

        const ext = file.name.split('.').pop().toLowerCase();
        const fileName = `product_${Date.now()}_${Math.random().toString(36).substr(2, 8)}.${ext}`;

        const { data, error } = await supabaseClient.storage
            .from('product-images')
            .upload(fileName, file, { cacheControl: '3600', upsert: false });

        if (error) throw error;

        const { data: urlData } = supabaseClient.storage
            .from('product-images')
            .getPublicUrl(fileName);

        return { success: true, url: urlData.publicUrl, path: fileName };
    } catch (error) {
        console.error('Upload error:', error.message);
        return { success: false, error: error.message };
    }
}

// ============================================================
// 12. UTILITY
// ============================================================

function generateRefNumber(prefix = 'REF') {
    const year = new Date().getFullYear();
    const random = Math.floor(Math.random() * 9999).toString().padStart(4, '0');
    return `GTH-${prefix}-${year}-${random}`;
}

// ============================================================
// 13. EXPORT TO GLOBAL SCOPE
// ============================================================

window.supabaseClient = supabaseClient;
window.BUSINESS_CONFIG = BUSINESS_CONFIG;

window.signUpUser = signUpUser;
window.signInUser = signInUser;
window.signOutUser = signOutUser;
window.getCurrentUser = getCurrentUser;
window.isAdminUser = isAdminUser;
window.getAdminAccessStatus = getAdminAccessStatus;
window.isCeoEmail = isCeoEmail;

window.getProducts = getProducts;
window.getProductById = getProductById;
window.getFeaturedProducts = getFeaturedProducts;
window.addProduct = addProduct;
window.updateProduct = updateProduct;
window.deleteProduct = deleteProduct;

window.submitRepairRequest = submitRepairRequest;
window.getRepairRequests = getRepairRequests;
window.updateRepairStatus = updateRepairStatus;

window.submitSwapRequest = submitSwapRequest;
window.getSwapRequests = getSwapRequests;

window.submitReview = submitReview;
window.getApprovedReviews = getApprovedReviews;
window.getPendingReviews = getPendingReviews;
window.approveReview = approveReview;

window.submitContactMessage = submitContactMessage;
window.getContactMessages = getContactMessages;

window.trackVisit = trackVisit;
window.trackProductView = trackProductView;
window.logActivity = logActivity;
window.getActivityLogs = getActivityLogs;
window.getDashboardStats = getDashboardStats;
window.getTopViewedProducts = getTopViewedProducts;

window.uploadProductImage = uploadProductImage;

window.getWhatsAppLink = getWhatsAppLink;
window.openWhatsApp = openWhatsApp;
window.generateRefNumber = generateRefNumber;
window.getSupabaseErrorMessage = getSupabaseErrorMessage;

console.log('✅ Genera Tech Hub: All Supabase functions loaded!');
console.log('📦 Ready to serve:', BUSINESS_CONFIG.name);