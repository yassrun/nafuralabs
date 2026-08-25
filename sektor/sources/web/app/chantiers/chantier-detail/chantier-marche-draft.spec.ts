import type { Chantier } from '../models';
import { chantierToMarcheDraft } from './chantier-marche-draft';

function chantier(overrides: Partial<Chantier> = {}): Chantier {
  return {
    id: 'chantier-1',
    code: 'CHA-001',
    name: 'Chantier test',
    type: 'BATIMENT',
    clientId: 'client-1',
    ville: 'Casablanca',
    dateDebut: '2026-08-01',
    budgetHt: 1_000_000,
    tvaTaux: 20,
    cautionGarantie: 7,
    avancementPercent: 0,
    facturesEmisesHt: 0,
    encaissementsTtc: 0,
    cumulSituationsHt: 0,
    status: 'EN_PREPARATION',
    isActive: true,
    ...overrides,
  };
}

describe('chantierToMarcheDraft', () => {
  it('ne remplace pas un ordre de service absent par la date de début', () => {
    const draft = chantierToMarcheDraft(chantier({ dateOrdreService: undefined }));

    expect(draft.dateOrdreService).toBeUndefined();
  });

  it('conserve exactement un ordre de service défini', () => {
    const draft = chantierToMarcheDraft(chantier({
      dateDebut: '2026-08-01',
      dateOrdreService: '2026-07-15',
    }));

    expect(draft.dateOrdreService).toBe('2026-07-15');
  });
});
