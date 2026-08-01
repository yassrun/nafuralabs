-- Migration: Add location_title column to categories table
-- This migration adds the location_title column as nullable
-- The CategoryLocationTitleUpdater will populate the values on startup

ALTER TABLE categories ADD COLUMN IF NOT EXISTS location_title VARCHAR(255);

