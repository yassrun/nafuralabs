import { Component, forwardRef, input, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ControlValueAccessor, NG_VALUE_ACCESSOR, NG_VALIDATORS, Validator, AbstractControl, ValidationErrors } from '@angular/forms';

import { isValidRib, stripNonDigits as stripNonDigitsShared } from '@applications/erp/shared/validators';

function stripNonDigits(v: string): string { return stripNonDigitsShared(v); }

function formatRib(digits: string): string {
  // Format: XXX XXX XXXXXXXXXXXXXXXXXX XX
  if (digits.length <= 3) return digits;
  if (digits.length <= 6) return `${digits.slice(0, 3)} ${digits.slice(3)}`;
  if (digits.length <= 24) return `${digits.slice(0, 3)} ${digits.slice(3, 6)} ${digits.slice(6, 22)} ${digits.slice(22)}`;
  return `${digits.slice(0, 3)} ${digits.slice(3, 6)} ${digits.slice(6, 22)} ${digits.slice(22, 24)}`;
}

/**
 * RIB Input — Relevé d'Identité Bancaire marocain (24 chiffres).
 * Format: `XXX XXX XXXXXXXXXXXXXXXX XX`
 */
@Component({
  selector: 'nf-rib-input',
  standalone: true,
  imports: [CommonModule],
  providers: [
    { provide: NG_VALUE_ACCESSOR, useExisting: forwardRef(() => RibInputComponent), multi: true },
    { provide: NG_VALIDATORS, useExisting: forwardRef(() => RibInputComponent), multi: true },
  ],
  template: `
    <div class="nf-rib" [class.nf-rib--error]="hasError()">
      <input
        type="text"
        inputmode="numeric"
        maxlength="28"
        [placeholder]="placeholder()"
        [disabled]="disabled()"
        [value]="displayValue()"
        (input)="onInput($event)"
        (blur)="onTouched()"
        class="nf-rib__input"
        autocomplete="off" />
      @if (hasError()) {
        <span class="nf-rib__error">{{ errorMessage() }}</span>
      }
    </div>
  `,
  styles: [`
    .nf-rib__input { width: 100%; padding: 8px 12px; border: 1px solid #cbd5e1; border-radius: 6px; font-size: 13px; font-family: monospace; letter-spacing: 0.04em; }
    .nf-rib--error .nf-rib__input { border-color: #dc2626; }
    .nf-rib__error { display: block; font-size: 11px; color: #dc2626; margin-top: 4px; }
  `],
})
export class RibInputComponent implements ControlValueAccessor, Validator {
  readonly placeholder = input('XXX XXX XXXXXXXXXXXXXXXX XX');
  /** Active le contrôle de clé RIB (mod 97). Par défaut désactivé pour préserver les seeds démo. */
  readonly strictKey = input(false);

  readonly displayValue = signal('');
  readonly disabled = signal(false);
  readonly errorMessage = signal('RIB invalide — 24 chiffres requis');
  private rawDigits = '';
  private touched = false;
  private onChange: (v: string) => void = () => {};
  onTouched: () => void = () => { this.touched = true; };

  readonly hasError = signal(false);

  onInput(e: Event): void {
    const raw = (e.target as HTMLInputElement).value;
    this.rawDigits = stripNonDigits(raw).slice(0, 24);
    const formatted = formatRib(this.rawDigits);
    this.displayValue.set(formatted);
    (e.target as HTMLInputElement).value = formatted;
    this.onChange(this.rawDigits);
    this.refreshErrorState();
  }

  writeValue(v: string | null): void {
    this.rawDigits = stripNonDigits(v ?? '').slice(0, 24);
    this.displayValue.set(formatRib(this.rawDigits));
  }

  registerOnChange(fn: (v: string) => void): void { this.onChange = fn; }
  registerOnTouched(fn: () => void): void {
    this.onTouched = () => {
      this.touched = true;
      fn();
      this.refreshErrorState(true);
    };
  }
  setDisabledState(d: boolean): void { this.disabled.set(d); }

  validate(control: AbstractControl): ValidationErrors | null {
    const v = control.value as string | null;
    if (v == null || v === '') return null;
    const digits = stripNonDigits(v);
    if (digits.length !== 24) {
      return { rib: { message: 'RIB doit contenir exactement 24 chiffres', actual: digits.length } };
    }
    if (this.strictKey() && !isValidRib(v, true)) {
      return { rib: { message: 'Clé RIB invalide — vérifiez le numéro saisi', actual: digits.slice(-2) } };
    }
    return null;
  }

  private refreshErrorState(force = false): void {
    if (!this.touched && !force) {
      this.hasError.set(false);
      return;
    }
    if (this.rawDigits.length === 0) {
      this.hasError.set(false);
      return;
    }
    if (this.rawDigits.length !== 24) {
      this.errorMessage.set('RIB invalide — 24 chiffres requis');
      this.hasError.set(true);
      return;
    }
    if (this.strictKey() && !isValidRib(this.rawDigits, true)) {
      this.errorMessage.set('Clé RIB invalide — vérifiez le numéro saisi');
      this.hasError.set(true);
      return;
    }
    this.hasError.set(false);
  }
}
