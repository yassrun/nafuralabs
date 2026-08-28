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

  it('EN_COURS ouvre DA, BL, documents, ST — planning recommandé, jamais seule porte', () => {
    const modules = cockpitModuleRoutes('ch-42', 'EN_COURS', [
      'chantiers.cockpit.action.avancement',
      'chantiers.cockpit.action.demandeAchat',
      'chantiers.cockpit.action.receptionBl',
      'chantiers.cockpit.action.documents',
      'chantiers.cockpit.action.sousTraitance',
      'chantiers.cockpit.action.notifierMarche',
    ]);
    const routes = modules.map((m) => m.route);
    expect(routes).toContain('/achats/demandes/new?chantierId=ch-42');
    expect(routes).toContain('/achats/commandes?chantierId=ch-42');
    expect(routes).toContain('/chantiers/documents?chantierId=ch-42');
    expect(routes).toContain('/chantiers/sous-traitance/new?chantierId=ch-42');
    expect(routes).toContain('/chantiers/avancements/saisie/ch-42');
    expect(routes).toContain('/marches/contrats/new?chantierId=ch-42');
    expect(modules.some((m) => m.recommande && m.route.includes('/chantiers/planning'))).toBeTrue();
    expect(routes.every((r) => r.includes('ch-42'))).toBeTrue();
  });

  it('ne propose pas situation au magasinier', () => {
    const modules = cockpitModuleRoutes('ch-42', 'EN_COURS', [
      'chantiers.cockpit.action.receptionBl',
    ]);
    expect(modules.map((m) => m.route)).not.toContain('/chantiers/situations?chantierId=ch-42');
    expect(modules.map((m) => m.route)).toContain('/achats/commandes?chantierId=ch-42');
  });

  it('remplace l’identifiant et conserve les query params', () => {
    expect(resolveCockpitRoute('/chantiers/{id}?tab=equipe', 'abc def'))
      .toBe('/chantiers/abc%20def?tab=equipe');
  });
});
