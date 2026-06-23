import { TestBed } from '@angular/core/testing';

import { NumberingService } from './numbering.service';

describe('NumberingService', () => {
  let service: NumberingService;

  beforeEach(() => {
    localStorage.removeItem('nafura-erp-numbering');
    TestBed.configureTestingModule({});
    service = TestBed.inject(NumberingService);
    service.resetCounters();
  });

  afterEach(() => {
    localStorage.removeItem('nafura-erp-numbering');
  });

  it('returns sequential BC numbers within a given year', () => {
    const a = service.nextNumber('BC', { year: 2026 });
    const b = service.nextNumber('BC', { year: 2026 });
    const c = service.nextNumber('BC', { year: 2026 });

    expect(a).toBe('BC-2026-00001');
    expect(b).toBe('BC-2026-00002');
    expect(c).toBe('BC-2026-00003');
    expect(service.peekNumber('BC', { year: 2026 })).toBe('BC-2026-00004');
  });

  it('resets the counter when the year changes (year-scoped suffix)', () => {
    expect(service.nextNumber('DA', { year: 2026 })).toBe('DA-2026-0001');
    expect(service.nextNumber('DA', { year: 2026 })).toBe('DA-2026-0002');

    expect(service.nextNumber('DA', { year: 2027 })).toBe('DA-2027-0001');
    expect(service.nextNumber('DA', { year: 2027 })).toBe('DA-2027-0002');

    expect(service.peekNumber('DA', { year: 2026 })).toBe('DA-2026-0003');
  });

  it('emits DV-prefixed devis numbers (historical ERP prefix)', () => {
    expect(service.nextNumber('DEVIS', { year: 2026 })).toBe('DV-2026-0001');
    expect(service.nextNumber('DEVIS', { year: 2026 })).toBe('DV-2026-0002');
  });

  it('emits AOC-prefixed appel-offres client numbers', () => {
    expect(service.nextNumber('AOC', { year: 2026 })).toBe('AOC-2026-0001');
  });

  it('emits CMD-prefixed commandes vente numbers', () => {
    expect(service.nextNumber('CMD_VENTE', { year: 2026 })).toBe('CMD-2026-0001');
    expect(service.nextNumber('CMD_VENTE', { year: 2026 })).toBe('CMD-2026-0002');
  });

  it('emits BL and BR stock document numbers (year scope)', () => {
    expect(service.nextNumber('BL', { year: 2026 })).toBe('BL-2026-0001');
    expect(service.nextNumber('BR', { year: 2026 })).toBe('BR-2026-0001');
    expect(service.nextNumber('BL', { year: 2026 })).toBe('BL-2026-0002');
  });

  it('emits PAI-prefixed fiche de paie numbers', () => {
    expect(service.nextNumber('FICHE_PAIE', { year: 2026 })).toBe('PAI-2026-0001');
    expect(service.nextNumber('FICHE_PAIE', { year: 2026 })).toBe('PAI-2026-0002');
  });

  it('uses chantier code as scope for SIT numbers (independent counters)', () => {
    const ch1a = service.nextNumber('SIT', { chantierCode: 'CH-2026-001' });
    const ch1b = service.nextNumber('SIT', { chantierCode: 'CH-2026-001' });
    const ch2a = service.nextNumber('SIT', { chantierCode: 'CH-2026-002' });

    expect(ch1a).toBe('SIT-CH-2026-001-001');
    expect(ch1b).toBe('SIT-CH-2026-001-002');
    expect(ch2a).toBe('SIT-CH-2026-002-001');
  });

  it('clears all counters when resetCounters is called', () => {
    service.nextNumber('BC', { year: 2026 });
    service.nextNumber('BC', { year: 2026 });
    service.nextNumber('FM', { year: 2026 });
    service.nextNumber('SIT', { chantierCode: 'CH-2026-001' });

    service.resetCounters();

    expect(service.counters()).toEqual({});
    expect(localStorage.getItem('nafura-erp-numbering')).toBeNull();
    expect(service.nextNumber('BC', { year: 2026 })).toBe('BC-2026-00001');
    expect(service.nextNumber('FM', { year: 2026 })).toBe('FM-2026-00001');
    expect(service.nextNumber('SIT', { chantierCode: 'CH-2026-001' })).toBe('SIT-CH-2026-001-001');
  });
});
