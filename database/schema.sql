-- ============================================================
-- GENERA TECH HUB — SAFE DATABASE SCHEMA
-- Version 3.0
-- Creates required tables without dropping existing tables.
-- Run in Supabase SQL Editor.
-- ============================================================

BEGIN;

-- 1. PRODUCTS
CREATE TABLE IF NOT EXISTS public.products (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(255) NOT NULL,
    description TEXT,
    price NUMERIC(10,2) NOT NULL DEFAULT 0 CHECK (price >= 0),
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
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. REPAIR REQUESTS
CREATE TABLE IF NOT EXISTS public.repair_requests (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
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
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. TRADE-IN / SWAP REQUESTS
CREATE TABLE IF NOT EXISTS public.swap_requests (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
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
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 4. REVIEWS
CREATE TABLE IF NOT EXISTS public.reviews (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    rating INTEGER NOT NULL CHECK (rating BETWEEN 1 AND 5),
    review_text TEXT NOT NULL,
    device_service VARCHAR(255),
    customer_name VARCHAR(255),
    is_approved BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 5. CONTACT MESSAGES
CREATE TABLE IF NOT EXISTS public.contact_messages (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    name VARCHAR(255) NOT NULL,
    phone VARCHAR(20) NOT NULL,
    email VARCHAR(255),
    subject VARCHAR(255),
    message TEXT NOT NULL,
    status VARCHAR(50) DEFAULT 'unread',
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 6. SITE VISITS
CREATE TABLE IF NOT EXISTS public.site_visits (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    visitor_id VARCHAR(100),
    session_id VARCHAR(100),
    page_url VARCHAR(500),
    page_title VARCHAR(255),
    referrer VARCHAR(500),
    user_agent VARCHAR(500),
    device_type VARCHAR(50),
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 7. ACTIVITY LOGS
CREATE TABLE IF NOT EXISTS public.activity_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    activity_type VARCHAR(50) NOT NULL,
    activity_title VARCHAR(255) NOT NULL,
    activity_description TEXT,
    user_email VARCHAR(255),
    user_name VARCHAR(255),
    related_id UUID,
    related_table VARCHAR(50),
    metadata JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 8. PRODUCT VIEWS
CREATE TABLE IF NOT EXISTS public.product_views (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    product_id UUID REFERENCES public.products(id) ON DELETE CASCADE,
    visitor_id VARCHAR(100),
    session_id VARCHAR(100),
    viewed_at TIMESTAMPTZ DEFAULT NOW()
);

-- 9. INDEXES
CREATE INDEX IF NOT EXISTS idx_products_category
    ON public.products(category);
CREATE INDEX IF NOT EXISTS idx_products_brand
    ON public.products(brand);
CREATE INDEX IF NOT EXISTS idx_products_available
    ON public.products(is_available);
CREATE INDEX IF NOT EXISTS idx_products_featured
    ON public.products(is_featured);
CREATE INDEX IF NOT EXISTS idx_products_created
    ON public.products(created_at DESC);

CREATE INDEX IF NOT EXISTS idx_repairs_status
    ON public.repair_requests(status);
CREATE INDEX IF NOT EXISTS idx_repairs_reference
    ON public.repair_requests(reference_number);
CREATE INDEX IF NOT EXISTS idx_repairs_created
    ON public.repair_requests(created_at DESC);

CREATE INDEX IF NOT EXISTS idx_swaps_status
    ON public.swap_requests(status);
CREATE INDEX IF NOT EXISTS idx_swaps_created
    ON public.swap_requests(created_at DESC);

CREATE INDEX IF NOT EXISTS idx_reviews_approved
    ON public.reviews(is_approved);
CREATE INDEX IF NOT EXISTS idx_reviews_created
    ON public.reviews(created_at DESC);

CREATE INDEX IF NOT EXISTS idx_messages_status
    ON public.contact_messages(status);
CREATE INDEX IF NOT EXISTS idx_messages_created
    ON public.contact_messages(created_at DESC);

CREATE INDEX IF NOT EXISTS idx_visits_created
    ON public.site_visits(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_visits_visitor
    ON public.site_visits(visitor_id);

CREATE INDEX IF NOT EXISTS idx_activity_created
    ON public.activity_logs(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_activity_type
    ON public.activity_logs(activity_type);

CREATE INDEX IF NOT EXISTS idx_views_product
    ON public.product_views(product_id);
CREATE INDEX IF NOT EXISTS idx_views_created
    ON public.product_views(viewed_at DESC);

-- 10. CEO CHECK
-- Uses the existing authenticated account's email.
CREATE OR REPLACE FUNCTION public.is_ceo()
RETURNS BOOLEAN
LANGUAGE SQL
STABLE
SECURITY DEFINER
SET search_path = ''
AS $$
    SELECT EXISTS (
        SELECT 1
        FROM auth.users AS u
        WHERE u.id = (SELECT auth.uid())
          AND (
              LOWER(u.email) = 'mudasirumukthar@gmail.com'
              OR u.raw_app_meta_data ->> 'role' = 'admin'
          )
    );
$$;

REVOKE ALL ON FUNCTION public.is_ceo() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.is_ceo() TO authenticated;

-- 11. ENABLE ROW LEVEL SECURITY
ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.repair_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.swap_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.reviews ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.contact_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.site_visits ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.activity_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.product_views ENABLE ROW LEVEL SECURITY;

-- 12. TABLE PERMISSIONS
GRANT SELECT ON public.products TO anon, authenticated;
GRANT INSERT, UPDATE, DELETE ON public.products TO authenticated;

GRANT INSERT ON public.repair_requests TO anon, authenticated;
GRANT SELECT, UPDATE ON public.repair_requests TO authenticated;

GRANT INSERT ON public.swap_requests TO anon, authenticated;
GRANT SELECT, UPDATE ON public.swap_requests TO authenticated;

GRANT SELECT, INSERT ON public.reviews TO anon, authenticated;
GRANT UPDATE, DELETE ON public.reviews TO authenticated;

GRANT INSERT ON public.contact_messages TO anon, authenticated;
GRANT SELECT, UPDATE ON public.contact_messages TO authenticated;

GRANT INSERT ON public.site_visits TO anon, authenticated;
GRANT SELECT ON public.site_visits TO authenticated;

GRANT INSERT ON public.activity_logs TO authenticated;
GRANT SELECT ON public.activity_logs TO authenticated;

GRANT INSERT ON public.product_views TO anon, authenticated;
GRANT SELECT ON public.product_views TO authenticated;

-- 13. RESET OUR NAMED POLICIES ONLY
-- This makes this section safe to run again.

DROP POLICY IF EXISTS "Public can read products" ON public.products;
DROP POLICY IF EXISTS "CEO can manage products" ON public.products;

DROP POLICY IF EXISTS "Anyone can insert repairs" ON public.repair_requests;
DROP POLICY IF EXISTS "CEO can read repairs" ON public.repair_requests;
DROP POLICY IF EXISTS "CEO can update repairs" ON public.repair_requests;

DROP POLICY IF EXISTS "Anyone can insert swaps" ON public.swap_requests;
DROP POLICY IF EXISTS "CEO can read swaps" ON public.swap_requests;
DROP POLICY IF EXISTS "CEO can update swaps" ON public.swap_requests;

DROP POLICY IF EXISTS "Anyone can insert reviews" ON public.reviews;
DROP POLICY IF EXISTS "Public can read approved reviews" ON public.reviews;
DROP POLICY IF EXISTS "CEO can manage reviews" ON public.reviews;

DROP POLICY IF EXISTS "Anyone can insert contact" ON public.contact_messages;
DROP POLICY IF EXISTS "CEO can read contacts" ON public.contact_messages;
DROP POLICY IF EXISTS "CEO can update contacts" ON public.contact_messages;

DROP POLICY IF EXISTS "Anyone can log visits" ON public.site_visits;
DROP POLICY IF EXISTS "CEO can read visits" ON public.site_visits;

DROP POLICY IF EXISTS "Anyone can log activity" ON public.activity_logs;
DROP POLICY IF EXISTS "CEO can read activity" ON public.activity_logs;

DROP POLICY IF EXISTS "Anyone can log product views" ON public.product_views;
DROP POLICY IF EXISTS "CEO can read product views" ON public.product_views;

-- 14. PRODUCT POLICIES
CREATE POLICY "Public can read products"
ON public.products FOR SELECT
TO anon, authenticated
USING (true);

CREATE POLICY "CEO can manage products"
ON public.products FOR ALL
TO authenticated
USING ((SELECT public.is_ceo()))
WITH CHECK ((SELECT public.is_ceo()));

-- 15. REPAIR POLICIES
CREATE POLICY "Anyone can insert repairs"
ON public.repair_requests FOR INSERT
TO anon, authenticated
WITH CHECK (true);

CREATE POLICY "CEO can read repairs"
ON public.repair_requests FOR SELECT
TO authenticated
USING ((SELECT public.is_ceo()));

CREATE POLICY "CEO can update repairs"
ON public.repair_requests FOR UPDATE
TO authenticated
USING ((SELECT public.is_ceo()))
WITH CHECK ((SELECT public.is_ceo()));

-- 16. TRADE-IN POLICIES
CREATE POLICY "Anyone can insert swaps"
ON public.swap_requests FOR INSERT
TO anon, authenticated
WITH CHECK (true);

CREATE POLICY "CEO can read swaps"
ON public.swap_requests FOR SELECT
TO authenticated
USING ((SELECT public.is_ceo()));

CREATE POLICY "CEO can update swaps"
ON public.swap_requests FOR UPDATE
TO authenticated
USING ((SELECT public.is_ceo()))
WITH CHECK ((SELECT public.is_ceo()));

-- 17. REVIEW POLICIES
CREATE POLICY "Anyone can insert reviews"
ON public.reviews FOR INSERT
TO anon, authenticated
WITH CHECK (
    rating BETWEEN 1 AND 5
    AND is_approved = false
);

CREATE POLICY "Public can read approved reviews"
ON public.reviews FOR SELECT
TO anon, authenticated
USING (is_approved = true);

CREATE POLICY "CEO can manage reviews"
ON public.reviews FOR ALL
TO authenticated
USING ((SELECT public.is_ceo()))
WITH CHECK ((SELECT public.is_ceo()));

-- 18. CONTACT POLICIES
CREATE POLICY "Anyone can insert contact"
ON public.contact_messages FOR INSERT
TO anon, authenticated
WITH CHECK (true);

CREATE POLICY "CEO can read contacts"
ON public.contact_messages FOR SELECT
TO authenticated
USING ((SELECT public.is_ceo()));

CREATE POLICY "CEO can update contacts"
ON public.contact_messages FOR UPDATE
TO authenticated
USING ((SELECT public.is_ceo()))
WITH CHECK ((SELECT public.is_ceo()));

-- 19. ANALYTICS POLICIES
CREATE POLICY "Anyone can log visits"
ON public.site_visits FOR INSERT
TO anon, authenticated
WITH CHECK (true);

CREATE POLICY "CEO can read visits"
ON public.site_visits FOR SELECT
TO authenticated
USING ((SELECT public.is_ceo()));

CREATE POLICY "CEO can read activity"
ON public.activity_logs FOR SELECT
TO authenticated
USING ((SELECT public.is_ceo()));

CREATE POLICY "CEO can read product views"
ON public.product_views FOR SELECT
TO authenticated
USING ((SELECT public.is_ceo()));

-- Only authenticated clients may insert activity logs.
-- Restrict viewing records to the CEO.
CREATE POLICY "Anyone can log activity"
ON public.activity_logs FOR INSERT
TO authenticated
WITH CHECK (true);

CREATE POLICY "Anyone can log product views"
ON public.product_views FOR INSERT
TO anon, authenticated
WITH CHECK (true);

-- 20. PRODUCT IMAGE STORAGE
INSERT INTO storage.buckets (id, name, public)
VALUES ('product-images', 'product-images', true)
ON CONFLICT (id) DO NOTHING;

DROP POLICY IF EXISTS "Public can view product images"
ON storage.objects;
CREATE POLICY "Public can view product images"
ON storage.objects FOR SELECT
TO anon, authenticated
USING (bucket_id = 'product-images');

DROP POLICY IF EXISTS "CEO can upload product images"
ON storage.objects;
CREATE POLICY "CEO can upload product images"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (
    bucket_id = 'product-images'
    AND (SELECT public.is_ceo())
);

DROP POLICY IF EXISTS "CEO can update product images"
ON storage.objects;
CREATE POLICY "CEO can update product images"
ON storage.objects FOR UPDATE
TO authenticated
USING (
    bucket_id = 'product-images'
    AND (SELECT public.is_ceo())
)
WITH CHECK (
    bucket_id = 'product-images'
    AND (SELECT public.is_ceo())
);

DROP POLICY IF EXISTS "CEO can delete product images"
ON storage.objects;
CREATE POLICY "CEO can delete product images"
ON storage.objects FOR DELETE
TO authenticated
USING (
    bucket_id = 'product-images'
    AND (SELECT public.is_ceo())
);

COMMIT;

-- 21. VERIFY TABLES
SELECT table_name
FROM information_schema.tables
WHERE table_schema = 'public'
  AND table_name IN (
      'products',
      'repair_requests',
      'swap_requests',
      'reviews',
      'contact_messages',
      'site_visits',
      'activity_logs',
      'product_views'
  )
ORDER BY table_name;
