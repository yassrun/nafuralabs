import { labelEtatListing, variantEtatListing } from './dossier-status.util';

describe('labelEtatListing', () => {
  it('montre l’étape pendant le travail, sans n/n ni statut déductible', () => {
    expect(labelEtatListing('BROUILLON', 1)).toBe('Cadrage & documents');
    expect(labelEtatListing('EN_ETUDE', 2)).toBe('Bordereau');
    expect(labelEtatListing('EN_ETUDE', 3)).toBe('Chiffrage');
    expect(labelEtatListing('EN_ETUDE', 4)).toBe('Chiffrage');
    expect(labelEtatListing('EN_ETUDE', 5)).toBe('Synthèse et validation');
  });

  it('montre le statut quand il n’est plus déductible de l’étape', () => {
    expect(labelEtatListing('EN_VALIDATION', 5)).toBe('En validation');
    expect(labelEtatListing('VALIDEE', 5)).toBe('Validée');
    expect(labelEtatListing('DEVIS_GENERE', 5)).toBe('Devis généré');
    expect(labelEtatListing('GAGNE', 5)).toBe('Gagné');
    expect(labelEtatListing('CONVERTIE', 5)).toBe('Convertie');
    expect(labelEtatListing('PERDU', 5)).toBe('Perdu');
    expect(labelEtatListing('ANNULE', 1)).toBe('Annulé');
  });
});

describe('variantEtatListing', () => {
  it('garde les couleurs du cycle de vie', () => {
    expect(variantEtatListing('BROUILLON')).toBe('default');
    expect(variantEtatListing('EN_ETUDE')).toBe('warning');
    expect(variantEtatListing('EN_VALIDATION')).toBe('info');
    expect(variantEtatListing('CONVERTIE')).toBe('success');
    expect(variantEtatListing('PERDU')).toBe('danger');
  });
});
