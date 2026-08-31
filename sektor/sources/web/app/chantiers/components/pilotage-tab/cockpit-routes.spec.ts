import {
  cockpitModuleRoutes,
  cockpitNavShortcuts,
  isCockpitAppRoute,
  resolveAlertRoute,
  resolveCockpitRoute,
  resolvePreparationRoute,
} from './cockpit-routes';

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

  it('mappe chaque code préparation CONTRAT vers une route /… (jamais clé i18n)', () => {
    const expected: Record<string, string> = {
      identite_client: '/chantiers/ch-42/edit',
      reference_vente: '/chantiers/ch-42/edit',
      dates_prevues: '/chantiers/ch-42/edit',
      arbre: '/chantiers/ch-42?tab=lots',
      responsables: '/chantiers/ch-42?tab=equipe',
      budget_initial: '/chantiers/budget/ch-42',
      planning: '/chantiers/planning?chantier=ch-42',
    };
    for (const [code, route] of Object.entries(expected)) {
      expect(resolvePreparationRoute(code, 'ch-42')).withContext(code).toBe(route);
      expect(isCockpitAppRoute(route)).withContext(code).toBeTrue();
      expect(route).not.toContain('chantiers.cockpit');
    }
    expect(resolvePreparationRoute('ordre_service', 'ch-42')).toBeNull();
    expect(resolvePreparationRoute('code_inconnu', 'ch-42')).toBeNull();
    expect(isCockpitAppRoute('chantiers.cockpit.preparation.action.arbre')).toBeFalse();
    expect(isCockpitAppRoute(null)).toBeFalse();
  });

  it('mappe chaque code alerte CONTRAT vers une route /… ; source_indisponible = pas de route', () => {
    expect(resolveAlertRoute('marge_negative', 'ch-42')).toBe('/chantiers/budget/ch-42');
    expect(resolveAlertRoute('marge_en_baisse', 'ch-42')).toBe('/chantiers/budget/ch-42');
    expect(resolveAlertRoute('finance_incomplete', 'ch-42')).toBe('/chantiers/ch-42/edit');
    expect(resolveAlertRoute('retard_contractuel', 'ch-42')).toBe('/chantiers/planning?chantier=ch-42');
    expect(resolveAlertRoute('source_indisponible', 'ch-42')).toBeNull();
    expect(resolveAlertRoute('alerte_inconnue', 'ch-42')).toBeNull();
    expect(isCockpitAppRoute('chantiers.cockpit.alerte.action.budget')).toBeFalse();
  });

  it('bandeau nav stable : 12 modules toujours présents (arbre, équipe, journal…)', () => {
    const nav = cockpitNavShortcuts('ch-42');
    expect(nav.length).toBe(12);
    const routes = nav.map((m) => m.route);
    expect(routes).toContain('/chantiers/ch-42?tab=lots');
    expect(routes).toContain('/chantiers/ch-42?tab=equipe');
    expect(routes).toContain('/chantiers/avancements/saisie/ch-42');
    expect(routes).toContain('/chantiers/attachements/saisie?chantierId=ch-42');
    expect(routes).toContain('/chantiers/situations?chantierId=ch-42');
    expect(routes).toContain('/chantiers/documents?chantierId=ch-42');
    expect(routes).toContain('/chantiers/journal?chantierId=ch-42');
    expect(routes).toContain('/chantiers/planning?chantier=ch-42');
    expect(routes).toContain('/chantiers/budget/ch-42');
    expect(routes).toContain('/achats/demandes/new?chantierId=ch-42');
    expect(routes).toContain('/chantiers/sous-traitance/new?chantierId=ch-42');
    expect(routes).toContain('/achats/commandes?chantierId=ch-42');
    expect(routes.every((r) => isCockpitAppRoute(r))).toBeTrue();
    expect(routes.every((r) => !r.includes('chantiers.cockpit'))).toBeTrue();
  });
});
