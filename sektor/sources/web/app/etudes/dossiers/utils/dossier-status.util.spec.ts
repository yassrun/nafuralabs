import { labelEtatListing, variantEtatListing } from './dossier-status.util';

describe('labelEtatListing', () => {
  it('montre toujours le statut, jamais l’étape wizard', () => {
    expect(labelEtatListing('DRAFT', 1)).toBe('Brouillon');
    expect(labelEtatListing('DRAFT', 2)).toBe('Brouillon');
    expect(labelEtatListing('PENDING_ASSIGNMENT', 1)).toBe('En attente d’affectation');
    expect(labelEtatListing('ASSIGNED', 2)).toBe('Affecté');
    expect(labelEtatListing('IN_PROGRESS', 2)).toBe('En cours');
    expect(labelEtatListing('COMPLETED', 5)).toBe('Chiffrage terminé');
    expect(labelEtatListing('FINANCIALLY_APPROVED', 5)).toBe('Validé financièrement');
    expect(labelEtatListing('FINAL_APPROVED', 5)).toBe('Validé définitivement');
    expect(labelEtatListing('ARCHIVED', 1)).toBe('Archivé');
    expect(labelEtatListing('BROUILLON', 1)).toBe('Brouillon');
    expect(labelEtatListing('A_DECIDER', 1)).toBe('En attente d’affectation');
    expect(labelEtatListing('EN_ETUDE', 2)).toBe('En cours');
    expect(labelEtatListing('EN_VALIDATION', 5)).toBe('Chiffrage terminé');
    expect(labelEtatListing('VALIDEE', 5)).toBe('Validé financièrement');
    expect(labelEtatListing('GAGNE', 5)).toBe('Validé définitivement');
    expect(labelEtatListing('REJECTED', 1)).toBe('Rejeté');
    expect(labelEtatListing('STUDY_REJECTED', 1)).toBe('Refusé par l’étude');
    expect(labelEtatListing('SUSPENDED', 3)).toBe('Suspendu');
    expect(labelEtatListing('FINANCIALLY_REJECTED', 5)).toBe('Refusé financièrement');
    expect(labelEtatListing('FINAL_REJECTED', 5)).toBe('Refusé en validation finale');
  });
});

describe('variantEtatListing', () => {
  it('garde les couleurs du cycle de vie', () => {
    expect(variantEtatListing('DRAFT')).toBe('default');
    expect(variantEtatListing('IN_PROGRESS')).toBe('warning');
    expect(variantEtatListing('COMPLETED')).toBe('info');
    expect(variantEtatListing('FINAL_APPROVED')).toBe('success');
    expect(variantEtatListing('REJECTED')).toBe('danger');
    expect(variantEtatListing('STUDY_REJECTED')).toBe('danger');
    expect(variantEtatListing('ARCHIVED')).toBe('default');
  });
});
