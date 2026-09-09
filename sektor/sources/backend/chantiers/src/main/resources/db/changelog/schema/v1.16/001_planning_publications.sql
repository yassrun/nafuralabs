CREATE TABLE chantier_planning_publications (
 id VARCHAR(100) PRIMARY KEY, tenant_id UUID NOT NULL, chantier_id VARCHAR(100) NOT NULL,
 version BIGINT NOT NULL DEFAULT 0, numero INTEGER NOT NULL,
 published_at TIMESTAMP WITH TIME ZONE NOT NULL, published_by VARCHAR(100) NOT NULL,
 title VARCHAR(200) NOT NULL, snapshot TEXT NOT NULL,
 acknowledgements JSONB NOT NULL DEFAULT '[]',
 UNIQUE (tenant_id, chantier_id, numero)
);
