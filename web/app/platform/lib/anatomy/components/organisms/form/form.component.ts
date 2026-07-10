import { Component, input, output, signal, computed, OnInit, OnChanges, SimpleChanges, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule, FormGroup, FormControl, Validators } from '@angular/forms';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatRadioModule } from '@angular/material/radio';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatNativeDateModule } from '@angular/material/core';
import { MatAutocompleteModule } from '@angular/material/autocomplete';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { FormFieldConfig, LookupContext } from '../../../types';
import { ButtonComponent } from '../../atoms/button';
import { ActionBarComponent } from '../../molecules/action-bar';

/**
 * Form layout types.
 */
export type FormLayout = 'vertical' | 'horizontal' | 'grid';

/**
 * Form Component
 *
 * Dynamic form generator.
 *
 * @example
 * <nf-form
 *   [fields]="formFields"
 *   [values]="formValues"
 *   [layout]="'grid'"
 *   [columns]="2"
 *   [lookups]="lookups()"
 *   [loading]="isSaving()"
 *   (submit)="onSubmit($event)"
 *   (cancel)="onCancel()">
 * </nf-form>
 */
@Component({
  selector: 'nf-form',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    ReactiveFormsModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatCheckboxModule,
    MatRadioModule,
    MatDatepickerModule,
    MatNativeDateModule,
    MatAutocompleteModule,
    TranslateModule,
    ButtonComponent,
    ActionBarComponent,
  ],
  template: `
    <form
      [formGroup]="formGroup"
      [class]="formClasses()"
      (ngSubmit)="onSubmit()"
    >
      <div class="nf-form__fields" [style.grid-template-columns]="gridColumns()">
        @for (field of fields(); track field.key) {
          <div
            class="nf-form__field"
            [style.grid-column]="getFieldSpan(field)"
          >
            @switch (field.type) {
              @case ('textarea') {
                <mat-form-field appearance="outline" class="nf-form__mat-field">
                  <mat-label>{{ field.label | translate }}</mat-label>
                  <textarea
                    matInput
                    [formControlName]="field.key"
                    [placeholder]="(field.placeholder || '') | translate"
                    [readonly]="field.readonly"
                    rows="4"
                  ></textarea>
                  @if (field.helpText) {
                    <mat-hint>{{ field.helpText | translate }}</mat-hint>
                  }
                  <mat-error>{{ getErrorMessage(field) }}</mat-error>
                </mat-form-field>
              }
              @case ('select') {
                <mat-form-field appearance="outline" class="nf-form__mat-field">
                  <mat-label>{{ field.label | translate }}</mat-label>
                  <mat-select
                    [formControlName]="field.key"
                    [placeholder]="(field.placeholder || '') | translate"
                  >
                    @for (opt of getOptions(field); track opt.value) {
                      <mat-option [value]="opt.value">{{ opt.label | translate }}</mat-option>
                    }
                  </mat-select>
                  @if (field.helpText) {
                    <mat-hint>{{ field.helpText | translate }}</mat-hint>
                  }
                  <mat-error>{{ getErrorMessage(field) }}</mat-error>
                </mat-form-field>
              }
              @case ('multiselect') {
                <mat-form-field appearance="outline" class="nf-form__mat-field">
                  <mat-label>{{ field.label | translate }}</mat-label>
                  <mat-select
                    multiple
                    [formControlName]="field.key"
                    [placeholder]="(field.placeholder || '') | translate"
                  >
                    @for (opt of getOptions(field); track opt.value) {
                      <mat-option [value]="opt.value">{{ opt.label | translate }}</mat-option>
                    }
                  </mat-select>
                  @if (field.helpText) {
                    <mat-hint>{{ field.helpText | translate }}</mat-hint>
                  }
                  <mat-error>{{ getErrorMessage(field) }}</mat-error>
                </mat-form-field>
              }
              @case ('checkbox') {
                <div class="nf-form__checkbox-field">
                  <mat-checkbox [formControlName]="field.key">
                    {{ field.label | translate }}
                  </mat-checkbox>
                  @if (field.helpText) {
                    <span class="nf-form__help-text">{{ field.helpText | translate }}</span>
                  }
                </div>
              }
              @case ('radio') {
                <div class="nf-form__radio-field">
                  <label class="nf-form__radio-label">{{ field.label | translate }}</label>
                  <mat-radio-group [formControlName]="field.key">
                    @for (opt of getOptions(field); track opt.value) {
                      <mat-radio-button [value]="opt.value">{{ opt.label | translate }}</mat-radio-button>
                    }
                  </mat-radio-group>
                  @if (field.helpText) {
                    <span class="nf-form__help-text">{{ field.helpText | translate }}</span>
                  }
                </div>
              }
              @case ('date') {
                <mat-form-field appearance="outline" class="nf-form__mat-field">
                  <mat-label>{{ field.label | translate }}</mat-label>
                  <input
                    matInput
                    [matDatepicker]="picker"
                    [formControlName]="field.key"
                    [placeholder]="(field.placeholder || '') | translate"
                    [readonly]="field.readonly"
                  />
                  <mat-datepicker-toggle matIconSuffix [for]="picker"></mat-datepicker-toggle>
                  <mat-datepicker #picker></mat-datepicker>
                  @if (field.helpText) {
                    <mat-hint>{{ field.helpText | translate }}</mat-hint>
                  }
                  <mat-error>{{ getErrorMessage(field) }}</mat-error>
                </mat-form-field>
              }
              @case ('number') {
                <mat-form-field appearance="outline" class="nf-form__mat-field">
                  <mat-label>{{ field.label | translate }}</mat-label>
                  <input
                    matInput
                    type="number"
                    [formControlName]="field.key"
                    [placeholder]="(field.placeholder || '') | translate"
                    [readonly]="field.readonly"
                  />
                  @if (field.helpText) {
                    <mat-hint>{{ field.helpText | translate }}</mat-hint>
                  }
                  <mat-error>{{ getErrorMessage(field) }}</mat-error>
                </mat-form-field>
              }
              @default {
                <mat-form-field appearance="outline" class="nf-form__mat-field">
                  <mat-label>{{ field.label | translate }}</mat-label>
                  <input
                    matInput
                    [type]="field.type === 'password' ? 'password' : field.type === 'email' ? 'email' : 'text'"
                    [formControlName]="field.key"
                    [placeholder]="(field.placeholder || '') | translate"
                    [readonly]="field.readonly"
                  />
                  @if (field.helpText) {
                    <mat-hint>{{ field.helpText | translate }}</mat-hint>
                  }
                  <mat-error>{{ getErrorMessage(field) }}</mat-error>
                </mat-form-field>
              }
            }
          </div>
        }
      </div>

      <nf-action-bar align="right" class="nf-form__actions">
        <nf-button
          variant="secondary"
          [disabled]="loading()"
          (clicked)="onCancel()"
        >{{ 'Cancel' | translate }}</nf-button>
        <nf-button
          variant="primary"
          [loading]="loading()"
          [disabled]="!formGroup.valid || loading()"
          (clicked)="onSubmit()"
        >{{ 'Save' | translate }}</nf-button>
      </nf-action-bar>
    </form>
  `,
  styles: [`
    .nf-form {
      display: flex;
      flex-direction: column;
      gap: 24px;
    }

    .nf-form__fields {
      display: grid;
      gap: 16px;
    }

    .nf-form--vertical .nf-form__fields {
      grid-template-columns: 1fr;
    }

    .nf-form--horizontal .nf-form__fields {
      grid-template-columns: 1fr 1fr;
    }

    .nf-form__field {
      width: 100%;
    }

    .nf-form__mat-field {
      width: 100%;
    }

    .nf-form__checkbox-field,
    .nf-form__radio-field {
      display: flex;
      flex-direction: column;
      gap: 8px;
    }

    .nf-form__radio-label {
      font-size: 0.875rem;
      color: var(--nf-color-text-secondary, #666);
    }

    .nf-form__help-text {
      font-size: 0.75rem;
      color: var(--nf-color-text-secondary, #666);
    }

    .nf-form__actions {
      padding-top: 8px;
      border-top: 1px solid var(--nf-color-border, #e0e0e0);
    }

    mat-radio-group {
      display: flex;
      flex-direction: column;
      gap: 8px;
    }
  `],
})
export class FormComponent implements OnInit, OnChanges {
  private readonly translate = inject(TranslateService);

  // Inputs
  fields = input.required<FormFieldConfig[]>();
  values = input<Record<string, unknown>>({});
  layout = input<FormLayout>('vertical');
  columns = input<number>(1);
  loading = input<boolean>(false);
  disabled = input<boolean>(false);
  lookups = input<LookupContext>({});

  // Outputs
  valueChange = output<Record<string, unknown>>();
  submit = output<Record<string, unknown>>();
  cancel = output<void>();

  // Form group
  formGroup = new FormGroup({});

  // Computed
  formClasses = computed(() => {
    return `nf-form nf-form--${this.layout()}`;
  });

  gridColumns = computed(() => {
    const cols = this.columns();
    return `repeat(${cols}, 1fr)`;
  });

  ngOnInit(): void {
    this.buildForm();
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['fields'] || changes['values']) {
      this.buildForm();
    }
  }

  private buildForm(): void {
    const group: Record<string, FormControl> = {};

    for (const field of this.fields()) {
      const validators = [];

      if (field.required) {
        validators.push(Validators.required);
      }

      if (field.validation?.minLength) {
        validators.push(Validators.minLength(field.validation.minLength));
      }

      if (field.validation?.maxLength) {
        validators.push(Validators.maxLength(field.validation.maxLength));
      }

      if (field.validation?.min !== undefined) {
        validators.push(Validators.min(field.validation.min));
      }

      if (field.validation?.max !== undefined) {
        validators.push(Validators.max(field.validation.max));
      }

      if (field.validation?.pattern) {
        validators.push(Validators.pattern(field.validation.pattern));
      }

      if (field.type === 'email') {
        validators.push(Validators.email);
      }

      const value = this.values()[field.key] ?? field.defaultValue ?? null;
      group[field.key] = new FormControl(
        { value, disabled: field.disabled || this.disabled() },
        validators
      );
    }

    this.formGroup = new FormGroup(group);

    // Emit value changes
    this.formGroup.valueChanges.subscribe((values) => {
      this.valueChange.emit(values as Record<string, unknown>);
    });
  }

  getOptions(field: FormFieldConfig): Array<{ label: string; value: unknown }> {
    if (field.lookupKey) {
      const lookupItems = this.lookups()[field.lookupKey];
      if (lookupItems) {
        return lookupItems.map((item) => ({
          label: item.value,
          value: item.key,
        }));
      }
    }
    return field.options || [];
  }

  getFieldSpan(field: FormFieldConfig): string {
    if (field.colSpan && field.colSpan > 1) {
      return `span ${field.colSpan}`;
    }
    return 'auto';
  }

  getErrorMessage(field: FormFieldConfig): string {
    const control = this.formGroup.get(field.key);
    if (!control || !control.errors) return '';
    const label = this.translateLabel(field.label);

    if (control.errors['required']) {
      return this.t(
        '{{label}} is required',
        `${label} is required`,
        { label }
      );
    }
    if (control.errors['minlength']) {
      return this.t(
        '{{label}} must be at least {{count}} characters',
        `${label} must be at least ${control.errors['minlength'].requiredLength} characters`,
        { label, count: control.errors['minlength'].requiredLength }
      );
    }
    if (control.errors['maxlength']) {
      return this.t(
        '{{label}} must be at most {{count}} characters',
        `${label} must be at most ${control.errors['maxlength'].requiredLength} characters`,
        { label, count: control.errors['maxlength'].requiredLength }
      );
    }
    if (control.errors['min']) {
      return this.t(
        '{{label}} must be at least {{value}}',
        `${label} must be at least ${control.errors['min'].min}`,
        { label, value: control.errors['min'].min }
      );
    }
    if (control.errors['max']) {
      return this.t(
        '{{label}} must be at most {{value}}',
        `${label} must be at most ${control.errors['max'].max}`,
        { label, value: control.errors['max'].max }
      );
    }
    if (control.errors['email']) {
      return this.t(
        '{{label}} must be a valid email',
        `${label} must be a valid email`,
        { label }
      );
    }
    if (control.errors['pattern']) {
      return this.t(
        '{{label}} has an invalid format',
        `${label} has an invalid format`,
        { label }
      );
    }

    return this.t('Invalid value', 'Invalid value');
  }

  onSubmit(): void {
    if (this.formGroup.valid) {
      this.submit.emit(this.formGroup.getRawValue() as Record<string, unknown>);
    }
  }

  onCancel(): void {
    this.cancel.emit();
  }

  private translateLabel(value: string): string {
    const translated = this.translate.instant(value);
    return translated === value ? value : translated;
  }

  private t(key: string, fallback: string, params?: Record<string, unknown>): string {
    const translated = this.translate.instant(key, params);
    return translated === key ? fallback : translated;
  }
}
