import { Component, ElementRef, LOCALE_ID, ViewChild, computed, effect, inject, signal, untracked } from '@angular/core';
import { FormControl, FormGroup, ReactiveFormsModule } from '@angular/forms';
import { MatButtonToggleModule } from '@angular/material/button-toggle';
import { ActivatedRoute } from '@angular/router';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { firstValueFrom, Subscription } from 'rxjs';

import {
  ButtonComponent,
  ConfigDrivenDetailPage,
  ConfigDrivenDetailPageImports,
  ConfigDrivenDetailPageStyles,
  IconComponent,
  NfInputComponent,
  NfSelectComponent,
  createDetailFacadeFromCrud,
} from '@lib/anatomy';
import type { PageHeaderConfig } from '@lib/anatomy/components';
import { FieldTemplateDirective } from '@lib/anatomy/components/organisms/entity-detail';
import type { DetailActionEvent, StatusTransitionEvent } from '@lib/anatomy/types';

import type { InventoryTx } from '../../../../../inventory/models';
import { ReceptionLinesEditorComponent } from '../../../../../inventory/components/reception-lines-editor/reception-lines-editor.component';
import { TenantContextService } from '../../../../../../../platform/core/tenant/tenant.context';
import { DocTypeService } from '../../../../../../../platform/features/documents/doc-extractor/services/doc-type.service';
import { ExtractionService } from '../../../../../../../platform/features/documents/doc-extractor/services/extraction.service';
import { buildReceptionDetailConfig } from '../config/detail/detail.config';
import { ReceptionFacade } from '../services/reception.facade';

type DeliveryMode = 'DEPOT' | 'CHANTIER_DIRECT';

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
    ButtonComponent,
    IconComponent,
    ReactiveFormsModule,
    TranslateModule,
  ],
  templateUrl: './reception-detail.page.html',
  styleUrls: ['./reception-detail.page.scss'],
  styles: [ConfigDrivenDetailPageStyles],
})
export class ReceptionDetailPage extends ConfigDrivenDetailPage<InventoryTx> {
  @ViewChild('blFileInput') private blFileInput?: ElementRef<HTMLInputElement>;

  private readonly crud = inject(ReceptionFacade);
  private readonly tenantContext = inject(TenantContextService);
  private readonly docTypeService = inject(DocTypeService);
  private readonly extractionService = inject(ExtractionService);
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
  readonly isExtracting = signal(false);
  readonly shouldAutoScanBl = signal(this.activatedRoute.snapshot.queryParamMap.get('scanBl') === '1');

  readonly depotLookups = computed(
    () =>
      (this.crud.lookups()['locationsDepot'] as Array<{ key: string; value: string }> | undefined) ?? [],
  );

  readonly chantierLookups = computed(
    () =>
      (this.crud.lookups()['chantiersLookup'] as Array<{ key: string; value: string }> | undefined) ?? [],
  );

  readonly phaseLookups = computed(
    () =>
      (this.crud.lookups()['phasesLookup'] as Array<{ key: string; value: string }> | undefined) ?? [],
  );

  readonly depotSelectOptions = computed(() =>
    this.depotLookups().map((opt) => ({ value: opt.key, label: opt.value })),
  );

  readonly chantierSelectOptions = computed(() =>
    this.chantierLookups().map((opt) => ({ value: opt.key, label: opt.value })),
  );

  readonly phaseSelectOptions = computed(() =>
    this.phaseLookups().map((opt) => ({ value: opt.key, label: opt.value })),
  );

  private readonly linesValue = signal<Array<{ totalPrice?: number; quantity: number; unitPrice?: number }>>([]);
  private readonly locale = inject(LOCALE_ID);

  readonly linesTotal = computed(() => {
    const lines = this.lineTotalsControl
      ? this.linesValue()
      : ((this.item()?.lines ?? []) as Array<{ totalPrice?: number; quantity: number; unitPrice?: number }>);
    const total = lines.reduce(
      (acc, l) => acc + (l.totalPrice ?? (l.unitPrice != null ? l.quantity * l.unitPrice : 0)),
      0,
    );
    return total.toLocaleString(this.locale, { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  });

  private readonly _inferModeEffect = effect(() => {
    const item = this.item();
    const chantierIds = new Set(
      (this.crud.lookups()['chantiersLookup'] as Array<{ key: string }> | undefined ?? [])
        .map((c) => c.key),
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

    queueMicrotask(() => {
      if (!this.shouldAutoScanBl()) return;
      const input = this.blFileInput?.nativeElement;
      if (!input) return;

      this.shouldAutoScanBl.set(false);
      this.onScanBlClick(input);
    });
  });

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
    this.linesValue.set(
      Array.isArray(nextValue)
        ? (nextValue as Array<{ totalPrice?: number; quantity: number; unitPrice?: number }>)
        : [],
    );

    this.lineTotalsSub = linesControl.valueChanges.subscribe((value) => {
      this.linesValue.set(
        Array.isArray(value)
          ? (value as Array<{ totalPrice?: number; quantity: number; unitPrice?: number }>)
          : [],
      );
    });
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
      const input = this.blFileInput?.nativeElement;
      if (!input) {
        this.showError(this.translate.instant('inventory.mouvement.common.scanBlOpen'));
        return;
      }
      this.onScanBlClick(input);
      return;
    }

    await super.handleCustomAction(event);
  }

  onScanBlClick(fileInput: HTMLInputElement): void {
    if (this.isExtracting()) return;
    fileInput.value = '';
    fileInput.click();
  }

  async onBlFileSelected(event: Event): Promise<void> {
    const input = event.target as HTMLInputElement;
    const file = input.files?.item(0);
    if (!file) return;

    const tenantId = this.tenantContext.tenantId();
    if (!tenantId) {
      this.showError(this.translate.instant('inventory.mouvement.common.tenantMissing'));
      return;
    }

    this.isExtracting.set(true);
    try {
      const definition = await firstValueFrom(
        this.docTypeService.getActiveDefinition('logistic', 'BL', tenantId),
      );

      const response = await firstValueFrom(
        this.extractionService.extract({
          file,
          docTypeDefinitionId: definition.id,
          persist: false,
        }),
      );

      if (response.status === 'FAILED') {
        this.showError(this.translate.instant('inventory.mouvement.common.scanBlFailed'));
        return;
      }

      const extracted = this.extractObject(response.extractedJson);
      this.applyExtractedBlToReception(extracted);
      this.showSuccess(this.translate.instant('inventory.mouvement.common.scanBlSuccess'));
    } catch (err) {
      this.showError((err as Error).message ?? this.translate.instant('inventory.mouvement.common.scanBlImpossible'));
    } finally {
      input.value = '';
      this.isExtracting.set(false);
    }
  }

  private applyExtractedBlToReception(data: Record<string, unknown>): void {
    const form = this.detailComponent?.form;
    if (!form) {
      this.showError(this.translate.instant('inventory.mouvement.common.formNotReady'));
      return;
    }

    const fournisseurName = this.findStringByAliases(data, [
      'supplierName',
      'supplier',
      'fournisseur',
      'vendor',
      'vendorName',
    ]);
    const fournisseurId = this.resolveLookupId('fournisseursLookup', fournisseurName);

    const chantierName = this.findStringByAliases(data, [
      'chantier',
      'site',
      'project',
      'destinationSite',
    ]);
    const chantierLocationId = this.resolveLookupId('chantiersLookup', chantierName);

    const phase = this.findStringByAliases(data, ['phaseRef', 'phase']);
    const phaseRef = this.resolvePhase(phase);

    const reference = this.findStringByAliases(data, [
      'blReference',
      'transferReference',
      'reference',
      'docReference',
      'blNumber',
      'number',
    ]);

    const txDateRaw = this.findStringByAliases(data, [
      'txDate',
      'documentDate',
      'date',
      'blDate',
      'deliveryDate',
    ]);
    const txDate = this.normalizeDate(txDateRaw);

    const lines = this.extractLines(data);

    const patch: Partial<InventoryTx> = {};
    if (fournisseurId) patch.fournisseurId = fournisseurId;
    if (reference) patch.reference = reference;
    if (txDate) patch.txDate = txDate;
    if (phaseRef) patch.phaseRef = phaseRef;
    if (lines.length > 0) patch.lines = lines;

    if (chantierLocationId) {
      patch.chantierLocationId = chantierLocationId;
      patch.destLocationId = null as unknown as string;
      this.deliveryMode.set('CHANTIER_DIRECT');
    }

    form.patchValue(patch);
    form.markAsDirty();
  }

  private extractObject(value: unknown): Record<string, unknown> {
    if (typeof value === 'string') {
      try {
        const parsed = JSON.parse(value);
        return this.extractObject(parsed);
      } catch {
        return {};
      }
    }
    if (value && typeof value === 'object' && !Array.isArray(value)) {
      return value as Record<string, unknown>;
    }
    return {};
  }

  private findStringByAliases(data: Record<string, unknown>, aliases: string[]): string | undefined {
    const raw = this.findByAliases(data, aliases);
    if (typeof raw !== 'string') return undefined;
    const trimmed = raw.trim();
    return trimmed.length > 0 ? trimmed : undefined;
  }

  private findByAliases(root: unknown, aliases: string[]): unknown {
    const normalizedAliases = new Set(aliases.map((a) => a.toLowerCase()));

    const walk = (node: unknown): unknown => {
      if (!node || typeof node !== 'object') return undefined;

      if (Array.isArray(node)) {
        for (const item of node) {
          const found = walk(item);
          if (found !== undefined) return found;
        }
        return undefined;
      }

      const record = node as Record<string, unknown>;
      for (const [key, value] of Object.entries(record)) {
        if (normalizedAliases.has(key.toLowerCase()) && value != null) {
          return value;
        }
      }

      for (const value of Object.values(record)) {
        const found = walk(value);
        if (found !== undefined) return found;
      }

      return undefined;
    };

    return walk(root);
  }

  private resolveLookupId(
    lookupKey: 'fournisseursLookup' | 'chantiersLookup',
    label?: string,
  ): string | undefined {
    if (!label) return undefined;
    const entries =
      (this.crud.lookups()[lookupKey] as Array<{ key: string; value: string }> | undefined) ?? [];
    const normalized = this.normalizeText(label);
    return entries.find((entry) => this.normalizeText(entry.value).includes(normalized))?.key;
  }

  private resolvePhase(phase?: string): string | undefined {
    if (!phase) return undefined;
    const entries = this.phaseLookups();
    const normalized = this.normalizeText(phase);
    return entries.find((entry) => this.normalizeText(entry.value).includes(normalized))?.key;
  }

  private extractLines(data: Record<string, unknown>): InventoryTx['lines'] {
    const rawLines = this.findByAliases(data, [
      'lines',
      'items',
      'lineItems',
      'articles',
      'produits',
      'details',
    ]);

    if (!Array.isArray(rawLines)) return [];

    const articleLookup =
      (this.crud.lookups()['articlesAll'] as Array<{ key: string; value: string; data?: Record<string, unknown> }> | undefined) ?? [];

    const resolvedLines: InventoryTx['lines'] = [];
    for (const rawLine of rawLines) {
      if (!rawLine || typeof rawLine !== 'object') continue;
      const line = rawLine as Record<string, unknown>;

      const articleCode = this.findStringByAliases(line, ['articleCode', 'code', 'sku', 'itemCode']);
      const articleName = this.findStringByAliases(line, ['articleName', 'name', 'designation', 'itemName']);
      const article = this.resolveArticle(articleLookup, articleCode, articleName);
      if (!article) continue;

      const quantity = this.toNumber(this.findByAliases(line, ['quantity', 'qty', 'quantite']));
      if (quantity <= 0) continue;

      const unitPriceRaw = this.findByAliases(line, ['unitPrice', 'prixUnitaire', 'price', 'pu']);
      const unitPrice = this.toNumber(unitPriceRaw);
      const defaultPrice = this.toNumber(article.data?.['prix']);

      const uomIdRaw = this.findByAliases(line, ['uomId', 'uom', 'unitId']);
      const uomId = typeof uomIdRaw === 'string' && uomIdRaw.trim().length > 0
        ? uomIdRaw.trim()
        : (typeof article.data?.['uomId'] === 'string' ? article.data['uomId'] : undefined);
      if (!uomId) continue;

      const uomCodeRaw = this.findByAliases(line, ['uomCode', 'unit', 'uomLabel']);
      const uomCode = typeof uomCodeRaw === 'string' && uomCodeRaw.trim().length > 0
        ? uomCodeRaw.trim()
        : (typeof article.data?.['uomCode'] === 'string' ? article.data['uomCode'] : undefined);

      const finalUnitPrice = unitPrice > 0 ? unitPrice : (defaultPrice > 0 ? defaultPrice : undefined);
      const totalPrice = finalUnitPrice != null ? Math.round(quantity * finalUnitPrice * 100) / 100 : undefined;

      resolvedLines.push({
        id: '',
        txId: '',
        lineNumber: resolvedLines.length + 1,
        articleId: article.key,
        articleCode: articleCode,
        articleName: articleName,
        quantity,
        uomId,
        uomCode,
        unitPrice: finalUnitPrice,
        totalPrice,
      });
    }

    return resolvedLines;
  }

  private resolveArticle(
    articles: Array<{ key: string; value: string; data?: Record<string, unknown> }>,
    code?: string,
    name?: string,
  ): { key: string; value: string; data?: Record<string, unknown> } | undefined {
    if (code) {
      const normalizedCode = this.normalizeText(code);
      const byCode = articles.find((a) => {
        const entryCode = a.value.split('—')[0]?.trim() ?? '';
        return this.normalizeText(entryCode) === normalizedCode;
      });
      if (byCode) return byCode;
    }

    if (name) {
      const normalizedName = this.normalizeText(name);
      return articles.find((a) => this.normalizeText(a.value).includes(normalizedName));
    }

    return undefined;
  }

  private normalizeDate(value?: string): string | undefined {
    if (!value) return undefined;

    const iso = value.match(/^(\d{4})-(\d{2})-(\d{2})$/);
    if (iso) return value;

    const fr = value.match(/^(\d{1,2})[\/\-.](\d{1,2})[\/\-.](\d{4})$/);
    if (fr) {
      const day = fr[1].padStart(2, '0');
      const month = fr[2].padStart(2, '0');
      return `${fr[3]}-${month}-${day}`;
    }

    const parsed = new Date(value);
    if (Number.isNaN(parsed.getTime())) return undefined;
    return parsed.toISOString().slice(0, 10);
  }

  private toNumber(value: unknown): number {
    if (typeof value === 'number') return Number.isFinite(value) ? value : 0;
    if (typeof value !== 'string') return 0;

    const normalized = value.replace(/\s+/g, '').replace(',', '.');
    const parsed = Number(normalized);
    return Number.isFinite(parsed) ? parsed : 0;
  }

  private normalizeText(value: string): string {
    return value
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .toLowerCase()
      .trim();
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
