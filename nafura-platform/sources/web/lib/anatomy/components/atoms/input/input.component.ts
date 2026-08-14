import {
  ChangeDetectionStrategy,
  Component,
  Input,
  forwardRef,
  signal,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import {
  ControlValueAccessor,
  NG_VALUE_ACCESSOR,
  ReactiveFormsModule,
  FormsModule,
} from '@angular/forms';

let nextUniqueId = 0;

/**
 * NfInput Component
 * 
 * A reusable, accessible input wrapper component that implements ControlValueAccessor
 * for seamless integration with Angular reactive forms.
 * 
 * @example
 * ```html
 * <nf-input
 *   [(ngModel)]="value"
 *   label="Full Name"
 *   [required]="true"
 *   [error]="errorMessage"
 *   placeholder="Enter your name">
 * </nf-input>
 * ```
 */
@Component({
  selector: 'nf-input',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, FormsModule],
  templateUrl: './input.component.html',
  styleUrl: './input.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
  providers: [
    {
      provide: NG_VALUE_ACCESSOR,
      useExisting: forwardRef(() => NfInputComponent),
      multi: true,
    },
  ],
})
export class NfInputComponent implements ControlValueAccessor {
  /** Label text or translation key */
  @Input() label?: string;

  /** Placeholder text or translation key */
  @Input() placeholder?: string;

  /** Input type (text, email, password, tel, url, etc.) */
  @Input() type: string = 'text';

  /** Whether the field is required */
  @Input() required = false;

  /** Error message to display */
  @Input() error?: string | null;

  /** Whether the input is disabled */
  @Input() disabled = false;

  /** Additional CSS classes */
  @Input() class?: string;

  /** Autocomplete attribute */
  @Input() autocomplete?: string;

  /** Max length */
  @Input() maxlength?: number;

  /** Input ID (auto-generated if not provided) */
  @Input() id = `nf-input-${nextUniqueId++}`;

  // Internal state
  value = signal<string>('');
  focused = signal(false);
  touched = signal(false);

  // ControlValueAccessor callbacks
  private onChange: (value: string) => void = () => {};
  private onTouched: () => void = () => {};

  /**
   * Write value from form control
   */
  writeValue(value: string): void {
    this.value.set(value ?? '');
  }

  /**
   * Register change callback
   */
  registerOnChange(fn: (value: string) => void): void {
    this.onChange = fn;
  }

  /**
   * Register touched callback
   */
  registerOnTouched(fn: () => void): void {
    this.onTouched = fn;
  }

  /**
   * Set disabled state
   */
  setDisabledState(isDisabled: boolean): void {
    this.disabled = isDisabled;
  }

  /**
   * Handle input value change
   */
  onValueChange(event: Event): void {
    const inputElement = event.target as HTMLInputElement;
    const newValue = inputElement.value;
    this.value.set(newValue);
    this.onChange(newValue);
  }

  /**
   * Handle focus event
   */
  onFocus(): void {
    this.focused.set(true);
  }

  /**
   * Handle blur event
   */
  onBlur(): void {
    this.focused.set(false);
    this.touched.set(true);
    this.onTouched();
  }

  /**
   * Check if error should be shown
   */
  shouldShowError(): boolean {
    return !!(this.error && this.touched());
  }
}
