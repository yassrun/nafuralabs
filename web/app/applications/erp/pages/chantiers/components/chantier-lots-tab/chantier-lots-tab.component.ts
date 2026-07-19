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

import {
  BadgeComponent,
  ButtonComponent,
  EmptyStateComponent,
  TreeTableComponent,
  type NfTreeNode,
  type NfTreeTableColumn,
} from '@lib/anatomy/components';
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
import {
  buildLotTreeNodes,
  type LotHierarchyRow,
  type LotHierarchyRowKind,
} from '../../utils/lot-hierarchy.util';
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
    TreeTableComponent,
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

      @if (treeNodes().length || loading()) {
        <div class="lots-tablebar">
          <span class="lots-count">{{ 'chantiers.chantier.detail.lots.rowsCount' | translate:{ count: rowCount() } }}</span>
          <span class="lots-tablebar__spacer"></span>
          <button type="button" class="linklike" (click)="collapseAll()">{{ 'chantiers.chantier.detail.lots.collapseAll' | translate }}</button>
          <button type="button" class="linklike" (click)="expandAll()">{{ 'chantiers.chantier.detail.lots.expandAll' | translate }}</button>
        </div>
        <nf-tree-table
          [nodes]="treeNodes()"
          [columns]="treeColumns"
          treeColumnKey="designation"
          [loading]="loading()"
          [expandedKeys]="expandedKeys()"
          (expandedKeysChange)="expandedKeys.set($event)"
          minWidth="64rem">
          <ng-template #cell let-row let-column="column">
            @switch (column.key) {
              @case ('type') {
                <nf-badge [variant]="typeBadgeVariant(row.kind)">{{ typeLabelKey(row.kind) | translate }}</nf-badge>
              }
              @case ('designation') {
                <strong>{{ rowDesignation(row) }}</strong>
              }
              @case ('code') {
                <span class="code-muted">{{ rowCode(row) }}</span>
              }
              @case ('quantite') {
                {{ rowQuantite(row) }}
              }
              @case ('unite') {
                {{ rowUnite(row) }}
              }
              @case ('prixUnitaireHt') {
                {{ rowPrixUnitaireValue(row) != null ? (rowPrixUnitaireValue(row)! | mad) : '—' }}
              }
              @case ('montantHt') {
                {{ rowMontantValue(row) != null ? (rowMontantValue(row)! | mad) : '—' }}
              }
              @case ('avancement') {
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
              }
              @case ('actions') {
                <span class="actions-cell">
                  <button type="button" class="row-action" (click)="editRow(row)"
                    [attr.title]="'chantiers.chantier.detail.lots.editAction' | translate"
                    [attr.aria-label]="'chantiers.chantier.detail.lots.editAction' | translate">✎</button>
                  <button type="button" class="row-action row-action--danger" (click)="deleteRow(row)"
                    [attr.title]="'chantiers.chantier.detail.lots.deleteAction' | translate"
                    [attr.aria-label]="'chantiers.chantier.detail.lots.deleteAction' | translate">🗑</button>
                </span>
              }
            }
          </ng-template>
          <ng-template #footer>
            <div class="lots-total">
              <span>{{ 'chantiers.chantier.detail.lots.totalLabel' | translate }}</span>
              <strong>{{ totalMontantHt() | mad }}</strong>
            </div>
          </ng-template>
        </nf-tree-table>
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
    .lots-tablebar { display: flex; align-items: center; gap: 0.75rem; margin-bottom: 0.5rem; }
    .lots-tablebar__spacer { flex: 1 1 auto; }
    .lots-count { font-size: 0.8125rem; color: var(--nf-color-text-secondary); }
    .linklike { border: none; background: transparent; color: var(--nf-color-primary-600); cursor: pointer; font-size: 0.8125rem; padding: 0; }
    .linklike:hover { text-decoration: underline; }
    .code-muted { font-size: 0.75rem; white-space: nowrap; color: var(--nf-color-text-tertiary, var(--nf-color-text-secondary)); font-variant-numeric: tabular-nums; }
    .lots-total { display: flex; align-items: center; justify-content: space-between; gap: 1rem; padding: 0.75rem 1rem; font-weight: 700; color: var(--nf-color-text-primary); }
    .lots-total strong { font-variant-numeric: tabular-nums; }
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

  readonly treeColumns: NfTreeTableColumn<LotHierarchyRow>[] = [
    { key: 'type', label: 'chantiers.chantier.detail.lots.typeColumn', width: '7rem' },
    { key: 'designation', label: 'chantiers.chantier.detail.columns.designation', width: '22rem' },
    { key: 'code', label: 'chantiers.chantier.detail.columns.code', width: '7rem' },
    { key: 'quantite', label: 'chantiers.chantier.detail.columns.quantite', align: 'end', width: '6rem' },
    { key: 'unite', label: 'chantiers.chantier.detail.columns.unite', width: '6rem' },
    { key: 'prixUnitaireHt', label: 'chantiers.chantier.detail.columns.prixUnitaireHt', align: 'end', width: '9rem' },
    { key: 'montantHt', label: 'chantiers.chantier.detail.columns.montantHt', align: 'end', width: '9rem' },
    { key: 'avancement', label: 'chantiers.chantier.detail.columns.avancement', align: 'center', width: '8rem' },
    { key: 'actions', label: 'chantiers.chantier.detail.lots.actionsColumn', align: 'center', width: '7rem' },
  ];

  readonly treeNodes = computed(() =>
    buildLotTreeNodes(this.lots(), this.postesByLotId()),
  );

  /** Total number of displayed rows (lots + postes), for the count label. */
  readonly rowCount = computed(
    () => this.lots().length + Object.values(this.postesByLotId()).reduce((sum, postes) => sum + postes.length, 0),
  );

  /** Expanded node keys (controlled). Reset to fully-expanded on each reload. */
  readonly expandedKeys = signal<Set<string>>(new Set());

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

  collapseAll(): void {
    this.expandedKeys.set(new Set());
  }

  expandAll(): void {
    this.expandedKeys.set(this.collectExpandableKeys(this.treeNodes()));
  }

  private collectExpandableKeys(nodes: NfTreeNode<LotHierarchyRow>[]): Set<string> {
    const keys = new Set<string>();
    const walk = (list: NfTreeNode<LotHierarchyRow>[]): void => {
      for (const node of list) {
        if (node.children?.length) {
          keys.add(node.key);
          walk(node.children);
        }
      }
    };
    walk(nodes);
    return keys;
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

    // Fully expand the tree whenever the underlying data is (re)loaded.
    effect(() => {
      this.expandedKeys.set(this.collectExpandableKeys(this.treeNodes()));
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

  rowCode(row: LotHierarchyRow): string {
    return row.poste?.code ?? row.lot?.code ?? '—';
  }

  rowDesignation(row: LotHierarchyRow): string {
    return row.poste?.designation ?? row.lot?.designation ?? '—';
  }

  rowQuantite(row: LotHierarchyRow): string | number {
    const q = row.poste?.quantite ?? row.lot?.quantite;
    return q ?? '—';
  }

  rowUnite(row: LotHierarchyRow): string {
    return row.poste?.unite ?? row.lot?.unite ?? '—';
  }

  rowPrixUnitaireValue(row: LotHierarchyRow): number | null {
    const pu = row.poste?.prixUnitaireHt ?? row.lot?.prixUnitaireHt;
    return pu != null ? pu : null;
  }

  rowMontantValue(row: LotHierarchyRow): number | null {
    const m = row.poste?.montantHt ?? row.lot?.montantHt;
    return m != null ? m : null;
  }

  rowAvancement(row: LotHierarchyRow): number {
    return row.lot?.avancementPercent ?? 0;
  }

  async editRow(row: LotHierarchyRow): Promise<void> {
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

  async deleteRow(row: LotHierarchyRow): Promise<void> {
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
