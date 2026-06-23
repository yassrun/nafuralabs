import { buildPilotageMargeRows, buildPilotageMargePivotRows, margePilotageCssClass } from './pilotage-chantier-marges.service';

import type { Chantier } from '../../../chantiers/models';
import type { Marche } from '../../marches/models';

describe('buildPilotageMargeRows', () => {
  const chantier = {
    id: 'ch-1',
    code: 'CH-001',
    name: 'Test',
    type: 'BATIMENT',
    clientId: 'c1',
    ville: 'Rabat',
    dateDebut: '2026-01-01',
    dateFinPrevue: '2026-12-31',
    budgetHt: 10_000_000,
    tvaTaux: 20,
    avancementPercent: 40,
    facturesEmisesHt: 3_000_000,
    encaissementsTtc: 2_500_000,
    cumulSituationsHt: 0,
    status: 'EN_COURS',
    isActive: true,
  } as Chantier;

  it('utilise le marché quand chantierId correspond', () => {
    const marche = {
      id: 'm1',
      numero: 'M-1',
      intitule: '',
      chantierId: 'ch-1',
      chantierCode: 'CH-001',
      chantierNom: 'Test',
      clientId: 'c1',
      clientNom: '',
      type: 'FORFAIT',
      nature: 'PRIVE_PME',
      montantInitialHt: 0,
      tvaTaux: 20,
      retenueGarantieTaux: 7,
      retenueSourceTaux: 0,
      delaiExecutionMois: 12,
      status: 'EN_EXECUTION',
      montantAvenantsHt: 0,
      montantTotalHt: 20_000_000,
      avancementPercent: 0,
      cumulFactureHt: 8_000_000,
      cumulEncaisseHt: 7_000_000,
    } as Marche;
    const [row] = buildPilotageMargeRows([chantier], [marche]);
    expect(row.montantMarcheHt).toBe(20_000_000);
    expect(row.cumulFactureHt).toBe(8_000_000);
    expect(row.pctFacture).toBe(40);
    expect(row.diffFactureAvancement).toBe(0);
    expect(row.alerteDiff).toBe(false);
  });

  it('alerte écart facturation / avancement si > 10 pts', () => {
    const c = { ...chantier, avancementPercent: 10 } as Chantier;
    const marche = {
      id: 'm1',
      numero: 'M-1',
      intitule: '',
      chantierId: 'ch-1',
      chantierCode: 'CH-001',
      chantierNom: 'Test',
      clientId: 'c1',
      clientNom: '',
      type: 'FORFAIT',
      nature: 'PRIVE_PME',
      montantInitialHt: 10_000_000,
      tvaTaux: 20,
      retenueGarantieTaux: 7,
      retenueSourceTaux: 0,
      delaiExecutionMois: 12,
      status: 'EN_EXECUTION',
      montantAvenantsHt: 0,
      montantTotalHt: 10_000_000,
      avancementPercent: 0,
      cumulFactureHt: 5_000_000,
      cumulEncaisseHt: 0,
    } as Marche;
    const [row] = buildPilotageMargeRows([c], [marche]);
    expect(row.pctFacture).toBe(50);
    expect(row.diffFactureAvancement).toBe(40);
    expect(row.alerteDiff).toBe(true);
  });
});

describe('buildPilotageMargePivotRows', () => {
  it('agrège par axe CLIENT', () => {
    const chantier = {
      id: 'ch-1',
      code: 'CH-001',
      name: 'Test',
      type: 'BATIMENT',
      clientId: 'c1',
      ville: 'Rabat',
      dateDebut: '2026-01-01',
      dateFinPrevue: '2026-12-31',
      budgetHt: 10_000_000,
      tvaTaux: 20,
      avancementPercent: 40,
      facturesEmisesHt: 3_000_000,
      encaissementsTtc: 2_500_000,
      cumulSituationsHt: 0,
      status: 'EN_COURS',
      isActive: true,
    } as Chantier;
    const marche = {
      id: 'm1',
      numero: 'M-1',
      intitule: '',
      chantierId: 'ch-1',
      chantierCode: 'CH-001',
      chantierNom: 'Test',
      clientId: 'cli-x',
      clientNom: 'Client X',
      type: 'FORFAIT',
      nature: 'PRIVE_PME',
      montantInitialHt: 0,
      tvaTaux: 20,
      retenueGarantieTaux: 7,
      retenueSourceTaux: 0,
      delaiExecutionMois: 12,
      status: 'EN_EXECUTION',
      montantAvenantsHt: 0,
      montantTotalHt: 20_000_000,
      avancementPercent: 0,
      cumulFactureHt: 8_000_000,
      cumulEncaisseHt: 7_000_000,
    } as Marche;
    const rows = buildPilotageMargePivotRows([chantier], [marche], 'CLIENT');
    expect(rows.length).toBe(1);
    expect(rows[0].label).toBe('Client X');
  });
});

describe('margePilotageCssClass', () => {
  it('retourne danger / warning / ok', () => {
    expect(margePilotageCssClass(4)).toBe('marge--danger');
    expect(margePilotageCssClass(10)).toBe('marge--warning');
    expect(margePilotageCssClass(20)).toBe('marge--ok');
  });
});
