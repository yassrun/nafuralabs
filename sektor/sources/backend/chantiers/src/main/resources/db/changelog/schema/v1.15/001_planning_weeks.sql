CREATE TABLE IF NOT EXISTS chantier_planning_weeks (
 id VARCHAR(100) PRIMARY KEY, tenant_id UUID NOT NULL, chantier_id VARCHAR(100) NOT NULL,
 week_start DATE NOT NULL, version BIGINT NOT NULL DEFAULT 0, revision INTEGER NOT NULL,
 status VARCHAR(40) NOT NULL, note TEXT, token VARCHAR(64), snapshot TEXT,
 contributors JSONB NOT NULL DEFAULT '[]', history JSONB NOT NULL DEFAULT '[]',
 UNIQUE (tenant_id, chantier_id, week_start)
);
