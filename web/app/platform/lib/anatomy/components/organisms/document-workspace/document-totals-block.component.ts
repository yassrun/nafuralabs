import { Component, computed, input } from '@angular/core';
import { CommonModule } from '@angular/common';
import type { DocumentTotalsBlockConfig } from '../../../types';
import { getValueAtPath } from './get-at-path';

@Component({
  selector: 'nf-document-totals-block',
  standalone: true,
  imports: [CommonModule],
  template: `
    @if (config(); as c) {
      <aside class="nf-doc-totals">
        @if (c.title) {
          <h3 class="nf-doc-totals__title">{{ c.title }}</h3>
        }
        <dl class="nf-doc-totals__list">
          @for (row of rows(); track row.id) {
            <div class="nf-doc-totals__row">
              <dt>{{ row.label }}</dt>
              <dd>{{ row.display }}</dd>
            </div>
          }
        </dl>
      </aside>
    }
  `,
  styles: `
    :host {
      display: block;
    }
    .nf-doc-totals {
      margin-top: 16px;
      padding: 12px 16px;
      border-radius: 8px;
      border: 1px solid var(--nf-border-default, #e5e7eb);
      background: var(--nf-surface-elevated, #fff);
      max-width: 360px;
    }
    .nf-doc-totals__title {
      margin: 0 0 8px;
      font-size: 0.8125rem;
      font-weight: 600;
      text-transform: uppercase;
      letter-spacing: 0.04em;
      color: var(--nf-text-secondary, #6b7280);
    }
    .nf-doc-totals__list {
      margin: 0;
    }
    .nf-doc-totals__row {
      display: flex;
      justify-content: space-between;
      gap: 16px;
      padding: 6px 0;
      border-bottom: 1px dashed var(--nf-border-muted, #f3f4f6);
      font-size: 0.9375rem;
    }
    .nf-doc-totals__row:last-child {
      border-bottom: none;
    }
    dt {
      margin: 0;
      color: var(--nf-text-secondary, #6b7280);
      font-weight: 400;
    }
    dd {
      margin: 0;
      font-weight: 600;
      color: var(--nf-text-primary, #111827);
      text-align: right;
    }
  `,
})
export class DocumentTotalsBlockComponent {
  readonly config = input<DocumentTotalsBlockConfig | null>(null);
  readonly document = input<unknown | null>(null);

  readonly rows = computed(() => {
    const c = this.config();
    const doc = this.document();
    if (!c?.items?.length) return [];
    return c.items.map((item) => {
      const v = doc != null ? getValueAtPath(doc, item.fieldPath) : undefined;
      let display = v != null ? String(v) : '—';
      if (item.format === 'currency' && typeof v === 'number') {
        display = new Intl.NumberFormat(undefined, { style: 'currency', currency: 'USD' }).format(v);
      }
      return { id: item.id, label: item.label, display };
    });
  });
}
