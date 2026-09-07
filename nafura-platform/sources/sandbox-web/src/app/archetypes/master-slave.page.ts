import { Component, ChangeDetectionStrategy, computed, signal } from '@angular/core';

import { PageShellComponent } from '@platform/lib/anatomy/components/organisms/page-shell';
import { PageHeaderComponent } from '@platform/lib/anatomy/components/molecules/page-header';
import { MasterSlaveShellComponent } from '@platform/lib/anatomy/components/organisms/master-slave-shell';

import type { Product } from '../mocks/product-mock.facade';

const PRODUCTS: Product[] = [
  { id: 'prd-01', code: 'PRD-01', name: 'Ciment CPJ 45', status: 'Active' },
  { id: 'prd-02', code: 'PRD-02', name: 'Fer 12 mm', status: 'Active' },
  { id: 'prd-03', code: 'PRD-03', name: 'Sable 0/2', status: 'Draft' },
];

@Component({
  selector: 'sb-master-slave',
  standalone: true,
  imports: [PageShellComponent, PageHeaderComponent, MasterSlaveShellComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <nf-page-shell>
      <nf-page-header
        [config]="{ title: 'Products panel', subtitle: 'nf-master-slave · entity-focus' }"
      />
      <nf-master-slave-shell
        [selectedId]="selectedId()"
        (selectedIdChange)="selectedId.set($event)"
      >
        <div master class="master">
          @for (p of products; track p.id) {
            <button
              type="button"
              class="row"
              [class.row--active]="p.id === selectedId()"
              (click)="selectedId.set(p.id)"
            >
              <strong>{{ p.code }}</strong>
              <span>{{ p.name }}</span>
            </button>
          }
        </div>
        <div slave class="slave">
          @if (selected(); as p) {
            <h2>{{ p.name }}</h2>
            <dl>
              <dt>Code</dt>
              <dd>{{ p.code }}</dd>
              <dt>Status</dt>
              <dd>{{ p.status }}</dd>
            </dl>
            <button type="button" class="close" (click)="selectedId.set(null)">Close</button>
          }
        </div>
      </nf-master-slave-shell>
    </nf-page-shell>
  `,
  styles: [
    `
      :host {
        display: block;
        height: 100%;
      }
      nf-master-slave-shell {
        display: block;
        height: calc(100vh - 140px);
      }
      .master {
        display: flex;
        flex-direction: column;
        gap: 4px;
        padding: 8px;
      }
      .row {
        display: flex;
        flex-direction: column;
        align-items: flex-start;
        gap: 2px;
        padding: 10px 12px;
        border: 1px solid transparent;
        border-radius: 6px;
        background: transparent;
        text-align: left;
        font: inherit;
        cursor: pointer;
      }
      .row:hover {
        background: var(--nf-bg-hover, #f3f4f6);
      }
      .row--active {
        background: var(--nf-bg-selected, #e8eefc);
        border-color: var(--nf-border-subtle, #c5cad3);
      }
      .slave {
        padding: 16px;
      }
      .slave h2 {
        margin: 0 0 12px;
      }
      dl {
        display: grid;
        grid-template-columns: 100px 1fr;
        gap: 8px;
        margin: 0 0 16px;
      }
      dt {
        color: var(--nf-text-muted, #6b7280);
      }
      dd {
        margin: 0;
      }
      .close {
        padding: 6px 12px;
        border-radius: 6px;
        border: 1px solid var(--nf-border-subtle, #d1d5db);
        background: #fff;
        cursor: pointer;
      }
    `,
  ],
})
export class MasterSlavePage {
  readonly products = PRODUCTS;
  readonly selectedId = signal<string | null>('prd-01');
  readonly selected = computed(() => PRODUCTS.find((p) => p.id === this.selectedId()) ?? null);
}
