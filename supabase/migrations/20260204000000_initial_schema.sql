-- ========================================
-- PrintCraft Studio — Supabase Schema
-- Run this in your Supabase SQL Editor
-- ========================================

-- ---------- Admin Users ----------
CREATE TABLE admin_users (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  email TEXT UNIQUE NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Insert the first admin
INSERT INTO admin_users (email) VALUES ('javontaedharden@gmail.com');

-- ---------- Products ----------
CREATE TABLE products (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  category TEXT,
  description TEXT,
  image_url TEXT,
  display_order INT DEFAULT 0,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- ---------- Services ----------
CREATE TABLE services (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  category TEXT,
  description TEXT,
  icon TEXT,
  display_order INT DEFAULT 0,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- ---------- Pricing ----------
CREATE TABLE pricing (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  category TEXT,
  pricing_type TEXT NOT NULL DEFAULT 'fixed' CHECK (pricing_type IN ('fixed', 'quote')),
  price NUMERIC(10,2),
  unit TEXT,
  description TEXT,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- ---------- Page Sections ----------
CREATE TABLE page_sections (
  key TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  is_enabled BOOLEAN DEFAULT true,
  display_order INT DEFAULT 0,
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Insert default sections
INSERT INTO page_sections (key, name, is_enabled, display_order) VALUES
  ('hero', 'Hero Banner', true, 0),
  ('services', 'Popular Services', true, 1),
  ('designer', 'Business Card Designer', true, 2),
  ('about', 'About Us', true, 3),
  ('clients', 'Our Clients', true, 4),
  ('booking', 'Booking Form', true, 5),
  ('upload', 'File Upload', true, 6),
  ('contact', 'Contact Us', true, 7);

-- ---------- Site Content (key-value store for About, Contact, Analytics) ----------
CREATE TABLE site_content (
  key TEXT PRIMARY KEY,
  value JSONB NOT NULL DEFAULT '{}',
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- ---------- Clients ----------
CREATE TABLE clients (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  logo_url TEXT,
  website TEXT,
  display_order INT DEFAULT 0,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- ---------- Updated_at Trigger ----------
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER products_updated_at BEFORE UPDATE ON products FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER services_updated_at BEFORE UPDATE ON services FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER pricing_updated_at BEFORE UPDATE ON pricing FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER page_sections_updated_at BEFORE UPDATE ON page_sections FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER site_content_updated_at BEFORE UPDATE ON site_content FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER clients_updated_at BEFORE UPDATE ON clients FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- ---------- Row Level Security ----------

-- Enable RLS on all tables
ALTER TABLE admin_users ENABLE ROW LEVEL SECURITY;
ALTER TABLE products ENABLE ROW LEVEL SECURITY;
ALTER TABLE services ENABLE ROW LEVEL SECURITY;
ALTER TABLE pricing ENABLE ROW LEVEL SECURITY;
ALTER TABLE page_sections ENABLE ROW LEVEL SECURITY;
ALTER TABLE site_content ENABLE ROW LEVEL SECURITY;
ALTER TABLE clients ENABLE ROW LEVEL SECURITY;

-- Public read access (for the frontend)
CREATE POLICY "Public can read active products" ON products FOR SELECT USING (is_active = true);
CREATE POLICY "Public can read active services" ON services FOR SELECT USING (is_active = true);
CREATE POLICY "Public can read active pricing" ON pricing FOR SELECT USING (is_active = true);
CREATE POLICY "Public can read enabled sections" ON page_sections FOR SELECT USING (true);
CREATE POLICY "Public can read site content" ON site_content FOR SELECT USING (true);
CREATE POLICY "Public can read active clients" ON clients FOR SELECT USING (is_active = true);

-- Admin full access (authenticated users who are in admin_users table)
CREATE POLICY "Admins can do anything with products" ON products FOR ALL
  USING (EXISTS (SELECT 1 FROM admin_users WHERE email = auth.jwt() ->> 'email'))
  WITH CHECK (EXISTS (SELECT 1 FROM admin_users WHERE email = auth.jwt() ->> 'email'));

CREATE POLICY "Admins can do anything with services" ON services FOR ALL
  USING (EXISTS (SELECT 1 FROM admin_users WHERE email = auth.jwt() ->> 'email'))
  WITH CHECK (EXISTS (SELECT 1 FROM admin_users WHERE email = auth.jwt() ->> 'email'));

CREATE POLICY "Admins can do anything with pricing" ON pricing FOR ALL
  USING (EXISTS (SELECT 1 FROM admin_users WHERE email = auth.jwt() ->> 'email'))
  WITH CHECK (EXISTS (SELECT 1 FROM admin_users WHERE email = auth.jwt() ->> 'email'));

CREATE POLICY "Admins can do anything with sections" ON page_sections FOR ALL
  USING (EXISTS (SELECT 1 FROM admin_users WHERE email = auth.jwt() ->> 'email'))
  WITH CHECK (EXISTS (SELECT 1 FROM admin_users WHERE email = auth.jwt() ->> 'email'));

CREATE POLICY "Admins can do anything with site_content" ON site_content FOR ALL
  USING (EXISTS (SELECT 1 FROM admin_users WHERE email = auth.jwt() ->> 'email'))
  WITH CHECK (EXISTS (SELECT 1 FROM admin_users WHERE email = auth.jwt() ->> 'email'));

CREATE POLICY "Admins can do anything with clients" ON clients FOR ALL
  USING (EXISTS (SELECT 1 FROM admin_users WHERE email = auth.jwt() ->> 'email'))
  WITH CHECK (EXISTS (SELECT 1 FROM admin_users WHERE email = auth.jwt() ->> 'email'));

-- Non-recursive: compare row email directly to JWT email (no subquery on same table)
CREATE POLICY "Admins can read admin_users" ON admin_users FOR SELECT
  USING (email = auth.jwt() ->> 'email');

-- ---------- Storage Bucket ----------
-- Create a public bucket for logo uploads
INSERT INTO storage.buckets (id, name, public) VALUES ('uploads', 'uploads', true);

-- Allow authenticated admins to upload
CREATE POLICY "Admins can upload" ON storage.objects FOR INSERT
  WITH CHECK (
    bucket_id = 'uploads' AND
    EXISTS (SELECT 1 FROM admin_users WHERE email = auth.jwt() ->> 'email')
  );

-- Allow public read
CREATE POLICY "Public can read uploads" ON storage.objects FOR SELECT
  USING (bucket_id = 'uploads');

-- Allow admins to delete uploads
CREATE POLICY "Admins can delete uploads" ON storage.objects FOR DELETE
  USING (
    bucket_id = 'uploads' AND
    EXISTS (SELECT 1 FROM admin_users WHERE email = auth.jwt() ->> 'email')
  );
