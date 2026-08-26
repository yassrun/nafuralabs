import { cockpitModuleRoutes, resolveCockpitRoute } from './cockpit-routes';

describe('cockpit canonical routes', () => {
  it('pointe chaque carte vers une route réellement déclarée', () => {
    expect(cockpitModuleRoutes('ch-42')).toEqual([
      jasmine.objectContaining({ route: '/chantiers/ch-42?tab=lots' }),
      jasmine.objectContaining({ route: '/chantiers/budget/ch-42' }),
      jasmine.objectContaining({ route: '/chantiers/planning?chantier=ch-42' }),
      jasmine.objectContaining({ route: '/chantiers/situations?chantierId=ch-42' }),
    ]);
  });

  it('remplace l’identifiant et conserve les query params', () => {
    expect(resolveCockpitRoute('/chantiers/{id}?tab=equipe', 'abc def'))
      .toBe('/chantiers/abc%20def?tab=equipe');
  });
});
