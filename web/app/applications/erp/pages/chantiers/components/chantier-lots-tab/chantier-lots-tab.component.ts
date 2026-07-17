import { CommonModule } from '@angular/common';
import {
  ChangeDetectionStrategy,
  Component,
  computed,
  effect,
  inject,
  input,
  signal,
} from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { firstValueFrom } from 'rxjs';
import { TranslateModule, TranslateService } from '@ngx-translate/core';

import { BadgeComponent, ButtonComponent, EmptyStateComponent } from '@lib/anatomy/components';
import { ConfirmDialogService, ToastService } from '@lib/anatomy';
import { MadCurrencyPipe } from '@lib/anatomy/pipes/mad-currency.pipe';
import type { LotChantier, PosteBudgetaire } from '@applications/erp/chantiers/models';
import {
  LOT_CHANTIER_IMPORT_DEFINITION,
  LotChantierImportService,
} from '@applications/erp/shared/smart-import/handlers/lot-chantier-import.handler';
import {
  SmartImportTriggerComponent,
  type ReviewedExtraction,
} from '@platform/features/documents/smart-import';

import { ChantierLotApiService } from '../../services/chantier-lot-api.service';
import { PosteBudgetaireApiService } from '../../services/poste-budgetaire-api.service';
import { buildLotHierarchyRows, type LotHierarchyRowKind } from '../../utils/lot-hierarchy.util';
import {
  LotFormDialogComponent,
  type LotFormDialogResult,
  type LotFormMode,
} from '../lot-form-dialog/lot-form-dialog.component';

@Component({
  selector: 'app-chantier-lots-tab',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    CommonModule,
    TranslateModule,
    ButtonComponent,
    BadgeComponent,
    EmptyStateComponent,
    MadCurrencyPipe,
    SmartImportTriggerComponent,
  ],
  template: `
    <section class="tab-panel">
      <div class="tab-panel__toolbar">
        <nf-button variant="primary" icon="plus" iconLibrary="lucide" (clicked)="openForm('rootLot')">
          {{ 'chantiers.chantier.detail.lots.addCta' | translate }}
        </nf-button>
        <nf-button variant="secondary" icon="plus" iconLibrary="lucide" (clicked)="openForm('sousLot')" [disabled]="!rootLots().length">
          {{ 'chantiers.chantier.detail.lots.addSousLotCta' | translate }}
        </nf-button>
        <nf-button variant="secondary" icon="plus" iconLibrary="lucide" (clicked)="openForm('poste')" [disabled]="!lots().length">
          {{ 'chantiers.chantier.detail.lots.addPosteCta' | translate }}
        </nf-button>
        <nf-smart-import-trigger
          [definition]="importDefinition"
          (completed)="onMagicImportComplete($event)" />
      </div>

      @if (hierarchyRows().length) {
        <div class="lots-tablebar">
          <span class="lots-count">{{ 'chantiers.chantier.detail.lots.rowsCount' | translate:{ count: hierarchyRows().length } }}</span>
          <span class="lots-tablebar__spacer"></span>
          <button type="button" class="linklike" (click)="collapseAll()">{{ 'chantiers.chantier.detail.lots.collapseAll' | translate }}</button>
          <button type="button" class="linklike" (click)="expandAll()">{{ 'chantiers.chantier.detail.lots.expandAll' | translate }}</button>
        </div>
        <div class="table-scroll">
          <table class="data-table">
          <thead>
            <tr>
              <th>{{ 'chantiers.chantier.detail.lots.typeColumn' | translate }}</th>
              <th>{{ 'chantiers.chantier.detail.columns.designation' | translate }}</th>
              <th class="code-col">{{ 'chantiers.chantier.detail.columns.code' | translate }}</th>
              <th class="num">{{ 'chantiers.chantier.detail.columns.quantite' | translate }}</th>
              <th>{{ 'chantiers.chantier.detail.columns.unite' | translate }}</th>
              <th class="num">{{ 'chantiers.chantier.detail.columns.prixUnitaireHt' | translate }}</th>
              <th class="num">{{ 'chantiers.chantier.detail.columns.montantHt' | translate }}</th>
              <th class="center">{{ 'chantiers.chantier.detail.columns.avancement' | translate }}</th>
              <th class="center">{{ 'chantiers.chantier.detail.lots.actionsColumn' | translate }}</th>
            </tr>
          </thead>
          <tbody>
            @for (row of visibleRows(); track rowTrack(row)) {
              <tr>
                <td>
                  <nf-badge [variant]="typeBadgeVariant(row.kind)">{{ typeLabelKey(row.kind) | translate }}</nf-badge>
                </td>
                <td [style.padding-left.rem]="0.75 + row.depth * 1.1">
                  @if (rowHasChildren(row)) {
                    <button
                      type="button"
                      class="collapse-toggle"
                      (click)="toggleCollapse(row.lot?.id)"
                      [attr.aria-expanded]="!isCollapsed(row.lot?.id)"
                      [attr.aria-label]="(isCollapsed(row.lot?.id) ? 'chantiers.chantier.detail.lots.expandLot' : 'chantiers.chantier.detail.lots.collapseLot') | translate">
                      {{ isCollapsed(row.lot?.id) ? '▸' : '▾' }}
                    </button>
                  }
                  <strong>{{ rowDesignation(row) }}</strong>
                </td>
                <td class="code-col code-muted">{{ rowCode(row) }}</td>
                <td class="num">{{ rowQuantite(row) }}</td>
                <td>{{ rowUnite(row) }}</td>
                <td class="num">{{ rowPrixUnitaireValue(row) != null ? (rowPrixUnitaireValue(row)! | mad) : '—' }}</td>
                <td class="num">{{ rowMontantValue(row) != null ? (rowMontantValue(row)! | mad) : '—' }}</td>
                <td class="center">
                  @if (row.kind !== 'poste') {
                    <div class="progress-wrap">
                      <div class="progress-bar sm">
                        <div class="progress-fill" [style.width.%]="rowAvancement(row)"></div>
                      </div>
                      <span>{{ rowAvancement(row) }}%</span>
                    </div>
                  } @else {
                    <span>—</span>
                  }
                </td>
                <td class="center actions-cell">
                  <button type="button" class="row-action" (click)="editRow(row)"
                    [attr.title]="'chantiers.chantier.detail.lots.editAction' | translate"
                    [attr.aria-label]="'chantiers.chantier.detail.lots.editAction' | translate">✎</button>
                  <button type="button" class="row-action row-action--danger" (click)="deleteRow(row)"
                    [attr.title]="'chantiers.chantier.detail.lots.deleteAction' | translate"
                    [attr.aria-label]="'chantiers.chantier.detail.lots.deleteAction' | translate">🗑</button>
                </td>
              </tr>
            }
          </tbody>
          <tfoot>
            <tr class="total-row">
              <td colspan="6">{{ 'chantiers.chantier.detail.lots.totalLabel' | translate }}</td>
              <td class="num">{{ totalMontantHt() | mad }}</td>
              <td class="center">—</td>
              <td class="center"></td>
            </tr>
          </tfoot>
          </table>
        </div>
      } @else if (!loading()) {
        <nf-empty-state
          icon="layers"
          [title]="'chantiers.chantier.detail.empty.lotsTitle' | translate"
          [message]="'chantiers.chantier.detail.empty.lotsMessage' | translate"
          [actionLabel]="'chantiers.chantier.detail.lots.addCta' | translate"
          (action)="openForm('rootLot')"></nf-empty-state>
      }
    </section>
  `,
  styles: [`
    .tab-panel__toolbar { display: flex; flex-wrap: wrap; gap: 0.5rem; margin-bottom: 1rem; }
    .table-scroll { max-height: 65vh; overflow: auto; border: 1px solid var(--nf-color-border); border-radius: 0.75rem; }
    .data-table { width: 100%; border-collapse: collapse; font-size: 0.87rem; background: var(--nf-color-surface); }
    .data-table thead th { position: sticky; top: 0; z-index: 2; }
    .data-table tfoot .total-row td { position: sticky; bottom: 0; z-index: 2; }
    .lots-tablebar { display: flex; align-items: center; gap: 0.75rem; margin-bottom: 0.5rem; }
    .lots-tablebar__spacer { flex: 1 1 auto; }
    .lots-count { font-size: 0.8125rem; color: var(--nf-color-text-secondary); }
    .linklike { border: none; background: transparent; color: var(--nf-color-primary-600); cursor: pointer; font-size: 0.8125rem; padding: 0; }
    .linklike:hover { text-decoration: underline; }
    .data-table th { padding: 0.7rem 1rem; background: var(--nf-color-bg-subtle); color: var(--nf-color-text-secondary); font-weight: 600; text-align: left; border-bottom: 2px solid var(--nf-color-border); white-space: nowrap; }
    .data-table th.num { text-align: right; }
    .data-table th.center { text-align: center; }
    .data-table th.code-col, .data-table td.code-col { font-size: 0.75rem; white-space: nowrap; }
    .data-table td.code-muted { color: var(--nf-color-text-tertiary, var(--nf-color-text-secondary)); font-variant-numeric: tabular-nums; font-weight: 400; }
    .data-table td { padding: 0.65rem 1rem; border-bottom: 1px solid var(--nf-color-bg-muted); color: var(--nf-color-text-secondary); }
    .data-table td.num { text-align: right; font-variant-numeric: tabular-nums; }
    .data-table td.center { text-align: center; }
    .data-table tbody tr:last-child td { border-bottom: none; }
    .collapse-toggle { border: none; background: transparent; cursor: pointer; padding: 0 0.4rem 0 0; font-size: 0.8rem; line-height: 1; color: var(--nf-color-text-secondary); }
    .collapse-toggle:hover { color: var(--nf-color-text-primary); }
    .data-table tfoot .total-row td { padding: 0.75rem 1rem; border-top: 2px solid var(--nf-color-border); background: var(--nf-color-bg-subtle); font-weight: 700; color: var(--nf-color-text-primary); }
    .data-table tfoot .total-row td.num { text-align: right; font-variant-numeric: tabular-nums; }
    .data-table tfoot .total-row td.center { text-align: center; }
    .actions-cell { white-space: nowrap; }
    .row-action { border: none; background: transparent; cursor: pointer; font-size: 0.95rem; line-height: 1; padding: 0 0.3rem; color: var(--nf-color-text-secondary); }
    .row-action:hover { color: var(--nf-color-text-primary); }
    .row-action--danger:hover { color: var(--nf-color-danger-600, #c0392b); }
    .progress-wrap { display: flex; flex-direction: column; align-items: center; gap: 0.25rem; }
    .progress-bar { width: 100%; height: 6px; background: var(--nf-color-bg-muted); border-radius: 999px; overflow: hidden; }
    .progress-bar.sm { max-width: 80px; }
    .progress-fill { height: 100%; background: var(--nf-color-primary-600); border-radius: 999px; }
  `],
})
export class ChantierLotsTabComponent {
  readonly chantierId = input.required<string>();

  private readonly lotApi = inject(ChantierLotApiService);
  private readonly posteApi = inject(PosteBudgetaireApiService);
  private readonly dialog = inject(MatDialog);
  private readonly translate = inject(TranslateService);
  private readonly toast = inject(ToastService);
  private readonly confirmDialog = inject(ConfirmDialogService);
  private readonly lotImporter = inject(LotChantierImportService);
  readonly importDefinition = LOT_CHANTIER_IMPORT_DEFINITION;

  readonly loading = signal(false);
  readonly lots = signal<LotChantier[]>([]);
  readonly postesByLotId = signal<Record<string, PosteBudgetaire[]>>({});

  readonly rootLots = computed(() => this.lots().filter((lot) => !lot.parentLotId));

  /** Root lot ids that are collapsed in the table (children hidden). */
  readonly collapsedLotIds = signal<Set<string>>(new Set());

  readonly hierarchyRows = computed(() =>
    buildLotHierarchyRows(this.lots(), this.postesByLotId()),
  );

  /** Rows actually rendered, honouring collapsed grouping nodes. */
  readonly visibleRows = computed(() => {
    const collapsed = this.collapsedLotIds();
    const rows = this.hierarchyRows();
    const out: typeof rows = [];
    let hiddenBelowDepth: number | null = null;
    for (const row of rows) {
      if (hiddenBelowDepth != null) {
        if (row.depth > hiddenBelowDepth) continue;
        hiddenBelowDepth = null;
      }
      out.push(row);
      if (row.kind !== 'poste' && row.lot && collapsed.has(row.lot.id)) {
        hiddenBelowDepth = row.depth;
      }
    }
    return out;
  });

  /** Total marché HT = sum of every poste amount across all lots. */
  readonly totalMontantHt = computed(() => {
    const byLot = this.postesByLotId();
    let total = 0;
    for (const postes of Object.values(byLot)) {
      for (const poste of postes) {
        if (poste.montantHt != null && Number.isFinite(poste.montantHt)) {
          total += poste.montantHt;
        }
      }
    }
    return total;
  });

  isCollapsed(lotId: string | undefined): boolean {
    return lotId ? this.collapsedLotIds().has(lotId) : false;
  }

  toggleCollapse(lotId: string | undefined): void {
    if (!lotId) return;
    const next = new Set(this.collapsedLotIds());
    if (next.has(lotId)) {
      next.delete(lotId);
    } else {
      next.add(lotId);
    }
    this.collapsedLotIds.set(next);
  }

  collapseAll(): void {
    const ids = this.hierarchyRows()
      .filter((row) => row.kind !== 'poste' && row.lot && this.rowHasChildren(row))
      .map((row) => row.lot!.id);
    this.collapsedLotIds.set(new Set(ids));
  }

  rowHasChildren(row: ReturnType<typeof buildLotHierarchyRows>[number]): boolean {
    if (row.kind === 'poste' || !row.lot) return false;
    const lotId = row.lot.id;
    if ((this.postesByLotId()[lotId] ?? []).length > 0) return true;
    return this.lots().some((lot) => lot.parentLotId === lotId);
  }

  expandAll(): void {
    this.collapsedLotIds.set(new Set());
  }

  constructor() {
    effect(() => {
      const id = this.chantierId();
      if (!id) {
        this.lots.set([]);
        this.postesByLotId.set({});
        return;
      }
      void this.reload(id);
    });
  }

  async reload(chantierId?: string): Promise<void> {
    const id = chantierId ?? this.chantierId();
    if (!id) return;
    this.loading.set(true);
    try {
      const lots = await this.lotApi.listByChantier(id);
      this.lots.set(lots);
      const settled = await Promise.allSettled(
        lots.map(async (lot) => [lot.id, await this.posteApi.listByLot(lot.id)] as const),
      );
      const postesByLotId: Record<string, PosteBudgetaire[]> = {};
      for (const result of settled) {
        if (result.status === 'fulfilled') {
          const [lotId, postes] = result.value;
          postesByLotId[lotId] = postes;
        }
      }
      this.postesByLotId.set(postesByLotId);
    } catch {
      this.lots.set([]);
      this.postesByLotId.set({});
    } finally {
      this.loading.set(false);
    }
  }

  async openForm(mode: LotFormMode): Promise<void> {
    const ref = this.dialog.open(LotFormDialogComponent, {
      data: { mode, lots: this.lots() },
      autoFocus: 'first-tabbable',
    });
    const result = await firstValueFrom(ref.afterClosed());
    if (!result) return;
    await this.submitForm(result);
  }

  private async submitForm(result: LotFormDialogResult): Promise<void> {
    const chantierId = this.chantierId();
    try {
      if (result.mode === 'poste') {
        const lotId = result.targetLotId;
        if (!lotId) return;
        const postes = this.postesByLotId()[lotId] ?? [];
        const quantite = result.quantite ?? 0;
        const prixUnitaireHt = result.prixUnitaireHt ?? 0;
        await this.posteApi.createForLot(lotId, {
          ...(result.code ? { code: result.code } : {}),
          designation: result.designation,
          quantite,
          unite: result.unite,
          prixUnitaireHt,
          montantHt: Math.round(quantite * prixUnitaireHt * 100) / 100,
          ordre: postes.length + 1,
        });
        this.toast.success(this.translate.instant('chantiers.chantier.detail.lots.posteCreateSuccess'));
      } else {
        // A lot / sous-lot is a grouping: its amount is derived from its postes,
        // so we do not send quantité / prix / montant here.
        await this.lotApi.createForChantier(chantierId, {
          ...(result.code ? { code: result.code } : {}),
          designation: result.designation,
          parentLotId: result.mode === 'sousLot' ? result.parentLotId : undefined,
          ordre: this.lots().length + 1,
          avancementPercent: 0,
        });
        const messageKey = result.mode === 'sousLot'
          ? 'chantiers.chantier.detail.lots.sousLotCreateSuccess'
          : 'chantiers.chantier.detail.lots.createSuccess';
        this.toast.success(this.translate.instant(messageKey));
      }
      await this.reload();
    } catch {
      const errorKey = result.mode === 'poste'
        ? 'chantiers.chantier.detail.lots.posteCreateFailed'
        : result.mode === 'sousLot'
          ? 'chantiers.chantier.detail.lots.sousLotCreateFailed'
          : 'chantiers.chantier.detail.lots.createFailed';
      this.toast.error(this.translate.instant(errorKey));
    }
  }

  typeLabelKey(kind: LotHierarchyRowKind): string {
    switch (kind) {
      case 'sousLot':
        return 'chantiers.chantier.detail.lots.typeSousLot';
      case 'poste':
        return 'chantiers.chantier.detail.lots.typePoste';
      default:
        return 'chantiers.chantier.detail.lots.typeLot';
    }
  }

  typeBadgeVariant(kind: LotHierarchyRowKind): 'default' | 'info' {
    switch (kind) {
      case 'sousLot':
        return 'info';
      default:
        return 'default';
    }
  }

  rowTrack(row: ReturnType<typeof buildLotHierarchyRows>[number]): string {
    if (row.poste) return `poste-${row.poste.id}`;
    return `lot-${row.lot!.id}-${row.kind}`;
  }

  rowCode(row: ReturnType<typeof buildLotHierarchyRows>[number]): string {
    return row.poste?.code ?? row.lot?.code ?? '—';
  }

  rowDesignation(row: ReturnType<typeof buildLotHierarchyRows>[number]): string {
    return row.poste?.designation ?? row.lot?.designation ?? '—';
  }

  rowQuantite(row: ReturnType<typeof buildLotHierarchyRows>[number]): string | number {
    const q = row.poste?.quantite ?? row.lot?.quantite;
    return q ?? '—';
  }

  rowUnite(row: ReturnType<typeof buildLotHierarchyRows>[number]): string {
    return row.poste?.unite ?? row.lot?.unite ?? '—';
  }

  rowPrixUnitaireValue(row: ReturnType<typeof buildLotHierarchyRows>[number]): number | null {
    const pu = row.poste?.prixUnitaireHt ?? row.lot?.prixUnitaireHt;
    return pu != null ? pu : null;
  }

  rowMontantValue(row: ReturnType<typeof buildLotHierarchyRows>[number]): number | null {
    const m = row.poste?.montantHt ?? row.lot?.montantHt;
    return m != null ? m : null;
  }

  rowAvancement(row: ReturnType<typeof buildLotHierarchyRows>[number]): number {
    return row.lot?.avancementPercent ?? 0;
  }

  async editRow(row: ReturnType<typeof buildLotHierarchyRows>[number]): Promise<void> {
    if (row.poste) {
      await this.openEditPoste(row.poste);
    } else if (row.lot) {
      await this.openEditLot(row.lot, row.kind);
    }
  }

  private async openEditLot(lot: LotChantier, kind: LotHierarchyRowKind): Promise<void> {
    const mode: LotFormMode = kind === 'sousLot' ? 'sousLot' : 'rootLot';
    const ref = this.dialog.open(LotFormDialogComponent, {
      data: {
        mode,
        lots: this.lots(),
        isEdit: true,
        initial: { code: lot.code, designation: lot.designation },
      },
      autoFocus: 'first-tabbable',
    });
    const result = await firstValueFrom(ref.afterClosed());
    if (!result) return;
    try {
      await this.lotApi.updateForChantier(this.chantierId(), lot.id, {
        code: result.code,
        designation: result.designation,
      });
      this.toast.success(this.translate.instant('chantiers.chantier.detail.lots.updateSuccess'));
      await this.reload();
    } catch {
      this.toast.error(this.translate.instant('chantiers.chantier.detail.lots.updateFailed'));
    }
  }

  private async openEditPoste(poste: PosteBudgetaire): Promise<void> {
    const ref = this.dialog.open(LotFormDialogComponent, {
      data: {
        mode: 'poste',
        lots: this.lots(),
        isEdit: true,
        initial: {
          code: poste.code,
          designation: poste.designation,
          quantite: poste.quantite,
          unite: poste.unite,
          prixUnitaireHt: poste.prixUnitaireHt,
        },
      },
      autoFocus: 'first-tabbable',
    });
    const result = await firstValueFrom(ref.afterClosed());
    if (!result) return;
    const quantite = result.quantite ?? 0;
    const prixUnitaireHt = result.prixUnitaireHt ?? 0;
    try {
      await this.posteApi.updatePoste(poste.id, {
        code: result.code,
        designation: result.designation,
        unite: result.unite,
        quantite,
        prixUnitaireHt,
        montantHt: Math.round(quantite * prixUnitaireHt * 100) / 100,
      });
      this.toast.success(this.translate.instant('chantiers.chantier.detail.lots.updateSuccess'));
      await this.reload();
    } catch {
      this.toast.error(this.translate.instant('chantiers.chantier.detail.lots.updateFailed'));
    }
  }

  async deleteRow(row: ReturnType<typeof buildLotHierarchyRows>[number]): Promise<void> {
    if (row.poste) {
      const confirmed = await this.confirmDialog.confirm({
        title: this.translate.instant('chantiers.chantier.detail.lots.deleteConfirmTitle'),
        message: this.translate.instant('chantiers.chantier.detail.lots.deleteConfirmPoste', {
          code: row.poste.code,
          designation: row.poste.designation,
        }),
        confirmLabel: this.translate.instant('chantiers.chantier.detail.lots.deleteAction'),
        cancelLabel: this.translate.instant('chantiers.chantier.detail.cancel'),
        variant: 'danger',
      });
      if (!confirmed) return;
      try {
        await this.posteApi.deletePoste(row.poste.id);
        this.toast.success(this.translate.instant('chantiers.chantier.detail.lots.deleteSuccess'));
        await this.reload();
      } catch {
        this.toast.error(this.translate.instant('chantiers.chantier.detail.lots.deleteFailed'));
      }
      return;
    }
    if (!row.lot) return;
    const childCount = this.countLotDescendants(row.lot.id);
    const messageKey = childCount > 0
      ? 'chantiers.chantier.detail.lots.deleteConfirmLotCascade'
      : 'chantiers.chantier.detail.lots.deleteConfirmLot';
    const confirmed = await this.confirmDialog.confirm({
      title: this.translate.instant('chantiers.chantier.detail.lots.deleteConfirmTitle'),
      message: this.translate.instant(messageKey, {
        code: row.lot.code,
        designation: row.lot.designation,
        count: childCount,
      }),
      confirmLabel: this.translate.instant('chantiers.chantier.detail.lots.deleteAction'),
      cancelLabel: this.translate.instant('chantiers.chantier.detail.cancel'),
      variant: 'danger',
    });
    if (!confirmed) return;
    try {
      await this.lotApi.deleteForChantier(this.chantierId(), row.lot.id);
      this.toast.success(this.translate.instant('chantiers.chantier.detail.lots.deleteSuccess'));
      await this.reload();
    } catch {
      this.toast.error(this.translate.instant('chantiers.chantier.detail.lots.deleteFailed'));
    }
  }

  private countLotDescendants(lotId: string): number {
    const postesByLot = this.postesByLotId();
    const sousLots = this.lots().filter((lot) => lot.parentLotId === lotId);
    let count = postesByLot[lotId]?.length ?? 0;
    for (const sousLot of sousLots) {
      count += 1;
      count += postesByLot[sousLot.id]?.length ?? 0;
    }
    return count;
  }

  async onMagicImportComplete(result: ReviewedExtraction): Promise<void> {
    await this.lotImporter.import(this.chantierId(), result.data);
    await this.reload();
  }
}
