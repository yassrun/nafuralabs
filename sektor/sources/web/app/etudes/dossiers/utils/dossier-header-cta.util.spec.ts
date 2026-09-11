import { headerCtaSlot } from './dossier-header-cta.util';

describe('headerCtaSlot', () => {
  it('hides jump-to-step CTAs the wizard already covers', () => {
    expect(headerCtaSlot('CORRIGER_BORDEREAU')).toBe('hidden');
    expect(headerCtaSlot('CORRIGER_CHIFFRAGE')).toBe('hidden');
    expect(headerCtaSlot('VOIR_SYNTHESE')).toBe('hidden');
    expect(headerCtaSlot('SOUMETTRE_STRUCTURE')).toBe('hidden');
  });

  it('keeps status actions in the header', () => {
    expect(headerCtaSlot('DECIDER_GO')).toBe('primary');
    expect(headerCtaSlot('RENVOYER_AFFECTATION')).toBe('primary');
    expect(headerCtaSlot('SOUMETTRE_GO')).toBe('primary');
    expect(headerCtaSlot('ACCEPTER_AFFECTATION')).toBe('primary');
    expect(headerCtaSlot('SOUMETTRE_CHIFFRAGE')).toBe('primary');
    expect(headerCtaSlot('REPRENDRE_CHIFFRAGE')).toBe('primary');
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
