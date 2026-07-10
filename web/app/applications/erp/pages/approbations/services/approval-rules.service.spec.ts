import { TestBed } from '@angular/core/testing';

import { ApprovalRulesService } from './approval-rules.service';

describe('ApprovalRulesService', () => {
  let service: ApprovalRulesService;
  const fixed = new Date('2026-05-10T12:00:00Z');

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(ApprovalRulesService);
  });

  it('BC : 1 étape si montant < 500 k MAD', () => {
    const e = service.buildDefaultEtapes('BC', 100_000, { referenceDate: fixed });
    expect(e.length).toBe(1);
    expect(e[0].approbateurRoleId).toBe('CONDUCTEUR_TRAVAUX');
  });

  it('BC : 3 étapes si montant ≥ 500 k MAD', () => {
    const e = service.buildDefaultEtapes('BC', 600_000, { referenceDate: fixed });
    expect(e.length).toBe(3);
    expect(e[2].approbateurRoleId).toBe('DG');
  });

  it('DA : escalade DAF uniquement au-delà de 50 000', () => {
    expect(service.buildDefaultEtapes('DA', 50_000, { referenceDate: fixed }).length).toBe(1);
    expect(service.buildDefaultEtapes('DA', 50_001, { referenceDate: fixed }).length).toBe(2);
  });

  it('NOTE_FRAIS : DAF si montant > 5 000', () => {
    expect(service.buildDefaultEtapes('NOTE_FRAIS', 5_000, { referenceDate: fixed }).length).toBe(1);
    expect(service.buildDefaultEtapes('NOTE_FRAIS', 5_001, { referenceDate: fixed }).length).toBe(2);
  });

  it('CONGE : une étape conducteur travaux', () => {
    const e = service.buildDefaultEtapes('CONGE', 0, { referenceDate: fixed });
    expect(e.length).toBe(1);
    expect(e[0].approbateurRoleId).toBe('CONDUCTEUR_TRAVAUX');
  });

  it('circuitSummary liste les approbateurs (AVN)', () => {
    const s = service.circuitSummary('AVN', 0);
    expect(s).toContain('Amal Bennani');
    expect(s).toContain('Omar Tazi');
  });
});
