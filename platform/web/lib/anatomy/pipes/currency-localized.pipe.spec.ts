import { ChangeDetectorRef } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { TranslateService } from '@ngx-translate/core';
import { Subject } from 'rxjs';

import { CurrencyLocalizedPipe } from './currency-localized.pipe';

interface FakeTranslateService {
  currentLang: string | undefined;
  defaultLang: string | undefined;
  onLangChange: Subject<{ lang: string; translations: unknown }>;
}

function setupPipe(initialLang?: string): {
  pipe: CurrencyLocalizedPipe;
  translate: FakeTranslateService;
  cdr: jasmine.SpyObj<ChangeDetectorRef>;
} {
  const translate: FakeTranslateService = {
    currentLang: initialLang,
    defaultLang: 'fr',
    onLangChange: new Subject(),
  };
  const cdr = jasmine.createSpyObj<ChangeDetectorRef>('ChangeDetectorRef', [
    'markForCheck',
    'detectChanges',
    'detach',
    'reattach',
    'checkNoChanges',
  ]);
  TestBed.configureTestingModule({
    providers: [
      CurrencyLocalizedPipe,
      { provide: TranslateService, useValue: translate },
      { provide: ChangeDetectorRef, useValue: cdr },
    ],
  });
  const pipe = TestBed.inject(CurrencyLocalizedPipe);
  return { pipe, translate, cdr };
}

describe('CurrencyLocalizedPipe', () => {
  afterEach(() => {
    TestBed.resetTestingModule();
  });

  it('formats MAD with FR comma decimal when currentLang is "fr"', () => {
    const { pipe } = setupPipe('fr');
    const out = pipe.transform(1234.56, 'MAD', 'code', '1.2-2');
    expect(out).not.toBeNull();
    expect(out!).toMatch(/1.?234,56/);
    expect(out!).toContain('MAD');
  });

  it('formats MAD with EN dot decimal + comma grouping when currentLang is "en"', () => {
    const { pipe } = setupPipe('en');
    const out = pipe.transform(1234.56, 'MAD', 'code', '1.2-2');
    expect(out).not.toBeNull();
    expect(out!).toContain('1,234.56');
    expect(out!).toContain('MAD');
  });

  it('formats MAD with the ar-MA locale when currentLang is "ar"', () => {
    const { pipe } = setupPipe('ar');
    const out = pipe.transform(1234.56, 'MAD', 'code', '1.2-2');
    expect(out).not.toBeNull();
    expect(out!.length).toBeGreaterThan(0);
  });

  it('defaults the currency code to MAD when none is provided', () => {
    const { pipe } = setupPipe('en');
    const out = pipe.transform(1234.56, undefined, 'code', '1.2-2');
    expect(out).not.toBeNull();
    expect(out!).toContain('MAD');
  });

  it('falls back to fr-MA for unknown languages', () => {
    const { pipe } = setupPipe('xx');
    const out = pipe.transform(1234.56, 'MAD', 'code', '1.2-2');
    expect(out).not.toBeNull();
    expect(out!).toMatch(/1.?234,56/);
  });

  it('returns null for null / undefined / empty string', () => {
    const { pipe } = setupPipe('fr');
    expect(pipe.transform(null)).toBeNull();
    expect(pipe.transform(undefined)).toBeNull();
    expect(pipe.transform('')).toBeNull();
  });

  it('reformats reactively when onLangChange fires (FR → EN)', () => {
    const { pipe, translate, cdr } = setupPipe('fr');
    const frOut = pipe.transform(1234.56, 'MAD', 'code', '1.2-2');
    expect(frOut!).toMatch(/1.?234,56/);

    translate.currentLang = 'en';
    translate.onLangChange.next({ lang: 'en', translations: {} });
    expect(cdr.markForCheck).toHaveBeenCalled();

    const enOut = pipe.transform(1234.56, 'MAD', 'code', '1.2-2');
    expect(enOut!).toContain('1,234.56');
  });
});
