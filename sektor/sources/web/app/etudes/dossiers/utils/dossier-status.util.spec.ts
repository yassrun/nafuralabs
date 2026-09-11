import { labelEtatListing, variantEtatListing } from './dossier-status.util';

describe('labelEtatListing', () => {
  it('montre toujours le statut, jamais l’étape wizard', () => {
    expect(labelEtatListing('BROUILLON', 1)).toBe('Draft');
    expect(labelEtatListing('BROUILLON', 2)).toBe('Draft');
    expect(labelEtatListing('A_DECIDER', 1)).toBe('À affecter');
    expect(labelEtatListing('AFFECTE', 2)).toBe('Affecté');
    expect(labelEtatListing('EN_ETUDE', 2)).toBe('En chiffrage');
    expect(labelEtatListing('EN_ETUDE', 5)).toBe('En chiffrage');
    expect(labelEtatListing('EN_VALIDATION', 5)).toBe('Chiffré');
    expect(labelEtatListing('VALIDEE', 5)).toBe('Validé intern');
    expect(labelEtatListing('DEVIS_GENERE', 5)).toBe('Validé');
    expect(labelEtatListing('ANNULE', 1)).toBe('Archivé');
    expect(labelEtatListing('NE_PAS_ETUDIER', 1)).toBe('Rejeté');
    expect(labelEtatListing('REJETE_CHIFFRAGE', 1)).toBe('Rejeté par le chiffrage');
    expect(labelEtatListing('SUSPENDU', 3)).toBe('Suspendu');
    expect(labelEtatListing('A_AVIS_EXECUTION', 5)).toBe('Avis d’exécution');
    expect(labelEtatListing('GAGNE', 5)).toBe('Gagné');
    expect(labelEtatListing('CONVERTIE', 5)).toBe('Convertie');
    expect(labelEtatListing('PERDU', 5)).toBe('Perdu');
  });
});

describe('variantEtatListing', () => {
  it('garde les couleurs du cycle de vie', () => {
    expect(variantEtatListing('BROUILLON')).toBe('default');
    expect(variantEtatListing('EN_ETUDE')).toBe('warning');
    expect(variantEtatListing('EN_VALIDATION')).toBe('info');
    expect(variantEtatListing('CONVERTIE')).toBe('success');
    expect(variantEtatListing('PERDU')).toBe('danger');
    expect(variantEtatListing('REJETE_CHIFFRAGE')).toBe('danger');
    expect(variantEtatListing('NE_PAS_ETUDIER')).toBe('danger');
  });
});
