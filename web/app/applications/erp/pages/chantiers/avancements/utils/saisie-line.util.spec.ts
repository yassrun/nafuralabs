import { buildSaisieLineDefinitions, avancementProgressKey, saisieLineKey } from './saisie-line.util';
import type { LotChantier } from '../models';

describe('saisie-line.util', () => {
  const rootLot: LotChantier = {
    id: 'lot-root',
    chantierId: 'ch-001',
    code: 'L01',
    designation: 'Menuiserie',
    unite: 'U',
    quantite: 0,
    cumulQuantite: 0,
    avancementPercent: 0,
    status: 'EN_COURS',
    ordre: 1,
  };

  const sousLot: LotChantier = {
    id: 'lot-child',
    chantierId: 'ch-001',
    code: 'L01-2',
    designation: 'Portes',
    parentLotId: 'lot-root',
    unite: 'U',
    quantite: 0,
    cumulQuantite: 0,
    avancementPercent: 0,
    status: 'EN_COURS',
    ordre: 2,
  };

  it('builds poste lines and skips empty container lots', () => {
    const lines = buildSaisieLineDefinitions([rootLot, sousLot], {
      'lot-child': [{
        id: 'poste-1',
        lotId: 'lot-child',
        code: '1.1',
        designation: 'Porte palière',
        unite: 'U',
        quantite: 8,
        prixUnitaireHt: 1000,
        montantHt: 8000,
        ordre: 1,
      }],
    });

    expect(lines).toHaveLength(1);
    expect(lines[0].kind).toBe('poste');
    expect(lines[0].key).toBe(saisieLineKey('poste', 'poste-1'));
  });

  it('builds lot fallback when no postes exist', () => {
    const flatLot: LotChantier = {
      ...rootLot,
      id: 'lot-flat',
      code: 'L10',
      quantite: 100,
      prixUnitaireHt: 50,
      montantHt: 5000,
    };
    const lines = buildSaisieLineDefinitions([flatLot], {});
    expect(lines).toHaveLength(1);
    expect(lines[0].kind).toBe('lot');
  });

  it('maps progress keys with poste id', () => {
    expect(avancementProgressKey('lot-1', 'poste-1')).toBe('lot-1::poste-1');
    expect(avancementProgressKey('lot-1', undefined)).toBe('lot-1::');
  });
});
