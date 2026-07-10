import { CommonModule } from '@angular/common';
import {
  ChangeDetectionStrategy,
  Component,
  computed,
  input,
} from '@angular/core';
import { TranslateModule } from '@ngx-translate/core';

export interface DecompteValues {
  cumulCourantHt: number;
  cumulPrecedentHt: number;
  travauxPeriodeHt: number;
  retenueGarantiePercent: number;
  retenueGarantieMontant: number;
  retenueAvancePercent?: number;
  retenueAvanceMontant?: number;
  netAPayerHt: number;
  tvaTaux: number;
  netAPayerTtc: number;
}

@Component({
  selector: 'app-decompte-card',
  standalone: true,
  imports: [CommonModule, TranslateModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './decompte-card.component.html',
  styleUrl: './decompte-card.component.scss',
})
export class DecompteCardComponent {
  readonly values = input.required<DecompteValues>();
  readonly sticky = input<boolean>(true);
  readonly compact = input<boolean>(false);

  readonly v = computed<DecompteValues>(() => this.values());
}
