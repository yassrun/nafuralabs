export interface PortefeuilleUrlState {
  recherche: string;
  status: string;
  alerte: string;
  tri: string;
  sens: string;
  enRetard: boolean;
  margeNegative: boolean;
  page: number;
}

const DEFAULTS: PortefeuilleUrlState = {
  recherche: '', status: '', alerte: '', tri: 'code', sens: 'asc',
  enRetard: false, margeNegative: false, page: 0,
};

export function parsePortefeuilleState(params: URLSearchParams): PortefeuilleUrlState {
  const page = Number(params.get('page') ?? '0');
  return {
    recherche: params.get('recherche')?.trim() ?? '',
    status: params.get('status') ?? '',
    alerte: params.get('alerte') ?? '',
    tri: params.get('tri') ?? DEFAULTS.tri,
    sens: params.get('sens') === 'desc' ? 'desc' : DEFAULTS.sens,
    enRetard: params.get('enRetard') === 'true',
    margeNegative: params.get('margeNegative') === 'true',
    page: Number.isInteger(page) && page > 0 ? page : 0,
  };
}

export function buildPortefeuilleQueryParams(state: PortefeuilleUrlState): Record<string, string> {
  const params: Record<string, string> = {};
  const recherche = state.recherche.trim();
  if (recherche) params['recherche'] = recherche;
  if (state.status) params['status'] = state.status;
  if (state.alerte) params['alerte'] = state.alerte;
  if (state.tri !== DEFAULTS.tri) params['tri'] = state.tri;
  if (state.sens !== DEFAULTS.sens) params['sens'] = state.sens;
  if (state.enRetard) params['enRetard'] = 'true';
  if (state.margeNegative) params['margeNegative'] = 'true';
  if (state.page > 0) params['page'] = String(state.page);
  return params;
}

export function portefeuilleReturnUrl(state: PortefeuilleUrlState): string {
  const query = new URLSearchParams(buildPortefeuilleQueryParams(state)).toString();
  return `/chantiers${query ? `?${query}` : ''}`;
}

export function safePortefeuilleReturnUrl(candidate: string | null | undefined): string {
  return candidate?.startsWith('/chantiers?') || candidate === '/chantiers'
    ? candidate
    : '/chantiers';
}
