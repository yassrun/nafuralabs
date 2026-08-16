import { Component, LOCALE_ID, OnDestroy, ViewChild, computed, effect, inject, signal, untracked, ChangeDetectionStrategy } from '@angular/core';
import { FormControl, FormGroup, ReactiveFormsModule } from '@angular/forms';
import { MatButtonToggleModule } from '@angular/material/button-toggle';
import { ActivatedRoute } from '@angular/router';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { Subscription } from 'rxjs';

import {
  ConfigDrivenDetailPage,
  ConfigDrivenDetailPageImports,
  ConfigDrivenDetailPageStyles,
  IconComponent,
  NfInputComponent,
  NfSelectComponent,
  createDetailFacadeFromCrud,
} from '@platform/lib/anatomy';
import type { PageHeaderConfig } from '@platform/lib/anatomy/components';
import { FieldTemplateDirective } from '@platform/lib/anatomy/components/organisms/entity-detail';
import type { DetailActionEvent, StatusTransitionEvent } from '@platform/lib/anatomy/types';

import type { InventoryTx } from '../../../models';
import { ReceptionLinesEditorComponent } from '../../../components/reception-lines-editor/reception-lines-editor.component';
import { RECEPTION_BL_EXTRACTION_SCHEMA } from '@app/socle/shared/extraction-schemas';
import {
  extractLines as extractRawLines,
  findByAliases,
  findStringByAliases,
  normalizeDate,
  normalizeText,
  toNumber,
} from '@app/socle/shared/utils/extraction-json.utils';
import {
  SmartImportTriggerComponent,
  type ExtractionDefinition,
  type ReviewedExtraction,
} from '@platform/app/document-extraction/smart-import';
import { buildReceptionDetailConfig } from '../config/detail/detail.config';
import { ReceptionFacade } from '../services/reception.facade';

type DeliveryMode = 'DEPOT' | 'CHANTIER_DIRECT';
type TxLine = { totalPrice?: number; quantity: number; unitPrice?: number };

@Component({
  selector: 'app-reception-detail',
  standalone: true,
  imports: [
    ...ConfigDrivenDetailPageImports,
    FieldTemplateDirective,
    ReceptionLinesEditorComponent,
    MatButtonToggleModule,
    NfSelectComponent,
    NfInputComponent,
    IconComponent,
    ReactiveFormsModule,
    TranslateModule,
    SmartImportTriggerComponent,
  ],
  templateUrl: './reception-detail.page.html',
  styleUrls: ['./reception-detail.page.scss'],
  changeDetection: ChangeDetectionStrategy.Eager,
  styles: [ConfigDrivenDetailPageStyles],
})
export class ReceptionDetailPage extends ConfigDrivenDetailPage<InventoryTx> implements OnDestroy {
  private blExtractor?: SmartImportTriggerComponent;

  @ViewChild('blExtractor')
  private set blExtractorComponent(value: SmartImportTriggerComponent | undefined) {
    this.blExtractor = value;
    queueMicrotask(() => this.tryAutoScanBl());
  }

  private readonly crud = inject(ReceptionFacade);
  private readonly activatedRoute = inject(ActivatedRoute);
  private readonly translate = inject(TranslateService);

  private lineTotalsSub: Subscription | null = null;
  private lineTotalsControl: FormControl | null = null;
  private pendingLinesControl: FormControl | null = null;
  private linesControlInitQueued = false;

  readonly facade = createDetailFacadeFromCrud<InventoryTx, Partial<InventoryTx>>({
    crud: this.crud,
    lookups: () => this.crud.lookups(),
  });
  readonly config = buildReceptionDetailConfig(this.translate);

  override get headerConfig(): PageHeaderConfig {
    const base = super.headerConfig;
    const item = this.item();
    if (!item?.txNumber) {
      return base;
    }

    return {
      ...base,
      title: this.translate.instant('inventory.mouvement.reception.headerTitleDetail'),
      subtitle: this.translate.instant('inventory.mouvement.reception.subtitleNumber', { number: item.txNumber }),
    };
  }

  get headerTitle(): string {
    if (this.mode() === 'create') return this.translate.instant('inventory.mouvement.reception.headerTitleNew');
    return this.translate.instant('inventory.mouvement.reception.headerTitleDetail');
  }

  readonly deliveryMode = signal<DeliveryMode>('DEPOT');
  readonly shouldAutoScanBl = signal(this.activatedRoute.snapshot.queryParamMap.get('scanBl') === '1');
  readonly blExtractionDefinition: ExtractionDefinition = {
    key: 'reception-bl',
    name: RECEPTION_BL_EXTRACTION_SCHEMA.name,
    description: RECEPTION_BL_EXTRACTION_SCHEMA.description,
    dataSchema: RECEPTION_BL_EXTRACTION_SCHEMA.dataSchema,
    presentationSchema: RECEPTION_BL_EXTRACTION_SCHEMA.presentationSchema,
    instructions: RECEPTION_BL_EXTRACTION_SCHEMA.instructions,
    arrayPath: RECEPTION_BL_EXTRACTION_SCHEMA.arrayPath!,
    config: {
      acceptedExtensions: ['.pdf', '.png', '.jpg', '.jpeg', '.webp'],
      acceptedMimeTypes: ['application/pdf', 'image/png', 'image/jpeg', 'image/webp'],
    },
  };

  readonly depotLookups = computed(() => this.getTypedLookup<{ key: string; value: string }>('locationsDepot'));

  readonly chantierLookups = computed(() => this.getTypedLookup<{ key: string; value: string }>('chantiersLookup'));

  readonly phaseLookups = computed(() => this.getTypedLookup<{ key: string; value: string }>('phasesLookup'));

  readonly depotSelectOptions = computed(() =>
    this.depotLookups().map((opt) => ({ value: opt.key, label: opt.value })),
  );

  readonly chantierSelectOptions = computed(() =>
    this.chantierLookups().map((opt) => ({ value: opt.key, label: opt.value })),
  );

  readonly phaseSelectOptions = computed(() =>
    this.phaseLookups().map((opt) => ({ value: opt.key, label: opt.value })),
  );

  private readonly linesValue = signal<TxLine[]>([]);
  private readonly locale = inject(LOCALE_ID);

  readonly linesTotal = computed(() => {
    const lines = this.lineTotalsControl
      ? this.linesValue()
      : (this.item()?.lines ?? []) as TxLine[];
    const total = lines.reduce(
      (acc, l) => acc + (l.totalPrice ?? (l.unitPrice == null ? 0 : l.quantity * l.unitPrice)),
      0,
    );
    return total.toLocaleString(this.locale, { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  });

  private readonly _inferModeEffect = effect(() => {
    const item = this.item();
    const chantierIds = new Set(
      this.getTypedLookup<{ key: string }>('chantiersLookup').map((c) => c.key),
    );
    const mode: DeliveryMode =
      item?.destLocationId && chantierIds.has(item.destLocationId)
        ? 'CHANTIER_DIRECT'
        : 'DEPOT';
    untracked(() => this.deliveryMode.set(mode));
  });

  private readonly _autoScanOnCreateEffect = effect(() => {
    if (!this.shouldAutoScanBl()) return;
    if (this.mode() !== 'create') return;

    queueMicrotask(() => this.tryAutoScanBl());
  });

  private tryAutoScanBl(): void {
    if (!this.shouldAutoScanBl() || this.mode() !== 'create' || !this.blExtractor) {
      return;
    }

    this.shouldAutoScanBl.set(false);
    this.blExtractor.selectFile();
  }

  onModeChange(mode: DeliveryMode, form: FormGroup): void {
    this.deliveryMode.set(mode);
    if (mode === 'CHANTIER_DIRECT') {
      form.get('destLocationId')?.setValue(null);
    } else {
      form.get('chantierLocationId')?.setValue(null);
      form.get('phaseRef')?.setValue('');
    }
    form.markAsDirty();
  }

  asFormControl(control: unknown): FormControl {
    return control as FormControl;
  }

  asLinesControl(control: unknown): FormControl {
    const linesControl = control as FormControl;

    if (this.lineTotalsControl !== linesControl) {
      this.pendingLinesControl = linesControl;
      if (!this.linesControlInitQueued) {
        this.linesControlInitQueued = true;
        queueMicrotask(() => {
          this.linesControlInitQueued = false;
          this.attachLinesControl(this.pendingLinesControl);
        });
      }
    }

    return linesControl;
  }

  private attachLinesControl(linesControl: FormControl | null): void {
    if (!linesControl || this.lineTotalsControl === linesControl) {
      return;
    }

    this.lineTotalsSub?.unsubscribe();
    this.lineTotalsSub = null;
    this.lineTotalsControl = linesControl;

    const nextValue = linesControl.value;
    this.linesValue.set(Array.isArray(nextValue) ? (nextValue as TxLine[]) : []);

    this.lineTotalsSub = linesControl.valueChanges.subscribe((value) => {
      this.linesValue.set(Array.isArray(value) ? (value as TxLine[]) : []);
    });
  }

  private getTypedLookup<T>(key: string): T[] {
    const raw = this.crud.lookups()[key];
    return Array.isArray(raw) ? (raw as T[]) : [];
  }

  protected override afterSave(item: InventoryTx): void {
    const wasEdit = this.mode() === 'edit';
    super.afterSave(item);
    if (wasEdit) {
      this.mode.set('view');
    }
  }

  protected override async handleSave(event: DetailActionEvent<InventoryTx>): Promise<void> {
    const v = event.formValue;

    if (this.deliveryMode() === 'DEPOT' && !v.destLocationId) {
      this.showError(this.translate.instant('inventory.mouvement.common.selectDepot'));
      return;
    }
    if (this.deliveryMode() === 'CHANTIER_DIRECT' && !v.chantierLocationId) {
      this.showError(this.translate.instant('inventory.mouvement.common.selectChantier'));
      return;
    }

    const lines = Array.isArray(v.lines) ? v.lines : [];
    if (lines.length === 0) {
      this.showError(this.translate.instant('inventory.mouvement.common.needLine'));
      return;
    }

    await super.handleSave(event);
  }

  protected override async handleCustomAction(event: DetailActionEvent<InventoryTx>): Promise<void> {
    if (event.actionId === 'enter_edit') {
      this.mode.set('edit');
      return;
    }

    if (event.actionId === 'scan_bl') {
      if (!this.blExtractor) {
        this.showError(this.translate.instant('inventory.mouvement.common.scanBlOpen'));
        return;
      }
      this.blExtractor.selectFile();
      return;
    }

    await super.handleCustomAction(event);
  }

  onBlExtractionComplete(result: ReviewedExtraction): void {
    try {
      const data = result.data;
      const fournisseurName =
        findStringByAliases(data, [
          'supplierName',
          'supplier',
          'fournisseur',
          'vendor',
          'vendorName',
        ]) ?? findStringByAliases(data['sender'], ['name']);
      const fournisseurId = this.resolveLookupId('fournisseursLookup', fournisseurName);

      const chantierName = findStringByAliases(data, [
            'chantier',
            'site',
            'project',
            'destinationSite',
          ]) ?? findStringByAliases(data['receiver'], ['name']);
      const chantierLocationId = this.resolveLookupId('chantiersLookup', chantierName);
      const depotName =
        findStringByAliases(data, ['depot', 'warehouse', 'destinationDepot']) ??
        findStringByAliases(data['receiver'], ['name']);
      const destLocationId = this.resolveLookupId('locationsDepot', depotName);

      const phase = findStringByAliases(data, ['phaseRef', 'phase']);
      const phaseRef = this.resolvePhase(phase);

      const reference = findStringByAliases(data, [
            'blReference',
            'transferReference',
            'reference',
            'docReference',
            'blNumber',
            'number',
          ]);

      const txDateRaw = findStringByAliases(data, [
            'txDate',
            'documentDate',
            'date',
            'blDate',
            'deliveryDate',
          ]);
      const txDate = normalizeDate(txDateRaw);

      const lines = this.extractLines(data);

      const mappedPatch: Partial<InventoryTx> = {};
      if (fournisseurId) mappedPatch.fournisseurId = fournisseurId;
      if (reference) mappedPatch.reference = reference;
      if (txDate) mappedPatch.txDate = txDate;
      if (phaseRef) mappedPatch.phaseRef = phaseRef;
      if (lines.length > 0) mappedPatch.lines = lines;

      if (chantierLocationId) {
        mappedPatch.chantierLocationId = chantierLocationId;
        mappedPatch.destLocationId = null as unknown as string;
        this.deliveryMode.set('CHANTIER_DIRECT');
      } else if (destLocationId) {
        mappedPatch.destLocationId = destLocationId;
        mappedPatch.chantierLocationId = null as unknown as string;
        mappedPatch.phaseRef = '';
        this.deliveryMode.set('DEPOT');
      }

      this.applyScanPatch(mappedPatch);
      this.showSuccess(this.translate.instant('inventory.mouvement.common.scanBlSuccess'));
    } catch {
      this.showError(this.translate.instant('inventory.mouvement.common.scanBlImpossible'));
    }
  }

  private applyScanPatch(patch: Partial<InventoryTx>): void {
    const form = this.detailComponent?.form;
    if (!form) {
      this.showError(this.translate.instant('inventory.mouvement.common.formNotReady'));
      return;
    }

    form.patchValue(patch);
    form.markAsDirty();
  }

  private resolvePhase(phase?: string): string | undefined {
    if (!phase) return undefined;
    const entries = this.phaseLookups();
    const normalized = normalizeText(phase);
    return entries.find((entry) => normalizeText(entry.value).includes(normalized))?.key;
  }

  private resolveLookupId(lookupKey: string, label?: string): string | undefined {
    if (!label) return undefined;
    const normalized = normalizeText(label);
    return this.getTypedLookup<{ key: string; value: string }>(lookupKey).find((entry) => {
      const entryLabel = normalizeText(entry.value);
      return entryLabel.includes(normalized) || normalized.includes(entryLabel);
    })?.key;
  }

  private extractLines(data: Record<string, unknown>): InventoryTx['lines'] {
    const rawLines = extractRawLines(data);
    const articleLookup = this.getTypedLookup<{ key: string; value: string; data?: Record<string, unknown> }>('articlesAll');

    const resolvedLines: InventoryTx['lines'] = [];
    for (const rawLine of rawLines) {
      const parsedLine = this.mapExtractedLine(rawLine, articleLookup, resolvedLines.length + 1);
      if (!parsedLine) continue;
      resolvedLines.push(parsedLine);
    }

    return resolvedLines;
  }

  private mapExtractedLine(
    line: Record<string, unknown>,
    articleLookup: Array<{ key: string; value: string; data?: Record<string, unknown> }>,
    lineNumber: number,
  ): InventoryTx['lines'][number] | null {
    const articleCode = findStringByAliases(line, [
      'articleCode',
      'code',
      'sku',
      'itemCode',
      'itemReference',
    ]);
    const articleName = findStringByAliases(line, [
      'articleName',
      'name',
      'designation',
      'itemName',
      'itemDesignation',
    ]);
    const article = this.resolveArticle(articleLookup, articleCode, articleName);
    if (!article) return null;

    const quantity = toNumber(findByAliases(line, ['quantity', 'qty', 'quantite']));
    if (quantity <= 0) return null;

    const unitPriceRaw = findByAliases(line, ['unitPrice', 'prixUnitaire', 'price', 'pu']);
    const unitPrice = toNumber(unitPriceRaw);
    const defaultPrice = toNumber(article.data?.['prix']);

    const uomId = this.resolveLineUomId(line, article);
    if (!uomId) return null;

    const uomCode = this.resolveLineUomCode(line, article);

    let finalUnitPrice: number | undefined;
    if (unitPrice > 0) {
      finalUnitPrice = unitPrice;
    } else if (defaultPrice > 0) {
      finalUnitPrice = defaultPrice;
    }

    let totalPrice: number | undefined;
    if (finalUnitPrice == null) {
      totalPrice = undefined;
    } else {
      totalPrice = Math.round(quantity * finalUnitPrice * 100) / 100;
    }

    return {
      id: '',
      txId: '',
      lineNumber,
      articleId: article.key,
      articleCode,
      articleName,
      quantity,
      uomId,
      uomCode,
      unitPrice: finalUnitPrice,
      totalPrice,
    };
  }

  private resolveLineUomId(
    line: Record<string, unknown>,
    article: { key: string; value: string; data?: Record<string, unknown> },
  ): string | undefined {
    const uomIdRaw = findByAliases(line, ['uomId', 'unitId']);
    if (typeof uomIdRaw === 'string' && uomIdRaw.trim().length > 0) {
      return uomIdRaw.trim();
    }

    if (typeof article.data?.['uomId'] === 'string') {
      return article.data['uomId'];
    }

    return undefined;
  }

  private resolveLineUomCode(
    line: Record<string, unknown>,
    article: { key: string; value: string; data?: Record<string, unknown> },
  ): string | undefined {
    const uomCodeRaw = findByAliases(line, ['uomCode', 'uom', 'unit', 'uomLabel']);
    if (typeof uomCodeRaw === 'string' && uomCodeRaw.trim().length > 0) {
      return uomCodeRaw.trim();
    }

    if (typeof article.data?.['uomCode'] === 'string') {
      return article.data['uomCode'];
    }

    return undefined;
  }

  private resolveArticle(
    articles: Array<{ key: string; value: string; data?: Record<string, unknown> }>,
    code?: string,
    name?: string,
  ): { key: string; value: string; data?: Record<string, unknown> } | undefined {
    if (code) {
      const normalizedCode = normalizeText(code);
      const byCode = articles.find((a) => {
        const entryCode = a.value.split('—')[0]?.trim() ?? '';
        return normalizeText(entryCode) === normalizedCode;
      });
      if (byCode) return byCode;
    }

    if (name) {
      const normalizedName = normalizeText(name);
      return articles.find((a) => normalizeText(a.value).includes(normalizedName));
    }

    return undefined;
  }

  protected override async loadItem(id: string): Promise<void> {
    await super.loadItem(id);
    this.mode.set('view');
  }

  override async handleTransition(event: StatusTransitionEvent): Promise<void> {
    const id = this.itemId();
    if (!id) return;

    this.isTransitioning.set(true);
    try {
      let updated: InventoryTx;

      if (event.action === 'validate') {
        updated = await this.crud.validate(id);
        this.showSuccess(
          this.translate.instant('inventory.mouvement.reception.validateSuccess', { number: updated.txNumber }),
        );
        this.mode.set('view');
      } else if (event.action === 'cancel') {
        updated = await this.crud.cancelReception(id);
        this.showSuccess(this.translate.instant('inventory.mouvement.reception.cancelSuccess'));
        this.mode.set('view');
      } else if (event.action === 'reset_to_draft') {
        updated = await this.crud.resetToDraft(id);
        this.showSuccess(
          this.translate.instant('inventory.mouvement.reception.resetSuccess', { number: updated.txNumber }),
        );
        this.mode.set('edit');
      } else {
        this.showError(this.translate.instant('inventory.mouvement.common.transitionUnknown', { action: event.action }));
        return;
      }

      this.item.set(updated);
      this.detailComponent?.markAsPristine();
    } catch (err) {
      this.showError((err as Error).message ?? this.translate.instant('inventory.mouvement.common.transitionFailed'));
    } finally {
      this.isTransitioning.set(false);
    }
  }

  ngOnDestroy(): void {
    this.lineTotalsSub?.unsubscribe();
  }
}
