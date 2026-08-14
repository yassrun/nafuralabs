import { Component, forwardRef, inject, input, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ControlValueAccessor, NG_VALUE_ACCESSOR, NG_VALIDATORS, Validator, AbstractControl, ValidationErrors } from '@angular/forms';
import { TranslateModule, TranslateService } from '@ngx-translate/core';

// Moroccan phone: +212 followed by 9 digits (mobile: 6/7, fixed: 5)
const MA_PHONE_RE = /^\+212[567]\d{8}$/;

function stripAndNormalize(v: string): string {
  let d = v.replace(/\D/g, '');
  if (d.startsWith('00212')) d = d.slice(5);
  else if (d.startsWith('212')) d = d.slice(3);
  else if (d.startsWith('0')) d = d.slice(1);
  return d.slice(0, 9);
}

function formatDisplay(digits: string): string {
  if (!digits) return '';
  if (digits.length <= 1) return `+212 ${digits}`;
  if (digits.length <= 3) return `+212 ${digits.slice(0, 1)} ${digits.slice(1)}`;
  if (digits.length <= 5) return `+212 ${digits.slice(0, 1)} ${digits.slice(1, 3)} ${digits.slice(3)}`;
  if (digits.length <= 7) return `+212 ${digits.slice(0, 1)} ${digits.slice(1, 3)} ${digits.slice(3, 5)} ${digits.slice(5)}`;
  return `+212 ${digits.slice(0, 1)} ${digits.slice(1, 3)} ${digits.slice(3, 5)} ${digits.slice(5, 7)} ${digits.slice(7, 9)}`;
}

function toE164(digits9: string): string {
  return digits9 ? `+212${digits9}` : '';
}

/**
 * Phone MA Input — numéro marocain au format `+212 6 XX XX XX XX`.
 * Stocke en E.164 (`+2126XXXXXXXX`), affiche formaté.
 */
@Component({
  selector: 'nf-phone-ma-input',
  standalone: true,
  imports: [CommonModule, TranslateModule],
  providers: [
    { provide: NG_VALUE_ACCESSOR, useExisting: forwardRef(() => PhoneMaInputComponent), multi: true },
    { provide: NG_VALIDATORS, useExisting: forwardRef(() => PhoneMaInputComponent), multi: true },
  ],
  template: `
    <div class="nf-phone" [class.nf-phone--error]="hasError()">
      <input
        type="tel"
        maxlength="22"
        [placeholder]="placeholder()"
        [disabled]="disabled()"
        [value]="displayValue()"
        (input)="onInput($event)"
        (blur)="onTouched()"
        class="nf-phone__input"
        autocomplete="tel" />
      @if (hasError()) {
        <span class="nf-phone__error">{{ 'shared.phoneMa.error' | translate }}</span>
      }
    </div>
  `,
  styles: [`
    .nf-phone__input { width: 100%; padding: 8px 12px; border: 1px solid #cbd5e1; border-radius: 6px; font-size: 13px; font-family: monospace; letter-spacing: 0.04em; }
    .nf-phone--error .nf-phone__input { border-color: #dc2626; }
    .nf-phone__error { display: block; font-size: 11px; color: #dc2626; margin-top: 4px; }
  `],
})
export class PhoneMaInputComponent implements ControlValueAccessor, Validator {
  private readonly translate = inject(TranslateService);

  readonly placeholder = input('+212 6 XX XX XX XX');

  readonly displayValue = signal('');
  readonly disabled = signal(false);
  private digits9 = '';
  private touched = false;
  private onChange: (v: string) => void = () => {};
  onTouched: () => void = () => { this.touched = true; };

  readonly hasError = signal(false);

  onInput(e: Event): void {
    const raw = (e.target as HTMLInputElement).value;
    this.digits9 = stripAndNormalize(raw);
    const formatted = formatDisplay(this.digits9);
    this.displayValue.set(formatted);
    (e.target as HTMLInputElement).value = formatted;
    const e164 = toE164(this.digits9);
    this.onChange(e164);
    this.hasError.set(this.touched && !!e164 && !MA_PHONE_RE.test(e164));
  }

  writeValue(v: string | null): void {
    if (!v) { this.digits9 = ''; this.displayValue.set(''); return; }
    this.digits9 = stripAndNormalize(v);
    this.displayValue.set(formatDisplay(this.digits9));
  }

  registerOnChange(fn: (v: string) => void): void { this.onChange = fn; }
  registerOnTouched(fn: () => void): void { this.onTouched = () => { this.touched = true; fn(); const e164 = toE164(this.digits9); this.hasError.set(!!e164 && !MA_PHONE_RE.test(e164)); }; }
  setDisabledState(d: boolean): void { this.disabled.set(d); }

  validate(control: AbstractControl): ValidationErrors | null {
    const v = control.value as string | null;
    if (!v) return null;
    return MA_PHONE_RE.test(v)
      ? null
      : { phoneMa: { message: this.translate.instant('shared.phoneMa.validatorMessage'), value: v } };
  }
}
