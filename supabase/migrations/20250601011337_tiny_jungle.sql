/*
  # Add status column to questions table

  1. Changes
    - Add `status` column to `questions` table with type `text`
    - Set default value to 'draft'
    - Make column non-nullable
    - Add check constraint to ensure valid status values ('draft' or 'active')
    - Update existing rows to have 'draft' status

  2. Security
    - No changes to RLS policies needed as the existing policies cover the new column
*/

DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'questions' AND column_name = 'status'
  ) THEN
    -- Add the status column with a default value
    ALTER TABLE questions 
    ADD COLUMN status text NOT NULL DEFAULT 'draft';

    -- Add check constraint to ensure valid status values
    ALTER TABLE questions 
    ADD CONSTRAINT questions_status_check 
    CHECK (status IN ('draft', 'active'));
  END IF;
END $$;