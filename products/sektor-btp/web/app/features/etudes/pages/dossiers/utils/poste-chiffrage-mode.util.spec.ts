import { prixVenteHtActif, resolvePosteChiffrageMode } from './poste-chiffrage-mode.util';

describe('poste-chiffrage-mode.util', () => {
  describe('resolvePosteChiffrageMode', () => {
    it('respecte le mode FOURNI explicite même sans prix', () => {
      expect(resolvePosteChiffrageMode({ mode: 'FOURNI', prixUnitaire: 0 })).toBe('FOURNI');
    });

    it('respecte le mode DECOMPOSE même avec un prix unitaire', () => {
      expect(resolvePosteChiffrageMode({ mode: 'DECOMPOSE', prixUnitaire: 1200 })).toBe(
        'DECOMPOSE',
      );
    });

    it('infère FOURNI si prix > 0 sans mode', () => {
      expect(resolvePosteChiffrageMode({ mode: null, prixUnitaire: 10 })).toBe('FOURNI');
    });

    it('reste sans mode si aucun prix ni mode', () => {
      expect(resolvePosteChiffrageMode({ mode: null, prixUnitaire: 0 })).toBeNull();
      expect(resolvePosteChiffrageMode({})).toBeNull();
    });
  });

  describe('prixVenteHtActif', () => {
    it('priorise le prix fourni en mode FOURNI même si une décomposition existe', () => {
      expect(
        prixVenteHtActif({
          mode: 'FOURNI',
          prixFourni: 1212,
          prixDecompose: 980,
          prixPoste: 1212,
        }),
      ).toBe(1212);
    });

    it('utilise le prix décomposé en mode DECOMPOSE', () => {
      expect(
        prixVenteHtActif({
          mode: 'DECOMPOSE',
          prixFourni: 1212,
          prixDecompose: 980,
          prixPoste: 1212,
        }),
      ).toBe(980);
    });

    it('retombe sur le prix poste sans mode', () => {
      expect(
        prixVenteHtActif({
          mode: null,
          prixFourni: null,
          prixDecompose: 500,
          prixPoste: 42,
        }),
      ).toBe(42);
    });

    it('retourne 0 pour une décomposition vide', () => {
      expect(
        prixVenteHtActif({
          mode: 'DECOMPOSE',
          prixFourni: 100,
          prixDecompose: 0,
          prixPoste: 100,
        }),
      ).toBe(0);
    });
  });
});
