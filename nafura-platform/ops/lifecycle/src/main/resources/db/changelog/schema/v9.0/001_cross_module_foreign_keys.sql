-- Cross-module migrations: foreign key constraints between modules
-- These run after module-level schema/data migrations.

-- Note: currently no cross-module foreign keys are enforced at the database level.
-- This keeps modules loosely coupled while CRUX contracts stabilize.
--
-- If you need cross-module FK constraints in the future, add them here.
-- Example:
-- ALTER TABLE app_user ADD CONSTRAINT fk_app_user_tenant
--     FOREIGN KEY (tenant_id) REFERENCES tenant(id);
-- ALTER TABLE inventory_tx ADD CONSTRAINT fk_inv_tx_from_location
--     FOREIGN KEY (from_location_id) REFERENCES location(id);

-- Placeholder statement to keep this changeSet explicit in Liquibase history.
SELECT 1;
