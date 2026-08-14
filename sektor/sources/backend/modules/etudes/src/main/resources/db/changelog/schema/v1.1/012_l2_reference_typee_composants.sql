-- L2 référentiel-catalogue : référence typée ITEM | OUVRAGE | LIBRE sur composants
-- Voir sektor/docs/epics/referentiel-catalogue-sektor/
-- Pas de champs de gel (L5). Pas de touch dpgf_noeuds (L1).

-- ── composants_dpu ──────────────────────────────────────────────────────────

ALTER TABLE composants_dpu
    ADD COLUMN IF NOT EXISTS reference_type VARCHAR(20),
    ADD COLUMN IF NOT EXISTS item_id UUID,
    ADD COLUMN IF NOT EXISTS ouvrage_id UUID,
    ADD COLUMN IF NOT EXISTS libelle VARCHAR(500);

DO $$
BEGIN
    IF EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_name = 'composants_dpu' AND column_name = 'article_ou_poste_id'
    ) THEN
        EXECUTE $sql$
            UPDATE composants_dpu
            SET reference_type = COALESCE(reference_type, 'LIBRE'),
                libelle = COALESCE(
                    NULLIF(TRIM(libelle), ''),
                    NULLIF(TRIM(article_ou_poste_id), ''),
                    'Sans libellé'
                ),
                item_id = CASE WHEN reference_type = 'ITEM' THEN item_id ELSE NULL END,
                ouvrage_id = CASE WHEN reference_type = 'OUVRAGE' THEN ouvrage_id ELSE NULL END
            WHERE reference_type IS NULL OR libelle IS NULL
        $sql$;
        ALTER TABLE composants_dpu DROP COLUMN article_ou_poste_id;
    ELSE
        UPDATE composants_dpu
        SET reference_type = COALESCE(reference_type, 'LIBRE'),
            libelle = COALESCE(NULLIF(TRIM(libelle), ''), 'Sans libellé')
        WHERE reference_type IS NULL OR libelle IS NULL;
    END IF;
END $$;

ALTER TABLE composants_dpu
    ALTER COLUMN reference_type SET NOT NULL,
    ALTER COLUMN libelle SET NOT NULL;

ALTER TABLE composants_dpu DROP CONSTRAINT IF EXISTS chk_composants_dpu_reference_exclusivity;
ALTER TABLE composants_dpu
    ADD CONSTRAINT chk_composants_dpu_reference_exclusivity CHECK (
        (reference_type = 'ITEM' AND item_id IS NOT NULL AND ouvrage_id IS NULL)
        OR (reference_type = 'OUVRAGE' AND ouvrage_id IS NOT NULL AND item_id IS NULL)
        OR (reference_type = 'LIBRE' AND item_id IS NULL AND ouvrage_id IS NULL AND libelle IS NOT NULL)
    );

DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint WHERE conname = 'fk_composants_dpu_ouvrage_ref'
    ) THEN
        ALTER TABLE composants_dpu
            ADD CONSTRAINT fk_composants_dpu_ouvrage_ref
            FOREIGN KEY (ouvrage_id) REFERENCES ouvrages(id) ON DELETE RESTRICT;
    END IF;
END $$;

CREATE INDEX IF NOT EXISTS idx_composants_dpu_item
    ON composants_dpu (tenant_id, item_id) WHERE item_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_composants_dpu_ouvrage
    ON composants_dpu (tenant_id, ouvrage_id) WHERE ouvrage_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_composants_dpu_libre
    ON composants_dpu (tenant_id, reference_type) WHERE reference_type = 'LIBRE';

-- ── composants_ouvrage ──────────────────────────────────────────────────────
-- Parent FK reste ouvrage_id ; la réf typée OUVRAGE utilise ref_ouvrage_id.

ALTER TABLE composants_ouvrage
    ADD COLUMN IF NOT EXISTS reference_type VARCHAR(20),
    ADD COLUMN IF NOT EXISTS item_id UUID,
    ADD COLUMN IF NOT EXISTS ref_ouvrage_id UUID;

DO $$
BEGIN
    IF EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_name = 'composants_ouvrage' AND column_name = 'designation'
    ) AND NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_name = 'composants_ouvrage' AND column_name = 'libelle'
    ) THEN
        ALTER TABLE composants_ouvrage RENAME COLUMN designation TO libelle;
    END IF;
END $$;

ALTER TABLE composants_ouvrage
    ADD COLUMN IF NOT EXISTS libelle VARCHAR(500);

DO $$
BEGIN
    IF EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_name = 'composants_ouvrage' AND column_name = 'article_id'
    ) THEN
        EXECUTE $sql$
            UPDATE composants_ouvrage
            SET reference_type = COALESCE(reference_type, 'LIBRE'),
                libelle = COALESCE(
                    NULLIF(TRIM(libelle), ''),
                    NULLIF(TRIM(article_id), ''),
                    'Sans libellé'
                ),
                item_id = CASE WHEN reference_type = 'ITEM' THEN item_id ELSE NULL END,
                ref_ouvrage_id = CASE WHEN reference_type = 'OUVRAGE' THEN ref_ouvrage_id ELSE NULL END
            WHERE reference_type IS NULL OR libelle IS NULL
        $sql$;
        ALTER TABLE composants_ouvrage DROP COLUMN article_id;
    ELSE
        UPDATE composants_ouvrage
        SET reference_type = COALESCE(reference_type, 'LIBRE'),
            libelle = COALESCE(NULLIF(TRIM(libelle), ''), 'Sans libellé')
        WHERE reference_type IS NULL OR libelle IS NULL;
    END IF;
END $$;

ALTER TABLE composants_ouvrage
    ALTER COLUMN reference_type SET NOT NULL,
    ALTER COLUMN libelle SET NOT NULL;

ALTER TABLE composants_ouvrage DROP CONSTRAINT IF EXISTS chk_composants_ouvrage_reference_exclusivity;
ALTER TABLE composants_ouvrage
    ADD CONSTRAINT chk_composants_ouvrage_reference_exclusivity CHECK (
        (reference_type = 'ITEM' AND item_id IS NOT NULL AND ref_ouvrage_id IS NULL)
        OR (reference_type = 'OUVRAGE' AND ref_ouvrage_id IS NOT NULL AND item_id IS NULL)
        OR (reference_type = 'LIBRE' AND item_id IS NULL AND ref_ouvrage_id IS NULL AND libelle IS NOT NULL)
    );

DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint WHERE conname = 'fk_composants_ouvrage_ref_ouvrage'
    ) THEN
        ALTER TABLE composants_ouvrage
            ADD CONSTRAINT fk_composants_ouvrage_ref_ouvrage
            FOREIGN KEY (ref_ouvrage_id) REFERENCES ouvrages(id) ON DELETE RESTRICT;
    END IF;
END $$;

CREATE INDEX IF NOT EXISTS idx_composants_ouvrage_item
    ON composants_ouvrage (tenant_id, item_id) WHERE item_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_composants_ouvrage_ref_ouvrage
    ON composants_ouvrage (tenant_id, ref_ouvrage_id) WHERE ref_ouvrage_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_composants_ouvrage_libre
    ON composants_ouvrage (tenant_id, reference_type) WHERE reference_type = 'LIBRE';
