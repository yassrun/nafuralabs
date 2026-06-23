import { CommonModule } from '@angular/common';
import {
  ChangeDetectionStrategy,
  Component,
  EventEmitter,
  Input,
  Output,
  computed,
  signal,
} from '@angular/core';
import { FormsModule } from '@angular/forms';
import { TranslateModule } from '@ngx-translate/core';

import type { SituationLigne } from '@applications/erp/chantiers/models';

@Component({
  selector: 'app-lots-saisie-table',
  standalone: true,
  imports: [CommonModule, FormsModule, TranslateModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './lots-saisie-table.component.html',
  styleUrl: './lots-saisie-table.component.scss',
})
export class LotsSaisieTableComponent {
  private _lines = signal<SituationLigne[]>([]);
  private _readonly = false;

  readonly displayLines = computed(() => this._lines());
  readonly totalCumulHt = computed(
    () =>
      Math.round(
        this._lines().reduce((s, l) => s + (l.montantHt || 0), 0) * 100,
      ) / 100,
  );

  @Input() set lines(value: SituationLigne[] | null | undefined) {
    this._lines.set(Array.isArray(value) ? [...value] : []);
  }

  @Input() set readonly(value: boolean) {
    this._readonly = value;
  }
  get readonly(): boolean {
    return this._readonly;
  }

  @Output() readonly linesChange = new EventEmitter<SituationLigne[]>();

  patchLine(index: number, patch: Partial<SituationLigne>): void {
    const list = [...this._lines()];
    const current = list[index];
    if (!current) return;

    const merged: SituationLigne = { ...current, ...patch };
    const qte = merged.quantiteCumulee ?? 0;
    const pu = merged.prixUnitaire ?? 0;
    merged.montantHt = Math.round(qte * pu * 100) / 100;

    list[index] = merged;
    this._lines.set(list);
    this.linesChange.emit(list);
  }

  pourcentage(line: SituationLigne): number {
    const total = line.quantiteTotale ?? 0;
    if (!total) return 0;
    return Math.round((line.quantiteCumulee / total) * 100);
  }

  alerteRegression(line: SituationLigne): boolean {
    const prec = line.quantitePrecedente ?? 0;
    return line.quantiteCumulee < prec;
  }

  trackById(_: number, line: SituationLigne): string {
    return line.id;
  }
}
