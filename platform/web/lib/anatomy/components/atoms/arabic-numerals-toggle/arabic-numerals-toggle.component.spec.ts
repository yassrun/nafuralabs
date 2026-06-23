/**
 * Tests Karma/Jasmine pour `ArabicNumeralsToggleComponent` (R2-P2 sub-C).
 *
 * Couverture (tests basiques) :
 *   1. Render sans erreur (le composant se monte)
 *   2. Reflète `enabled() === false` au démarrage
 *   3. `service.toggle()` met à jour l'état + le DOM
 *   4. `showLabel = false` cache le label texte
 */

import { ComponentFixture, TestBed } from '@angular/core/testing';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { TranslateLoader, TranslateModule } from '@ngx-translate/core';
import { Observable, of } from 'rxjs';

import {
  ARABIC_NUMERALS_STORAGE_KEY,
  ArabicNumeralsService,
} from '@core/i18n/arabic-numerals.service';

import { ArabicNumeralsToggleComponent } from './arabic-numerals-toggle.component';

class FakeTranslateLoader implements TranslateLoader {
  getTranslation(_lang: string): Observable<Record<string, string>> {
    return of({
      'i18n.numerals.toggle.label': 'Arabic numerals',
      'i18n.numerals.toggle.tooltip':
        'Display digits using Arabic numerals (٠-٩) instead of Western digits (0-9)',
    });
  }
}

function clearStorage(): void {
  try {
    localStorage.removeItem(ARABIC_NUMERALS_STORAGE_KEY);
  } catch {
    // ignore
  }
}

describe('ArabicNumeralsToggleComponent', () => {
  let fixture: ComponentFixture<ArabicNumeralsToggleComponent>;
  let component: ArabicNumeralsToggleComponent;
  let service: ArabicNumeralsService;

  beforeEach(async () => {
    clearStorage();
    await TestBed.configureTestingModule({
      imports: [
        ArabicNumeralsToggleComponent,
        NoopAnimationsModule,
        TranslateModule.forRoot({
          loader: { provide: TranslateLoader, useClass: FakeTranslateLoader },
        }),
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(ArabicNumeralsToggleComponent);
    component = fixture.componentInstance;
    service = TestBed.inject(ArabicNumeralsService);
    fixture.detectChanges();
  });

  afterEach(() => {
    clearStorage();
    TestBed.resetTestingModule();
  });

  it('renders without errors', () => {
    expect(component).toBeTruthy();
    const root = fixture.nativeElement as HTMLElement;
    expect(root.querySelector('mat-slide-toggle')).not.toBeNull();
  });

  it('reflects enabled() === false by default', () => {
    expect(component.service.enabled()).toBeFalse();
  });

  it('toggles state when service.toggle() is called', () => {
    service.toggle();
    fixture.detectChanges();
    expect(component.service.enabled()).toBeTrue();

    service.toggle();
    fixture.detectChanges();
    expect(component.service.enabled()).toBeFalse();
  });

  it('hides the label when showLabel === false', () => {
    component.showLabel = false;
    fixture.detectChanges();
    const root = fixture.nativeElement as HTMLElement;
    const labelSpan = root.querySelector('.nf-arabic-numerals-toggle__label');
    expect(labelSpan).toBeNull();
  });
});
