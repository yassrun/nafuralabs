import { IncidentService } from './incident.service';
import type { Incident } from '../models';

describe('IncidentService', () => {
  const svc = new IncidentService();

  it('requires CNSS DAT for AT travail, trajet and MP', () => {
    const base = { id: '1', numero: 'X', date: '2026-05-01', lieu: 'L', gravite: 'SANS_ARRET' as const, description: 'D', status: 'DECLARE' as const };
    expect(svc.requiresCnssDeclaration({ ...base, typeIncident: 'AT_TRAVAIL' } as Incident)).toBe(true);
    expect(svc.requiresCnssDeclaration({ ...base, typeIncident: 'AT_TRAJET' } as Incident)).toBe(true);
    expect(svc.requiresCnssDeclaration({ ...base, typeIncident: 'MP' } as Incident)).toBe(true);
    expect(svc.requiresCnssDeclaration({ ...base, typeIncident: 'PRESQUE_ACCIDENT' } as Incident)).toBe(false);
  });

  it('detects CNSS 48h deadline passed for old incident', () => {
    const inc: Incident = {
      id: 'x',
      numero: 'N',
      date: '2020-01-01',
      heure: '08:00',
      lieu: 'L',
      gravite: 'AVEC_ARRET',
      description: 'D',
      status: 'DECLARE',
      typeIncident: 'AT_TRAVAIL',
    };
    expect(svc.isCnssDeadlinePassed(inc)).toBe(true);
    expect(svc.hoursUntilCnssDeadline(inc)).toBeLessThan(0);
  });
});
