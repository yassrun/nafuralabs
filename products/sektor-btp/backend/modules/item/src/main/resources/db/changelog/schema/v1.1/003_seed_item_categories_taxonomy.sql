-- Classification Lot 3 follow-up: seed taxonomy familles for existing tenants.
-- Source: onboarding/reference-data.json itemCategories (§3.2). Idempotent.
-- Legacy GROS_OEUVRE / VRD / FINITIONS stay inactive; EPI reactivated as taxonomy root.

-- Reactivate / refresh EPI (same code as new taxonomy root)
UPDATE item_categories
SET name = 'Équipements de protection individuelle',
    description = 'Équipements de protection individuelle',
    is_active = true,
    updated_at = now()
WHERE UPPER(TRIM(code)) = 'EPI';

-- Insert missing roots for every tenant
INSERT INTO item_categories (id, tenant_id, code, name, description, is_active, created_at, updated_at)
SELECT gen_random_uuid(), t.id, v.code, v.name, v.description, true, now(), now()
FROM tenant t
CROSS JOIN (VALUES
    ('LIANTS', 'Liants', 'Liants'),
    ('GRANULATS', 'Granulats', 'Granulats'),
    ('BETON_MORTIER', 'Bétons et mortiers', 'Bétons et mortiers'),
    ('ACIER', 'Aciers', 'Aciers'),
    ('MACONNERIE', 'Maçonnerie', 'Maçonnerie'),
    ('BOIS_COFFRAGE', 'Bois et coffrage', 'Bois et coffrage'),
    ('ETANCHEITE_ISOLATION', 'Étanchéité et isolation', 'Étanchéité et isolation'),
    ('REVETEMENT', 'Revêtements', 'Revêtements'),
    ('PEINTURE_ENDUIT', 'Peintures et enduits', 'Peintures et enduits'),
    ('MENUISERIE', 'Menuiserie et serrurerie', 'Menuiserie et serrurerie'),
    ('PLOMBERIE_SANITAIRE', 'Plomberie et sanitaire', 'Plomberie et sanitaire'),
    ('ELECTRICITE', 'Électricité', 'Électricité'),
    ('CVC', 'Chauffage, ventilation, climatisation', 'Chauffage, ventilation, climatisation'),
    ('VRD_RESEAUX', 'VRD et réseaux', 'VRD et réseaux'),
    ('QUINCAILLERIE', 'Quincaillerie et fixations', 'Quincaillerie et fixations'),
    ('EPI', 'Équipements de protection individuelle', 'Équipements de protection individuelle'),
    ('CONSO_CHANTIER', 'Consommables chantier', 'Consommables chantier'),
    ('CARBURANT_LUBRIFIANT', 'Carburants et lubrifiants', 'Carburants et lubrifiants'),
    ('OUTILLAGE_FAM', 'Outillage', 'Outillage'),
    ('ENGIN', 'Engins', 'Engins'),
    ('ECHAFAUDAGE_ETAIEMENT', 'Échafaudage et étaiement', 'Échafaudage et étaiement'),
    ('SIGNALISATION_SECURITE', 'Signalisation et sécurité chantier', 'Signalisation et sécurité chantier'),
    ('MAIN_DOEUVRE_FAM', 'Main d''œuvre', 'Main d''œuvre'),
    ('SOUS_TRAITANCE_FAM', 'Sous-traitance', 'Sous-traitance'),
    ('SERVICE_EXTERNE', 'Services externes', 'Services externes')
) AS v(code, name, description)
WHERE NOT EXISTS (
    SELECT 1 FROM item_categories c
    WHERE c.tenant_id = t.id AND UPPER(TRIM(c.code)) = UPPER(v.code)
);

-- Insert missing children
INSERT INTO item_categories (id, tenant_id, code, name, description, parent_id, is_active, created_at, updated_at)
SELECT gen_random_uuid(), t.id, v.code, v.name, v.description, p.id, true, now(), now()
FROM tenant t
CROSS JOIN (VALUES
    ('CIMENT', 'Ciment', 'Ciment', 'LIANTS'),
    ('CHAUX_PLATRE', 'Chaux et plâtre', 'Chaux et plâtre', 'LIANTS'),
    ('SABLE', 'Sable', 'Sable', 'GRANULATS'),
    ('GRAVIER', 'Gravier', 'Gravier', 'GRANULATS'),
    ('TOUT_VENANT', 'Tout-venant', 'Tout-venant', 'GRANULATS'),
    ('BPE', 'Béton prêt à l''emploi', 'Béton prêt à l''emploi', 'BETON_MORTIER'),
    ('MORTIER_COLLE', 'Mortier et colle', 'Mortier et colle', 'BETON_MORTIER'),
    ('ADJUVANT', 'Adjuvant', 'Adjuvant', 'BETON_MORTIER'),
    ('ROND_BETON', 'Rond à béton', 'Rond à béton', 'ACIER'),
    ('TREILLIS', 'Treillis soudé', 'Treillis soudé', 'ACIER'),
    ('PROFILE_METAL', 'Profilé métallique', 'Profilé métallique', 'ACIER'),
    ('AGGLO', 'Aggloméré', 'Aggloméré', 'MACONNERIE'),
    ('BRIQUE', 'Brique', 'Brique', 'MACONNERIE'),
    ('HOURDIS', 'Hourdis', 'Hourdis', 'MACONNERIE'),
    ('MENUISERIE_BOIS', 'Menuiserie bois', 'Menuiserie bois', 'MENUISERIE'),
    ('MENUISERIE_ALU_PVC', 'Menuiserie aluminium / PVC', 'Menuiserie aluminium / PVC', 'MENUISERIE'),
    ('SERRURERIE', 'Serrurerie', 'Serrurerie', 'MENUISERIE'),
    ('CABLE', 'Câble', 'Câble', 'ELECTRICITE'),
    ('APPAREILLAGE', 'Appareillage', 'Appareillage', 'ELECTRICITE'),
    ('ECLAIRAGE', 'Éclairage', 'Éclairage', 'ELECTRICITE'),
    ('CANALISATION', 'Canalisation', 'Canalisation', 'VRD_RESEAUX'),
    ('REGARD_BORDURE', 'Regard et bordure', 'Regard et bordure', 'VRD_RESEAUX'),
    ('OUTILLAGE_MANUEL', 'Outillage manuel', 'Outillage manuel', 'OUTILLAGE_FAM'),
    ('OUTILLAGE_ELECTRO', 'Outillage électroportatif', 'Outillage électroportatif', 'OUTILLAGE_FAM'),
    ('ENGIN_TERRASSEMENT', 'Engin de terrassement', 'Engin de terrassement', 'ENGIN'),
    ('ENGIN_LEVAGE', 'Engin de levage', 'Engin de levage', 'ENGIN'),
    ('ENGIN_COMPACTAGE', 'Engin de compactage', 'Engin de compactage', 'ENGIN'),
    ('ENGIN_TRANSPORT', 'Engin de transport', 'Engin de transport', 'ENGIN'),
    ('MO_ENCADREMENT', 'Encadrement', 'Encadrement', 'MAIN_DOEUVRE_FAM'),
    ('MO_QUALIFIEE', 'Ouvrier qualifié', 'Ouvrier qualifié', 'MAIN_DOEUVRE_FAM'),
    ('MO_SPECIALISEE', 'Ouvrier spécialisé', 'Ouvrier spécialisé', 'MAIN_DOEUVRE_FAM'),
    ('MO_MANOEUVRE', 'Manoeuvre', 'Manoeuvre', 'MAIN_DOEUVRE_FAM'),
    ('ST_GROS_OEUVRE', 'Sous-traitance gros œuvre', 'Sous-traitance gros œuvre', 'SOUS_TRAITANCE_FAM'),
    ('ST_SECOND_OEUVRE', 'Sous-traitance second œuvre', 'Sous-traitance second œuvre', 'SOUS_TRAITANCE_FAM'),
    ('ST_TECHNIQUE', 'Sous-traitance technique', 'Sous-traitance technique', 'SOUS_TRAITANCE_FAM')
) AS v(code, name, description, parent_code)
JOIN item_categories p
  ON p.tenant_id = t.id AND UPPER(TRIM(p.code)) = UPPER(v.parent_code)
WHERE NOT EXISTS (
    SELECT 1 FROM item_categories c
    WHERE c.tenant_id = t.id AND UPPER(TRIM(c.code)) = UPPER(v.code)
);

-- Link any child that exists without parent_id
UPDATE item_categories child
SET parent_id = parent.id,
    updated_at = now()
FROM item_categories parent,
(VALUES
    ('CIMENT', 'LIANTS'),
    ('CHAUX_PLATRE', 'LIANTS'),
    ('SABLE', 'GRANULATS'),
    ('GRAVIER', 'GRANULATS'),
    ('TOUT_VENANT', 'GRANULATS'),
    ('BPE', 'BETON_MORTIER'),
    ('MORTIER_COLLE', 'BETON_MORTIER'),
    ('ADJUVANT', 'BETON_MORTIER'),
    ('ROND_BETON', 'ACIER'),
    ('TREILLIS', 'ACIER'),
    ('PROFILE_METAL', 'ACIER'),
    ('AGGLO', 'MACONNERIE'),
    ('BRIQUE', 'MACONNERIE'),
    ('HOURDIS', 'MACONNERIE'),
    ('MENUISERIE_BOIS', 'MENUISERIE'),
    ('MENUISERIE_ALU_PVC', 'MENUISERIE'),
    ('SERRURERIE', 'MENUISERIE'),
    ('CABLE', 'ELECTRICITE'),
    ('APPAREILLAGE', 'ELECTRICITE'),
    ('ECLAIRAGE', 'ELECTRICITE'),
    ('CANALISATION', 'VRD_RESEAUX'),
    ('REGARD_BORDURE', 'VRD_RESEAUX'),
    ('OUTILLAGE_MANUEL', 'OUTILLAGE_FAM'),
    ('OUTILLAGE_ELECTRO', 'OUTILLAGE_FAM'),
    ('ENGIN_TERRASSEMENT', 'ENGIN'),
    ('ENGIN_LEVAGE', 'ENGIN'),
    ('ENGIN_COMPACTAGE', 'ENGIN'),
    ('ENGIN_TRANSPORT', 'ENGIN'),
    ('MO_ENCADREMENT', 'MAIN_DOEUVRE_FAM'),
    ('MO_QUALIFIEE', 'MAIN_DOEUVRE_FAM'),
    ('MO_SPECIALISEE', 'MAIN_DOEUVRE_FAM'),
    ('MO_MANOEUVRE', 'MAIN_DOEUVRE_FAM'),
    ('ST_GROS_OEUVRE', 'SOUS_TRAITANCE_FAM'),
    ('ST_SECOND_OEUVRE', 'SOUS_TRAITANCE_FAM'),
    ('ST_TECHNIQUE', 'SOUS_TRAITANCE_FAM')
) AS v(code, parent_code)
WHERE UPPER(TRIM(child.code)) = UPPER(v.code)
  AND child.tenant_id = parent.tenant_id
  AND UPPER(TRIM(parent.code)) = UPPER(v.parent_code)
  AND (child.parent_id IS DISTINCT FROM parent.id);
