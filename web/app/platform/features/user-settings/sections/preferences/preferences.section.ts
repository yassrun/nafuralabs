import { CommonModule } from '@angular/common';
import {
  Component,
  EventEmitter,
  Input,
  OnChanges,
  OnDestroy,
  Output,
  inject,
} from '@angular/core';
import { FormBuilder, ReactiveFormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatRadioModule } from '@angular/material/radio';
import { MatSelectModule } from '@angular/material/select';
import { TranslateModule } from '@ngx-translate/core';
import { Subject, takeUntil } from 'rxjs';

import type { UserPreferencesSettings } from '../../models';
import type { ThemeMode } from '@core/theme/theme-mode.service';
import { ThemeModeService } from '@core/theme/theme-mode.service';
import {
  DATE_FORMAT_OPTIONS,
  THEME_OPTIONS,
  formatDatePreview,
} from './preferences.config';

export interface LocaleOption {
  value: string;
  label: string;
}

export interface TimezoneOption {
  value: string;
  label: string;
}

/** Tenant-level defaults shown in hints when user has no override. Optional. */
export interface TenantDefaultsHint {
  locale?: string | null;
  timezone?: string | null;
  theme?: string | null;
  dateFormat?: string | null;
}

@Component({
  selector: 'app-user-preferences-section',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    TranslateModule,
    MatFormFieldModule,
    MatSelectModule,
    MatRadioModule,
    MatButtonModule,
  ],
  template: `
    <section class="settings-section">
      <h3>{{ 'userSettings.preferences.title' | translate }}</h3>

      <form [formGroup]="form" (ngSubmit)="submit()">
        <div class="grid">
          <mat-form-field appearance="outline">
            <mat-label>{{ 'userSettings.preferences.locale' | translate }}</mat-label>
            <mat-select formControlName="locale">
              <mat-option [value]="null">{{ tenantHint?.locale != null ? ('userSettings.preferences.defaultHint' | translate : { value: tenantHint!.locale }) : ('userSettings.preferences.defaultOption' | translate) }}</mat-option>
              @for (opt of localeOptions; track opt.value) {
                <mat-option [value]="opt.value">{{ opt.label }}</mat-option>
              }
            </mat-select>
          </mat-form-field>

          <mat-form-field appearance="outline">
            <mat-label>{{ 'userSettings.preferences.timezone' | translate }}</mat-label>
            <mat-select formControlName="timezone">
              <mat-option [value]="null">{{ tenantHint?.timezone != null ? ('userSettings.preferences.defaultHint' | translate : { value: tenantHint!.timezone }) : ('userSettings.preferences.defaultOption' | translate) }}</mat-option>
              @for (tz of timezoneOptions; track tz.value) {
                <mat-option [value]="tz.value">{{ tz.label }}</mat-option>
              }
            </mat-select>
          </mat-form-field>

          <mat-form-field appearance="outline">
            <mat-label>{{ 'userSettings.preferences.dateFormat' | translate }}</mat-label>
            <mat-select formControlName="dateFormat">
              <mat-option [value]="null">{{ tenantHint?.dateFormat != null ? ('userSettings.preferences.defaultHint' | translate : { value: tenantHint!.dateFormat }) : ('userSettings.preferences.defaultOption' | translate) }}</mat-option>
              @for (format of dateFormats; track format) {
                <mat-option [value]="format">{{ format }}</mat-option>
              }
            </mat-select>
            @if (datePreview; as preview) {
              <mat-hint>{{ 'userSettings.preferences.dateFormat.preview' | translate : { value: preview } }}</mat-hint>
            }
          </mat-form-field>
        </div>

        <div class="theme-group">
          <label>{{ 'userSettings.preferences.theme' | translate }}</label>
          <mat-radio-group formControlName="theme">
            <mat-radio-button [value]="null">
              {{ tenantHint?.theme != null ? ('userSettings.preferences.defaultHint' | translate : { value: tenantHint!.theme }) : ('userSettings.preferences.defaultOption' | translate) }}
            </mat-radio-button>
            @for (theme of themeOptions; track theme.value) {
              <mat-radio-button [value]="theme.value">
                {{ theme.labelKey | translate }}
              </mat-radio-button>
            }
          </mat-radio-group>
        </div>

        <div class="actions">
          <button
            mat-flat-button
            color="primary"
            type="submit"
            [disabled]="loading || saving || !form.dirty">
            {{ 'userSettings.preferences.save' | translate }}
          </button>
        </div>
      </form>
    </section>
  `,
  styles: [
    `
      .settings-section {
        border: 1px solid var(--nf-border-default);
        border-radius: 12px;
        padding: 1rem;
        background: var(--nf-surface-section);
      }

      .settings-section h3 {
        margin: 0 0 1rem;
      }

      .grid {
        display: grid;
        gap: 0.75rem;
        grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
      }

      .theme-group {
        margin-top: 0.75rem;
      }

      .theme-group label {
        display: block;
        margin-bottom: 0.4rem;
        font-weight: 500;
      }

      mat-radio-group {
        display: flex;
        flex-wrap: wrap;
        gap: 1rem;
      }

      .actions {
        margin-top: 0.75rem;
        display: flex;
        justify-content: flex-end;
      }
    `,
  ],
})
export class PreferencesSectionComponent implements OnChanges, OnDestroy {
  private readonly fb = inject(FormBuilder);
  private readonly themeMode = inject(ThemeModeService);
  private readonly destroy$ = new Subject<void>();

  @Input() data: UserPreferencesSettings | null = null;
  @Input() localeOptions: LocaleOption[] = [];
  @Input() timezoneOptions: TimezoneOption[] = [];
  /** Optional tenant defaults for "Defaults to organization setting ({value})" hint */
  @Input() tenantHint: TenantDefaultsHint | null = null;
  @Input() loading = false;
  @Input() saving = false;

  @Output() save = new EventEmitter<UserPreferencesSettings>();

  readonly themeOptions = [...THEME_OPTIONS];
  readonly dateFormats = [...DATE_FORMAT_OPTIONS];

  readonly form = this.fb.group({
    locale: this.fb.control<string | null>(null),
    timezone: this.fb.control<string | null>(null),
    theme: this.fb.control<ThemeMode | null>(null),
    dateFormat: this.fb.control<string | null>(null),
  });

  constructor() {
    this.form
      .get('theme')
      ?.valueChanges.pipe(takeUntil(this.destroy$))
      .subscribe((mode) => {
        this.themeMode.applyMode(mode ?? 'system');
      });
  }

  get datePreview(): string {
    const v = this.form.get('dateFormat')?.value;
    return formatDatePreview(typeof v === 'string' ? v : 'YYYY-MM-DD');
  }

  ngOnChanges(): void {
    if (!this.data) {
      return;
    }
    this.form.patchValue(
      {
        locale: this.data.locale ?? null,
        timezone: this.data.timezone ?? null,
        theme: this.data.theme ?? null,
        dateFormat: this.data.dateFormat ?? null,
      },
      { emitEvent: false }
    );
    this.form.markAsPristine();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  submit(): void {
    const value = this.form.getRawValue();
    this.save.emit({
      locale: value.locale ?? null,
      timezone: value.timezone ?? null,
      theme: value.theme ?? null,
      dateFormat: value.dateFormat ?? null,
    });
  }
}
