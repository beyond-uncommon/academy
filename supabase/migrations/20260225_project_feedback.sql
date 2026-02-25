-- Add feedback column to project_submissions
-- Allows admins to write feedback when reviewing submissions

ALTER TABLE project_submissions
    ADD COLUMN IF NOT EXISTS feedback TEXT;
