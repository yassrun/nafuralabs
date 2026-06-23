-- Onboarding signup uses PENDING_EMAIL_VERIFICATION (28 chars); widen status column.
ALTER TABLE app_user ALTER COLUMN status TYPE VARCHAR(40);
