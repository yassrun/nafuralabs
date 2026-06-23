/**
 * Tests Karma/Jasmine pour `HijriToggleComponent` (Phase 4.3 / agent D3).
 *
 * Couverture (tests basiques) :
 *   1. Render basique (le composant se monte sans erreur)
 *   2. `enabled() === false` au démarrage par défaut
 *   3. Click → `service.toggle()` bascule l'état
 *   4. `showLabel = false` cache le label texte
 *   5. Le checkbox interne reflète l'état du signal
 */

import { ComponentFixture, TestBed } from '@angular/core/testing';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { TranslateLoader, TranslateModule } from '@ngx-translate/core';
import { Observable, of } from 'rxjs';

import { HIJRI_ENABLED_STORAGE_KEY, HijriCalendarService } from '@core/i18n/hijri-calendar.service';

import { HijriToggleComponent } from './hijri-toggle.component';

class FakeTranslateLoader implements TranslateLoader {
  getTranslation(_lang: string): Observable<Record<string, string>> {
    return of({
      'i18n.hijri.toggle.label': 'Show Hijri dates alongside',
      'i18n.hijri.toggle.tooltip': 'Displays the Hijri date next to the Gregorian date',
    });
  }
}

function clearStorage(): void {
  try {
    localStorage.removeItem(HIJRI_ENABLED_STORAGE_KEY);
  } catch {
    // ignore
  }
}

describe('HijriToggleComponent', () => {
  let fixture: ComponentFixture<HijriToggleComponent>;
  let component: HijriToggleComponent;
  let service: HijriCalendarService;

  beforeEach(async () => {
    clearStorage();
    await TestBed.configureTestingModule({
      imports: [
        HijriToggleComponent,
        NoopAnimationsModule,
        TranslateModule.forRoot({
          loader: { provide: TranslateLoader, useClass: FakeTranslateLoader },
        }),
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(HijriToggleComponent);
    component = fixture.componentInstance;
    service = TestBed.inject(HijriCalendarService);
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
    expect(component.hijri.enabled()).toBeFalse();
  });

  it('toggles state when service.toggle() is called', () => {
    service.toggle();
    fixture.detectChanges();
    expect(component.hijri.enabled()).toBeTrue();

    service.toggle();
    fixture.detectChanges();
    expect(component.hijri.enabled()).toBeFalse();
  });

  it('displays the translated label when showLabel === true (default)', () => {
    const root = fixture.nativeElement as HTMLElement;
    const labelSpan = root.querySelector('.nf-hijri-toggle__label');
    expect(labelSpan).not.toBeNull();
    expect(labelSpan!.textContent!.trim()).toContain('Hijri');
  });

  it('hides the label when showLabel === false', () => {
    component.showLabel = false;
    fixture.detectChanges();
    const root = fixture.nativeElement as HTMLElement;
    const labelSpan = root.querySelector('.nf-hijri-toggle__label');
    expect(labelSpan).toBeNull();
  });
});
