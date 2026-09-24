import { Component, ChangeDetectionStrategy, computed, inject, signal, OnInit } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { FormsModule } from '@angular/forms';

import { PageShellComponent } from '@platform/lib/anatomy/components/organisms/page-shell';
import { PageHeaderComponent } from '@platform/lib/anatomy/components/molecules/page-header';
import { ButtonComponent } from '@platform/lib/anatomy/components/atoms/button';
import { DataTableComponent } from '@platform/lib/anatomy/components/organisms/data-table';
import type { ColumnConfig } from '@platform/lib/anatomy/types';

interface OrderLine {
  id: string;
  lineNo: number;
  article: string;
  qty: number;
  uom: string;
}

@Component({
  selector: 'sb-details-1n',
  standalone: true,
  imports: [
    FormsModule,
    PageShellComponent,
    PageHeaderComponent,
    ButtonComponent,
    DataTableComponent,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <nf-page-shell scroll>
      <nf-page-header [config]="headerConfig()"></nf-page-header>

      <section class="parent">
        <h2>Header</h2>
        <div class="grid">
          <label>
            <span>Customer</span>
            <input [(ngModel)]="customer" name="customer" />
          </label>
          <label>
            <span>Status</span>
            <select [(ngModel)]="status" name="status">
              <option>Draft</option>
              <option>Confirmed</option>
            </select>
          </label>
        </div>
      </section>

      <section class="child">
        <div class="child__bar">
          <h2>Lines</h2>
          <nf-button variant="secondary" icon="plus" (clicked)="addLine()">Add line</nf-button>
        </div>
        <p class="hint">nf-details-1n — listing embarqué dans le détail.</p>
        <nf-data-table [items]="lines()" [columns]="columns" [selectable]="false" />
      </section>
    </nf-page-shell>
  `,
  styles: [
    `
      .parent,
      .child {
        margin-bottom: 24px;
      }
      h2 {
        margin: 0 0 10px;
        font-size: 1rem;
      }
      .grid {
        display: grid;
        grid-template-columns: 1fr 1fr;
        gap: 12px;
        max-width: 40rem;
      }
      label {
        display: grid;
        gap: 4px;
        font-size: 0.85rem;
      }
      input,
      select {
        padding: 8px 10px;
        border: 1px solid var(--nf-border-subtle, #d1d5db);
        border-radius: 6px;
        font: inherit;
      }
      .child__bar {
        display: flex;
        justify-content: space-between;
        align-items: center;
        gap: 12px;
      }
      .hint {
        margin: 0 0 10px;
        color: var(--nf-text-muted, #6b7280);
        font-size: 0.85rem;
      }
    `,
  ],
})
export class Details1nPage implements OnInit {
  private readonly route = inject(ActivatedRoute);

  customer = 'Atlas Bâtiment SA';
  status = 'Draft';
  private orderId = 'ord-1042';

  readonly lines = signal<OrderLine[]>([
    { id: 'l1', lineNo: 1, article: 'Ciment CPJ 45', qty: 40, uom: 'T' },
    { id: 'l2', lineNo: 2, article: 'Fer 12 mm', qty: 2.5, uom: 'T' },
  ]);

  readonly columns: ColumnConfig[] = [
    { key: 'lineNo', field: 'lineNo', label: '#' },
    { key: 'article', field: 'article', label: 'Article' },
    { key: 'qty', field: 'qty', label: 'Qty' },
    { key: 'uom', field: 'uom', label: 'UoM' },
  ];

  readonly headerConfig = computed(() => ({
    title: `Order ${this.orderId.toUpperCase()}`,
    subtitle: 'nf-details-1n — parent form + embedded listing',
  }));

  ngOnInit(): void {
    this.orderId = this.route.snapshot.paramMap.get('id') ?? 'ord-1042';
  }

  addLine(): void {
    const n = this.lines().length + 1;
    this.lines.update((xs) => [
      ...xs,
      { id: `l${n}`, lineNo: n, article: `Article ${n}`, qty: 1, uom: 'U' },
    ]);
  }
}
