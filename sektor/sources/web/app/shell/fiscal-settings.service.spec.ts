import { TestBed } from '@angular/core/testing';

import {
  DEFAULT_TVA_RATES_MA,
  FISCAL_SETTINGS_STORAGE_KEY,
  FiscalSettingsService,
} from './fiscal-settings.service';

/**
 * Unit tests — FiscalSettingsService.
 * Couvre principalement le catalogue paramétrable des taux TVA (M-MA-04)
 * et la résolution des taux applicables (exonération marché public, défaut).
 */
describe('FiscalSettingsService — catalogue TVA paramétrable (M-MA-04)', () => {
  let service: FiscalSettingsService;

  beforeEach(() => {
    localStorage.removeItem(FISCAL_SETTINGS_STORAGE_KEY);
    TestBed.configureTestingModule({});
    service = TestBed.inject(FiscalSettingsService);
  });

  it('initialise un catalogue MA par défaut (20/14/10/7/0)', () => {
    const rates = service.tvaRates();
    expect(rates.length).toBeGreaterThanOrEqual(5);
    expect(rates.map((r) => r.taux)).toEqual(jasmine.arrayContaining([20, 14, 10, 7, 0]));
    expect(service.defaultTvaRate()).toBe(20);
  });

  it('expose le taux par défaut via defaultTvaRate()', () => {
    const def = DEFAULT_TVA_RATES_MA.find((r) => r.isDefault);
    expect(def).toBeDefined();
    expect(service.defaultTvaRate()).toBe(def!.taux);
  });

  it('setTvaRates persiste et garantit un seul taux par défaut', () => {
    service.setTvaRates([
      { id: 'tva-20', taux: 20, libelle: 'Standard', description: '', isDefault: true },
      { id: 'tva-14', taux: 14, libelle: 'Réduit', description: '', isDefault: true },
      { id: 'tva-0',  taux: 0,  libelle: 'Exonéré', description: '', isDefault: true },
    ]);
    const persisted = service.tvaRates();
    const defaults = persisted.filter((r) => r.isDefault);
    expect(defaults.length).toBe(1);
    expect(defaults[0].id).toBe('tva-20');
  });

  it('findTvaRate retourne la fiche correspondante', () => {
    expect(service.findTvaRate('tva-14')?.taux).toBe(14);
    expect(service.findTvaRate('inexistant')).toBeUndefined();
  });

  it('resolveTaux — exonere prioritaire → 0', () => {
    expect(service.resolveTaux({ exonere: true, taux: 14 })).toBe(0);
  });

  it('resolveTaux — taux explicite respecté', () => {
    expect(service.resolveTaux({ taux: 10 })).toBe(10);
  });

  it('resolveTaux — sans paramètre → taux par défaut société', () => {
    expect(service.resolveTaux()).toBe(20);
  });

  it('migration douce : ancien snapshot sans tvaRates → catalogue MA seedé', () => {
    localStorage.setItem(
      FISCAL_SETTINGS_STORAGE_KEY,
      JSON.stringify({
        retenueSouceTaux: 5,
        retenueSouceSeuil: 0,
        timbreFiscalTaux: 0.25,
        timbreFiscalSeuil: 10000,
        timbreFiscalPlafond: 100,
        autoliquidationTvaActivee: false,
        exonerationLogementSocial: false,
        retenueTvaSurAutoliquidationTaux: 100,
      }),
    );
    const reloaded = TestBed.runInInjectionContext(() => new FiscalSettingsService());
    expect(reloaded.tvaRates().length).toBeGreaterThanOrEqual(5);
    expect(reloaded.defaultTvaRate()).toBe(20);
  });
});
