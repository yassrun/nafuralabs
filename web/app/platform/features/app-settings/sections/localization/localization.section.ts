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
import {
  AbstractControl,
  FormBuilder,
  FormGroup,
  ReactiveFormsModule,
  Validators,
} from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatSelectModule } from '@angular/material/select';
import { Subscription } from 'rxjs';
import { TranslateModule } from '@ngx-translate/core';

import type { AppLocalizationSettings } from '../../models';
import {
  DATE_FORMAT_OPTIONS,
  NUMBER_FORMAT_OPTIONS,
  LOCALE_OPTIONS,
  CURRENCY_OPTIONS,
  formatDatePreview,
  formatNumberPreview,
} from './localization.config';

function supportedLocalesIncludeDefault(group: AbstractControl): { supportedLocalesMustIncludeDefault: true } | null {
  const g = group as FormGroup;
  const defaultLocale = g.get('defaultLocale')?.value;
  const supported = g.get('supportedLocales')?.value as string[] | undefined;
  if (defaultLocale == null || !Array.isArray(supported)) return null;
  if (supported.includes(defaultLocale)) return null;
  return { supportedLocalesMustIncludeDefault: true };
}

@Component({
  selector: 'app-app-settings-localization-section',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    TranslateModule,
    MatFormFieldModule,
    MatSelectModule,
    MatButtonModule,
  ],
  template: `
    <section class="settings-section">
      <h3>{{ 'appSettings.localization.title' | translate }}</h3>
      <form [formGroup]="form" (ngSubmit)="submit()">
        <div class="grid">
          <mat-form-field appearance="outline">
            <mat-label>{{ 'appSettings.localization.defaultLocale' | translate }}</mat-label>
            <mat-select formControlName="defaultLocale">
              @for (opt of localeOptions; track opt.value) {
                <mat-option [value]="opt.value">{{ opt.label }}</mat-option>
              }
            </mat-select>
          </mat-form-field>

          <mat-form-field appearance="outline">
            <mat-label>{{ 'appSettings.localization.supportedLocales' | translate }}</mat-label>
            <mat-select formControlName="supportedLocales" multiple>
              @for (opt of localeOptions; track opt.value) {
                <mat-option [value]="opt.value">{{ opt.label }}</mat-option>
              }
            </mat-select>
            @if (form.get('supportedLocales')?.errors?.['supportedLocalesMustIncludeDefault']) {
              <mat-error>{{ 'appSettings.localization.supportedLocalesMustIncludeDefault' | translate }}</mat-error>
            }
          </mat-form-field>

          <mat-form-field appearance="outline">
            <mat-label>{{ 'appSettings.localization.defaultCurrency' | translate }}</mat-label>
            <mat-select formControlName="defaultCurrency">
              @for (opt of currencyOptions; track opt.value) {
                <mat-option [value]="opt.value">{{ opt.label }}</mat-option>
              }
            </mat-select>
          </mat-form-field>

          <mat-form-field appearance="outline">
            <mat-label>{{ 'appSettings.localization.dateFormat' | translate }}</mat-label>
            <mat-select formControlName="dateFormat">
              @for (format of dateFormats; track format) {
                <mat-option [value]="format">{{ format }}</mat-option>
              }
            </mat-select>
            @if (datePreview; as preview) {
              <mat-hint>{{ 'appSettings.localization.dateFormat.preview' | translate : { value: preview } }}</mat-hint>
            }
          </mat-form-field>

          <mat-form-field appearance="outline">
            <mat-label>{{ 'appSettings.localization.numberFormat' | translate }}</mat-label>
            <mat-select formControlName="numberFormat">
              @for (format of numberFormats; track format) {
                <mat-option [value]="format">{{ format }}</mat-option>
              }
            </mat-select>
            @if (numberPreview; as preview) {
              <mat-hint>{{ 'appSettings.localization.numberFormat.preview' | translate : { value: preview } }}</mat-hint>
            }
          </mat-form-field>
        </div>

        <div class="actions">
          <button
            mat-flat-button
            color="primary"
            type="submit"
            [disabled]="loading || saving || form.invalid || !form.dirty">
            {{ 'appSettings.localization.save' | translate }}
          </button>
        </div>
      </form>
    </section>
  `,
  styles: [
    `
      .settings-section {
        border: 1px solid #dbe3ee;
        border-radius: 12px;
        padding: 1rem;
        background: #ffffff;
      }

      .settings-section h3 {
        margin: 0 0 1rem;
      }

      .grid {
        display: grid;
        gap: 0.75rem;
        grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
      }

      .actions {
        margin-top: 0.75rem;
        display: flex;
        justify-content: flex-end;
      }
    `,
  ],
})
export class LocalizationSectionComponent implements OnChanges, OnDestroy {
  private readonly fb = inject(FormBuilder);
  private defaultLocaleSub?: Subscription;

  @Input() data: AppLocalizationSettings | null = null;
  @Input() loading = false;
  @Input() saving = false;
  /** Options from parent (I18N_CONFIG); use LOCALE_OPTIONS labels in template */
  @Input() localeOptions: { value: string; label: string }[] = LOCALE_OPTIONS;
  @Input() currencyOptions: { value: string; label: string }[] = CURRENCY_OPTIONS;

  @Output() save = new EventEmitter<AppLocalizationSettings>();

  readonly dateFormats = [...DATE_FORMAT_OPTIONS];
  readonly numberFormats = [...NUMBER_FORMAT_OPTIONS];

  readonly form = this.fb.group(
    {
      defaultLocale: this.fb.nonNullable.control('en', Validators.required),
      supportedLocales: this.fb.nonNullable.control<string[]>([], [
        Validators.required,
        Validators.minLength(1),
      ]),
      defaultCurrency: this.fb.nonNullable.control('USD', Validators.required),
      dateFormat: this.fb.nonNullable.control('YYYY-MM-DD', Validators.required),
      numberFormat: this.fb.nonNullable.control('#,##0.00', Validators.required),
    },
    { validators: supportedLocalesIncludeDefault }
  );

  constructor() {
    this.defaultLocaleSub = this.form.get('defaultLocale')?.valueChanges.subscribe((defaultLocale) => {
      if (defaultLocale == null) return;
      const supported = this.form.get('supportedLocales')?.value ?? [];
      if (supported.includes(defaultLocale)) return;
      this.form.patchValue(
        { supportedLocales: [...supported, defaultLocale] },
        { emitEvent: false }
      );
    });
  }

  get datePreview(): string {
    const v = this.form.get('dateFormat')?.value;
    return formatDatePreview(typeof v === 'string' ? v : 'YYYY-MM-DD');
  }

  get numberPreview(): string {
    const v = this.form.get('numberFormat')?.value;
    return formatNumberPreview(typeof v === 'string' ? v : '#,##0.00');
  }

  ngOnDestroy(): void {
    this.defaultLocaleSub?.unsubscribe();
  }

  ngOnChanges(): void {
    if (!this.data) {
      return;
    }
    this.form.patchValue(
      {
        defaultLocale: this.data.defaultLocale ?? 'en',
        supportedLocales: this.data.supportedLocales ?? [],
        defaultCurrency: this.data.defaultCurrency ?? 'USD',
        dateFormat: this.data.dateFormat ?? 'YYYY-MM-DD',
        numberFormat: this.data.numberFormat ?? '#,##0.00',
      },
      { emitEvent: false }
    );
    this.form.markAsPristine();
  }

  submit(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }
    const value = this.form.getRawValue();
    this.save.emit({
      defaultLocale: value.defaultLocale,
      supportedLocales: value.supportedLocales,
      defaultCurrency: value.defaultCurrency,
      dateFormat: value.dateFormat,
      numberFormat: value.numberFormat,
    });
  }
}
