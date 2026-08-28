import { formatPercentDisplay } from './percent-display.util';

describe('formatPercentDisplay', () => {
  it('arrondit à une décimale en locale fr-FR', () => {
    expect(formatPercentDisplay(4.1846)).toBe('4,2 %');
  });

  it('affiche un entier sans décimale forcée', () => {
    expect(formatPercentDisplay(10)).toBe('10 %');
  });

  it('retourne — pour null / NaN', () => {
    expect(formatPercentDisplay(null)).toBe('—');
    expect(formatPercentDisplay(Number.NaN)).toBe('—');
  });
});
