
import { Component, inject, signal, ChangeDetectionStrategy } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { TranslateModule, TranslateService } from '@ngx-translate/core';

import {
  ButtonComponent,
  ConfigDrivenDetailPage,
  ConfigDrivenDetailPageImports,
  ConfigDrivenDetailPageStyles,
  createDetailFacadeFromCrud,
} from '@platform/lib/anatomy';
import type { DetailActionEvent } from '@platform/lib/anatomy/types';

import { UomFacade } from '../services';
import type { UomConfig, UomCreate, UomListItem } from '../models';
import { buildUomDetailConfig } from '../config';

@Component({
  selector: 'app-uom-detail',
  standalone: true,
  imports: [
    ...ConfigDrivenDetailPageImports,
    FormsModule,
    TranslateModule,
    ButtonComponent
],
  templateUrl: './uom-detail.page.html',
  changeDetection: ChangeDetectionStrategy.Eager,
  styles: [
    ConfigDrivenDetailPageStyles,
    `
      .uom-convert {
        margin: 1.5rem 0 0;
        padding: 1rem 1.25rem;
        border: 1px solid var(--nf-border-subtle, #e5e7eb);
        border-radius: 8px;
      }
      .uom-convert h3 {
        margin: 0 0 0.75rem;
        font-size: 1rem;
        font-weight: 600;
      }
      .uom-convert__hint {
        margin: 0 0 1rem;
        font-size: 0.85rem;
        color: var(--nf-text-muted, #6b7280);
      }
      .uom-convert__row {
        display: flex;
        flex-wrap: wrap;
        gap: 0.75rem 1rem;
        align-items: flex-end;
        margin-bottom: 0.75rem;
      }
      .uom-convert__field {
        display: flex;
        flex-direction: column;
        gap: 0.25rem;
        min-width: 140px;
      }
      .uom-convert__field label {
        font-size: 0.8rem;
        color: var(--nf-text-muted, #6b7280);
      }
      .uom-convert__field select,
      .uom-convert__field input {
        min-height: 2rem;
        padding: 0.25rem 0.5rem;
      }
      .uom-convert__result {
        margin: 0.5rem 0 0;
        padding: 0.75rem;
        border-radius: 6px;
        font-size: 0.9rem;
      }
      .uom-convert__result--ok {
        background: color-mix(in srgb, #16a34a 12%, transparent);
      }
      .uom-convert__result--err {
        background: color-mix(in srgb, #dc2626 12%, transparent);
      }
    `,
  ],
})
export class UomDetailPage extends ConfigDrivenDetailPage<UomConfig> {
  private readonly crud = inject(UomFacade);
  private readonly translate = inject(TranslateService);
  readonly facade = createDetailFacadeFromCrud<UomConfig, UomCreate>({
    crud: this.crud,
    lookups: () => this.crud.lookups(),
  });
  readonly config = buildUomDetailConfig(this.translate);

  readonly convertOptions = signal<UomListItem[]>([]);
  fromUomId = '';
  toUomId = '';
  quantity: number | null = 1000;
  readonly convertResult = signal<string | null>(null);
  readonly convertError = signal<string | null>(null);
  readonly converting = signal(false);

  override ngOnInit(): void {
    super.ngOnInit();
    void this.loadConvertOptions();
  }

  private async loadConvertOptions(): Promise<void> {
    const items = await this.crud.listForConversion();
    this.convertOptions.set(items);
    const id = this.itemId();
    if (id) {
      this.fromUomId = id;
    }
  }

  get headerTitle(): string {
    const mode = this.mode();
    if (mode === 'create') return this.translate.instant('inventory.configuration.uom.headerTitleNew');
    const item = this.item();
    return item
      ? `${item.name || item.code || ''}`
      : this.translate.instant('inventory.configuration.uom.headerTitleDetail');
  }

  async runConversion(): Promise<void> {
    this.convertResult.set(null);
    this.convertError.set(null);
    if (!this.fromUomId || !this.toUomId || this.quantity == null) {
      this.convertError.set(this.translate.instant('inventory.configuration.uom.convert.incomplete'));
      return;
    }
    this.converting.set(true);
    try {
      const res = await this.crud.convert({
        fromUomId: this.fromUomId,
        toUomId: this.toUomId,
        quantity: this.quantity,
      });
      this.convertResult.set(
        this.translate.instant('inventory.configuration.uom.convert.success', {
          fromQty: res.quantityFrom,
          fromCode: res.fromCode,
          toQty: res.quantityTo,
          toCode: res.toCode,
        }),
      );
    } catch (err: unknown) {
      const message = this.extractErrorKey(err);
      this.convertError.set(
        this.translate.instant(message, { default: this.translate.instant(message) }),
      );
    } finally {
      this.converting.set(false);
    }
  }

  private extractErrorKey(err: unknown): string {
    const anyErr = err as { error?: { message?: string }; message?: string };
    const raw = anyErr?.error?.message || anyErr?.message || 'item.uom.conversion.failed';
    if (typeof raw === 'string' && raw.startsWith('item.uom.')) {
      return raw;
    }
    return 'item.uom.conversion.failed';
  }

  protected override async handleCustomAction(
    event: DetailActionEvent<UomConfig>
  ): Promise<void> {
    switch (event.actionId) {
      default:
        console.log('Unhandled detail action:', event.actionId, event);
    }
  }
}
