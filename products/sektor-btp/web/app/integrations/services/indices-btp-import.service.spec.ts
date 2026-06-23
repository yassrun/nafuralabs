import { TestBed } from '@angular/core/testing';

import { IndicesBtpImportService } from './indices-btp-import.service';
import { FormuleRevisionKService } from '@applications/erp/pages/marches/services/formule-revision-k.service';
import type { FormuleRevisionK } from '@applications/erp/pages/marches/models';

describe('IndicesBtpImportService', () => {
  let svc: IndicesBtpImportService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    localStorage.clear();
    svc = TestBed.inject(IndicesBtpImportService);
    svc.reset();
  });

  it('seed contient BTP01/BTP18/MO01 sur 3 mois', () => {
    const map = svc.indicesPourPeriode('2026-04');
    expect(map.get('BTP01')).toBe(128.34);
    expect(map.get('BTP18')).toBe(143.20);
    expect(map.get('MO01')).toBe(119.05);
  });

  it('parseCsv accepte point-virgule + ignore l en-tête', () => {
    const csv = 'code;periode;valeur;libelle\nBTP02;2026-05;110.5;Maçonnerie\nBTP02;2026-04;110.0;Maçonnerie';
    const rows = svc.parseCsv(csv, 'HCP');
    expect(rows.length).toBe(2);
    expect(rows[0].code).toBe('BTP02');
    expect(rows[0].valeur).toBe(110.5);
    expect(rows[0].source).toBe('HCP');
  });

  it('importCsv merge sur (code, periode) — remplace ancienne valeur', () => {
    const csv = 'BTP01;2026-05;129.99;Tous travaux du bâtiment';
    const stats = svc.importCsv(csv, 'HCP');
    expect(stats.misAJour).toBe(1);
    expect(svc.indicesPourPeriode('2026-05').get('BTP01')).toBe(129.99);
  });

  it('importCsv ajoute si paire (code, periode) inconnue', () => {
    const csv = 'BTP99;2026-05;200.0;Nouveau';
    const stats = svc.importCsv(csv, 'HCP');
    expect(stats.ajoutes).toBe(1);
    expect(svc.indicesPourPeriode('2026-05').get('BTP99')).toBe(200.0);
  });

  it('alimente FormuleRevisionKService correctement', () => {
    const k = TestBed.inject(FormuleRevisionKService);
    const formule: FormuleRevisionK = {
      termeFixe: 0.15,
      termesVariables: [
        { coefficient: 0.55, indiceCode: 'BTP01', indiceBaseValeur: 125 },
        { coefficient: 0.30, indiceCode: 'MO01', indiceBaseValeur: 115 },
      ],
    };
    const indices = svc.indicesPourPeriode('2026-05');
    const result = k.calculerK(formule, indices);
    expect(Number.isFinite(result)).toBe(true);
    expect(result).toBeGreaterThan(0);
  });
});
