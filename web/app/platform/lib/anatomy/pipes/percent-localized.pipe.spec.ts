import { ChangeDetectorRef } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { TranslateService } from '@ngx-translate/core';
import { Subject } from 'rxjs';

import { PercentLocalizedPipe } from './percent-localized.pipe';

interface FakeTranslateService {
  currentLang: string | undefined;
  defaultLang: string | undefined;
  onLangChange: Subject<{ lang: string; translations: unknown }>;
}

function setupPipe(initialLang?: string): {
  pipe: PercentLocalizedPipe;
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
      PercentLocalizedPipe,
      { provide: TranslateService, useValue: translate },
      { provide: ChangeDetectorRef, useValue: cdr },
    ],
  });
  const pipe = TestBed.inject(PercentLocalizedPipe);
  return { pipe, translate, cdr };
}

describe('PercentLocalizedPipe', () => {
  afterEach(() => {
    TestBed.resetTestingModule();
  });

  it('uses FR comma decimal when currentLang is "fr"', () => {
    const { pipe } = setupPipe('fr');
    const out = pipe.transform(0.125, '1.1-1');
    expect(out).not.toBeNull();
    expect(out!).toContain('12,5');
    expect(out!).toContain('%');
  });

  it('uses EN dot decimal when currentLang is "en"', () => {
    const { pipe } = setupPipe('en');
    const out = pipe.transform(0.125, '1.1-1');
    expect(out).not.toBeNull();
    expect(out!).toContain('12.5');
    expect(out!).toContain('%');
  });

  it('formats with the ar-MA locale when currentLang is "ar"', () => {
    const { pipe } = setupPipe('ar');
    const out = pipe.transform(0.125, '1.1-1');
    expect(out).not.toBeNull();
    expect(out!.length).toBeGreaterThan(0);
  });

  it('falls back to FR-MA for unknown languages', () => {
    const { pipe } = setupPipe('zz');
    const out = pipe.transform(0.125, '1.1-1');
    expect(out).not.toBeNull();
    expect(out!).toContain('12,5');
  });

  it('returns null for null / undefined / empty string', () => {
    const { pipe } = setupPipe('fr');
    expect(pipe.transform(null)).toBeNull();
    expect(pipe.transform(undefined)).toBeNull();
    expect(pipe.transform('')).toBeNull();
  });

  it('reformats reactively when onLangChange fires (FR → EN)', () => {
    const { pipe, translate, cdr } = setupPipe('fr');
    const frOut = pipe.transform(0.125, '1.1-1');
    expect(frOut!).toContain('12,5');

    translate.currentLang = 'en';
    translate.onLangChange.next({ lang: 'en', translations: {} });
    expect(cdr.markForCheck).toHaveBeenCalled();

    const enOut = pipe.transform(0.125, '1.1-1');
    expect(enOut!).toContain('12.5');
  });
});
