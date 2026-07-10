import { Component, forwardRef, input, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ControlValueAccessor, NG_VALUE_ACCESSOR, NG_VALIDATORS, Validator, AbstractControl, ValidationErrors } from '@angular/forms';

import { isValidIce, stripNonDigits as stripNonDigitsShared } from '@applications/erp/shared/validators';

function stripNonDigits(v: string): string { return stripNonDigitsShared(v); }

function formatIce(digits: string): string {
  if (digits.length <= 5) return digits;
  if (digits.length <= 10) return `${digits.slice(0, 5)} ${digits.slice(5)}`;
  return `${digits.slice(0, 5)} ${digits.slice(5, 10)} ${digits.slice(10, 15)}`;
}

/**
 * ICE Input — Identifiant Commun de l'Entreprise (Maroc, 15 chiffres).
 * Auto-formats as: `XXXXX XXXXX XXXXX`
 */
@Component({
  selector: 'nf-ice-input',
  standalone: true,
  imports: [CommonModule],
  providers: [
    { provide: NG_VALUE_ACCESSOR, useExisting: forwardRef(() => IceInputComponent), multi: true },
    { provide: NG_VALIDATORS, useExisting: forwardRef(() => IceInputComponent), multi: true },
  ],
  template: `
    <div class="nf-ice" [class.nf-ice--error]="hasError()">
      <input
        type="text"
        inputmode="numeric"
        maxlength="17"
        [placeholder]="placeholder()"
        [disabled]="disabled()"
        [value]="displayValue()"
        (input)="onInput($event)"
        (blur)="onTouched()"
        class="nf-ice__input"
        autocomplete="off" />
      @if (hasError()) {
        <span class="nf-ice__error">ICE invalide — 15 chiffres requis</span>
      }
    </div>
  `,
  styles: [`
    .nf-ice__input { width: 100%; padding: 8px 12px; border: 1px solid #cbd5e1; border-radius: 6px; font-size: 13px; font-family: monospace; letter-spacing: 0.05em; }
    .nf-ice--error .nf-ice__input { border-color: #dc2626; }
    .nf-ice__error { display: block; font-size: 11px; color: #dc2626; margin-top: 4px; }
  `],
})
export class IceInputComponent implements ControlValueAccessor, Validator {
  readonly placeholder = input('00000 00000 00000');

  readonly displayValue = signal('');
  readonly disabled = signal(false);
  private rawDigits = '';
  private touched = false;
  private onChange: (v: string) => void = () => {};
  onTouched: () => void = () => { this.touched = true; };

  readonly hasError = signal(false);

  onInput(e: Event): void {
    const raw = (e.target as HTMLInputElement).value;
    this.rawDigits = stripNonDigits(raw).slice(0, 15);
    this.displayValue.set(formatIce(this.rawDigits));
    (e.target as HTMLInputElement).value = formatIce(this.rawDigits);
    this.onChange(this.rawDigits);
    this.hasError.set(this.touched && this.rawDigits.length > 0 && this.rawDigits.length !== 15);
  }

  writeValue(v: string | null): void {
    this.rawDigits = stripNonDigits(v ?? '').slice(0, 15);
    this.displayValue.set(formatIce(this.rawDigits));
  }

  registerOnChange(fn: (v: string) => void): void { this.onChange = fn; }
  registerOnTouched(fn: () => void): void { this.onTouched = () => { this.touched = true; fn(); this.hasError.set(this.rawDigits.length > 0 && this.rawDigits.length !== 15); }; }
  setDisabledState(d: boolean): void { this.disabled.set(d); }

  validate(control: AbstractControl): ValidationErrors | null {
    const v = control.value as string | null;
    if (v == null || v === '') return null;
    return isValidIce(v)
      ? null
      : { ice: { message: 'ICE doit contenir exactement 15 chiffres', actual: stripNonDigits(v).length } };
  }
}
