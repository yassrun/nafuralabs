import { chantierToUi } from './chantier.mapper';

describe('chantierToUi', () => {
  it('conserve EN_PREPARATION et ne déduit aucune date contractuelle de dateDebut', () => {
    const chantier = chantierToUi({
      id: 'chantier-1',
      code: 'CHA-001',
      status: 'EN_PREPARATION',
      dateDebut: '2026-08-01',
    });

    expect(chantier.status).toBe('EN_PREPARATION');
    expect(chantier.dateDebut).toBe('2026-08-01');
    expect(chantier.dateOrdreService).toBeUndefined();
    expect(chantier.dateFinPrevue).toBeUndefined();
  });
});
