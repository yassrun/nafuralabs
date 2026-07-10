import { Component, forwardRef, inject, input, LOCALE_ID, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ControlValueAccessor, NG_VALUE_ACCESSOR } from '@angular/forms';

function parseInput(s: string): number | null {
  // Replace French decimal separator and remove spaces
  const cleaned = s.replace(/\s/g, '').replace(',', '.');
  if (!cleaned) return null;
  const n = parseFloat(cleaned);
  return Number.isNaN(n) ? null : n;
}

/**
 * Money Input — MAD currency input with fr-MA formatting.
 * Stores a number, displays `1 234 567,89` with `MAD` suffix.
 */
@Component({
  selector: 'nf-money-input',
  standalone: true,
  imports: [CommonModule],
  providers: [
    { provide: NG_VALUE_ACCESSOR, useExisting: forwardRef(() => MoneyInputComponent), multi: true },
  ],
  template: `
    <div class="nf-money" [class.nf-money--disabled]="disabled()">
      <input
        type="text"
        inputmode="decimal"
        [placeholder]="placeholder()"
        [disabled]="disabled()"
        [value]="editValue()"
        (focus)="onFocus()"
        (blur)="onBlur($event)"
        (input)="onInput($event)"
        class="nf-money__input"
        autocomplete="off" />
      <span class="nf-money__suffix">{{ currency() }}</span>
    </div>
  `,
  styles: [`
    .nf-money { display: flex; align-items: center; border: 1px solid #cbd5e1; border-radius: 6px; overflow: hidden; }
    .nf-money--disabled { opacity: 0.6; }
    .nf-money__input { flex: 1; padding: 8px 10px; border: none; outline: none; font-size: 13px; font-variant-numeric: tabular-nums; min-width: 0; background: white; }
    .nf-money__suffix { padding: 0 10px; font-size: 12px; font-weight: 600; color: #64748b; white-space: nowrap; border-inline-start: 1px solid #e2e8f0; background: #f8fafc; }
  `],
})
export class MoneyInputComponent implements ControlValueAccessor {
  readonly placeholder = input('0');
  readonly currency = input('MAD');

  readonly editValue = signal('');
  readonly disabled = signal(false);
  private focused = false;
  private numValue: number | null = null;
  private onChange: (v: number | null) => void = () => {};
  onTouched: () => void = () => {};

  private readonly locale = inject(LOCALE_ID);
  private readonly fmt = new Intl.NumberFormat(this.locale, {
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  });

  private formatDisplay(n: number | null): string {
    if (n == null || Number.isNaN(n)) return '';
    return this.fmt.format(n);
  }

  onFocus(): void {
    this.focused = true;
    // On focus: show raw number for editing
    this.editValue.set(this.numValue != null ? String(this.numValue) : '');
  }

  onBlur(e: Event): void {
    this.focused = false;
    const raw = (e.target as HTMLInputElement).value;
    this.numValue = parseInput(raw);
    this.onChange(this.numValue);
    this.onTouched();
    this.editValue.set(this.formatDisplay(this.numValue));
  }

  onInput(e: Event): void {
    if (!this.focused) return;
    const raw = (e.target as HTMLInputElement).value;
    this.numValue = parseInput(raw);
    this.onChange(this.numValue);
  }

  writeValue(v: number | string | null): void {
    this.numValue = v != null ? (typeof v === 'string' ? parseFloat(v) : v) : null;
    if (Number.isNaN(this.numValue as number)) this.numValue = null;
    this.editValue.set(this.focused ? (this.numValue != null ? String(this.numValue) : '') : this.formatDisplay(this.numValue));
  }

  registerOnChange(fn: (v: number | null) => void): void { this.onChange = fn; }
  registerOnTouched(fn: () => void): void { this.onTouched = fn; }
  setDisabledState(d: boolean): void { this.disabled.set(d); }
}
