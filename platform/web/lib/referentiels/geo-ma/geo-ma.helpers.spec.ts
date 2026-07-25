import {
  findVilleByCode,
  findVilleByNom,
  normalizeGeoLabel,
  provinceOfVille,
  regionOfVille,
  regionSelectOptions,
  searchVilles,
  villeSelectOptions,
  villesByRegion,
} from './geo-ma.helpers';
import { PROVINCES_MA } from './provinces-ma';
import { REGIONS_MA } from './regions-ma';
import { VILLES_MA } from './villes-ma';

/**
 * Unit tests — Référentiel géographique MA.
 *
 * Couvre :
 *  - Normalisation accents / casse / apostrophes pour le rattachement legacy.
 *  - Unicité des codes et des noms canoniques.
 *  - Intégrité référentielle villes → provinces → régions.
 *  - Cohérence des chefs-lieux.
 *  - Résolution des valeurs présentes dans les seeds backend.
 */
describe('geo-ma — référentiel géographique MA', () => {
  describe('normalizeGeoLabel', () => {
    it('retire les accents et met en minuscules', () => {
      expect(normalizeGeoLabel('Béni Mellal')).toBe('beni mellal');
      expect(normalizeGeoLabel('Laâyoune')).toBe('laayoune');
      expect(normalizeGeoLabel('Kénitra')).toBe('kenitra');
    });

    it('neutralise apostrophes, tirets et espaces multiples', () => {
      expect(normalizeGeoLabel("M'diq")).toBe('mdiq');
      expect(normalizeGeoLabel('Tan-Tan')).toBe('tan tan');
      expect(normalizeGeoLabel('  Ksar   El Kébir ')).toBe('ksar el kebir');
    });
  });

  describe('findVilleByNom — rattachement legacy', () => {
    it('retrouve une ville par son nom canonique', () => {
      expect(findVilleByNom('Casablanca')?.code).toBe('casablanca');
    });

    it('est insensible à la casse et aux accents', () => {
      expect(findVilleByNom('beni mellal')?.nom).toBe('Béni Mellal');
      expect(findVilleByNom('TETOUAN')?.nom).toBe('Tétouan');
      expect(findVilleByNom('kenitra')?.nom).toBe('Kénitra');
      expect(findVilleByNom('Mdiq')?.nom).toBe("M'diq");
    });

    it('retourne undefined pour les valeurs vides ou inconnues', () => {
      expect(findVilleByNom('')).toBeUndefined();
      expect(findVilleByNom(null)).toBeUndefined();
      expect(findVilleByNom(undefined)).toBeUndefined();
      expect(findVilleByNom('Atlantis')).toBeUndefined();
    });
  });

  describe('unicité', () => {
    it('les codes de villes sont uniques', () => {
      const codes = VILLES_MA.map((v) => v.code);
      expect(new Set(codes).size).toBe(codes.length);
    });

    it('les noms canoniques normalisés de villes sont uniques', () => {
      const noms = VILLES_MA.map((v) => normalizeGeoLabel(v.nom));
      expect(new Set(noms).size).toBe(noms.length);
    });

    it('les codes de provinces et de régions sont uniques', () => {
      const provinces = PROVINCES_MA.map((p) => p.code);
      const regions = REGIONS_MA.map((r) => r.code);
      expect(new Set(provinces).size).toBe(provinces.length);
      expect(new Set(regions).size).toBe(regions.length);
    });
  });

  describe('intégrité référentielle', () => {
    it('contient 12 régions et 75 provinces / préfectures', () => {
      expect(REGIONS_MA.length).toBe(12);
      expect(PROVINCES_MA.length).toBe(75);
    });

    it('chaque province référence une région existante', () => {
      const regionCodes = new Set(REGIONS_MA.map((r) => r.code));
      for (const p of PROVINCES_MA) {
        expect(regionCodes.has(p.regionCode))
          .withContext(`province ${p.code} → région ${p.regionCode}`)
          .toBeTrue();
      }
    });

    it('chaque ville référence une province existante, dans la même région', () => {
      const provincesByCode = new Map(PROVINCES_MA.map((p) => [p.code, p]));
      for (const v of VILLES_MA) {
        const province = provincesByCode.get(v.provinceCode);
        expect(province)
          .withContext(`ville ${v.code} → province ${v.provinceCode}`)
          .toBeDefined();
        expect(province?.regionCode)
          .withContext(`ville ${v.code} : région incohérente avec sa province`)
          .toBe(v.regionCode);
      }
    });

    it('chaque région a exactement un chef-lieu, qui correspond à REGIONS_MA', () => {
      for (const r of REGIONS_MA) {
        const chefsLieux = VILLES_MA.filter(
          (v) => v.regionCode === r.code && v.chefLieuRegion,
        );
        expect(chefsLieux.length).withContext(`région ${r.code}`).toBe(1);
        expect(chefsLieux[0].nom).withContext(`région ${r.code}`).toBe(r.chefLieu);
      }
    });
  });

  describe('helpers de dérivation', () => {
    it('regionOfVille et provinceOfVille dérivent depuis un nom legacy', () => {
      expect(regionOfVille('casablanca')?.nom).toBe('Casablanca-Settat');
      expect(provinceOfVille('Ksar El Kébir')?.nom).toBe('Larache');
    });

    it('villesByRegion retourne les villes triées de la région', () => {
      const villes = villesByRegion('12');
      expect(villes.map((v) => v.nom)).toEqual(['Aousserd', 'Dakhla']);
    });

    it('searchVilles filtre sur le nom normalisé', () => {
      const results = searchVilles('kenit');
      expect(results.map((v) => v.nom)).toContain('Kénitra');
    });

    it('findVilleByCode retrouve une ville par slug', () => {
      expect(findVilleByCode('beni-mellal')?.nom).toBe('Béni Mellal');
    });
  });

  describe('options de select', () => {
    it('villeSelectOptions : valeur = nom canonique, libellé avec la région, tri alpha', () => {
      const options = villeSelectOptions();
      expect(options.length).toBe(VILLES_MA.length);
      const casa = options.find((o) => o.value === 'Casablanca');
      expect(casa?.label).toBe('Casablanca — Casablanca-Settat');
      const noms = options.map((o) => o.value);
      expect(noms).toEqual([...noms].sort((a, b) => a.localeCompare(b, 'fr')));
    });

    it('regionSelectOptions expose les 12 régions', () => {
      expect(regionSelectOptions().length).toBe(12);
    });
  });

  describe('couverture des seeds backend', () => {
    it('résout toutes les villes utilisées par les seeds démo', () => {
      const seedVilles = ['Casablanca', 'Marrakech', 'Mohammedia', 'Rabat', 'Salé', 'Tanger'];
      for (const nom of seedVilles) {
        expect(findVilleByNom(nom)).withContext(nom).toBeDefined();
      }
    });
  });
});
