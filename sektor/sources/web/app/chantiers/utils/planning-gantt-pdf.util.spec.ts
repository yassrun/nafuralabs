import type { LotChantier } from '@app/chantiers/models';

import { VILLA_HASSAN_GANTT_FIXTURE } from './fixtures/villa-hassan-gantt.fixture';
import {
  buildPhaseCode,
  enrichPlanningTasksWithLots,
  filterPlanningTasks,
  isPaymentMilestone,
  parseGanttPdfText,
  suggestLotId,
} from './planning-gantt-pdf.util';

describe('planning-gantt-pdf.util', () => {
  const fixtureText = VILLA_HASSAN_GANTT_FIXTURE;

  const rootLots: LotChantier[] = [
    { id: 'l01', chantierId: 'ch-001', code: 'L01', designation: 'Menuiserie', nature: 'INTERNE', avancementPercent: 0, ordre: 1 },
    { id: 'l02', chantierId: 'ch-001', code: 'L02', designation: 'Faux plafonds', nature: 'INTERNE', avancementPercent: 0, ordre: 2 },
    { id: 'l03', chantierId: 'ch-001', code: 'L03', designation: 'Revêtements', nature: 'INTERNE', avancementPercent: 0, ordre: 3 },
    { id: 'l04', chantierId: 'ch-001', code: 'L04', designation: 'Électricité', nature: 'INTERNE', avancementPercent: 0, ordre: 4 },
    { id: 'l05', chantierId: 'ch-001', code: 'L05', designation: 'Plomberie', nature: 'INTERNE', avancementPercent: 0, ordre: 5 },
    { id: 'l06', chantierId: 'ch-001', code: 'L06', designation: 'Peinture', nature: 'INTERNE', avancementPercent: 0, ordre: 6 },
    { id: 'l08', chantierId: 'ch-001', code: 'L08', designation: 'Piscine', nature: 'INTERNE', avancementPercent: 0, ordre: 8 },
  ];

  it('parses Hassan Gantt fixture with ISO dates', () => {
    const tasks = parseGanttPdfText(fixtureText);
    expect(tasks.length).toBeGreaterThanOrEqual(100);

    const enduits = tasks.find((task) => task.numero === 11);
    expect(enduits).toEqual(
      jasmine.objectContaining({
        designation: 'Enduits',
        dateDebut: '2026-03-30',
        dateFin: '2026-05-06',
      }),
    );
  });

  it('detects payment milestones', () => {
    expect(isPaymentMilestone('Avance de démmarage 25%')).toBeTrue();
    expect(isPaymentMilestone('1er Règlement 15%')).toBeTrue();
    expect(isPaymentMilestone('Enduits interieur')).toBeFalse();
  });

  it('filters payment milestones by default', () => {
    const parsed = parseGanttPdfText(fixtureText);
    const filtered = filterPlanningTasks(parsed);
    expect(filtered.length).toBeGreaterThanOrEqual(90);
    expect(filtered.some((task) => task.isPaymentMilestone)).toBeFalse();
    expect(filtered.some((task) => /règlement|reglement/i.test(task.designation))).toBeFalse();
  });

  it('suggests lot codes from designation keywords', () => {
    expect(suggestLotId('Electricité', rootLots)).toBe('L04');
    expect(suggestLotId('Plomberie', rootLots)).toBe('L05');
    expect(suggestLotId('Faux plafonds', rootLots)).toBe('L02');
    expect(suggestLotId('Peinture', rootLots)).toBe('L06');
    expect(suggestLotId('Piscine et local technique', rootLots)).toBe('L08');
  });

  it('propagates lot hints to sub-section rows', () => {
    const parsed = filterPlanningTasks(parseGanttPdfText(fixtureText));
    const enriched = enrichPlanningTasksWithLots(parsed, rootLots);
    const plomberie = enriched.find((task) => task.numero === 35);
    const sousSol = enriched.find((task) => task.numero === 38);
    expect(plomberie?.lotHint).toBe('L05');
    expect(sousSol?.lotHint).toBe('L05');
  });

  it('builds stable phase codes', () => {
    expect(buildPhaseCode(11)).toBe('P011');
    expect(buildPhaseCode(105)).toBe('P105');
  });
});
