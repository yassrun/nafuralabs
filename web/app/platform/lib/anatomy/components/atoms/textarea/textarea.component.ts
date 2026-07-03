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
 * NfTextarea Component
 * 
 * A reusable, accessible textarea wrapper component that implements ControlValueAccessor
 * for seamless integration with Angular reactive forms.
 * 
 * @example
 * ```html
 * <nf-textarea
 *   [(ngModel)]="notes"
 *   label="Additional Notes"
 *   [rows]="4"
 *   [required]="true"
 *   placeholder="Enter any additional notes">
 * </nf-textarea>
 * ```
 */
@Component({
  selector: 'nf-textarea',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, FormsModule],
  templateUrl: './textarea.component.html',
  styleUrl: './textarea.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
  providers: [
    {
      provide: NG_VALUE_ACCESSOR,
      useExisting: forwardRef(() => NfTextareaComponent),
      multi: true,
    },
  ],
})
export class NfTextareaComponent implements ControlValueAccessor {
  /** Label text or translation key */
  @Input() label?: string;

  /** Placeholder text or translation key */
  @Input() placeholder?: string;

  /** Number of visible text rows */
  @Input() rows: number = 3;

  /** Whether the field is required */
  @Input() required = false;

  /** Error message to display */
  @Input() error?: string | null;

  /** Whether the textarea is disabled */
  @Input() disabled = false;

  /** Additional CSS classes */
  @Input() class?: string;

  /** Max length */
  @Input() maxlength?: number;

  /** Textarea ID (auto-generated if not provided) */
  @Input() id = `nf-textarea-${nextUniqueId++}`;

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
   * Handle textarea value change
   */
  onValueChange(event: Event): void {
    const textareaElement = event.target as HTMLTextAreaElement;
    const newValue = textareaElement.value;
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
