import {
  ChangeDetectionStrategy,
  Component,
  Input,
  signal,
  computed,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { NfAddress, NfAddressMode } from './address.model';

/**
 * Address View Component
 * 
 * A read-only display component for address data.
 * Supports compact and full layout modes with customizable country label resolution.
 * 
 * @example
 * ```html
 * <nf-address-view
 *   [value]="supplier.billingAddress"
 *   [mode]="'full'"
 *   [countryLabelResolver]="getCountryLabel">
 * </nf-address-view>
 * ```
 */
@Component({
  selector: 'nf-address-view',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './address-view.component.html',
  styleUrl: './address-view.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class NfAddressViewComponent {
  /** Address value to display */
  @Input() set value(val: NfAddress | null | undefined) {
    this.addressValue.set(val ?? null);
  }

  /** Display mode: 'compact' or 'full' */
  @Input() set mode(val: NfAddressMode) {
    this._mode.set(val);
  }

  /** Optional function to resolve country code to display label */
  @Input() countryLabelResolver?: (code: string) => string;

  // Internal signals
  private addressValue = signal<NfAddress | null>(null);
  _mode = signal<NfAddressMode>('full');

  // Computed values
  address = computed(() => this.addressValue());
  isCompactMode = computed(() => this._mode() === 'compact');
  isEmpty = computed(() => !this.addressValue());

  /**
   * Get country display label
   */
  getCountryLabel(countryCode: string): string {
    if (this.countryLabelResolver) {
      return this.countryLabelResolver(countryCode);
    }
    // Fallback to country code
    return countryCode;
  }

  /**
   * Get formatted city line (postalCode + city)
   */
  getCityLine(): string {
    const addr = this.address();
    if (!addr) return '';

    const parts: string[] = [];
    if (addr.postalCode) {
      parts.push(addr.postalCode);
    }
    if (addr.city) {
      parts.push(addr.city);
    }
    return parts.join(' ');
  }

  /**
   * Check if a field has a value
   */
  hasValue(field: keyof NfAddress): boolean {
    const addr = this.address();
    if (!addr) return false;
    const value = addr[field];
    return typeof value === 'string' && value.trim().length > 0;
  }
}
