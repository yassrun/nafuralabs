import { chantierSummaryToUi, chantierToUi } from './chantier.mapper';

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

  it('conserve une absence financière comme null, jamais zéro (AC-14)', () => {
    const chantier = chantierToUi({ id: 'ch-1', code: 'CH-1', status: 'EN_PREPARATION' });

    expect(chantier.facturesEmisesHt).toBeNull();
    expect(chantier.encaissementsTtc).toBeNull();
    expect(chantier.cumulSituationsHt).toBeNull();
    expect(chantier.montantVenteActifHt).toBeNull();
  });
});

describe('chantierSummaryToUi', () => {
  it('expose le dictionnaire canonique et l’absence comme null (AC-9/AC-10/AC-14)', () => {
    const summary = chantierSummaryToUi({
      chantier: { id: 'ch-2', code: 'CH-2026-002', status: 'EN_PREPARATION' },
      budget: { prevuHt: '582600.00', reviseHt: '582600.00', realiseHt: '0' },
      montantVenteInitialHt: '737106.00',
      montantVenteActifHt: '737106.00',
      debourseInitialHt: '582600.00',
      budgetReviseHt: '582600.00',
      margeInitialeHt: '154506.00',
      margeInitialePct: '20.96',
      margeProjeteeHt: '154506.00',
      margeProjeteePct: '20.96',
      sourceVente: 'DEVIS',
      status: 'EN_PREPARATION',
    });

    expect(summary.montantVenteActifHt).toBe(737106);
    expect(summary.montantVenteInitialHt).toBe(737106);
    expect(summary.debourseInitialHt).toBe(582600);
    expect(summary.budgetReviseHt).toBe(582600);
    expect(summary.margeInitialeHt).toBe(154506);
    expect(summary.margeInitialePct).toBe(20.96);
    expect(summary.sourceVente).toBe('DEVIS');
    expect(summary.status).toBe('EN_PREPARATION');
  });

  it('laisse les marges absentes en null quand la vente manque (AC-14)', () => {
    const summary = chantierSummaryToUi({
      chantier: { id: 'ch-3', code: 'CH-3', status: 'EN_PREPARATION' },
      budget: { prevuHt: '100', reviseHt: '100', realiseHt: '0' },
      margeInitialePct: null,
      margeProjeteePct: null,
    });

    expect(summary.montantVenteActifHt).toBeNull();
    expect(summary.margeInitialePct).toBeNull();
    expect(summary.margeProjeteePct).toBeNull();
  });
});
