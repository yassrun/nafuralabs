import {
  computeCoutRevient,
  computePrixVenteDepuisCout,
  deduceCoutDepuisPrixVente,
  ecartEstimationPercent,
  origineUi,
  prixVenteHtActif,
  puVenteSimple,
  resolveOrigineCout,
  resolvePosteChiffrageMode,
} from './poste-chiffrage-mode.util';

describe('poste-chiffrage-mode.util', () => {
  describe('resolveOrigineCout', () => {
    it('priorise origineCout', () => {
      expect(
        resolveOrigineCout({ origineCout: 'FORFAIT', mode: 'FOURNI', prixUnitaire: 1 }),
      ).toBe('FORFAIT');
    });

    it('mappe FOURNI legacy → ESTIME', () => {
      expect(resolveOrigineCout({ mode: 'FOURNI', prixUnitaire: 0 })).toBe('ESTIME');
    });

    it('infère ESTIME si prix > 0 sans origine', () => {
      expect(resolveOrigineCout({ mode: null, prixUnitaire: 10 })).toBe('ESTIME');
    });
  });

  describe('origineUi', () => {
    it('défaut DECOMPOSE', () => {
      expect(origineUi(null)).toBe('DECOMPOSE');
    });
  });

  describe('resolvePosteChiffrageMode (compat)', () => {
    it('FOURNI explicite → FOURNI', () => {
      expect(resolvePosteChiffrageMode({ mode: 'FOURNI', prixUnitaire: 0 })).toBe('FOURNI');
    });

    it('FORFAIT → FOURNI legacy', () => {
      expect(resolvePosteChiffrageMode({ origineCout: 'FORFAIT' })).toBe('FOURNI');
    });
  });

  describe('chaîne multiplicative', () => {
    it('46 → 49,68 → 53,16 (FG 8 %, marge 7 %)', () => {
      expect(computeCoutRevient(46, 8)).toBe(49.68);
      expect(computePrixVenteDepuisCout(46, 8, 7)).toBe(53.16);
    });

    it('déduit le coût depuis un prix de vente', () => {
      expect(deduceCoutDepuisPrixVente(1000, 8, 7)).toBe(865.33);
      expect(computePrixVenteDepuisCout(865.33, 8, 7)).toBe(1000);
    });
  });

  describe('ecartEstimationPercent', () => {
    it('calcule l’écart', () => {
      expect(ecartEstimationPercent(46, 44.2)).toBe(-3.91);
    });
  });

  describe('prixVenteHtActif', () => {
    it('priorise le coût/vente en ESTIME', () => {
      expect(
        prixVenteHtActif({
          origine: 'ESTIME',
          prixFourni: 1212,
          prixDecompose: 980,
          prixPoste: 1212,
        }),
      ).toBe(1212);
    });

    it('utilise le prix décomposé en DECOMPOSE', () => {
      expect(
        prixVenteHtActif({
          origine: 'DECOMPOSE',
          prixFourni: 1212,
          prixDecompose: 980,
          prixPoste: 1212,
        }),
      ).toBe(980);
    });
  });

  describe('puVenteSimple', () => {
    it('retourne null tant que rien n’est saisi', () => {
      expect(puVenteSimple({ cout: null, fgPercent: 10, margePercent: 17.5 })).toBeNull();
      expect(puVenteSimple({ cout: 0, fgPercent: 10, margePercent: 17.5 })).toBeNull();
    });

    it('priorise une vente saisie directement', () => {
      expect(
        puVenteSimple({ cout: 100, fgPercent: 10, margePercent: 10, venteDirecte: 250 }),
      ).toBe(250);
    });
  });
});
