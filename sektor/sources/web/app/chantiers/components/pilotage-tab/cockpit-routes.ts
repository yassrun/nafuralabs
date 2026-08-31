export interface CockpitModuleRoute {
  titre: string;
  resume: string;
  route: string;
  recommande?: boolean;
  /** Clé pour enrichir la tuile depuis le read model (ex. compteur DA). */
  moduleKey?: 'demandeAchat';
}

export function cockpitModuleRoutes(
  chantierId: string,
  status?: string | null,
  nextActionLibelles?: string[],
): CockpitModuleRoute[] {
  const id = encodeURIComponent(chantierId);
  if (status !== 'EN_COURS') {
    return [
      { titre: 'chantiers.cockpit.module.arbre', resume: 'chantiers.cockpit.module.arbreResume', route: `/chantiers/${id}?tab=lots` },
      { titre: 'chantiers.cockpit.module.budget', resume: 'chantiers.cockpit.module.budgetResume', route: `/chantiers/budget/${id}` },
      { titre: 'chantiers.cockpit.module.planning', resume: 'chantiers.cockpit.module.planningResume', route: `/chantiers/planning?chantier=${id}` },
      { titre: 'chantiers.cockpit.module.situations', resume: 'chantiers.cockpit.module.situationsResume', route: `/chantiers/situations?chantierId=${id}` },
    ];
  }

  const allowed = new Set(nextActionLibelles ?? []);
  const has = (libelle: string) => allowed.size === 0 || allowed.has(libelle);
  const modules: CockpitModuleRoute[] = [
    { titre: 'chantiers.cockpit.module.arbre', resume: 'chantiers.cockpit.module.arbreResume', route: `/chantiers/${id}?tab=lots` },
  ];
  if (has('chantiers.cockpit.action.avancement')) {
    modules.push({
      titre: 'chantiers.cockpit.module.avancement',
      resume: 'chantiers.cockpit.module.avancementResume',
      route: `/chantiers/avancements/saisie/${id}`,
    });
  }
  if (has('chantiers.cockpit.action.demandeAchat')) {
    modules.push({
      titre: 'chantiers.cockpit.module.demandeAchat',
      resume: 'chantiers.cockpit.module.demandeAchatResume',
      route: `/achats/demandes/new?chantierId=${id}`,
      moduleKey: 'demandeAchat',
    });
  }
  if (has('chantiers.cockpit.action.receptionBl')) {
    modules.push({
      titre: 'chantiers.cockpit.module.receptionBl',
      resume: 'chantiers.cockpit.module.receptionBlResume',
      route: `/achats/commandes?chantierId=${id}`,
    });
  }
  if (has('chantiers.cockpit.action.documents')) {
    modules.push({
      titre: 'chantiers.cockpit.module.documents',
      resume: 'chantiers.cockpit.module.documentsResume',
      route: `/chantiers/documents?chantierId=${id}`,
    });
  }
  if (has('chantiers.cockpit.action.sousTraitance')) {
    modules.push({
      titre: 'chantiers.cockpit.module.sousTraitance',
      resume: 'chantiers.cockpit.module.sousTraitanceResume',
      route: `/chantiers/sous-traitance/new?chantierId=${id}`,
    });
  }
  if (has('chantiers.cockpit.action.attachement')) {
    modules.push({
      titre: 'chantiers.cockpit.module.attachement',
      resume: 'chantiers.cockpit.module.attachementResume',
      route: `/chantiers/attachements/saisie?chantierId=${id}`,
    });
  }
  if (has('chantiers.cockpit.action.situation') || has('chantiers.cockpit.action.soumettreSituation')) {
    modules.push({
      titre: 'chantiers.cockpit.module.situations',
      resume: 'chantiers.cockpit.module.situationsResume',
      route: `/chantiers/situations?chantierId=${id}`,
    });
  }
  if (has('chantiers.cockpit.action.budget')) {
    modules.push({
      titre: 'chantiers.cockpit.module.budget',
      resume: 'chantiers.cockpit.module.budgetResume',
      route: `/chantiers/budget/${id}`,
    });
  }
  if (has('chantiers.cockpit.action.notifierMarche')) {
    modules.push({
      titre: 'chantiers.cockpit.module.notifierMarche',
      resume: 'chantiers.cockpit.module.notifierMarcheResume',
      route: `/marches/contrats/new?chantierId=${id}`,
    });
  }
  modules.push({
    titre: 'chantiers.cockpit.module.planning',
    resume: 'chantiers.cockpit.module.planningRecommandeResume',
    route: `/chantiers/planning?chantier=${id}`,
    recommande: true,
  });
  return modules;
}

export function resolveCockpitRoute(route: string, chantierId: string): string {
  return route.replace('{id}', encodeURIComponent(chantierId));
}

/** Bandeau nav toujours visible — pas filtré par nextActions (les commandes restent dans « À faire »). */
export function cockpitNavShortcuts(chantierId: string): CockpitModuleRoute[] {
  const id = encodeURIComponent(chantierId);
  return [
    { titre: 'chantiers.cockpit.module.arbre', resume: 'chantiers.cockpit.module.arbreResume', route: `/chantiers/${id}?tab=lots` },
    { titre: 'chantiers.cockpit.module.equipe', resume: 'chantiers.cockpit.module.equipeResume', route: `/chantiers/${id}?tab=equipe` },
    { titre: 'chantiers.cockpit.module.avancement', resume: 'chantiers.cockpit.module.avancementResume', route: `/chantiers/avancements/saisie/${id}` },
    { titre: 'chantiers.cockpit.module.attachement', resume: 'chantiers.cockpit.module.attachementResume', route: `/chantiers/attachements/saisie?chantierId=${id}` },
    { titre: 'chantiers.cockpit.module.situations', resume: 'chantiers.cockpit.module.situationsResume', route: `/chantiers/situations?chantierId=${id}` },
    { titre: 'chantiers.cockpit.module.documents', resume: 'chantiers.cockpit.module.documentsResume', route: `/chantiers/documents?chantierId=${id}` },
    { titre: 'chantiers.cockpit.module.journal', resume: 'chantiers.cockpit.module.journalResume', route: `/chantiers/journal?chantierId=${id}` },
    { titre: 'chantiers.cockpit.module.planning', resume: 'chantiers.cockpit.module.planningResume', route: `/chantiers/planning?chantier=${id}` },
    { titre: 'chantiers.cockpit.module.budget', resume: 'chantiers.cockpit.module.budgetResume', route: `/chantiers/budget/${id}` },
    { titre: 'chantiers.cockpit.module.demandeAchat', resume: 'chantiers.cockpit.module.demandeAchatResume', route: `/achats/demandes/new?chantierId=${id}` },
    { titre: 'chantiers.cockpit.module.sousTraitance', resume: 'chantiers.cockpit.module.sousTraitanceResume', route: `/chantiers/sous-traitance/new?chantierId=${id}` },
    { titre: 'chantiers.cockpit.module.receptionBl', resume: 'chantiers.cockpit.module.receptionBlResume', route: `/achats/commandes?chantierId=${id}` },
  ];
}

const PREP_ROUTES: Record<string, (id: string) => string> = {
  identite_client: (id) => `/chantiers/${id}/edit`,
  reference_vente: (id) => `/chantiers/${id}/edit`,
  dates_prevues: (id) => `/chantiers/${id}/edit`,
  arbre: (id) => `/chantiers/${id}?tab=lots`,
  budget_initial: (id) => `/chantiers/budget/${id}`,
  responsables: (id) => `/chantiers/${id}?tab=equipe`,
  planning: (id) => `/chantiers/planning?chantier=${id}`,
};

const ALERT_ROUTES: Record<string, (id: string) => string> = {
  marge_negative: (id) => `/chantiers/budget/${id}`,
  marge_en_baisse: (id) => `/chantiers/budget/${id}`,
  finance_incomplete: (id) => `/chantiers/${id}/edit`,
  retard_contractuel: (id) => `/chantiers/planning?chantier=${id}`,
};

export function isCockpitAppRoute(value: string | null | undefined): boolean {
  return !!value && value.startsWith('/');
}

export function resolvePreparationRoute(code: string, chantierId: string): string | null {
  const factory = PREP_ROUTES[code];
  return factory ? factory(encodeURIComponent(chantierId)) : null;
}

export function resolveAlertRoute(code: string, chantierId: string): string | null {
  const factory = ALERT_ROUTES[code];
  return factory ? factory(encodeURIComponent(chantierId)) : null;
}
