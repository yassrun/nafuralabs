ALTER TABLE dpgf_noeuds
    ADD COLUMN IF NOT EXISTS prix_fourni_base NUMERIC(18, 4),
    ADD COLUMN IF NOT EXISTS frais_generaux_percent NUMERIC(8, 4),
    ADD COLUMN IF NOT EXISTS marge_percent NUMERIC(8, 4);

COMMENT ON COLUMN dpgf_noeuds.prix_fourni_base IS
    'Coût unitaire saisi en mode FOURNI, avant frais généraux et marge';
