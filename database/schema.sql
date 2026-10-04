-- ============================================================
-- GENERA TECH HUB — DATABASE SCHEMA
-- Version: 2.1 — Production Ready + Safe Migration
-- Run ONCE in Supabase SQL Editor
-- ============================================================

-- ============================================================
-- 0. DROP OLD TABLES (CLEAN START)
-- ============================================================
-- ⚠️ This deletes all existing data.
-- Since we're in development, this is safe.
-- If you have real customer data later, use ALTER TABLE instead.

DROP TABLE IF EXISTS product_views CASCADE;
DROP TABLE IF EXISTS activity_logs CASCADE;
DROP TABLE IF EXISTS site_visits CASCADE;
DROP TABLE IF EXISTS contact_messages CASCADE;
DROP TABLE IF EXISTS reviews CASCADE;
DROP TABLE IF EXISTS swap_requests CASCADE;
DROP TABLE IF EXISTS repair_requests CASCADE;
DROP TABLE IF EXISTS products CASCADE;

-- ============================================================
-- 1. PRODUCTS TABLE
-- ============================================================
CREATE TABLE products (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    price DECIMAL(10,2) NOT NULL CHECK (price >= 0),
    category VARCHAR(100),
    condition VARCHAR(50) DEFAULT 'New',
    brand VARCHAR(100),
    model VARCHAR(100),
    storage VARCHAR(50),
    color VARCHAR(50),
    stock_quantity INTEGER DEFAULT 0 CHECK (stock_quantity >= 0),
    is_featured BOOLEAN DEFAULT FALSE,
    is_available BOOLEAN DEFAULT TRUE,
    image_urls TEXT[],
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ============================================================
-- 2. REPAIR REQUESTS TABLE
-- ============================================================
CREATE TABLE repair_requests (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    reference_number VARCHAR(50) UNIQUE,
    user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    device_type VARCHAR(100) NOT NULL,
    device_brand VARCHAR(100),
    device_model VARCHAR(100),
    issue_description TEXT NOT NULL,
    collection_method VARCHAR(50) DEFAULT 'walk-in',
    preferred_date DATE,
    preferred_time VARCHAR(50),
    pickup_address TEXT,
    pickup_landmark VARCHAR(255),
    delivery_method VARCHAR(50) DEFAULT 'pickup-in-person',
    delivery_address TEXT,
    status VARCHAR(50) DEFAULT 'pending',
    customer_name VARCHAR(255) NOT NULL,
    customer_phone VARCHAR(20) NOT NULL,
    customer_whatsapp VARCHAR(20),
    customer_email VARCHAR(255),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ============================================================
-- 3. SWAP REQUESTS TABLE
-- ============================================================
CREATE TABLE swap_requests (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    reference_number VARCHAR(50) UNIQUE,
    user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    device_type VARCHAR(100),
    device_brand VARCHAR(100) NOT NULL,
    device_model VARCHAR(100) NOT NULL,
    device_storage VARCHAR(50),
    device_age VARCHAR(50),
    device_condition VARCHAR(50) NOT NULL,
    device_notes TEXT,
    swap_preference VARCHAR(50),
    target_device VARCHAR(255),
    status VARCHAR(50) DEFAULT 'pending',
    customer_name VARCHAR(255) NOT NULL,
    customer_phone VARCHAR(20) NOT NULL,
    customer_whatsapp VARCHAR(20),
    customer_email VARCHAR(255),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ============================================================
-- 4. REVIEWS TABLE
-- ============================================================
CREATE TABLE reviews (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    rating INTEGER NOT NULL CHECK (rating >= 1 AND rating <= 5),
    review_text TEXT NOT NULL,
    device_service VARCHAR(255),
    customer_name VARCHAR(255),
    is_approved BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ============================================================
-- 5. CONTACT MESSAGES TABLE
-- ============================================================
CREATE TABLE contact_messages (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    name VARCHAR(255) NOT NULL,
    phone VARCHAR(20) NOT NULL,
    email VARCHAR(255),
    subject VARCHAR(255),
    message TEXT NOT NULL,
    status VARCHAR(50) DEFAULT 'unread',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ============================================================
-- 6. SITE VISITS TABLE (ANALYTICS)
-- ============================================================
CREATE TABLE site_visits (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    visitor_id VARCHAR(100),
    session_id VARCHAR(100),
    page_url VARCHAR(500),
    page_title VARCHAR(255),
    referrer VARCHAR(500),
    user_agent VARCHAR(500),
    device_type VARCHAR(50),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ============================================================
-- 7. ACTIVITY LOGS TABLE
-- ============================================================
CREATE TABLE activity_logs (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    activity_type VARCHAR(50) NOT NULL,
    activity_title VARCHAR(255) NOT NULL,
    activity_description TEXT,
    user_email VARCHAR(255),
    user_name VARCHAR(255),
    related_id UUID,
    related_table VARCHAR(50),
    metadata JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ============================================================
-- 8. PRODUCT VIEWS TABLE
-- ============================================================
CREATE TABLE product_views (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    product_id UUID REFERENCES products(id) ON DELETE CASCADE,
    visitor_id VARCHAR(100),
    session_id VARCHAR(100),
    viewed_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ============================================================
-- 9. INDEXES FOR PERFORMANCE
-- ============================================================
CREATE INDEX idx_products_category ON products(category);
CREATE INDEX idx_products_brand ON products(brand);
CREATE INDEX idx_products_available ON products(is_available);
CREATE INDEX idx_products_featured ON products(is_featured);
CREATE INDEX idx_products_created ON products(created_at DESC);

CREATE INDEX idx_repairs_status ON repair_requests(status);
CREATE INDEX idx_repairs_reference ON repair_requests(reference_number);
CREATE INDEX idx_repairs_created ON repair_requests(created_at DESC);

CREATE INDEX idx_swaps_status ON swap_requests(status);
CREATE INDEX idx_swaps_created ON swap_requests(created_at DESC);

CREATE INDEX idx_reviews_approved ON reviews(is_approved);
CREATE INDEX idx_reviews_created ON reviews(created_at DESC);

CREATE INDEX idx_messages_status ON contact_messages(status);
CREATE INDEX idx_messages_created ON contact_messages(created_at DESC);

CREATE INDEX idx_visits_created ON site_visits(created_at DESC);
CREATE INDEX idx_visits_visitor ON site_visits(visitor_id);

CREATE INDEX idx_activity_created ON activity_logs(created_at DESC);
CREATE INDEX idx_activity_type ON activity_logs(activity_type);

CREATE INDEX idx_views_product ON product_views(product_id);
CREATE INDEX idx_views_created ON product_views(viewed_at DESC);

-- ============================================================
-- 10. ENABLE ROW LEVEL SECURITY (RLS)
-- ============================================================
ALTER TABLE products ENABLE ROW LEVEL SECURITY;
ALTER TABLE repair_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE swap_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE reviews ENABLE ROW LEVEL SECURITY;
ALTER TABLE contact_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE site_visits ENABLE ROW LEVEL SECURITY;
ALTER TABLE activity_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE product_views ENABLE ROW LEVEL SECURITY;

-- ============================================================
-- 11. HELPER FUNCTION — CHECK IF USER IS CEO
-- ============================================================
CREATE OR REPLACE FUNCTION public.is_ceo()
RETURNS BOOLEAN
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
    SELECT EXISTS (
        SELECT 1 FROM auth.users
        WHERE id = auth.uid()
        AND (
            lower(email) = 'mudasirumukthar@gmail.com'
            OR (raw_app_meta_data ->> 'role') = 'admin'
        )
    );
$$;

GRANT EXECUTE ON FUNCTION public.is_ceo() TO authenticated;
GRANT EXECUTE ON FUNCTION public.is_ceo() TO anon;

-- ============================================================
-- 12. RLS POLICIES — PRODUCTS
-- ============================================================
CREATE POLICY "Public can read products" ON products
    FOR SELECT USING (true);

CREATE POLICY "CEO can manage products" ON products
    FOR ALL USING (public.is_ceo());

-- ============================================================
-- 13. RLS POLICIES — REPAIR REQUESTS
-- ============================================================
CREATE POLICY "Anyone can insert repairs" ON repair_requests
    FOR INSERT WITH CHECK (true);

CREATE POLICY "CEO can read repairs" ON repair_requests
    FOR SELECT USING (public.is_ceo());

CREATE POLICY "CEO can update repairs" ON repair_requests
    FOR UPDATE USING (public.is_ceo());

-- ============================================================
-- 14. RLS POLICIES — SWAP REQUESTS
-- ============================================================
CREATE POLICY "Anyone can insert swaps" ON swap_requests
    FOR INSERT WITH CHECK (true);

CREATE POLICY "CEO can read swaps" ON swap_requests
    FOR SELECT USING (public.is_ceo());

CREATE POLICY "CEO can update swaps" ON swap_requests
    FOR UPDATE USING (public.is_ceo());

-- ============================================================
-- 15. RLS POLICIES — REVIEWS
-- ============================================================
CREATE POLICY "Anyone can insert reviews" ON reviews
    FOR INSERT WITH CHECK (true);

CREATE POLICY "Public can read approved reviews" ON reviews
    FOR SELECT USING (is_approved = true);

CREATE POLICY "CEO can manage reviews" ON reviews
    FOR ALL USING (public.is_ceo());

-- ============================================================
-- 16. RLS POLICIES — CONTACT MESSAGES
-- ============================================================
CREATE POLICY "Anyone can insert contact" ON contact_messages
    FOR INSERT WITH CHECK (true);

CREATE POLICY "CEO can read contacts" ON contact_messages
    FOR SELECT USING (public.is_ceo());

CREATE POLICY "CEO can update contacts" ON contact_messages
    FOR UPDATE USING (public.is_ceo());

-- ============================================================
-- 17. RLS POLICIES — SITE VISITS
-- ============================================================
CREATE POLICY "Anyone can log visits" ON site_visits
    FOR INSERT WITH CHECK (true);

CREATE POLICY "CEO can read visits" ON site_visits
    FOR SELECT USING (public.is_ceo());

-- ============================================================
-- 18. RLS POLICIES — ACTIVITY LOGS
-- ============================================================
CREATE POLICY "Anyone can log activity" ON activity_logs
    FOR INSERT WITH CHECK (true);

CREATE POLICY "CEO can read activity" ON activity_logs
    FOR SELECT USING (public.is_ceo());

-- ============================================================
-- 19. RLS POLICIES — PRODUCT VIEWS
-- ============================================================
CREATE POLICY "Anyone can log product views" ON product_views
    FOR INSERT WITH CHECK (true);

CREATE POLICY "CEO can read product views" ON product_views
    FOR SELECT USING (public.is_ceo());

-- ============================================================
-- 20. STORAGE BUCKET FOR PRODUCT IMAGES
-- ============================================================
INSERT INTO storage.buckets (id, name, public)
VALUES ('product-images', 'product-images', true)
ON CONFLICT (id) DO NOTHING;

-- ============================================================
-- 21. STORAGE POLICIES
-- ============================================================
DROP POLICY IF EXISTS "Public can view product images" ON storage.objects;
CREATE POLICY "Public can view product images" ON storage.objects
    FOR SELECT USING (bucket_id = 'product-images');

DROP POLICY IF EXISTS "CEO can upload product images" ON storage.objects;
CREATE POLICY "CEO can upload product images" ON storage.objects
    FOR INSERT WITH CHECK (
        bucket_id = 'product-images' AND public.is_ceo()
    );

DROP POLICY IF EXISTS "CEO can update product images" ON storage.objects;
CREATE POLICY "CEO can update product images" ON storage.objects
    FOR UPDATE USING (
        bucket_id = 'product-images' AND public.is_ceo()
    );

DROP POLICY IF EXISTS "CEO can delete product images" ON storage.objects;
CREATE POLICY "CEO can delete product images" ON storage.objects
    FOR DELETE USING (
        bucket_id = 'product-images' AND public.is_ceo()
    );

-- ============================================================
-- ✅ END OF SCHEMA
-- ============================================================
-- After running:
-- 1. Verify all 8 tables in Table Editor
-- 2. Verify policies in Authentication → Policies
-- 3. Verify 'product-images' bucket in Storage
-- ============================================================