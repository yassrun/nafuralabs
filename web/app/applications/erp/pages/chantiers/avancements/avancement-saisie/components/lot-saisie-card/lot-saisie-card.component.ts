import { Component, computed, input, output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { TranslateModule } from '@ngx-translate/core';

import { ButtonComponent } from '@lib/anatomy';

import type { LotSaisieViewModel } from '../../../models';
import { PhotoUploaderComponent } from '../photo-uploader/photo-uploader.component';

@Component({
  selector: 'app-lot-saisie-card',
  standalone: true,
  imports: [CommonModule, FormsModule, TranslateModule, ButtonComponent, PhotoUploaderComponent],
  templateUrl: './lot-saisie-card.component.html',
  styleUrls: ['./lot-saisie-card.component.scss'],
})
export class LotSaisieCardComponent {
  readonly model = input.required<LotSaisieViewModel>();

  readonly quantityChanged = output<number | null>();
  readonly notesChanged = output<string>();
  readonly photosChanged = output<LotSaisieViewModel['photos']>();
  readonly removed = output<void>();

  readonly isForfait = computed(() => {
    const u = this.model().lot.unite?.toUpperCase();
    return u === 'FF' || u === 'FORFAIT' || u === '%';
  });

  onPercentInput(value: string | number | null): void {
    const pct = value == null || value === '' ? null : Math.min(100, Math.max(0, Number(value)));
    if (pct == null || Number.isNaN(pct)) { this.quantityChanged.emit(null); return; }
    // For forfait: quantity = percent / 100 (assuming lot.quantite = 1)
    const lotQte = this.model().lot.quantite || 1;
    this.quantityChanged.emit((pct / 100) * lotQte);
  }

  onQuantityInput(value: string | number | null): void {
    if (value == null || value === '') {
      this.quantityChanged.emit(null);
      return;
    }

    const numericValue = Number(value);
    this.quantityChanged.emit(numericValue != null && !Number.isNaN(numericValue) ? numericValue : null);
  }
}