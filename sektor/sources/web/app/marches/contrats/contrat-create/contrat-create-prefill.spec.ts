import { ordreServicePrefill } from './contrat-create-prefill';

describe('ordreServicePrefill', () => {
  it('laisse le champ vide quand le chantier ne porte aucun ordre de service', () => {
    expect(ordreServicePrefill({ dateOrdreService: undefined })).toBe('');
  });

  it('conserve la date contractuelle enregistrée', () => {
    expect(ordreServicePrefill({ dateOrdreService: '2026-07-15' })).toBe('2026-07-15');
  });
});
