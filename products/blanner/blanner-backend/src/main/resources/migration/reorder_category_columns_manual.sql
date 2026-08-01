-- Manual migration to reorder categories table columns
-- WARNING: This will recreate the table. Backup your data first!
-- Run this script manually in your database client

BEGIN;

-- Step 1: Create new table with desired column order
CREATE TABLE categories_new (
    id VARCHAR(36) PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    location_title VARCHAR(255),
    default_image VARCHAR(255),
    google_tags JSONB,
    billability VARCHAR(50) NOT NULL,
    order_index INTEGER,
    is_active BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMP NOT NULL,
    updated_at TIMESTAMP
);

-- Step 2: Copy all data from old table
INSERT INTO categories_new (id, name, location_title, default_image, google_tags, billability, order_index, is_active, created_at, updated_at)
SELECT id, name, location_title, default_image, google_tags, billability, order_index, is_active, created_at, updated_at
FROM categories;

-- Step 3: Drop old table
DROP TABLE categories;

-- Step 4: Rename new table
ALTER TABLE categories_new RENAME TO categories;

COMMIT;

