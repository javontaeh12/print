-- Storage Bucket for uploads (only part that failed from initial migration)
INSERT INTO storage.buckets (id, name, public) VALUES ('uploads', 'uploads', true)
ON CONFLICT (id) DO NOTHING;
