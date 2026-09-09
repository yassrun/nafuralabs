-- SEKTOR-320 — cadrage AO sans date limite CPS (délai / type / réf. persistés).
ALTER TABLE appels_offres_clients
    ALTER COLUMN date_limite_depot DROP NOT NULL;
