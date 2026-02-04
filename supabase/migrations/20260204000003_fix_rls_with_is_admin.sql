-- Fix RLS recursion: create SECURITY DEFINER helper to check admin status
-- This avoids the infinite recursion when storage/table policies query admin_users
-- which itself has RLS enabled.

CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS BOOLEAN AS $fn$
  SELECT EXISTS (
    SELECT 1 FROM public.admin_users
    WHERE email = (auth.jwt() ->> 'email')
  );
$fn$ LANGUAGE sql SECURITY DEFINER STABLE;

-- Fix storage upload policy
DROP POLICY IF EXISTS "Admins can upload" ON storage.objects;
CREATE POLICY "Admins can upload" ON storage.objects FOR INSERT
  WITH CHECK (bucket_id = 'uploads' AND public.is_admin());

-- Fix storage delete policy
DROP POLICY IF EXISTS "Admins can delete uploads" ON storage.objects;
CREATE POLICY "Admins can delete uploads" ON storage.objects FOR DELETE
  USING (bucket_id = 'uploads' AND public.is_admin());

-- Fix all table admin policies to use is_admin()
DROP POLICY IF EXISTS "Admins can do anything with products" ON products;
CREATE POLICY "Admins can do anything with products" ON products FOR ALL
  USING (public.is_admin()) WITH CHECK (public.is_admin());

DROP POLICY IF EXISTS "Admins can do anything with services" ON services;
CREATE POLICY "Admins can do anything with services" ON services FOR ALL
  USING (public.is_admin()) WITH CHECK (public.is_admin());

DROP POLICY IF EXISTS "Admins can do anything with pricing" ON pricing;
CREATE POLICY "Admins can do anything with pricing" ON pricing FOR ALL
  USING (public.is_admin()) WITH CHECK (public.is_admin());

DROP POLICY IF EXISTS "Admins can do anything with sections" ON page_sections;
CREATE POLICY "Admins can do anything with sections" ON page_sections FOR ALL
  USING (public.is_admin()) WITH CHECK (public.is_admin());

DROP POLICY IF EXISTS "Admins can do anything with site_content" ON site_content;
CREATE POLICY "Admins can do anything with site_content" ON site_content FOR ALL
  USING (public.is_admin()) WITH CHECK (public.is_admin());

DROP POLICY IF EXISTS "Admins can do anything with clients" ON clients;
CREATE POLICY "Admins can do anything with clients" ON clients FOR ALL
  USING (public.is_admin()) WITH CHECK (public.is_admin());
