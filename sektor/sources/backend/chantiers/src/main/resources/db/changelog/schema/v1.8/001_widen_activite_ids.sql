-- IDs activité concaténés (chantier UUID + -act- + UUID + -ratt- + UUID) dépassent VARCHAR(100).

ALTER TABLE chantier_activites
    ALTER COLUMN id TYPE VARCHAR(160),
    ALTER COLUMN parent_activite_id TYPE VARCHAR(160);

ALTER TABLE chantier_activite_precedences
    ALTER COLUMN id TYPE VARCHAR(160),
    ALTER COLUMN pred_activite_id TYPE VARCHAR(160),
    ALTER COLUMN succ_activite_id TYPE VARCHAR(160);

ALTER TABLE chantier_activite_rattachements
    ALTER COLUMN id TYPE VARCHAR(160),
    ALTER COLUMN activite_id TYPE VARCHAR(160);

ALTER TABLE avancements_physiques
    ALTER COLUMN activite_id TYPE VARCHAR(160);
