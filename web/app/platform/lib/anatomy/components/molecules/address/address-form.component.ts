import {
  ChangeDetectionStrategy,
  Component,
  EventEmitter,
  Input,
  OnDestroy,
  OnInit,
  Output,
  signal,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import {
  FormBuilder,
  FormControl,
  FormGroup,
  ReactiveFormsModule,
  Validators,
} from '@angular/forms';
import { debounceTime, distinctUntilChanged, Subject, takeUntil } from 'rxjs';
import {
  DEFAULT_COUNTRY_OPTIONS,
  NfAddress,
  NfAddressMode,
  NfAddressRequiredConfig,
  NfCountryOption,
} from './address.model';
import { NfInputComponent } from '../../atoms/input';
import { NfSelectComponent, NfSelectOption } from '../../atoms/select';
import { NfTextareaComponent } from '../../atoms/textarea';

interface AddressFormControls {
  line1: string;
  line2: string;
  city: string;
  postalCode: string;
  region: string;
  countryCode: string;
  notes: string;
}

/**
 * Address Form Component
 * 
 * A reusable, domain-agnostic form component for capturing address data.
 * Supports compact and full layout modes, configurable required fields,
 * and emits typed address values with validation state.
 * 
 * @example
 * ```html
 * <nf-address-form
 *   [value]="supplier.billingAddress"
 *   [mode]="'full'"
 *   [required]="{ line1: true, city: true, countryCode: true }"
 *   [showNotes]="true"
 *   (valueChange)="onAddressChange($event)"
 *   (validityChange)="onValidityChange($event)">
 * </nf-address-form>
 * ```
 */
@Component({
  selector: 'nf-address-form',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, NfInputComponent, NfSelectComponent, NfTextareaComponent],
  templateUrl: './address-form.component.html',
  styleUrl: './address-form.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class NfAddressFormComponent implements OnInit, OnDestroy {
  private destroy$ = new Subject<void>();
  private fb = new FormBuilder();

  /** Current address value */
  @Input() set value(val: NfAddress | null | undefined) {
    if (val) {
      this.writeValue(val);
    } else {
      this.addressForm.reset({
        line1: '',
        line2: '',
        city: '',
        postalCode: '',
        region: '',
        countryCode: '',
        notes: '',
      });
    }
  }

  /** Display mode: 'compact' or 'full' */
  @Input() mode: NfAddressMode = 'full';

  /** Configuration for required fields */
  @Input() set required(config: NfAddressRequiredConfig | undefined) {
    this.requiredConfig.set(config || {});
    this.updateValidators();
  }

  /** Disabled state */
  @Input() set disabled(val: boolean | undefined) {
    this.setDisabledState(val ?? false);
  }

  /** Available country options */
  @Input() countryOptions: NfCountryOption[] = DEFAULT_COUNTRY_OPTIONS;

  /** Whether to show notes field (only in full mode) */
  @Input() showNotes = false;

  /** Emits validated address or null if invalid */
  @Output() valueChange = new EventEmitter<NfAddress | null>();

  /** Emits form validity state */
  @Output() validityChange = new EventEmitter<boolean>();

  // Signals for reactive state
  requiredConfig = signal<NfAddressRequiredConfig>({});
  isCompactMode = signal(false);

  addressForm!: FormGroup<{
    line1: FormControl<string>;
    line2: FormControl<string>;
    city: FormControl<string>;
    postalCode: FormControl<string>;
    region: FormControl<string>;
    countryCode: FormControl<string>;
    notes: FormControl<string>;
  }>;

  constructor() {
    this.initializeForm();
  }

  ngOnInit(): void {
    this.isCompactMode.set(this.mode === 'compact');
    this.updateValidators();
    this.setupValueChanges();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  /**
   * Initialize the reactive form group with default validators
   */
  private initializeForm(): void {
    this.addressForm = this.fb.group({
      line1: this.fb.control('', [Validators.maxLength(120)]),
      line2: this.fb.control('', [Validators.maxLength(120)]),
      city: this.fb.control('', [Validators.maxLength(60)]),
      postalCode: this.fb.control('', [Validators.maxLength(16)]),
      region: this.fb.control('', [Validators.maxLength(60)]),
      countryCode: this.fb.control('', [Validators.required]),
      notes: this.fb.control('', [Validators.maxLength(200)]),
    }) as FormGroup<{
      line1: FormControl<string>;
      line2: FormControl<string>;
      city: FormControl<string>;
      postalCode: FormControl<string>;
      region: FormControl<string>;
      countryCode: FormControl<string>;
      notes: FormControl<string>;
    }>;
  }

  /**
   * Update validators based on required configuration
   */
  private updateValidators(): void {
    if (!this.addressForm) return;

    const config = this.requiredConfig();
    const fields: (keyof AddressFormControls)[] = [
      'line1',
      'line2',
      'city',
      'postalCode',
      'region',
      'notes',
    ];

    fields.forEach((field) => {
      const control = this.addressForm.get(field);
      if (!control) return;

      const validators = [];

      // Add required validator if configured
      if (config[field]) {
        validators.push(Validators.required);
      }

      // Add maxLength validators
      switch (field) {
        case 'line1':
        case 'line2':
          validators.push(Validators.maxLength(120));
          break;
        case 'city':
        case 'region':
          validators.push(Validators.maxLength(60));
          break;
        case 'postalCode':
          validators.push(Validators.maxLength(16));
          break;
        case 'notes':
          validators.push(Validators.maxLength(200));
          break;
      }

      control.setValidators(validators.length > 0 ? validators : null);
      control.updateValueAndValidity({ emitEvent: false });
    });

    // CountryCode is always required
    const countryControl = this.addressForm.get('countryCode');
    if (countryControl) {
      countryControl.setValidators([Validators.required]);
      countryControl.updateValueAndValidity({ emitEvent: false });
    }
  }

  /**
   * Setup form value change subscriptions
   */
  private setupValueChanges(): void {
    // Emit validity changes immediately
    this.addressForm.statusChanges
      .pipe(takeUntil(this.destroy$), distinctUntilChanged())
      .subscribe(() => {
        this.validityChange.emit(this.addressForm.valid);
      });

    // Emit value changes debounced, only when valid
    this.addressForm.valueChanges
      .pipe(
        takeUntil(this.destroy$),
        debounceTime(200),
        distinctUntilChanged()
      )
      .subscribe(() => {
        if (this.addressForm.valid) {
          this.valueChange.emit(this.getFormValue());
        } else {
          this.valueChange.emit(null);
        }
      });
  }

  /**
   * Get typed form value
   */
  private getFormValue(): NfAddress {
    const raw = this.addressForm.getRawValue();
    return {
      line1: raw.line1?.trim() || '',
      line2: raw.line2?.trim() || undefined,
      city: raw.city?.trim() || '',
      postalCode: raw.postalCode?.trim() || undefined,
      region: raw.region?.trim() || undefined,
      countryCode: raw.countryCode?.trim() || '',
      notes: raw.notes?.trim() || undefined,
    };
  }

  /**
   * Programmatically set the address value
   */
  writeValue(value: NfAddress | null): void {
    if (!value) {
      this.addressForm.reset();
      return;
    }

    this.addressForm.patchValue(
      {
        line1: value.line1 || '',
        line2: value.line2 || '',
        city: value.city || '',
        postalCode: value.postalCode || '',
        region: value.region || '',
        countryCode: value.countryCode || '',
        notes: value.notes || '',
      },
      { emitEvent: false }
    );
  }

  /**
   * Set disabled state for the entire form
   */
  setDisabledState(isDisabled: boolean): void {
    if (!this.addressForm) return;

    if (isDisabled) {
      this.addressForm.disable({ emitEvent: false });
    } else {
      this.addressForm.enable({ emitEvent: false });
    }
  }

  /**
   * Check if a field should be visible based on mode
   */
  isFieldVisible(field: keyof AddressFormControls): boolean {
    if (this.mode === 'compact') {
      return ['line1', 'city', 'postalCode', 'countryCode'].includes(field);
    }
    if (field === 'notes') {
      return this.showNotes;
    }
    return true;
  }

  /**
   * Check if a field is required
   */
  isFieldRequired(field: keyof AddressFormControls): boolean {
    if (field === 'countryCode') return true;
    return this.requiredConfig()[field] ?? false;
  }

  /**
   * Check if a field has errors and has been touched
   */
  hasError(field: keyof AddressFormControls): boolean {
    const control = this.addressForm.get(field);
    return !!(control?.invalid && control?.touched);
  }

  /**
   * Get error message key for a field
   */
  getErrorKey(field: keyof AddressFormControls): string | null {
    const control = this.addressForm.get(field);
    if (!control?.errors || !control?.touched) return null;

    if (control.errors['required']) {
      return 'Common.Required';
    }
    if (control.errors['maxlength']) {
      return 'Common.MaxLength';
    }
    return null;
  }

  /**
   * Get country options formatted for nf-select
   */
  getCountrySelectOptions(): NfSelectOption[] {
    return this.countryOptions.map((option) => ({
      value: option.code,
      label: option.labelKey,
    }));
  }
}

/**
 * USAGE EXAMPLE IN DOMAIN FORMS
 * 
 * ```typescript
 * // In a Supplier form component:
 * import { NfAddressFormComponent } from '@lib/anatomy/components/molecules/address';
 * import { NfAddress } from '@lib/anatomy/components/molecules/address';
 * 
 * @Component({
 *   // ...
 *   imports: [NfAddressFormComponent, ...],
 * })
 * export class SupplierFormComponent {
 *   supplierForm = this.fb.group({
 *     name: [''],
 *     billingAddress: [null as NfAddress | null],
 *     shippingAddress: [null as NfAddress | null],
 *   });
 * 
 *   onBillingAddressChange(address: NfAddress | null): void {
 *     this.supplierForm.patchValue({ billingAddress: address });
 *   }
 * 
 *   onAddressValidityChange(isValid: boolean): void {
 *     console.log('Address validity:', isValid);
 *   }
 * }
 * ```
 * 
 * ```html
 * <!-- In supplier form template -->
 * <form [formGroup]="supplierForm">
 *   <nf-input formControlName="name" label="Supplier Name"></nf-input>
 *   
 *   <div class="address-section">
 *     <h3>Billing Address</h3>
 *     <nf-address-form
 *       [value]="supplierForm.value.billingAddress"
 *       [mode]="'full'"
 *       [required]="{ line1: true, city: true, countryCode: true }"
 *       (valueChange)="onBillingAddressChange($event)"
 *       (validityChange)="onAddressValidityChange($event)">
 *     </nf-address-form>
 *   </div>
 * </form>
 * ```
 */
