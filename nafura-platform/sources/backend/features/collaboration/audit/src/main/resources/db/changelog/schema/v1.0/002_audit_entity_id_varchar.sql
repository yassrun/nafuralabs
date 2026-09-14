-- Business ids are not always UUID (chantier, employé, demande d'approbation).
ALTER TABLE audit_events
    ALTER COLUMN entity_id TYPE VARCHAR(100) USING entity_id::text;
