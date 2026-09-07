import type { LookupItem } from '@platform/lib/anatomy/types';

import {
  partnerLookupLabel,
  partnerRaisonSociale,
  partnerRaisonSocialeFromLabel,
} from './erp-lookup-label';

function item(data: Record<string, unknown>, value = ''): LookupItem {
  return { key: 'id-1', value, data };
}

describe('partnerLookupLabel', () => {
  it('affiche la raison sociale, pas le code en premier', () => {
    expect(
      partnerLookupLabel(
        item({ id: 'id-1', code: 'FRN-0142', raisonSociale: 'Beton Atlas SARL' }),
      ),
    ).toBe('Beton Atlas SARL (FRN-0142)');
  });

  it('lit name si raisonSociale est absente', () => {
    expect(partnerLookupLabel(item({ code: 'FRN-0142', name: 'Beton Atlas SARL' }))).toBe(
      'Beton Atlas SARL (FRN-0142)',
    );
  });

  it('ne prend pas le code comme désignation', () => {
    expect(partnerRaisonSociale(item({ code: 'FRN-0142' }, 'FRN-0142'))).toBe('');
    expect(partnerLookupLabel(item({ code: 'FRN-0142' }, 'FRN-0142'))).toBe('FRN-0142');
  });

  it('déplie un value legacy CODE — nom', () => {
    expect(
      partnerLookupLabel(item({ code: 'FRN-0142' }, 'FRN-0142 — Beton Atlas SARL')),
    ).toBe('Beton Atlas SARL (FRN-0142)');
  });
});

describe('partnerRaisonSocialeFromLabel', () => {
  it('extrait le nom depuis CODE — nom et nom (CODE)', () => {
    expect(partnerRaisonSocialeFromLabel('FRN-0142 — Beton Atlas SARL')).toBe(
      'Beton Atlas SARL',
    );
    expect(partnerRaisonSocialeFromLabel('Beton Atlas SARL (FRN-0142)')).toBe(
      'Beton Atlas SARL',
    );
  });
});
