import { headerCtaSlot } from './dossier-header-cta.util';

describe('headerCtaSlot', () => {
  it('hides jump-to-step CTAs the wizard already covers', () => {
    expect(headerCtaSlot('CORRIGER_BORDEREAU')).toBe('hidden');
    expect(headerCtaSlot('CORRIGER_CHIFFRAGE')).toBe('hidden');
  });

  it('keeps Voir la synthèse as a secondary jump', () => {
    expect(headerCtaSlot('VOIR_SYNTHESE')).toBe('jump');
  });

  it('keeps dossier-level decisions as primary', () => {
    expect(headerCtaSlot('VALIDER_N1')).toBe('primary');
    expect(headerCtaSlot('GENERER_DEVIS')).toBe('primary');
    expect(headerCtaSlot('MARQUER_GAGNE')).toBe('primary');
  });

  it('hides an empty action', () => {
    expect(headerCtaSlot(undefined)).toBe('hidden');
    expect(headerCtaSlot('')).toBe('hidden');
  });
});
