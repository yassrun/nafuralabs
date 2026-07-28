import { buildComposantDirtyKey, isCommentDirty } from './poste-dirty.util';

describe('poste-dirty.util', () => {
  it('détecte un commentaire modifié sans toucher aux composants', () => {
    expect(isCommentDirty('  note  ', 'note')).toBe(false);
    expect(isCommentDirty('nouvelle note', 'note')).toBe(true);
  });

  it('inclut sourcePrix et offreFournisseurId dans la clé dirty DPU', () => {
    const a = buildComposantDirtyKey([
      {
        id: '1',
        type: 'MATIERE',
        articleOuPosteId: 'Béton',
        quantite: 1,
        unite: 'm3',
        prixUnitaire: 100,
        sourcePrix: 'MANUEL',
      },
    ]);
    const b = buildComposantDirtyKey([
      {
        id: '1',
        type: 'MATIERE',
        articleOuPosteId: 'Béton',
        quantite: 1,
        unite: 'm3',
        prixUnitaire: 100,
        sourcePrix: 'CONSULTE',
        offreFournisseurId: 'offre-1',
      },
    ]);
    expect(a).not.toEqual(b);
  });
});
