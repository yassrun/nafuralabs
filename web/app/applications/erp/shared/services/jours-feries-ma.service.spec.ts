import { TestBed } from '@angular/core/testing';

import { JoursFeriesMaService } from './jours-feries-ma.service';

/**
 * Unit tests — JoursFeriesMaService (M-MA-09).
 *
 * Couvre :
 *  - Référentiel jours fériés civils (Indépendance, Trône, Marche Verte…)
 *  - Référentiel jours fériés religieux (Aïd Al Fitr, Aïd Al Adha…)
 *  - Détection week-end + jour férié
 *  - Calcul jours ouvrés (échéances facture + congés)
 */
describe('JoursFeriesMaService — jours fériés MA', () => {
  let service: JoursFeriesMaService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(JoursFeriesMaService);
    service.rebuild(2025, 2030);
  });

  it('reconnaît les fêtes civiles fixes', () => {
    expect(service.isFerie('2026-01-01')).toBe(true); // Nouvel an
    expect(service.isFerie('2026-01-11')).toBe(true); // Manifeste Indépendance
    expect(service.isFerie('2026-05-01')).toBe(true); // Fête Travail
    expect(service.isFerie('2026-07-30')).toBe(true); // Trône
    expect(service.isFerie('2026-08-14')).toBe(true); // Allégeance Oued Eddahab
    expect(service.isFerie('2026-08-20')).toBe(true); // Révolution
    expect(service.isFerie('2026-08-21')).toBe(true); // Jeunesse
    expect(service.isFerie('2026-11-06')).toBe(true); // Marche Verte
    expect(service.isFerie('2026-11-18')).toBe(true); // Indépendance
  });

  it('reconnaît les fêtes religieuses MA 2026 (dates officielles)', () => {
    expect(service.isFerie('2026-03-20')).toBe(true); // Aïd Al Fitr
    expect(service.isFerie('2026-03-21')).toBe(true); // Aïd Al Fitr 2e jour
    expect(service.isFerie('2026-05-27')).toBe(true); // Aïd Al Adha
    expect(service.isFerie('2026-05-28')).toBe(true); // Aïd Al Adha 2e jour
    expect(service.isFerie('2026-02-26')).toBe(true); // Aïd Al Mawlid
    expect(service.isFerie('2026-06-16')).toBe(true); // Mouharram
  });

  it('refuse une date qui n\'est pas fériée', () => {
    expect(service.isFerie('2026-06-15')).toBe(false);
    expect(service.isFerie('2026-12-25')).toBe(false); // Noël n\'est pas férié MA
  });

  it('getFerie retourne le libellé', () => {
    expect(service.getFerie('2026-07-30')?.libelle).toContain('Trône');
    expect(service.getFerie('2026-11-06')?.libelle).toContain('Marche Verte');
    expect(service.getFerie('2026-06-15')).toBeUndefined();
  });

  it('isWeekend détecte samedi et dimanche', () => {
    expect(service.isWeekend('2026-05-16')).toBe(true);  // samedi
    expect(service.isWeekend('2026-05-17')).toBe(true);  // dimanche
    expect(service.isWeekend('2026-05-18')).toBe(false); // lundi
  });

  it('isOuvre exclut weekends + fériés', () => {
    expect(service.isOuvre('2026-05-01')).toBe(false); // Fête Travail (vendredi)
    expect(service.isOuvre('2026-05-04')).toBe(true);  // lundi ouvré
    expect(service.isOuvre('2026-05-09')).toBe(false); // samedi
  });

  it('joursOuvres — semaine sans férié = 5 jours', () => {
    // 2026-05-04 (lundi) → 2026-05-08 (vendredi)
    expect(service.joursOuvres('2026-05-04', '2026-05-08')).toBe(5);
  });

  it('joursOuvres — semaine avec férié Trône (jeudi 30/07/2026)', () => {
    // 2026-07-27 (lundi) → 2026-07-31 (vendredi) → 1 férié + 4 ouvrés
    expect(service.joursOuvres('2026-07-27', '2026-07-31')).toBe(4);
  });

  it('joursOuvres — début > fin → 0', () => {
    expect(service.joursOuvres('2026-05-08', '2026-05-04')).toBe(0);
  });

  it('addJoursOuvres — facture émise mardi + 30 jours ouvrés ≠ +30 jours calendaires', () => {
    const dateRef = service.addJoursOuvres('2026-05-05', 30);
    // 30 jours ouvrés depuis mardi 5 mai 2026, doit retomber bien après le 4 juin
    expect(dateRef.getTime()).toBeGreaterThan(new Date('2026-06-04T00:00:00').getTime());
  });

  it('listForYear filtre par année', () => {
    const list2026 = service.listForYear(2026);
    expect(list2026.length).toBeGreaterThan(10);
    expect(list2026.every((f) => f.date.startsWith('2026-'))).toBe(true);
  });
});
