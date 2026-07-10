import { TestBed } from '@angular/core/testing';

import { BudgetFacade } from '@applications/erp/pages/chantiers/budget/services';
import { StockBudgetSyncService } from './stock-budget-sync.service';

describe('StockBudgetSyncService', () => {
  beforeEach(() => {
    TestBed.configureTestingModule({});
  });

  it('recordConsommation with origin STOCK increments realise matière (M-STK-04)', () => {
    const budget = TestBed.inject(BudgetFacade);

    const ok = budget.recordConsommation({
      chantierId: 'ch-001',
      rubrique: 'MATERIAUX',
      montantHt: 1900,
      articleId: 'art-ciment',
      articleLabel: 'Ciment CPJ 45',
      unite: 'T',
      qte: 2,
      reference: 'TEST-BUD-1',
      origin: 'STOCK',
    });

    expect(ok).toBe(true);
    const b = budget.getBudgetById('ch-001');
    const mat = b?.lignes.find((l) => l.rubrique === 'MATERIAUX');
    expect(mat?.realiseMatiereStockHt).toBeGreaterThan(0);
    const drill = mat?.drilldown?.find((d) => d.articleId === 'art-ciment');
    expect(drill?.qteRealiseeStock ?? 0).toBeGreaterThanOrEqual(2);
    expect(drill?.montantRealiseMatiereStockHt ?? 0).toBeGreaterThan(0);
    expect(budget.realisesMatieresParPoste('ch-001').length).toBeGreaterThan(0);
  });

  it('StockBudgetSyncService.recordOutflow delegates to budget (smoke)', () => {
    const sync = TestBed.inject(StockBudgetSyncService);
    const facade = sync as unknown as { budget: BudgetFacade };
    const budget = TestBed.inject(BudgetFacade);
    expect(facade.budget).toBe(budget);
  });
});
