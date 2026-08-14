import {
  foldUnite,
  mapToReferentialCode,
  uniteOptionsForValue,
  type UniteOption,
} from './unite-options.util';

describe('unite-options.util', () => {
  const opts: UniteOption[] = [
    { code: 'M2', label: 'M2 — mètre carré' },
    { code: 'M3', label: 'M3' },
    { code: 'ML', label: 'ML' },
    { code: 'U', label: 'U' },
    { code: 'ENS', label: 'ENS' },
  ];

  it('foldUnite : ㎡ → M2 via NFKC', () => {
    expect(foldUnite('㎡')).toBe('M2');
    expect(foldUnite('m²')).toBe('M2');
    expect(foldUnite('ml')).toBe('ML');
  });

  it('mapToReferentialCode mappe les alias vers le code référentiel', () => {
    expect(mapToReferentialCode('㎡', opts)).toBe('M2');
    expect(mapToReferentialCode('ml', opts)).toBe('ML');
    expect(mapToReferentialCode('Ens', opts)).toBe('ENS');
    expect(mapToReferentialCode('E', opts)).toBe('ENS');
  });

  it('uniteOptionsForValue conserve la valeur hors référentiel', () => {
    const list = uniteOptionsForValue(opts, 'GL');
    expect(list[0].code).toBe('GL');
    expect(list[0].label).toContain('hors référentiel');
    expect(list.length).toBe(opts.length + 1);
  });

  it('uniteOptionsForValue ne duplique pas si déjà mappable', () => {
    expect(uniteOptionsForValue(opts, '㎡')).toEqual(opts);
  });
});
