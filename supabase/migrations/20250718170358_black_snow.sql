/*
  # Create storage bucket for quiz files

  1. Storage Setup
    - Create 'quiz-files' bucket for file uploads
    - Set up public access policies
    - Configure file type restrictions

  2. Security
    - Allow anonymous uploads (for quiz submissions)
    - Allow authenticated users to read files (for admin)
    - Restrict file types and sizes
*/

-- Create the storage bucket for quiz files
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'quiz-files',
  'quiz-files',
  true,
  5242880, -- 5MB limit
  ARRAY['image/jpeg', 'image/png', 'application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document']
);

-- Allow anonymous users to upload files
CREATE POLICY "Allow anonymous uploads" ON storage.objects
  FOR INSERT TO anon
  WITH CHECK (bucket_id = 'quiz-files');

-- Allow authenticated users to read files
CREATE POLICY "Allow authenticated reads" ON storage.objects
  FOR SELECT TO authenticated
  USING (bucket_id = 'quiz-files');

-- Allow public access to files (since bucket is public)
CREATE POLICY "Allow public reads" ON storage.objects
  FOR SELECT TO public
  USING (bucket_id = 'quiz-files');