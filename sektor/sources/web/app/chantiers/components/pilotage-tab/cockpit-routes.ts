export interface CockpitModuleRoute {
  titre: string;
  resume: string;
  route: string;
}

export function cockpitModuleRoutes(chantierId: string): CockpitModuleRoute[] {
  const id = encodeURIComponent(chantierId);
  return [
    { titre: 'chantiers.cockpit.module.arbre', resume: 'chantiers.cockpit.module.arbreResume', route: `/chantiers/${id}?tab=lots` },
    { titre: 'chantiers.cockpit.module.budget', resume: 'chantiers.cockpit.module.budgetResume', route: `/chantiers/budget/${id}` },
    { titre: 'chantiers.cockpit.module.planning', resume: 'chantiers.cockpit.module.planningResume', route: `/chantiers/planning?chantier=${id}` },
    { titre: 'chantiers.cockpit.module.situations', resume: 'chantiers.cockpit.module.situationsResume', route: `/chantiers/situations?chantierId=${id}` },
  ];
}

export function resolveCockpitRoute(route: string, chantierId: string): string {
  return route.replace('{id}', encodeURIComponent(chantierId));
}
