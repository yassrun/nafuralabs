import { CommonModule } from '@angular/common';
import {
  ChangeDetectionStrategy,
  Component,
  ElementRef,
  ViewChild,
  computed,
  effect,
  inject,
  input,
  signal,
} from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { firstValueFrom } from 'rxjs';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import * as XLSX from 'xlsx';

import {
  BadgeComponent,
  ButtonComponent,
  EmptyStateComponent,
  TreeTableComponent,
  type NfTreeTableColumn,
} from '@lib/anatomy/components';
import { ToastService } from '@lib/anatomy';
import { MadCurrencyPipe } from '@lib/anatomy/pipes/mad-currency.pipe';
import type { LotChantier, PosteBudgetaire } from '@applications/erp/chantiers/models';

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
import { isBpdeWorkbook, parseBpdeWorkbook, buildBpdeSousLotCode, type BpdeParsedLot } from '../../utils/bpde-lot-import.util';

type LotImportIssueReason = 'missingRequired' | 'invalidQuantite' | 'invalidPrixUnitaire' | 'apiCreateFailed';

type ParsedLotImportRow = {
  sourceLine: number;
  data: Partial<LotChantier>;
};

type LotImportIssue = {
  sourceLine: number;
  reason: LotImportIssueReason;
};

type ParsedLotImportResult = {
  rows: ParsedLotImportRow[];
  issues: LotImportIssue[];
};

type BpdeImportStats = {
  createdLots: number;
  createdPostes: number;
  skippedLots: number;
  skippedPostes: number;
  failed: number;
};

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
        <nf-button variant="secondary" icon="upload" iconLibrary="lucide" (clicked)="triggerLotImport()" [disabled]="importing()">
          {{ 'chantiers.chantier.detail.lots.importCta' | translate }}
        </nf-button>
        @if (selectedLotImportFile()) {
          <nf-button variant="secondary" icon="play" iconLibrary="lucide" (clicked)="confirmLotImport()" [disabled]="importing()">
            {{ 'chantiers.chantier.detail.lots.importConfirmCta' | translate }}
          </nf-button>
        }
        <nf-button variant="ghost" icon="download" iconLibrary="lucide" (clicked)="downloadLotImportTemplate()">
          {{ 'chantiers.chantier.detail.lots.templateCta' | translate }}
        </nf-button>
        <nf-button variant="ghost" icon="copy" iconLibrary="lucide" (clicked)="copyLotImportMapping()">
          {{ 'chantiers.chantier.detail.lots.mappingCta' | translate }}
        </nf-button>
        <input
          #lotImportInput
          type="file"
          accept=".csv,.xlsx,.xls"
          (change)="onLotFileSelected($event)"
          hidden />
      </div>

      @if (importing()) {
        <p class="import-file-chip import-file-chip--progress">
          {{ 'chantiers.chantier.detail.lots.bpdeImportInProgress' | translate }}
        </p>
      }
      @if (selectedLotImportFileName(); as fileName) {
        <p class="import-file-chip">
          {{ 'chantiers.chantier.detail.lots.importFileSelected' | translate:{ fileName: fileName } }}
          @if (selectedLotImportRowCount(); as count) {
            <strong>({{ count }} {{ 'chantiers.chantier.detail.lots.importFileRowsLabel' | translate:{ count: count } }})</strong>
          }
        </p>
      }

      <div class="mapping-help">
        <p class="mapping-help__title">{{ 'chantiers.chantier.detail.lots.mappingHelpTitle' | translate }}</p>
        <p class="mapping-help__hint">{{ 'chantiers.chantier.detail.lots.mappingHelpHint' | translate }}</p>
        <ul class="mapping-help__list">
          <li><strong>code</strong>: {{ 'chantiers.chantier.detail.lots.mappingHelpCode' | translate }}</li>
          <li><strong>designation</strong>: {{ 'chantiers.chantier.detail.lots.mappingHelpDesignation' | translate }}</li>
          <li><strong>quantite</strong>: {{ 'chantiers.chantier.detail.lots.mappingHelpQuantite' | translate }}</li>
          <li><strong>unite</strong>: {{ 'chantiers.chantier.detail.lots.mappingHelpUnite' | translate }}</li>
          <li><strong>prix_unitaire_ht</strong>: {{ 'chantiers.chantier.detail.lots.mappingHelpPrixUnitaire' | translate }}</li>
        </ul>
      </div>

      @if (treeNodes().length || loading()) {
        <nf-tree-table
          [nodes]="treeNodes()"
          [columns]="treeColumns"
          treeColumnKey="designation"
          [loading]="loading()"
          minWidth="64rem">
          <ng-template #cell let-row let-column="column">
            @switch (column.key) {
              @case ('type') {
                <nf-badge [variant]="typeBadgeVariant(row.kind)">
                  {{ typeLabelKey(row.kind) | translate }}
                </nf-badge>
              }
              @case ('code') {
                <strong>{{ rowCode(row) }}</strong>
              }
              @case ('designation') {
                {{ rowDesignation(row) }}
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
            }
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
    .progress-wrap { display: flex; flex-direction: column; align-items: center; gap: 0.25rem; }
    .progress-bar { width: 100%; height: 6px; background: var(--nf-color-bg-muted); border-radius: 999px; overflow: hidden; }
    .progress-bar.sm { max-width: 80px; }
    .progress-fill { height: 100%; background: var(--nf-color-primary-600); border-radius: 999px; }
    .import-file-chip { margin: 0 0 0.75rem; padding: 0.5rem 0.75rem; background: var(--nf-color-bg-subtle); border-radius: 0.5rem; font-size: 0.875rem; color: var(--nf-color-text-secondary); }
    .mapping-help { margin-bottom: 1rem; padding: 0.75rem 1rem; background: var(--nf-color-bg-subtle); border: 1px solid var(--nf-color-border); border-radius: 0.75rem; font-size: 0.8125rem; color: var(--nf-color-text-secondary); }
    .mapping-help__title { margin: 0 0 0.35rem; font-weight: 600; color: var(--nf-color-text-primary); }
    .mapping-help__hint { margin: 0 0 0.5rem; }
    .mapping-help__list { margin: 0; padding-left: 1.25rem; }
  `],
})
export class ChantierLotsTabComponent {
  readonly chantierId = input.required<string>();

  private readonly lotApi = inject(ChantierLotApiService);
  private readonly posteApi = inject(PosteBudgetaireApiService);
  private readonly dialog = inject(MatDialog);
  private readonly translate = inject(TranslateService);
  private readonly toast = inject(ToastService);

  @ViewChild('lotImportInput') private readonly lotImportInput?: ElementRef<HTMLInputElement>;

  readonly loading = signal(false);
  readonly importing = signal(false);
  readonly lots = signal<LotChantier[]>([]);
  readonly postesByLotId = signal<Record<string, PosteBudgetaire[]>>({});

  readonly selectedLotImportFile = signal<File | null>(null);
  readonly selectedLotImportFileName = computed(() => this.selectedLotImportFile()?.name ?? '');
  readonly selectedLotImportRowCount = signal<number | null>(null);

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
  ];

  readonly treeNodes = computed(() =>
    buildLotTreeNodes(this.lots(), this.postesByLotId()),
  );

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
        await this.posteApi.createForLot(lotId, {
          code: result.code,
          designation: result.designation,
          quantite: result.quantite,
          unite: result.unite,
          prixUnitaireHt: result.prixUnitaireHt,
          montantHt: Math.round(result.quantite * result.prixUnitaireHt * 100) / 100,
          ordre: postes.length + 1,
        });
        this.toast.success(this.translate.instant('chantiers.chantier.detail.lots.posteCreateSuccess'));
      } else {
        await this.lotApi.createForChantier(chantierId, {
          code: result.code,
          designation: result.designation,
          quantite: result.quantite,
          unite: result.unite,
          prixUnitaireHt: result.prixUnitaireHt,
          montantHt: Math.round(result.quantite * result.prixUnitaireHt * 100) / 100,
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

  triggerLotImport(): void {
    this.lotImportInput?.nativeElement.click();
  }

  downloadLotImportTemplate(): void {
    const headers = ['code', 'designation', 'quantite', 'unite', 'prix_unitaire_ht'];
    const sample = ['L01', 'Terrassement', '100', 'm3', '250'];
    const csvContent = `${headers.join(',')}\n${sample.join(',')}\n`;
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = globalThis.URL.createObjectURL(blob);
    const anchor = globalThis.document.createElement('a');
    anchor.href = url;
    anchor.download = 'modele-import-lots.csv';
    anchor.click();
    globalThis.URL.revokeObjectURL(url);
    this.toast.success(this.translate.instant('chantiers.chantier.detail.lots.templateDownloaded'));
  }

  async copyLotImportMapping(): Promise<void> {
    try {
      await this.writeClipboard(this.buildLotImportMappingHint());
      this.toast.success(this.translate.instant('chantiers.chantier.detail.lots.mappingCopied'));
    } catch {
      this.toast.error(this.translate.instant('chantiers.chantier.detail.lots.mappingCopyFailed'));
    }
  }

  async onLotFileSelected(event: Event): Promise<void> {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0];
    input.value = '';
    if (!file) return;
    try {
      const rowCount = await this.countLotsFileRows(file);
      this.selectedLotImportFile.set(file);
      this.selectedLotImportRowCount.set(rowCount);
      this.toast.info(
        this.translate.instant('chantiers.chantier.detail.lots.importReady', {
          fileName: file.name,
          count: rowCount,
        }),
      );
    } catch {
      this.toast.error(this.translate.instant('chantiers.chantier.detail.lots.importParseCountFailed'));
      this.selectedLotImportFile.set(null);
      this.selectedLotImportRowCount.set(null);
    }
  }

  async confirmLotImport(): Promise<void> {
    const file = this.selectedLotImportFile();
    if (!file) {
      this.toast.error(this.translate.instant('chantiers.chantier.detail.lots.importNoFile'));
      return;
    }
    await this.importLotsFromFile(file);
    this.selectedLotImportFile.set(null);
    this.selectedLotImportRowCount.set(null);
  }

  private buildLotImportMappingHint(): string {
    return [
      'code: code | lot | lot_code | lotcode',
      'designation: designation | description | intitule | name',
      'quantite: quantite | quantity | qte',
      'unite: unite | unit | uom',
      'prix_unitaire_ht: prix_unitaire_ht | prixunitaireht | prixunitaire | pu | unitprice',
    ].join('\n');
  }

  private async writeClipboard(value: string): Promise<void> {
    if (globalThis.navigator?.clipboard?.writeText) {
      await globalThis.navigator.clipboard.writeText(value);
      return;
    }
    throw new Error('clipboard-api-unavailable');
  }

  private async importLotsFromFile(file: File): Promise<void> {
    const chantierId = this.chantierId();
    this.importing.set(true);
    try {
      const buffer = await file.arrayBuffer();
      const workbook = XLSX.read(buffer, { type: 'array' });
      if (isBpdeWorkbook(workbook)) {
        const bpdeLots = parseBpdeWorkbook(workbook);
        if (!bpdeLots.length) {
          this.toast.error(this.translate.instant('chantiers.chantier.detail.lots.importInvalidFile'));
          return;
        }
        const stats = await this.importBpdeLots(chantierId, bpdeLots);
        this.showBpdeImportToast(stats);
        return;
      }

      const parsed = await this.parseLotsFileFromWorkbook(workbook);
      if (!parsed.rows.length) {
        this.toast.error(this.translate.instant('chantiers.chantier.detail.lots.importInvalidFile'));
        return;
      }
      const initialOrder = this.lots().length;
      const created: LotChantier[] = [];
      const issues: LotImportIssue[] = [...parsed.issues];

      for (let i = 0; i < parsed.rows.length; i += 1) {
        const row = parsed.rows[i];
        try {
          const lot = await this.lotApi.createForChantier(chantierId, {
            ...row.data,
            ordre: initialOrder + i + 1,
          });
          created.push(lot);
        } catch {
          issues.push({ sourceLine: row.sourceLine, reason: 'apiCreateFailed' });
        }
      }

      if (!created.length) {
        this.toast.error(this.translate.instant('chantiers.chantier.detail.lots.importFailed'));
        return;
      }

      if (issues.length > 0) {
        this.toast.success(
          this.translate.instant('chantiers.chantier.detail.lots.importPartial', {
            imported: created.length,
            total: parsed.rows.length + parsed.issues.length,
          }),
        );
        this.toast.warning(
          this.translate.instant('chantiers.chantier.detail.lots.importIssuesSummary', {
            failed: issues.length,
            total: parsed.rows.length + parsed.issues.length,
            details: this.formatImportIssueDetails(issues),
          }),
        );
      } else {
        this.toast.success(
          this.translate.instant('chantiers.chantier.detail.lots.importSuccess', { count: created.length }),
        );
      }
    } catch {
      this.toast.error(this.translate.instant('chantiers.chantier.detail.lots.importFailed'));
    } finally {
      await this.reload();
      this.importing.set(false);
    }
  }

  private showBpdeImportToast(stats: BpdeImportStats): void {
    const created = stats.createdLots + stats.createdPostes;
    const skipped = stats.skippedLots + stats.skippedPostes;
    if (created === 0 && stats.failed > 0) {
      this.toast.error(this.translate.instant('chantiers.chantier.detail.lots.importFailed'));
      return;
    }
    if (skipped > 0 || stats.failed > 0) {
      this.toast.success(
        this.translate.instant('chantiers.chantier.detail.lots.bpdeImportPartial', {
          lots: stats.createdLots,
          postes: stats.createdPostes,
          skipped,
          failed: stats.failed,
        }),
      );
      return;
    }
    this.toast.success(
      this.translate.instant('chantiers.chantier.detail.lots.bpdeImportSuccess', {
        lots: stats.createdLots,
        postes: stats.createdPostes,
      }),
    );
  }

  private buildLotCodeIndex(lots: LotChantier[]): Map<string, LotChantier> {
    return new Map(lots.map((lot) => [lot.code, lot]));
  }

  private buildPosteCodeIndex(postesByLotId: Record<string, PosteBudgetaire[]>): Map<string, Set<string>> {
    const index = new Map<string, Set<string>>();
    for (const [lotId, postes] of Object.entries(postesByLotId)) {
      index.set(lotId, new Set(postes.map((poste) => poste.code)));
    }
    return index;
  }

  private async resolveOrCreateLot(
    chantierId: string,
    code: string,
    designation: string,
    lotByCode: Map<string, LotChantier>,
    stats: BpdeImportStats,
    options: { parentLotId?: string; ordre: number },
  ): Promise<LotChantier | null> {
    const existing = lotByCode.get(code);
    if (existing) {
      stats.skippedLots += 1;
      return existing;
    }
    try {
      const lot = await this.lotApi.createForChantier(chantierId, {
        code,
        designation,
        parentLotId: options.parentLotId,
        ordre: options.ordre,
        avancementPercent: 0,
      });
      lotByCode.set(code, lot);
      stats.createdLots += 1;
      return lot;
    } catch {
      stats.failed += 1;
      return null;
    }
  }

  private async createPosteIfNew(
    lotId: string,
    poste: BpdeParsedLot['postes'][number],
    posteCodesByLot: Map<string, Set<string>>,
    stats: BpdeImportStats,
    ordre: number,
  ): Promise<void> {
    const codes = posteCodesByLot.get(lotId) ?? new Set<string>();
    if (codes.has(poste.code)) {
      stats.skippedPostes += 1;
      return;
    }
    try {
      await this.posteApi.createForLot(lotId, {
        code: poste.code,
        designation: poste.designation,
        unite: poste.unite,
        quantite: poste.quantite,
        prixUnitaireHt: poste.prixUnitaireHt,
        montantHt: poste.montantHt,
        ordre,
      });
      codes.add(poste.code);
      posteCodesByLot.set(lotId, codes);
      stats.createdPostes += 1;
    } catch {
      stats.failed += 1;
    }
  }

  private async importBpdeLots(chantierId: string, bpdeLots: BpdeParsedLot[]): Promise<BpdeImportStats> {
    const stats: BpdeImportStats = {
      createdLots: 0,
      createdPostes: 0,
      skippedLots: 0,
      skippedPostes: 0,
      failed: 0,
    };
    await this.reload(chantierId);
    let order = this.lots().length;
    const lotByCode = this.buildLotCodeIndex(this.lots());
    const posteCodesByLot = this.buildPosteCodeIndex(this.postesByLotId());
    let posteOrdre = 1;

    for (const bpdeLot of bpdeLots) {
      order += 1;
      const rootLot = await this.resolveOrCreateLot(
        chantierId,
        bpdeLot.code,
        bpdeLot.designation,
        lotByCode,
        stats,
        { ordre: order },
      );
      if (!rootLot) continue;

      for (const poste of bpdeLot.postes) {
        await this.createPosteIfNew(rootLot.id, poste, posteCodesByLot, stats, posteOrdre);
        posteOrdre += 1;
      }

      for (const sousLot of bpdeLot.sousLots) {
        order += 1;
        const sousLotCode = buildBpdeSousLotCode(bpdeLot.code, sousLot, order);
        const childLot = await this.resolveOrCreateLot(
          chantierId,
          sousLotCode,
          sousLot.designation,
          lotByCode,
          stats,
          { parentLotId: rootLot.id, ordre: order },
        );
        if (!childLot) continue;

        for (const poste of sousLot.postes) {
          await this.createPosteIfNew(childLot.id, poste, posteCodesByLot, stats, posteOrdre);
          posteOrdre += 1;
        }
      }
    }

    return stats;
  }

  private async countLotsFileRows(file: File): Promise<number> {
    const buffer = await file.arrayBuffer();
    const workbook = XLSX.read(buffer, { type: 'array' });
    const firstSheetName = workbook.SheetNames[0];
    if (!firstSheetName) return 0;
    const worksheet = workbook.Sheets[firstSheetName];
    const rawRows = XLSX.utils.sheet_to_json<Record<string, unknown>>(worksheet, { defval: '' });
    return Math.max(0, rawRows.length);
  }

  private async parseLotsFile(file: File): Promise<ParsedLotImportResult> {
    const buffer = await file.arrayBuffer();
    const workbook = XLSX.read(buffer, { type: 'array' });
    return this.parseLotsFileFromWorkbook(workbook);
  }

  private parseLotsFileFromWorkbook(workbook: XLSX.WorkBook): ParsedLotImportResult {
    const firstSheetName = workbook.SheetNames[0];
    if (!firstSheetName) return { rows: [], issues: [] };

    const worksheet = workbook.Sheets[firstSheetName];
    const rawRows = XLSX.utils.sheet_to_json<Record<string, unknown>>(worksheet, { defval: '' });
    const rows: ParsedLotImportRow[] = [];
    const issues: LotImportIssue[] = [];

    for (let index = 0; index < rawRows.length; index += 1) {
      const rawRow = rawRows[index];
      const sourceLine = index + 2;
      const code = this.readString(rawRow, ['code', 'lot', 'lotcode', 'lot_code']);
      const designation = this.readString(rawRow, ['designation', 'description', 'intitule', 'name']);
      const unite = this.readString(rawRow, ['unite', 'unit', 'uom']);
      const quantite = this.readNumber(rawRow, ['quantite', 'quantity', 'qte']);
      const prixUnitaireHt = this.readNumber(rawRow, [
        'prixunitaireht',
        'prix_unitaire_ht',
        'prixunitaire',
        'pu',
        'unitprice',
      ]);

      if (!code || !designation || !unite) {
        issues.push({ sourceLine, reason: 'missingRequired' });
        continue;
      }
      if (!Number.isFinite(quantite) || quantite <= 0) {
        issues.push({ sourceLine, reason: 'invalidQuantite' });
        continue;
      }
      if (!Number.isFinite(prixUnitaireHt) || prixUnitaireHt < 0) {
        issues.push({ sourceLine, reason: 'invalidPrixUnitaire' });
        continue;
      }

      rows.push({
        sourceLine,
        data: {
          code,
          designation,
          unite,
          quantite,
          prixUnitaireHt,
          montantHt: Math.round(quantite * prixUnitaireHt * 100) / 100,
          avancementPercent: 0,
        },
      });
    }

    return { rows, issues };
  }

  private formatImportIssueDetails(issues: LotImportIssue[]): string {
    const maxDisplayed = 3;
    const displayed = issues.slice(0, maxDisplayed).map((issue) => this.formatImportIssue(issue));
    const remaining = issues.length - displayed.length;
    if (remaining <= 0) return displayed.join(' | ');
    return `${displayed.join(' | ')} | ${this.translate.instant('chantiers.chantier.detail.lots.importIssueAndMore', { count: remaining })}`;
  }

  private formatImportIssue(issue: LotImportIssue): string {
    return this.translate.instant(this.importIssueReasonKey(issue.reason), { line: issue.sourceLine });
  }

  private importIssueReasonKey(reason: LotImportIssueReason): string {
    switch (reason) {
      case 'missingRequired':
        return 'chantiers.chantier.detail.lots.importIssueMissingRequired';
      case 'invalidQuantite':
        return 'chantiers.chantier.detail.lots.importIssueInvalidQuantite';
      case 'invalidPrixUnitaire':
        return 'chantiers.chantier.detail.lots.importIssueInvalidPrixUnitaire';
      case 'apiCreateFailed':
        return 'chantiers.chantier.detail.lots.importIssueApiFailed';
      default:
        return 'chantiers.chantier.detail.lots.importFailed';
    }
  }

  private readString(row: Record<string, unknown>, aliases: string[]): string {
    const value = this.readByAliases(row, aliases);
    if (typeof value === 'string') return value.trim();
    if (typeof value === 'number' || typeof value === 'boolean') return String(value).trim();
    return '';
  }

  private readNumber(row: Record<string, unknown>, aliases: string[]): number {
    const normalized = this.readString(row, aliases).replace(/\s+/g, '').replace(',', '.');
    const parsed = Number.parseFloat(normalized);
    return Number.isFinite(parsed) ? parsed : Number.NaN;
  }

  private readByAliases(row: Record<string, unknown>, aliases: string[]): unknown {
    const normalizedEntries = Object.entries(row).map(([key, value]) => [this.normalizeHeader(key), value] as const);
    for (const alias of aliases) {
      const aliasKey = this.normalizeHeader(alias);
      const found = normalizedEntries.find(([key]) => key === aliasKey);
      if (found) return found[1];
    }
    return undefined;
  }

  private normalizeHeader(value: string): string {
    return value
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/[^a-zA-Z0-9]/g, '')
      .toLowerCase();
  }
}
