/**
 * Tests Karma/Jasmine pour `ArabicNumeralsService` (Round 2 Phase 2 sub-C).
 *
 * Couverture :
 *   1. `enabled()` défaut `false` quand `localStorage` est vierge
 *   2. `enabled()` lit `localStorage` au boot ("true" → true)
 *   3. `toggle()` bascule l'état + persiste
 *   4. `setEnabled(boolean)` force l'état + persiste
 *   5. `formatNumeric()` OFF renvoie la chaîne inchangée (digits occidentaux)
 *   6. `formatNumeric()` ON convertit `0-9` → `٠-٩`
 *   7. `formatNumeric()` ON gère chaîne vide / pas de digits
 *   8. `formatNumeric()` ON est idempotent (chaîne déjà arabe inchangée)
 */

import { TestBed } from '@angular/core/testing';

import { ARABIC_NUMERALS_STORAGE_KEY, ArabicNumeralsService } from './arabic-numerals.service';

function clearStorage(): void {
  try {
    localStorage.removeItem(ARABIC_NUMERALS_STORAGE_KEY);
  } catch {
    // ignore in test environments without localStorage
  }
}

function setStorage(value: string): void {
  try {
    localStorage.setItem(ARABIC_NUMERALS_STORAGE_KEY, value);
  } catch {
    // ignore
  }
}

describe('ArabicNumeralsService', () => {
  beforeEach(() => {
    clearStorage();
    TestBed.resetTestingModule();
  });

  afterEach(() => {
    clearStorage();
  });

  it('defaults to disabled when localStorage is empty', () => {
    const service = TestBed.inject(ArabicNumeralsService);
    expect(service.enabled()).toBe(false);
  });

  it('reads stored "true" from localStorage at boot', () => {
    setStorage('true');
    const service = TestBed.inject(ArabicNumeralsService);
    expect(service.enabled()).toBe(true);
  });

  it('toggle() flips state and persists', () => {
    const service = TestBed.inject(ArabicNumeralsService);
    expect(service.enabled()).toBe(false);

    service.toggle();
    expect(service.enabled()).toBe(true);
    expect(localStorage.getItem(ARABIC_NUMERALS_STORAGE_KEY)).toBe('true');

    service.toggle();
    expect(service.enabled()).toBe(false);
    expect(localStorage.getItem(ARABIC_NUMERALS_STORAGE_KEY)).toBe('false');
  });

  it('setEnabled() forces state and persists', () => {
    const service = TestBed.inject(ArabicNumeralsService);
    service.setEnabled(true);
    expect(service.enabled()).toBe(true);
    expect(localStorage.getItem(ARABIC_NUMERALS_STORAGE_KEY)).toBe('true');

    service.setEnabled(false);
    expect(service.enabled()).toBe(false);
    expect(localStorage.getItem(ARABIC_NUMERALS_STORAGE_KEY)).toBe('false');
  });

  it('formatNumeric() returns input unchanged when disabled', () => {
    const service = TestBed.inject(ArabicNumeralsService);
    expect(service.enabled()).toBe(false);
    expect(service.formatNumeric('Total: 1234.56 MAD')).toBe('Total: 1234.56 MAD');
    expect(service.formatNumeric('0123456789')).toBe('0123456789');
  });

  it('formatNumeric() converts Western digits (0-9) to Arabic-Indic (٠-٩) when enabled', () => {
    const service = TestBed.inject(ArabicNumeralsService);
    service.setEnabled(true);
    expect(service.formatNumeric('0123456789')).toBe('٠١٢٣٤٥٦٧٨٩');
    expect(service.formatNumeric('Total: 1234.56 MAD')).toBe('Total: ١٢٣٤.٥٦ MAD');
    expect(service.formatNumeric('Page 1 / 10')).toBe('Page ١ / ١٠');
  });

  it('formatNumeric() handles empty string and digit-less input when enabled', () => {
    const service = TestBed.inject(ArabicNumeralsService);
    service.setEnabled(true);
    expect(service.formatNumeric('')).toBe('');
    expect(service.formatNumeric('Bonjour le monde')).toBe('Bonjour le monde');
  });

  it('formatNumeric() is idempotent on already-converted Arabic digits when enabled', () => {
    const service = TestBed.inject(ArabicNumeralsService);
    service.setEnabled(true);
    expect(service.formatNumeric('٠١٢٣٤٥٦٧٨٩')).toBe('٠١٢٣٤٥٦٧٨٩');
  });
});
