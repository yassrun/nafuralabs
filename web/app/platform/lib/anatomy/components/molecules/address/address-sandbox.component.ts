import { Component, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { NfAddressFormComponent } from './address-form.component';
import { NfAddressViewComponent } from './address-view.component';
import { NfAddress, NfAddressMode } from './address.model';

/**
 * Address Sandbox Component
 * 
 * A demo/sandbox component to showcase the nf-address-form and nf-address-view components
 * with various configurations and use cases.
 */
@Component({
  selector: 'nf-address-sandbox',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    NfAddressFormComponent,
    NfAddressViewComponent,
  ],
  templateUrl: './address-sandbox.component.html',
  styleUrl: './address-sandbox.component.scss',
})
export class NfAddressSandboxComponent {
  // Form states
  fullModeAddress = signal<NfAddress | null>(null);
  compactModeAddress = signal<NfAddress | null>(null);
  
  // Validation states
  fullModeValid = signal(false);
  compactModeValid = signal(false);
  
  // UI controls
  currentMode = signal<NfAddressMode>('full');
  showNotes = signal(true);
  isDisabled = signal(false);
  
  // Sample data for view component
  sampleAddress: NfAddress = {
    line1: '123 Avenue Mohammed V',
    line2: 'Appartement 5B',
    city: 'Casablanca',
    postalCode: '20250',
    region: 'Casablanca-Settat',
    countryCode: 'MA',
    notes: 'Ring doorbell twice. Delivery preferred in the morning.',
  };

  /**
   * Handle address changes from full mode form
   */
  onFullModeAddressChange(address: NfAddress | null): void {
    this.fullModeAddress.set(address);
    console.log('Full mode address:', address);
  }

  /**
   * Handle validity changes from full mode form
   */
  onFullModeValidityChange(isValid: boolean): void {
    this.fullModeValid.set(isValid);
    console.log('Full mode validity:', isValid);
  }

  /**
   * Handle address changes from compact mode form
   */
  onCompactModeAddressChange(address: NfAddress | null): void {
    this.compactModeAddress.set(address);
    console.log('Compact mode address:', address);
  }

  /**
   * Handle validity changes from compact mode form
   */
  onCompactModeValidityChange(isValid: boolean): void {
    this.compactModeValid.set(isValid);
    console.log('Compact mode validity:', isValid);
  }

  /**
   * Toggle between full and compact mode
   */
  toggleMode(): void {
    this.currentMode.set(this.currentMode() === 'full' ? 'compact' : 'full');
  }

  /**
   * Toggle notes visibility
   */
  toggleNotes(): void {
    this.showNotes.set(!this.showNotes());
  }

  /**
   * Toggle disabled state
   */
  toggleDisabled(): void {
    this.isDisabled.set(!this.isDisabled());
  }

  /**
   * Prefill form with sample data
   */
  prefillForm(): void {
    this.fullModeAddress.set({ ...this.sampleAddress });
  }

  /**
   * Clear form
   */
  clearForm(): void {
    this.fullModeAddress.set(null);
  }

  /**
   * Get country label for view component
   */
  getCountryLabel(code: string): string {
    const labels: Record<string, string> = {
      MA: 'Morocco (المغرب)',
      FR: 'France',
      ES: 'Spain (España)',
      US: 'United States',
    };
    return labels[code] || code;
  }

  /**
   * Get JSON representation of address
   */
  getAddressJson(address: NfAddress | null): string {
    return JSON.stringify(address, null, 2);
  }
}
