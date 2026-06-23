import { CommonModule } from '@angular/common';
import {
  ChangeDetectionStrategy,
  Component,
  computed,
  input,
} from '@angular/core';
import { TranslateModule } from '@ngx-translate/core';

import type { Situation } from '@applications/erp/chantiers/models';

@Component({
  selector: 'app-decompte-print',
  standalone: true,
  imports: [CommonModule, TranslateModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './decompte-print.component.html',
  styleUrl: './decompte-print.component.scss',
})
export class DecomptePrintComponent {
  readonly situation = input.required<Situation>();

  readonly tva = computed(() => {
    const s = this.situation();
    return Math.round((s.netAPayerHt * s.tvaTaux) / 100 * 100) / 100;
  });
}
