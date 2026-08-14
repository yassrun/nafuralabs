import { TestBed } from '@angular/core/testing';

import { ApprovalEngineService } from './approval-engine.service';

describe('ApprovalEngineService', () => {
  let service: ApprovalEngineService;
  const fixed = new Date('2026-05-10T12:00:00Z');

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(ApprovalEngineService);
  });

  it('sélectionne BC < 500 k : une étape', () => {
    const wf = service.selectWorkflow('BC', { montant: 100_000 });
    expect(wf.id).toBe('wf-bc-std');
    expect(service.buildEtapes(wf, { referenceDate: fixed }).length).toBe(1);
  });

  it('sélectionne BC ≥ 500 k : trois étapes série', () => {
    const wf = service.selectWorkflow('BC', { montant: 1_000_000 });
    expect(wf.id).toBe('wf-bc-500k');
    const e = service.buildEtapes(wf, { referenceDate: fixed });
    expect(e.length).toBe(3);
    expect(e[0].approbateurRoleId).toBe('CONDUCTEUR_TRAVAUX');
    expect(e[1].approbateurRoleId).toBe('DAF');
    expect(e[2].approbateurRoleId).toBe('DG');
  });

  it('DA : DAF seulement si montant > 50 k', () => {
    expect(service.selectWorkflow('DA', { montant: 50_000 }).id).toBe('wf-da-std');
    expect(service.selectWorkflow('DA', { montant: 50_001 }).id).toBe('wf-da-daf');
  });

  it('NOTE_FRAIS : DAF si > 5 k', () => {
    expect(service.selectWorkflow('NOTE_FRAIS', { montant: 5_000 }).id).toBe('wf-note-frais-low');
    expect(service.selectWorkflow('NOTE_FRAIS', { montant: 5_001 }).id).toBe('wf-note-frais-high');
  });

  it('slaLagDays retourne 0 si pas de date limite', () => {
    expect(
      service.slaLagDays({
        status: 'EN_ATTENTE',
        etapeCourante: 0,
        etapes: [{ ordre: 0, approbateurNom: 'X' }],
      }),
    ).toBe(0);
  });
});
