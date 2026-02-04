-- Add image_url column to services table for image uploads
ALTER TABLE services ADD COLUMN IF NOT EXISTS image_url TEXT;
