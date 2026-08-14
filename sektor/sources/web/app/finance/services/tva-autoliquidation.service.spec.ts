import { TestBed } from '@angular/core/testing';

import { FiscalSettingsService, FISCAL_SETTINGS_STORAGE_KEY } from '../../shell/fiscal-settings.service';

import { TvaAutoliquidationService } from './tva-autoliquidation.service';

describe('TvaAutoliquidationService', () => {
  let service: TvaAutoliquidationService;
  let fiscal: FiscalSettingsService;

  beforeEach(() => {
    try {
      localStorage.removeItem(FISCAL_SETTINGS_STORAGE_KEY);
    } catch {
      /* noop */
    }
    TestBed.configureTestingModule({});
    fiscal = TestBed.inject(FiscalSettingsService);
    service = TestBed.inject(TvaAutoliquidationService);
  });

  it('mode NORMAL si option autoliquidation désactivée', () => {
    fiscal.save({ ...fiscal.snapshot(), autoliquidationTvaActivee: false });
    const r = service.compute(100_000, 20, true);
    expect(r.mode).toBe('NORMAL');
    expect(r.netAPayerFournisseur).toBe(120_000);
    expect(r.tvaSurFacture).toBe(20_000);
    expect(r.tvaAutoliquidationDeclaree).toBe(0);
    expect(r.retenueTvaMontant).toBe(0);
  });

  it('mode NORMAL si prestataire résident (même si option activée)', () => {
    fiscal.save({ ...fiscal.snapshot(), autoliquidationTvaActivee: true });
    const r = service.compute(100_000, 20, false);
    expect(r.mode).toBe('NORMAL');
    expect(r.netAPayerFournisseur).toBe(120_000);
    expect(r.retenueTvaMontant).toBe(0);
  });

  it('mode AUTOLIQUIDATION si option active + non-résident', () => {
    fiscal.save({
      ...fiscal.snapshot(),
      autoliquidationTvaActivee: true,
      retenueTvaSurAutoliquidationTaux: 0,
    });
    const r = service.compute(100_000, 20, true);
    expect(r.mode).toBe('AUTOLIQUIDATION');
    expect(r.netAPayerFournisseur).toBe(100_000);
    expect(r.tvaSurFacture).toBe(0);
    expect(r.tvaAutoliquidationDeclaree).toBe(20_000);
    expect(r.retenueTvaMontant).toBe(0);
  });

  it('retenue TVA sur autoliquidation (pourcentage de la TVA déclarée)', () => {
    fiscal.save({
      ...fiscal.snapshot(),
      autoliquidationTvaActivee: true,
      retenueTvaSurAutoliquidationTaux: 50,
    });
    const r = service.compute(100_000, 20, true);
    expect(r.mode).toBe('AUTOLIQUIDATION');
    expect(r.tvaAutoliquidationDeclaree).toBe(20_000);
    expect(r.retenueTvaMontant).toBe(10_000);
    expect(r.netAPayerFournisseur).toBe(90_000);
  });

  it('forceTvaClassique impose le mode NORMAL', () => {
    fiscal.save({ ...fiscal.snapshot(), autoliquidationTvaActivee: true });
    const r = service.compute(100_000, 20, true, { forceTvaClassique: true });
    expect(r.mode).toBe('NORMAL');
    expect(r.netAPayerFournisseur).toBe(120_000);
  });

  it('auto-entrepreneur résident : autoliquidation si option active', () => {
    fiscal.save({
      ...fiscal.snapshot(),
      autoliquidationTvaActivee: true,
      retenueTvaSurAutoliquidationTaux: 0,
    });
    const r = service.compute(100_000, 20, false, { prestataireAutoEntrepreneur: true });
    expect(r.mode).toBe('AUTOLIQUIDATION');
    expect(r.netAPayerFournisseur).toBe(100_000);
  });
});
