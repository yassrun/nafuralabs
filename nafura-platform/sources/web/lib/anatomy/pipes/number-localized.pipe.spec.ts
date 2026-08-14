import { ChangeDetectorRef } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { TranslateService } from '@ngx-translate/core';
import { Subject } from 'rxjs';

import { NumberLocalizedPipe } from './number-localized.pipe';

interface FakeTranslateService {
  currentLang: string | undefined;
  defaultLang: string | undefined;
  onLangChange: Subject<{ lang: string; translations: unknown }>;
}

function setupPipe(initialLang?: string): {
  pipe: NumberLocalizedPipe;
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
      NumberLocalizedPipe,
      { provide: TranslateService, useValue: translate },
      { provide: ChangeDetectorRef, useValue: cdr },
    ],
  });
  const pipe = TestBed.inject(NumberLocalizedPipe);
  return { pipe, translate, cdr };
}

describe('NumberLocalizedPipe', () => {
  afterEach(() => {
    TestBed.resetTestingModule();
  });

  it('uses the FR comma decimal separator when currentLang is "fr"', () => {
    const { pipe } = setupPipe('fr');
    const out = pipe.transform(1234.56, '1.2-2');
    expect(out).not.toBeNull();
    // FR formats use ',' for the decimal mark
    expect(out!).toMatch(/1.?234,56/);
  });

  it('uses the EN dot decimal separator + comma grouping when currentLang is "en"', () => {
    const { pipe } = setupPipe('en');
    const out = pipe.transform(1234.56, '1.2-2');
    expect(out).toBe('1,234.56');
  });

  it('formats with the ar-MA locale when currentLang is "ar"', () => {
    const { pipe } = setupPipe('ar');
    const out = pipe.transform(1234.56, '1.2-2');
    expect(out).not.toBeNull();
    expect(out!.length).toBeGreaterThan(0);
  });

  it('falls back to FR-MA when the language is unknown', () => {
    const { pipe } = setupPipe('xx');
    const out = pipe.transform(1234.56, '1.2-2');
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
    const frOut = pipe.transform(1234.56, '1.2-2');
    expect(frOut!).toMatch(/1.?234,56/);

    translate.currentLang = 'en';
    translate.onLangChange.next({ lang: 'en', translations: {} });
    expect(cdr.markForCheck).toHaveBeenCalled();

    const enOut = pipe.transform(1234.56, '1.2-2');
    expect(enOut).toBe('1,234.56');
  });
});
