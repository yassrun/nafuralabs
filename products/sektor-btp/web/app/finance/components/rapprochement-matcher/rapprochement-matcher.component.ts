import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, Component, computed, effect, inject, input, LOCALE_ID, output, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { TranslateModule } from '@ngx-translate/core';

import type { MouvementTresorerie, RapprochementLigneReleve } from '../../models';
import { ButtonComponent } from '@lib/anatomy/components';


interface MatchPair {
  mouvementId: string;
  releveLigneId: string;
}

@Component({
  selector: 'app-rapprochement-matcher',
  standalone: true,
  imports: [CommonModule, FormsModule, TranslateModule, ButtonComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="rm">
      <div class="rm__head">
        <div class="rm__head-stats">
          <span class="rm__stat">
            <strong>{{ unmatchedMouvements().length }}</strong> {{ 'finance.rapprochement.matcher.unmatchedMvt' | translate }}
          </span>
          <span class="rm__stat">
            <strong>{{ unmatchedReleve().length }}</strong> {{ 'finance.rapprochement.matcher.unmatchedReleve' | translate }}
          </span>
          <span class="rm__stat rm__stat--ok">
            <strong>{{ matchedPairs().length }}</strong> {{ 'finance.rapprochement.matcher.inProgress' | translate }}
          </span>
        </div>
        <div class="rm__head-actions">
          <nf-button variant="primary" class="rm__btn" (clicked)="suggererMatchings()">
            {{ 'finance.rapprochement.matcher.autoMatch' | translate }}
          </nf-button>
          <nf-button variant="ghost" class="rm__btn rm__btn--ghost" (clicked)="resetMatchings()">
            {{ 'finance.common.actions.refresh' | translate }}
          </nf-button>
        </div>
      </div>

      <div class="rm__body">
        <section class="rm__col">
          <header class="rm__col-head">
            <h3>{{ 'finance.rapprochement.matcher.mvtTitle' | translate }}</h3>
            <span class="rm__col-total">
              {{ 'finance.common.labels.total' | translate }} : {{ formatTotal(unmatchedMouvementsTotal()) }} {{ 'finance.common.currency.mad' | translate }}
            </span>
          </header>
          <ul class="rm__list">
            @for (m of unmatchedMouvements(); track m.id) {
              <li
                class="rm__item"
                [class.rm__item--selected]="selectedMvt() === m.id"
                (click)="selectMvt(m.id)"
              >
                <div class="rm__item-row">
                  <span class="rm__item-date">{{ formatDate(m.date) }}</span>
                  <span class="rm__item-num">{{ m.numero }}</span>
                </div>
                <div class="rm__item-libelle">{{ m.libelle }}</div>
                <div class="rm__item-row">
                  @if (m.recette > 0) {
                    <span class="rm__amount rm__amount--in">+{{ format(m.recette) }}</span>
                  } @else {
                    <span class="rm__amount rm__amount--out">-{{ format(m.depense) }}</span>
                  }
                  <span class="rm__item-ref">{{ m.reference || ('finance.common.dash' | translate) }}</span>
                </div>
              </li>
            } @empty {
              <li class="rm__empty">{{ 'finance.rapprochement.matcher.allMvtReconciled' | translate }}</li>
            }
          </ul>
        </section>

        <div class="rm__center">
          <nf-button variant="primary" class="rm__match-btn" (clicked)="matchManual()"  [disabled]="!selectedMvt() || !selectedReleve()">
            {{ 'finance.rapprochement.matcher.matchAction' | translate }}
          </nf-button>
          <nf-button variant="primary" class="rm__match-btn rm__match-btn--unlink" (clicked)="unmatch()"  [disabled]="!hoveredPair()">
            {{ 'finance.rapprochement.matcher.unlinkAction' | translate }}
          </nf-button>
        </div>

        <section class="rm__col">
          <header class="rm__col-head">
            <h3>{{ 'finance.rapprochement.matcher.releveTitle' | translate }}</h3>
            <span class="rm__col-total">
              {{ 'finance.common.labels.total' | translate }} : {{ formatTotal(unmatchedReleveTotal()) }} {{ 'finance.common.currency.mad' | translate }}
            </span>
          </header>
          <ul class="rm__list">
            @for (l of unmatchedReleve(); track l.id) {
              <li
                class="rm__item"
                [class.rm__item--selected]="selectedReleve() === l.id"
                (click)="selectReleve(l.id)"
              >
                <div class="rm__item-row">
                  <span class="rm__item-date">{{ formatDate(l.date) }}</span>
                  <span class="rm__item-ref">{{ l.reference || '' }}</span>
                </div>
                <div class="rm__item-libelle">{{ l.libelle }}</div>
                <div class="rm__item-row">
                  @if (l.recette > 0) {
                    <span class="rm__amount rm__amount--in">+{{ format(l.recette) }}</span>
                  } @else {
                    <span class="rm__amount rm__amount--out">-{{ format(l.depense) }}</span>
                  }
                  <nf-button variant="primary" class="rm__create-mvt" [title]="'finance.rapprochement.matcher.createMvtTooltip' | translate"
                    (clicked)="$event.stopPropagation(); createMvt.emit(l)">
                    {{ 'finance.rapprochement.matcher.createMvt' | translate }}
                  </nf-button>
                </div>
              </li>
            } @empty {
              <li class="rm__empty">{{ 'finance.rapprochement.matcher.allReleveMatched' | translate }}</li>
            }
          </ul>
        </section>
      </div>

      @if (matchedPairs().length > 0) {
        <section class="rm__pairs">
          <h3 class="rm__pairs-title">{{ 'finance.rapprochement.matcher.pairsTitle' | translate }}</h3>
          <table class="rm__pairs-table">
            <thead>
              <tr>
                <th>{{ 'finance.rapprochement.matcher.cols.mouvement' | translate }}</th>
                <th>{{ 'finance.rapprochement.matcher.cols.releve' | translate }}</th>
                <th class="rm__th-num">{{ 'finance.rapprochement.matcher.cols.mvtShort' | translate }}</th>
                <th class="rm__th-num">{{ 'finance.rapprochement.matcher.cols.releveShort' | translate }}</th>
                <th class="rm__th-num">{{ 'finance.common.labels.ecart' | translate }}</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              @for (p of matchedPairs(); track p.mouvementId + p.releveLigneId) {
                @if (mvtById(p.mouvementId); as m) {
                  @if (releveById(p.releveLigneId); as l) {
                    <tr>
                      <td>
                        <div>{{ m.libelle }}</div>
                        <div class="rm__sub">{{ m.numero }} · {{ formatDate(m.date) }}</div>
                      </td>
                      <td>
                        <div>{{ l.libelle }}</div>
                        <div class="rm__sub">{{ formatDate(l.date) }}</div>
                      </td>
                      <td class="rm__td-num">
                        {{ format(m.recette > 0 ? m.recette : -m.depense) }}
                      </td>
                      <td class="rm__td-num">
                        {{ format(l.recette > 0 ? l.recette : -l.depense) }}
                      </td>
                      <td class="rm__td-num"
                          [class.rm__diff--ok]="diffPair(m, l) === 0"
                          [class.rm__diff--ko]="diffPair(m, l) !== 0">
                        {{ format(diffPair(m, l)) }}
                      </td>
                      <td>
                        <nf-button variant="primary" class="rm__remove-btn" (clicked)="removePair(p)"
                          [title]="'finance.rapprochement.matcher.unlinkTooltip' | translate">
                          ✕
                        </nf-button>
                      </td>
                    </tr>
                  }
                }
              }
            </tbody>
          </table>
        </section>
      }
    </div>
  `,
  styles: [
    `
      .rm {
        display: flex;
        flex-direction: column;
        gap: 16px;
      }
      .rm__head {
        display: flex;
        justify-content: space-between;
        align-items: center;
        flex-wrap: wrap;
        gap: 12px;
        padding: 12px 14px;
        background: var(--nf-color-bg-subtle);
        border: 1px solid var(--nf-color-border);
        border-radius: 8px;
      }
      .rm__head-stats {
        display: flex;
        gap: 20px;
        flex-wrap: wrap;
        font-size: 13px;
        color: var(--nf-color-text-secondary);
      }
      .rm__stat strong {
        color: var(--nf-text-primary);
        font-weight: 700;
      }
      .rm__stat--ok strong {
        color: var(--nf-color-success-700);
      }
      .rm__head-actions {
        display: flex;
        gap: 8px;
      }
      .rm__btn {
        padding: 6px 14px;
        border-radius: 6px;
        background: var(--nf-color-primary-600);
        color: white;
        border: none;
        font-size: 13px;
        font-weight: 500;
        cursor: pointer;
      }
      .rm__btn:hover {
        background: var(--nf-color-primary-700);
      }
      .rm__btn--ghost {
        background: transparent;
        color: var(--nf-color-text-secondary);
        border: 1px solid var(--nf-color-border);
      }
      .rm__btn--ghost:hover {
        background: var(--nf-color-bg-subtle);
      }
      .rm__body {
        display: grid;
        grid-template-columns: 1fr auto 1fr;
        gap: 16px;
        align-items: stretch;
      }
      .rm__col {
        display: flex;
        flex-direction: column;
        background: var(--nf-color-surface);
        border: 1px solid var(--nf-color-border);
        border-radius: 8px;
        overflow: hidden;
      }
      .rm__col-head {
        padding: 10px 14px;
        background: var(--nf-color-bg-subtle);
        border-bottom: 1px solid var(--nf-color-border);
        display: flex;
        justify-content: space-between;
        align-items: center;
        gap: 8px;
      }
      .rm__col-head h3 {
        margin: 0;
        font-size: 13px;
        font-weight: 600;
        color: var(--nf-text-primary);
      }
      .rm__col-total {
        font-size: 12px;
        color: var(--nf-color-text-secondary);
        font-variant-numeric: tabular-nums;
      }
      .rm__list {
        list-style: none;
        margin: 0;
        padding: 0;
        max-height: 480px;
        overflow-y: auto;
      }
      .rm__item {
        padding: 10px 14px;
        border-bottom: 1px solid var(--nf-color-bg-muted);
        cursor: pointer;
        display: flex;
        flex-direction: column;
        gap: 4px;
        font-size: 13px;
      }
      .rm__item:hover {
        background: var(--nf-color-bg-subtle);
      }
      .rm__item--selected {
        background: var(--nf-color-primary-50);
        box-shadow: inset 3px 0 0 var(--nf-color-primary-600);
      }
      .rm__item-row {
        display: flex;
        justify-content: space-between;
        align-items: center;
        gap: 8px;
      }
      .rm__item-date {
        font-size: 11px;
        color: var(--nf-color-text-secondary);
        font-variant-numeric: tabular-nums;
      }
      .rm__item-num,
      .rm__item-ref {
        font-family: ui-monospace, SF Mono, Menlo, monospace;
        font-size: 11px;
        color: var(--nf-color-text-muted);
      }
      .rm__item-libelle {
        color: var(--nf-text-primary);
        font-weight: 500;
      }
      .rm__amount {
        font-weight: 700;
        font-variant-numeric: tabular-nums;
      }
      .rm__amount--in {
        color: var(--nf-color-success-700);
      }
      .rm__amount--out {
        color: var(--nf-color-danger-700);
      }
      .rm__center {
        display: flex;
        flex-direction: column;
        gap: 8px;
        align-self: center;
      }
      .rm__match-btn {
        padding: 10px 16px;
        border-radius: 8px;
        background: var(--nf-color-success-600);
        color: white;
        border: none;
        font-weight: 600;
        cursor: pointer;
        white-space: nowrap;
      }
      .rm__match-btn:disabled {
        background: var(--nf-color-border);
        cursor: not-allowed;
      }
      .rm__match-btn:hover:not(:disabled) {
        background: var(--nf-color-success-700);
      }
      .rm__match-btn--unlink {
        background: var(--nf-color-danger-500);
      }
      .rm__match-btn--unlink:hover:not(:disabled) {
        background: var(--nf-color-danger-600);
      }
      .rm__create-mvt {
        font-size: 11px;
        padding: 4px 8px;
        border-radius: 4px;
        background: transparent;
        color: var(--nf-color-primary-600);
        border: 1px solid var(--nf-color-border);
        cursor: pointer;
      }
      .rm__create-mvt:hover {
        border-color: var(--nf-color-primary-600);
        background: var(--nf-color-primary-50);
      }
      .rm__empty {
        padding: 24px;
        text-align: center;
        color: var(--nf-color-text-secondary);
        font-size: 12px;
        font-style: italic;
      }
      .rm__pairs {
        background: var(--nf-color-surface);
        border: 1px solid var(--nf-color-border);
        border-radius: 8px;
      }
      .rm__pairs-title {
        margin: 0;
        padding: 10px 14px;
        background: var(--nf-color-success-50);
        border-bottom: 1px solid var(--nf-color-success-200);
        color: var(--nf-color-success-700);
        font-size: 13px;
        font-weight: 600;
      }
      .rm__pairs-table {
        width: 100%;
        border-collapse: collapse;
      }
      .rm__pairs-table th {
        text-align: left;
        font-size: 11px;
        text-transform: uppercase;
        letter-spacing: 0.05em;
        color: var(--nf-color-text-secondary);
        padding: 8px 12px;
        background: var(--nf-color-bg-subtle);
        border-bottom: 1px solid var(--nf-color-border);
      }
      .rm__pairs-table td {
        padding: 8px 12px;
        font-size: 13px;
        border-bottom: 1px solid var(--nf-color-bg-muted);
        color: var(--nf-color-text-primary);
      }
      .rm__th-num {
        text-align: right;
      }
      .rm__td-num {
        text-align: right;
        font-variant-numeric: tabular-nums;
        font-weight: 600;
      }
      .rm__sub {
        font-size: 11px;
        color: var(--nf-color-text-secondary);
        font-family: ui-monospace, SF Mono, Menlo, monospace;
        margin-top: 2px;
      }
      .rm__diff--ok {
        color: var(--nf-color-success-700);
      }
      .rm__diff--ko {
        color: var(--nf-color-danger-700);
      }
      .rm__remove-btn {
        background: transparent;
        border: 1px solid var(--nf-color-border);
        color: var(--nf-color-danger-500);
        font-size: 13px;
        font-weight: 700;
        width: 26px;
        height: 26px;
        border-radius: 4px;
        cursor: pointer;
      }
      .rm__remove-btn:hover {
        background: var(--nf-color-danger-100);
        border-color: var(--nf-color-danger-500);
      }
      @media (max-width: 1024px) {
        .rm__body {
          grid-template-columns: 1fr;
        }
        .rm__center {
          flex-direction: row;
          justify-content: center;
        }
      }
    `,
  ],
})
export class RapprochementMatcherComponent {
  private readonly locale = inject(LOCALE_ID);

  readonly mouvements = input<MouvementTresorerie[]>([]);
  readonly lignesReleve = input<RapprochementLigneReleve[]>([]);
  readonly pairs = input<MatchPair[]>([]);

  readonly pairsChange = output<MatchPair[]>();
  readonly createMvt = output<RapprochementLigneReleve>();

  protected readonly selectedMvt = signal<string | null>(null);
  protected readonly selectedReleve = signal<string | null>(null);
  protected readonly hoveredPair = signal<MatchPair | null>(null);
  protected readonly localPairs = signal<MatchPair[]>([]);

  constructor() {
    // Sync local pairs with input
    let synced = false;
    effect(() => {
      const incoming = this.pairs();
      if (!synced) {
        this.localPairs.set(incoming);
        synced = true;
      }
    });
  }

  readonly matchedPairs = computed(() => this.localPairs());

  readonly unmatchedMouvements = computed(() => {
    const matched = new Set(this.localPairs().map((p) => p.mouvementId));
    return this.mouvements().filter((m) => !matched.has(m.id));
  });

  readonly unmatchedReleve = computed(() => {
    const matched = new Set(this.localPairs().map((p) => p.releveLigneId));
    return this.lignesReleve().filter((l) => !matched.has(l.id));
  });

  readonly unmatchedMouvementsTotal = computed(() =>
    this.unmatchedMouvements().reduce((s, m) => s + (m.recette - m.depense), 0),
  );
  readonly unmatchedReleveTotal = computed(() =>
    this.unmatchedReleve().reduce((s, l) => s + (l.recette - l.depense), 0),
  );

  selectMvt(id: string): void {
    this.selectedMvt.set(this.selectedMvt() === id ? null : id);
  }

  selectReleve(id: string): void {
    this.selectedReleve.set(this.selectedReleve() === id ? null : id);
  }

  matchManual(): void {
    const mvtId = this.selectedMvt();
    const releveId = this.selectedReleve();
    if (!mvtId || !releveId) return;
    const next = [...this.localPairs(), { mouvementId: mvtId, releveLigneId: releveId }];
    this.localPairs.set(next);
    this.pairsChange.emit(next);
    this.selectedMvt.set(null);
    this.selectedReleve.set(null);
  }

  unmatch(): void {
    const p = this.hoveredPair();
    if (!p) return;
    this.removePair(p);
  }

  removePair(p: MatchPair): void {
    const next = this.localPairs().filter(
      (x) => !(x.mouvementId === p.mouvementId && x.releveLigneId === p.releveLigneId),
    );
    this.localPairs.set(next);
    this.pairsChange.emit(next);
  }

  resetMatchings(): void {
    this.localPairs.set([]);
    this.pairsChange.emit([]);
  }

  /**
   * Algorithme de matching auto :
   *   - même montant exact (recette/dépense)
   *   - date ± 3 jours
   *   - sens identique
   */
  suggererMatchings(): void {
    const usedM = new Set(this.localPairs().map((p) => p.mouvementId));
    const usedL = new Set(this.localPairs().map((p) => p.releveLigneId));
    const newPairs: MatchPair[] = [...this.localPairs()];

    for (const m of this.mouvements()) {
      if (usedM.has(m.id)) continue;
      const mAmount = m.recette - m.depense;
      const mDate = new Date(m.date).getTime();
      const candidate = this.lignesReleve().find((l) => {
        if (usedL.has(l.id)) return false;
        const lAmount = l.recette - l.depense;
        if (Math.abs(lAmount - mAmount) > 0.01) return false;
        const lDate = new Date(l.date).getTime();
        const days = Math.abs((lDate - mDate) / (1000 * 60 * 60 * 24));
        return days <= 3;
      });
      if (candidate) {
        newPairs.push({ mouvementId: m.id, releveLigneId: candidate.id });
        usedM.add(m.id);
        usedL.add(candidate.id);
      }
    }
    this.localPairs.set(newPairs);
    this.pairsChange.emit(newPairs);
  }

  mvtById(id: string): MouvementTresorerie | undefined {
    return this.mouvements().find((m) => m.id === id);
  }

  releveById(id: string): RapprochementLigneReleve | undefined {
    return this.lignesReleve().find((l) => l.id === id);
  }

  diffPair(m: MouvementTresorerie, l: RapprochementLigneReleve): number {
    const mAmt = m.recette - m.depense;
    const lAmt = l.recette - l.depense;
    return Math.round((mAmt - lAmt) * 100) / 100;
  }

  format(v: number): string {
    return Math.abs(v).toLocaleString(this.locale, { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  }

  formatTotal(v: number): string {
    const sign = v < 0 ? '-' : '+';
    return sign + Math.abs(v).toLocaleString(this.locale, {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    });
  }

  formatDate(d: string): string {
    if (!d) return '—';
    const dt = new Date(d);
    return Number.isNaN(dt.getTime()) ? d : dt.toLocaleDateString(this.locale);
  }
}
