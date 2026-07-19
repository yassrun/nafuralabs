-- Lot 1 — supprimer le nom trompeur quantite_indicative (→ rendement)
ALTER TABLE consultation_composants RENAME COLUMN quantite_indicative TO rendement;
