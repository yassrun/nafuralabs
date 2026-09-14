import { applyModeleJRow, mapFormeJuridique } from './modele-j-import.handler';

describe('applyModeleJRow', () => {
  it('maps a modèle J row onto société identity', () => {
    const patch = applyModeleJRow({
      raisonSociale: 'Atlas Bâtiment SARL',
      formeJuridique: 'SARL à associé unique',
      ice: '001 234 567 0000 88',
      identifiantFiscal: '40123456',
      rc: 'Casa - 715869',
      adresse: 'Bd Zerktouni, Casablanca',
      ville: 'Casablanca',
      capitalSocial: '1 000 000',
      representantLegalNom: 'Nadia El Fassi',
      representantLegalQualite: 'Gérante',
    });

    expect(patch.societe.raisonSociale).toBe('Atlas Bâtiment SARL');
    expect(patch.societe.formeJuridique).toBe('SARLAU');
    expect(patch.societe.ice).toBe('001234567000088');
    expect(patch.societe.if).toBe('40123456');
    expect(patch.extras.capitalSocial).toBe(1000000);
    expect(patch.extras.villeSiegeAffichee).toBe('Casablanca');
  });

  it('ignores empty invented fields', () => {
    const patch = applyModeleJRow({ raisonSociale: 'Solo SA', ice: null });
    expect(patch.societe.ice).toBeUndefined();
    expect(mapFormeJuridique('SA')).toBe('SA');
  });
});
