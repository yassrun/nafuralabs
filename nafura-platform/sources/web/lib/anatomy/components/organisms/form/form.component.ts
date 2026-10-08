import { Component, input, output, computed, OnInit, OnChanges, SimpleChanges, inject, effect, signal } from '@angular/core';
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
import { ComputedFieldFormat, FormFieldConfig, FormFieldType, LookupContext } from '../../../types';
import { ButtonComponent } from '../../atoms/button';
import { IceInputComponent } from '../../atoms/ice-input/ice-input.component';
import { MoneyInputComponent } from '../../atoms/money-input/money-input.component';
import { PhoneMaInputComponent } from '../../atoms/phone-ma-input/phone-ma-input.component';
import { RibInputComponent } from '../../atoms/rib-input/rib-input.component';
import { VilleMaSelectComponent } from '../../atoms/ville-ma-select/ville-ma-select.component';
import { ActionBarComponent } from '../../molecules/action-bar';
import { RichtextComponent } from './richtext.component';

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
    RichtextComponent,
    IceInputComponent,
    RibInputComponent,
    PhoneMaInputComponent,
    MoneyInputComponent,
    VilleMaSelectComponent,
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
            @switch (fieldType(field)) {
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
              @case ('richtext') {
                <nf-richtext
                  [label]="field.label"
                  [toolbar]="field.toolbar ?? 'basic'"
                  [readonly]="field.readonly ?? false"
                  [maxLength]="field.validation?.maxLength"
                  [formControlName]="field.key" />
              }
              @case ('money') {
                <div class="nf-form__atom-field">
                  <label class="nf-form__atom-label">{{ field.label | translate }}</label>
                  <nf-money-input
                    [formControlName]="field.key"
                    [placeholder]="(field.placeholder || '0') | translate"
                    [currency]="field.currency || 'MAD'" />
                  @if (field.helpText) {
                    <span class="nf-form__help-text">{{ field.helpText | translate }}</span>
                  }
                  @if (showAtomError(field)) {
                    <span class="nf-form__atom-error">{{ getErrorMessage(field) }}</span>
                  }
                </div>
              }
              @case ('ice') {
                <div class="nf-form__atom-field">
                  <label class="nf-form__atom-label">{{ field.label | translate }}</label>
                  <nf-ice-input
                    [formControlName]="field.key"
                    [placeholder]="(field.placeholder || '00000 00000 00000') | translate" />
                  @if (field.helpText) {
                    <span class="nf-form__help-text">{{ field.helpText | translate }}</span>
                  }
                  @if (showAtomError(field)) {
                    <span class="nf-form__atom-error">{{ getErrorMessage(field) }}</span>
                  }
                </div>
              }
              @case ('rib') {
                <div class="nf-form__atom-field">
                  <label class="nf-form__atom-label">{{ field.label | translate }}</label>
                  <nf-rib-input
                    [formControlName]="field.key"
                    [strictKey]="true"
                    [placeholder]="(field.placeholder || 'XXX XXX XXXXXXXXXXXXXXXX XX') | translate" />
                  @if (field.helpText) {
                    <span class="nf-form__help-text">{{ field.helpText | translate }}</span>
                  }
                  @if (showAtomError(field)) {
                    <span class="nf-form__atom-error">{{ getErrorMessage(field) }}</span>
                  }
                </div>
              }
              @case ('phone-ma') {
                <div class="nf-form__atom-field">
                  <label class="nf-form__atom-label">{{ field.label | translate }}</label>
                  <nf-phone-ma-input
                    [formControlName]="field.key"
                    [placeholder]="(field.placeholder || '+212 6 XX XX XX XX') | translate" />
                  @if (field.helpText) {
                    <span class="nf-form__help-text">{{ field.helpText | translate }}</span>
                  }
                  @if (showAtomError(field)) {
                    <span class="nf-form__atom-error">{{ getErrorMessage(field) }}</span>
                  }
                </div>
              }
              @case ('city-ma') {
                <div class="nf-form__atom-field">
                  <nf-ville-ma-select
                    [formControlName]="field.key"
                    [label]="field.label | translate"
                    [placeholder]="(field.placeholder || 'Sélectionner une ville') | translate"
                    [required]="!!field.required"
                    [error]="showAtomError(field) ? getErrorMessage(field) : null" />
                  @if (field.helpText) {
                    <span class="nf-form__help-text">{{ field.helpText | translate }}</span>
                  }
                </div>
              }
              @case ('computed') {
                <div class="nf-form__computed">
                  <span class="nf-form__atom-label">{{ field.label | translate }}</span>
                  <span class="nf-form__computed-value">{{ computedLabels()[field.key] }}</span>
                  @if (field.helpText) {
                    <span class="nf-form__help-text">{{ field.helpText | translate }}</span>
                  }
                </div>
              }
              @default {
                <mat-form-field appearance="outline" class="nf-form__mat-field">
                  <mat-label>{{ field.label | translate }}</mat-label>
                  <input
                    matInput
                    [type]="fieldType(field) === 'password' ? 'password' : fieldType(field) === 'email' ? 'email' : 'text'"
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

      @if (actions()) {
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
          >{{ (submitLabel() || 'Save') | translate }}</nf-button>
        </nf-action-bar>
      }
    </form>
  `,
  styles: [`
    :host {
      display: block;
      container-type: inline-size;
    }

    /* Narrow container: one column, every field full width. */
    @container (max-width: 640px) {
      .nf-form__fields {
        grid-template-columns: 1fr !important;
      }
      .nf-form__field {
        grid-column: auto !important;
      }
    }

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

    .nf-form__atom-field {
      display: flex;
      flex-direction: column;
      gap: 6px;
      width: 100%;
    }

    .nf-form__atom-label {
      font-size: 0.75rem;
      font-weight: 500;
      color: var(--nf-color-text-secondary, #64748b);
    }

    .nf-form__atom-error {
      font-size: 0.75rem;
      color: #dc2626;
    }

    .nf-form__computed {
      display: flex;
      flex-direction: column;
      gap: 4px;
      padding: 8px 0;
    }

    .nf-form__computed-value {
      font-size: 1rem;
      font-weight: 600;
      color: var(--nf-color-text, #0f172a);
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
  /**
   * Full draft of the host record (saved + edits). Used by `computed` fields so a value
   * can depend on siblings outside this form section.
   */
  record = input<Record<string, unknown>>({});
  layout = input<FormLayout>('vertical');
  columns = input<number>(1);
  loading = input<boolean>(false);
  disabled = input<boolean>(false);
  lookups = input<LookupContext>({});
  /** False when the host owns saving (e.g. a record page save bar). */
  actions = input(true);
  /** Primary button label. Defaults to Save. */
  submitLabel = input<string | undefined>(undefined);

  // Outputs
  valueChange = output<Record<string, unknown>>();
  submit = output<Record<string, unknown>>();
  cancel = output<void>();

  // Form group
  formGroup = new FormGroup({});
  /** Live form values for `computed` labels (updated on valueChanges). */
  private readonly formSnapshot = signal<Record<string, unknown>>({});

  // Computed
  formClasses = computed(() => {
    return `nf-form nf-form--${this.layout()}`;
  });

  gridColumns = computed(() => {
    const cols = this.columns();
    return `repeat(${cols}, 1fr)`;
  });

  /** Labels of `computed` fields; recomputed when the host record or form values change. */
  readonly computedLabels = computed((): Record<string, string> => {
    const draft = { ...this.record(), ...this.values(), ...this.formSnapshot() };
    const labels: Record<string, string> = {};
    for (const field of this.fields()) {
      if ((field.type ?? 'text') !== 'computed') continue;
      labels[field.key] = formatComputed(field.compute?.(draft), field.format, field.currency);
    }
    return labels;
  });

  constructor() {
    effect(() => {
      const fields = this.fields();
      const disabled = this.disabled();
      const values = this.values();
      if (!this.hasControlsFor(fields)) {
        this.buildForm();
        return;
      }
      this.syncMeta(fields, disabled, values);
    });
  }

  ngOnInit(): void {
    if (!this.hasControls()) {
      this.buildForm();
    }
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['fields'] || !this.hasControls()) {
      this.buildForm();
    } else if (changes['values'] || changes['disabled']) {
      this.resetForm();
    }
  }

  fieldType(field: FormFieldConfig): FormFieldType {
    return field.type ?? 'text';
  }

  showAtomError(field: FormFieldConfig): boolean {
    const control = this.formGroup.get(field.key);
    return !!control && control.invalid && (control.dirty || control.touched);
  }

  private editableFields(): FormFieldConfig[] {
    return this.fields().filter((field) => this.fieldType(field) !== 'computed');
  }

  private hasControls(): boolean {
    return this.hasControlsFor(this.fields());
  }

  private hasControlsFor(fields: FormFieldConfig[]): boolean {
    const editable = fields.filter((field) => (field.type ?? 'text') !== 'computed');
    return (
      editable.length === Object.keys(this.formGroup.controls).length &&
      editable.every((field) => this.formGroup.contains(field.key))
    );
  }

  private initialValue(field: FormFieldConfig): unknown {
    // A checkbox has two states: unchecked is false, never null.
    return this.values()[field.key] ?? field.defaultValue ?? (this.fieldType(field) === 'checkbox' ? false : null);
  }

  /** Same field keys: update values / disabled / required in place (keeps focus). */
  private syncMeta(fields: FormFieldConfig[], formDisabled: boolean, values: Record<string, unknown>): void {
    for (const field of fields) {
      if (this.fieldType(field) === 'computed') continue;
      const control = this.formGroup.get(field.key);
      if (!control) continue;
      const next = values[field.key] ?? field.defaultValue ?? (this.fieldType(field) === 'checkbox' ? false : null);
      if (!sameValue(control.value, next) && !control.dirty) {
        control.reset(next, { emitEvent: false });
      }
      control.setValidators(this.validatorsOf(field));
      control.updateValueAndValidity({ emitEvent: false });
      if (field.disabled || formDisabled) control.disable({ emitEvent: false });
      else control.enable({ emitEvent: false });
    }
  }

  /** New values or state on the same fields: update the controls in place (keeps focus and bindings). */
  private resetForm(): void {
    for (const field of this.editableFields()) {
      const control = this.formGroup.get(field.key)!;
      control.reset(this.initialValue(field), { emitEvent: false });
      if (field.disabled || this.disabled()) control.disable({ emitEvent: false });
      else control.enable({ emitEvent: false });
    }
  }

  private validatorsOf(field: FormFieldConfig) {
    const validators = [];
    if (field.required) validators.push(Validators.required);
    if (field.validation?.minLength) validators.push(Validators.minLength(field.validation.minLength));
    if (field.validation?.maxLength) validators.push(Validators.maxLength(field.validation.maxLength));
    if (field.validation?.min !== undefined) validators.push(Validators.min(field.validation.min));
    if (field.validation?.max !== undefined) validators.push(Validators.max(field.validation.max));
    if (field.validation?.pattern) validators.push(Validators.pattern(field.validation.pattern));
    if (this.fieldType(field) === 'email') validators.push(Validators.email);
    return validators;
  }

  private buildForm(): void {
    const group: Record<string, FormControl> = {};

    for (const field of this.fields()) {
      if (this.fieldType(field) === 'computed') continue;
      group[field.key] = new FormControl(
        { value: this.initialValue(field), disabled: field.disabled || this.disabled() },
        this.validatorsOf(field),
      );
    }

    this.formGroup = new FormGroup(group);
    this.formSnapshot.set(this.formGroup.getRawValue() as Record<string, unknown>);

    // Emit value changes
    this.formGroup.valueChanges.subscribe((values) => {
      this.formSnapshot.set(this.formGroup.getRawValue() as Record<string, unknown>);
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
    const errors = control.errors;

    if (errors['required']) {
      return this.t('form.errors.required', `${label} is required`, { label });
    }
    if (errors['minlength']) {
      return this.t('form.errors.minLength', `${label} must be at least ${errors['minlength'].requiredLength} characters`, {
        label,
        count: errors['minlength'].requiredLength,
      });
    }
    if (errors['maxlength']) {
      return this.t('form.errors.maxLength', `${label} must be at most ${errors['maxlength'].requiredLength} characters`, {
        label,
        count: errors['maxlength'].requiredLength,
      });
    }
    if (errors['min']) {
      return this.t('form.errors.min', `${label} must be at least ${errors['min'].min}`, {
        label,
        value: errors['min'].min,
      });
    }
    if (errors['max']) {
      return this.t('form.errors.max', `${label} must be at most ${errors['max'].max}`, {
        label,
        value: errors['max'].max,
      });
    }
    if (errors['email']) {
      return this.t('form.errors.email', `${label} must be a valid email`, { label });
    }
    if (errors['pattern']) {
      return this.t('form.errors.pattern', `${label} has an invalid format`, { label });
    }
    if (errors['ice']) {
      return this.t('form.errors.ice', `${label} : ICE invalide — 15 chiffres requis`, { label });
    }
    if (errors['rib']) {
      const message = typeof errors['rib']?.message === 'string' ? errors['rib'].message : null;
      return message ?? this.t('form.errors.rib', `${label} : RIB invalide — 24 chiffres et clé`, { label });
    }
    if (errors['phoneMa']) {
      return this.t('form.errors.phoneMa', `${label} : numéro marocain invalide`, { label });
    }

    return this.t('form.errors.invalid', 'Invalid value');
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

function sameValue(a: unknown, b: unknown): boolean {
  const empty = (value: unknown) => value === null || value === undefined || value === '';
  if (empty(a) && empty(b)) return true;
  return a === b;
}

function formatComputed(value: unknown, format: ComputedFieldFormat | undefined, currency?: string): string {
  if (value == null || value === '') return '—';
  switch (format) {
    case 'money': {
      const amount = Number(value);
      if (Number.isNaN(amount)) return String(value);
      return `${amount.toLocaleString('fr-MA', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} ${currency ?? 'MAD'}`;
    }
    case 'percent': {
      const ratio = Number(value);
      if (Number.isNaN(ratio)) return String(value);
      return `${(ratio * 100).toLocaleString('fr-MA', { maximumFractionDigits: 2 })} %`;
    }
    case 'number': {
      const amount = Number(value);
      if (Number.isNaN(amount)) return String(value);
      return amount.toLocaleString('fr-MA');
    }
    case 'date': {
      if (value instanceof Date) return value.toLocaleDateString('fr-MA');
      const parsed = new Date(String(value));
      return Number.isNaN(parsed.getTime()) ? String(value) : parsed.toLocaleDateString('fr-MA');
    }
    default:
      return String(value);
  }
}
