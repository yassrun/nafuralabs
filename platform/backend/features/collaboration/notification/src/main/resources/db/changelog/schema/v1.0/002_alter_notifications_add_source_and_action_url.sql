-- Add source and action_url columns for notifications

ALTER TABLE notifications
    ADD COLUMN IF NOT EXISTS source VARCHAR(30);

ALTER TABLE notifications
    ADD COLUMN IF NOT EXISTS action_url VARCHAR(300);

