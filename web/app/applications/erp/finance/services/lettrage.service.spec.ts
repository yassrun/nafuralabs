import { TestBed } from '@angular/core/testing';

import { LettrageService } from './lettrage.service';

describe('LettrageService', () => {
  let svc: LettrageService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    svc = TestBed.inject(LettrageService);
  });

  it('computeTotals équilibré quand débit = crédit', () => {
    const t = svc.computeTotals([
      { debit: 100, credit: 0 },
      { debit: 0, credit: 100 },
    ]);
    expect(t.difference).toBe(0);
  });

  it('refuse lettrage si différence > tolérance (sans partiel)', () => {
    expect(svc.canLettrer(5, 0.01, false)).toBe(false);
    expect(svc.canLettrer(0.005, 0.01, false)).toBe(true);
  });

  it('suggestAutoPairKeys retourne une paire même pièce', () => {
    const keys = svc.suggestAutoPairKeys([
      {
        ligneKey: 'ec-1::l1',
        ecritureId: 'ec-1',
        ligneId: 'l1',
        date: '2026-01-01',
        piece: 'FC-1',
        libelle: 'A',
        debit: 120,
        credit: 0,
      },
      {
        ligneKey: 'ec-2::l1',
        ecritureId: 'ec-2',
        ligneId: 'l1',
        date: '2026-01-02',
        piece: 'FC-1',
        libelle: 'B',
        debit: 0,
        credit: 120,
      },
    ]);
    expect(keys?.length).toBe(2);
  });
});
