CREATE TABLE chantier_planning_reports (
 id VARCHAR(100) PRIMARY KEY, tenant_id UUID NOT NULL, chantier_id VARCHAR(100) NOT NULL,
 version BIGINT NOT NULL DEFAULT 0, status VARCHAR(40) NOT NULL,
 proposed_by VARCHAR(100) NOT NULL, proposed_at TIMESTAMP WITH TIME ZONE NOT NULL,
 reason TEXT NOT NULL, request TEXT NOT NULL, preview TEXT NOT NULL,
 decided_by VARCHAR(100), decided_at TIMESTAMP WITH TIME ZONE, decision_note TEXT
);
CREATE INDEX chantier_planning_reports_scope ON chantier_planning_reports (tenant_id,chantier_id,proposed_at);
