import {
  buildPortefeuilleQueryParams,
  parsePortefeuilleState,
  portefeuilleReturnUrl,
  safePortefeuilleReturnUrl,
} from './portefeuille-state';

describe('portefeuille URL state', () => {
  it('utilise de vrais query params lisibles et restaure toute la décision', () => {
    const state = {
      recherche: '  chantier casa  ',
      status: 'EN_COURS',
      alerte: 'WARNING',
      tri: 'echeance',
      sens: 'desc',
      enRetard: true,
      margeNegative: false,
      page: 2,
    } as const;

    const params = buildPortefeuilleQueryParams(state);

    expect(params).toEqual({
      recherche: 'chantier casa',
      status: 'EN_COURS',
      alerte: 'WARNING',
      tri: 'echeance',
      sens: 'desc',
      enRetard: 'true',
      page: '2',
    });
    expect(parsePortefeuilleState(new URLSearchParams(params))).toEqual({
      recherche: 'chantier casa',
      status: 'EN_COURS',
      alerte: 'WARNING',
      tri: 'echeance',
      sens: 'desc',
      enRetard: true,
      margeNegative: false,
      page: 2,
    });
  });

  it('construit un retour fiche fidèle sans paramètre etat encodé', () => {
    const url = portefeuilleReturnUrl({
      recherche: 'CASA', status: '', alerte: '', tri: 'code', sens: 'asc',
      enRetard: false, margeNegative: false, page: 0,
    });

    expect(url).toBe('/chantiers?recherche=CASA');
    expect(url).not.toContain('etat=');
  });

  it('restaure uniquement un retour interne vers le portefeuille', () => {
    expect(safePortefeuilleReturnUrl('/chantiers?status=EN_COURS&page=2'))
      .toBe('/chantiers?status=EN_COURS&page=2');
    expect(safePortefeuilleReturnUrl('https://evil.example')).toBe('/chantiers');
  });
});
