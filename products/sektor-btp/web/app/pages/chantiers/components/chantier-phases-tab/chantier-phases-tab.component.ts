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

import { ButtonComponent, EmptyStateComponent } from '@lib/anatomy/components';
import { ConfirmDialogService, ToastService } from '@lib/anatomy';
import type { LotChantier, PhaseChantier } from '@applications/erp/chantiers/models';
import { DocScanButtonComponent } from '@applications/erp/shared/components/doc-scan-button/doc-scan-button.component';
import { ErpDocScanService } from '@applications/erp/shared/services/erp-doc-scan.service';
import { TenantContextService } from '@platform/core/tenant/tenant.context';
import { DocTypeService } from '@platform/features/documents/doc-extractor/services/doc-type.service';
import { PHASE_STATUS_KEYS } from '@applications/erp/shell/i18n-labels';

import { ChantierLotApiService } from '../../services/chantier-lot-api.service';
import { ChantierPhaseApiService } from '../../services/chantier-phase-api.service';
import { mapAiPlanningExtraction } from '../../utils/planning-gantt-ai.mapper';
import {
  buildPhaseCode,
  enrichPlanningTasksWithLots,
  extractPdfText,
  filterPlanningTasks,
  parseGanttPdfText,
  type ParsedPlanningTask,
} from '../../utils/planning-gantt-pdf.util';
import {
  PhaseImportPreviewDialogComponent,
  type PhaseImportPreviewDialogResult,
  type PhaseImportPreviewRow,
} from '../phase-import-preview-dialog/phase-import-preview-dialog.component';

type PhaseImportStats = {
  createdPhases: number;
  skippedPhases: number;
  failed: number;
};

const PHASE_STATUS_CSS: Record<string, string> = {
  PLANIFIE: 'badge--info',
  EN_COURS: 'badge--success',
  TERMINE: 'badge--secondary',
  EN_RETARD: 'badge--danger',
};

const MIN_LOCAL_PARSE_TASKS = 10;

@Component({
  selector: 'app-chantier-phases-tab',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    CommonModule,
    TranslateModule,
    ButtonComponent,
    EmptyStateComponent,
    DocScanButtonComponent,
  ],
  template: `
    <section class="tab-panel">
      <div class="tab-panel__toolbar">
        <nf-button variant="primary" icon="plus" iconLibrary="lucide" (clicked)="addPhase()">
          {{ 'chantiers.chantier.detail.phases.addAction' | translate }}
        </nf-button>
        <nf-button variant="secondary" icon="upload" iconLibrary="lucide" (clicked)="triggerPdfImport()" [disabled]="importing()">
          {{ 'chantiers.chantier.detail.phases.importPdfCta' | translate }}
        </nf-button>
        <erp-doc-scan-button
          domainKey="chantiers"
          docTypeKey="PLANNING_GANTT_PDF"
          [labelKey]="'chantiers.chantier.detail.phases.scanAiCta'"
          accept=".pdf,.png,.jpg,.jpeg,.webp"
          [disabled]="importing()"
          (extracted)="onAiExtracted($event)"
          (scanError)="onAiScanError()" />
        <input
          #pdfImportInput
          type="file"
          accept=".pdf,application/pdf"
          (change)="onPdfSelected($event)"
          hidden />
      </div>

      @if (importing()) {
        <p class="import-file-chip import-file-chip--progress">
          {{ 'chantiers.chantier.detail.phases.phaseImportInProgress' | translate }}
        </p>
      }

      @if (phases().length) {
        <table class="data-table">
          <thead>
            <tr>
              <th>{{ 'chantiers.chantier.detail.columns.code' | translate }}</th>
              <th>{{ 'chantiers.chantier.detail.columns.designation' | translate }}</th>
              <th>{{ 'chantiers.chantier.detail.columns.responsable' | translate }}</th>
              <th>{{ 'chantiers.chantier.detail.columns.debut' | translate }}</th>
              <th>{{ 'chantiers.chantier.detail.columns.fin' | translate }}</th>
              <th class="center">{{ 'chantiers.chantier.detail.columns.avancement' | translate }}</th>
              <th>{{ 'chantiers.chantier.detail.columns.status' | translate }}</th>
            </tr>
          </thead>
          <tbody>
            @for (phase of phases(); track phase.id) {
              <tr>
                <td><strong>{{ phase.code }}</strong></td>
                <td>{{ phase.designation }}</td>
                <td>{{ phase.responsableName ?? '—' }}</td>
                <td class="date">{{ phase.dateDebut | date:'dd/MM/yy' }}</td>
                <td class="date">{{ phase.dateFin | date:'dd/MM/yy' }}</td>
                <td class="center">
                  <div class="progress-wrap">
                    <div class="progress-bar sm"><div class="progress-fill" [style.width.%]="phase.avancementPercent" [class.progress-fill--done]="phase.avancementPercent >= 100" [class.progress-fill--warn]="phase.status === 'EN_RETARD'"></div></div>
                    <span>{{ phase.avancementPercent }}%</span>
                  </div>
                </td>
                <td><span class="badge {{ phaseStatusCss(phase.status) }}">{{ phaseStatusLabel(phase.status) }}</span></td>
              </tr>
            }
          </tbody>
        </table>
      } @else {
        <nf-empty-state
          icon="timeline"
          [title]="'chantiers.chantier.detail.empty.phasesTitle' | translate"
          [message]="'chantiers.chantier.detail.empty.phasesMessage' | translate"></nf-empty-state>
      }
    </section>
  `,
  styles: [`
    .tab-panel__toolbar { display: flex; flex-wrap: wrap; gap: 0.5rem; justify-content: flex-end; margin-bottom: 0.75rem; }
    .import-file-chip { margin: 0 0 0.75rem; font-size: 0.85rem; color: var(--nf-color-text-secondary); }
    .import-file-chip--progress { color: var(--nf-color-primary-700); font-weight: 600; }
    .data-table { width: 100%; border-collapse: collapse; font-size: 0.875rem; border: 1px solid var(--nf-color-border); border-radius: 8px; overflow: hidden; }
    .data-table th { text-align: left; padding: 0.65rem 1rem; background: var(--nf-color-bg-muted); font-weight: 600; color: var(--nf-color-text-secondary); font-size: 0.75rem; text-transform: uppercase; letter-spacing: 0.04em; }
    .data-table th.center { text-align: center; }
    .data-table td { padding: 0.65rem 1rem; border-bottom: 1px solid var(--nf-color-bg-muted); color: var(--nf-color-text-secondary); }
    .data-table td.center { text-align: center; }
    .data-table td.date { white-space: nowrap; font-size: 0.8rem; }
    .data-table tbody tr:last-child td { border-bottom: none; }
    .progress-bar { height: 6px; background: var(--nf-color-border); border-radius: 3px; overflow: hidden; flex-shrink: 0; }
    .progress-bar.sm { width: 60px; }
    .progress-fill { height: 100%; background: var(--nf-color-primary-500); border-radius: 3px; transition: width 0.3s; }
    .progress-fill--warn { background: var(--nf-color-warning-500); }
    .progress-fill--done { background: var(--nf-color-success-600); }
    .progress-wrap { display: flex; align-items: center; gap: 6px; justify-content: center; font-size: 0.8rem; }
    .badge { display: inline-block; padding: 2px 8px; border-radius: 4px; font-size: 0.72rem; font-weight: 600; white-space: nowrap; }
    .badge--info { background: var(--nf-color-primary-100); color: var(--nf-color-primary-700); }
    .badge--success { background: var(--nf-color-success-100); color: var(--nf-color-success-700); }
    .badge--danger { background: var(--nf-color-danger-100); color: var(--nf-color-danger-700); }
    .badge--secondary { background: var(--nf-color-bg-muted); color: var(--nf-color-text-secondary); }
  `],
})
export class ChantierPhasesTabComponent {
  readonly chantierId = input.required<string>();

  private readonly phaseApi = inject(ChantierPhaseApiService);
  private readonly lotApi = inject(ChantierLotApiService);
  private readonly dialog = inject(MatDialog);
  private readonly confirmDialog = inject(ConfirmDialogService);
  private readonly translate = inject(TranslateService);
  private readonly toast = inject(ToastService);
  private readonly erpDocScan = inject(ErpDocScanService);
  private readonly tenantContext = inject(TenantContextService);
  private readonly docTypeService = inject(DocTypeService);

  @ViewChild('pdfImportInput') private readonly pdfImportInput?: ElementRef<HTMLInputElement>;

  readonly importing = signal(false);
  readonly phases = signal<PhaseChantier[]>([]);
  readonly lots = signal<LotChantier[]>([]);

  readonly rootLots = computed(() => this.lots().filter((lot) => !lot.parentLotId));

  constructor() {
    effect(() => {
      const id = this.chantierId();
      if (!id) {
        this.phases.set([]);
        this.lots.set([]);
        return;
      }
      void this.reload(id);
    });
  }

  async reload(chantierId?: string): Promise<void> {
    const id = chantierId ?? this.chantierId();
    if (!id) return;
    try {
      const [phases, lots] = await Promise.all([
        this.phaseApi.listByChantier(id),
        this.lotApi.listByChantier(id),
      ]);
      this.phases.set(phases);
      this.lots.set(lots);
    } catch {
      this.phases.set([]);
      this.lots.set([]);
    }
  }

  phaseStatusLabel(status: string): string {
    const key = PHASE_STATUS_KEYS[status as keyof typeof PHASE_STATUS_KEYS];
    return key ? this.translate.instant(key) : status;
  }

  phaseStatusCss(status: string): string {
    return PHASE_STATUS_CSS[status] ?? 'badge--secondary';
  }

  triggerPdfImport(): void {
    this.pdfImportInput?.nativeElement.click();
  }

  async onPdfSelected(event: Event): Promise<void> {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0];
    input.value = '';
    if (!file) return;

    try {
      const text = await extractPdfText(file);
      let tasks = filterPlanningTasks(parseGanttPdfText(text));
      if (tasks.length < MIN_LOCAL_PARSE_TASKS) {
        this.toast.info(this.translate.instant('chantiers.chantier.detail.phases.importFallbackAi'));
        tasks = await this.extractWithAi(file);
      }
      await this.openPreviewAndImport(tasks);
    } catch {
      this.toast.error(this.translate.instant('chantiers.chantier.detail.phases.importParseFailed'));
    }
  }

  async onAiExtracted(extracted: Record<string, unknown>): Promise<void> {
    const tasks = mapAiPlanningExtraction(extracted, this.rootLots());
    if (!tasks.length) {
      this.toast.error(this.translate.instant('chantiers.chantier.detail.phases.importParseFailed'));
      return;
    }
    await this.openPreviewAndImport(tasks);
  }

  onAiScanError(): void {
    this.toast.error(this.translate.instant('chantiers.chantier.detail.phases.importScanFailed'));
  }

  async addPhase(): Promise<void> {
    const chantierId = this.chantierId();
    if (!chantierId) return;
    const today = new Date().toISOString().slice(0, 10);
    const in3m = new Date(new Date().setMonth(new Date().getMonth() + 3)).toISOString().slice(0, 10);
    const result = await this.confirmDialog.prompt({
      title: this.translate.instant('chantiers.chantier.detail.phases.addTitle'),
      fields: [
        { key: 'code', label: 'chantiers.chantier.detail.phases.promptCode', required: true },
        { key: 'designation', label: 'chantiers.chantier.detail.phases.promptDesignation', required: true },
        { key: 'dateDebut', label: 'chantiers.chantier.detail.phases.promptDateDebut', required: true, initial: today },
        { key: 'dateFin', label: 'chantiers.chantier.detail.phases.promptDateFin', required: true, initial: in3m },
        { key: 'responsableName', label: 'chantiers.chantier.detail.phases.promptResponsable', required: false },
      ],
      confirmLabel: this.translate.instant('chantiers.chantier.detail.phases.addAction'),
      cancelLabel: this.translate.instant('chantiers.chantier.detail.cancel'),
      icon: 'timeline',
    });
    if (!result) return;
    try {
      const phase = await this.phaseApi.createForChantier(chantierId, {
        code: result['code']?.trim(),
        designation: result['designation']?.trim(),
        dateDebut: result['dateDebut'],
        dateFin: result['dateFin'],
        responsableName: result['responsableName']?.trim() || undefined,
        avancementPercent: 0,
        status: 'PLANIFIE',
      });
      this.phases.update((rows) => [...rows, phase]);
      this.toast.success(this.translate.instant('chantiers.chantier.detail.phases.createSuccess'));
    } catch {
      this.toast.error(this.translate.instant('chantiers.chantier.detail.phases.createFailed'));
    }
  }

  private async extractWithAi(file: File): Promise<ParsedPlanningTask[]> {
    const tenantId = this.tenantContext.tenantId();
    if (!tenantId) {
      throw new Error('ERP_DOC_SCAN_TENANT_MISSING');
    }
    const definition = await firstValueFrom(
      this.docTypeService.getActiveDefinition('chantiers', 'PLANNING_GANTT_PDF', tenantId),
    );
    const extracted = await this.erpDocScan.extractJson({
      file,
      dataSchema: definition.jsonSchema,
      presentationSchema: definition.uiSchema,
      instructions: definition.promptTemplate,
      schemaName: definition.name,
    });
    return mapAiPlanningExtraction(extracted, this.rootLots());
  }

  private async openPreviewAndImport(tasks: ParsedPlanningTask[]): Promise<void> {
    if (!tasks.length) {
      this.toast.error(this.translate.instant('chantiers.chantier.detail.phases.importParseFailed'));
      return;
    }

    const enriched = enrichPlanningTasksWithLots(tasks, this.rootLots());
    const ref = this.dialog.open(PhaseImportPreviewDialogComponent, {
      data: { tasks: enriched, lots: this.rootLots() },
      autoFocus: 'first-tabbable',
    });
    const result = await firstValueFrom(ref.afterClosed()) as PhaseImportPreviewDialogResult | undefined;
    if (!result?.tasks.length) return;

    this.importing.set(true);
    try {
      const stats = await this.importPhases(this.chantierId(), result.tasks);
      this.showImportToast(stats);
    } finally {
      this.importing.set(false);
      await this.reload();
    }
  }

  private async importPhases(chantierId: string, rows: PhaseImportPreviewRow[]): Promise<PhaseImportStats> {
    const stats: PhaseImportStats = { createdPhases: 0, skippedPhases: 0, failed: 0 };
    await this.reload(chantierId);
    const phaseByCode = new Map(this.phases().map((phase) => [phase.code, phase]));

    for (const row of rows) {
      const code = row.code || buildPhaseCode(row.numero);
      if (phaseByCode.has(code)) {
        stats.skippedPhases += 1;
        continue;
      }
      try {
        const phase = await this.phaseApi.createForChantier(chantierId, {
          code,
          designation: row.designation,
          lotId: row.lotId,
          dateDebut: row.dateDebut,
          dateFin: row.dateFin,
          avancementPercent: 0,
          status: 'PLANIFIE',
        });
        phaseByCode.set(code, phase);
        stats.createdPhases += 1;
      } catch {
        stats.failed += 1;
      }
    }

    return stats;
  }

  private showImportToast(stats: PhaseImportStats): void {
    if (stats.failed > 0 || stats.skippedPhases > 0) {
      this.toast.info(this.translate.instant('chantiers.chantier.detail.phases.phaseImportPartial', {
        created: stats.createdPhases,
        skipped: stats.skippedPhases,
        failed: stats.failed,
      }));
      return;
    }
    this.toast.success(this.translate.instant('chantiers.chantier.detail.phases.phaseImportSuccess', {
      created: stats.createdPhases,
    }));
  }
}
