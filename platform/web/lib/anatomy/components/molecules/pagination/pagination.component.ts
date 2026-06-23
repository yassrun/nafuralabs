import { Component, computed, input, output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { TranslateModule } from '@ngx-translate/core';

export interface PageChangeEvent {
  page: number;
  pageSize: number;
}

/**
 * Pagination — uniform pagination bar for all ERP listings.
 *
 * @example
 * <nf-pagination [total]="total()" [page]="page()" [pageSize]="25"
 *   (pageChange)="onPage($event)">
 * </nf-pagination>
 */
@Component({
  selector: 'nf-pagination',
  standalone: true,
  imports: [CommonModule, TranslateModule],
  template: `
    <div class="nf-pag">
      <!-- Items per page -->
      <div class="nf-pag__sizer">
        <span>{{ 'shared.pagination.rowsPerPage' | translate }}</span>
        <select [value]="pageSize()" (change)="onSizeChange($any($event.target).value)">
          @for (s of pageSizes; track s) {
            <option [value]="s">{{ s }}</option>
          }
        </select>
      </div>

      <!-- Counter -->
      <span class="nf-pag__counter">
        {{ 'shared.pagination.counter' | translate: { from: from(), to: to(), total: total() } }}
      </span>

      <!-- Nav buttons -->
      <div class="nf-pag__nav">
        <button class="nf-pag__btn" (click)="goto(1)" [disabled]="page() === 1" [title]="'shared.pagination.firstPage' | translate">«</button>
        <button class="nf-pag__btn" (click)="goto(page() - 1)" [disabled]="page() === 1" [title]="'shared.pagination.previousPage' | translate">‹</button>

        @for (p of visiblePages(); track p) {
          @if (p === -1) {
            <span class="nf-pag__ellipsis">…</span>
          } @else {
            <button
              class="nf-pag__btn"
              [class.nf-pag__btn--active]="p === page()"
              (click)="goto(p)">
              {{ p }}
            </button>
          }
        }

        <button class="nf-pag__btn" (click)="goto(page() + 1)" [disabled]="page() === totalPages()" [title]="'shared.pagination.nextPage' | translate">›</button>
        <button class="nf-pag__btn" (click)="goto(totalPages())" [disabled]="page() === totalPages()" [title]="'shared.pagination.lastPage' | translate">»</button>
      </div>
    </div>
  `,
  styles: [`
    :host { display: block; }
    .nf-pag { display: flex; align-items: center; gap: 1rem; padding: 0.625rem 0; font-size: 13px; color: #475569; flex-wrap: wrap; }
    .nf-pag__sizer { display: flex; align-items: center; gap: 6px; }
    .nf-pag__sizer select { padding: 3px 6px; border: 1px solid #e2e8f0; border-radius: 4px; font-size: 12px; background: white; }
    .nf-pag__counter { color: #64748b; white-space: nowrap; }
    .nf-pag__nav { display: flex; align-items: center; gap: 3px; margin-left: auto; }
    .nf-pag__btn { min-width: 28px; height: 28px; padding: 0 6px; border: 1px solid #e2e8f0; border-radius: 5px; background: white; font-size: 13px; cursor: pointer; display: flex; align-items: center; justify-content: center; color: #475569; transition: all 80ms; }
    .nf-pag__btn:hover:not(:disabled) { background: #f1f5f9; border-color: #cbd5e1; }
    .nf-pag__btn:disabled { opacity: 0.4; cursor: not-allowed; }
    .nf-pag__btn--active { background: #0d9488; color: white; border-color: #0d9488; font-weight: 700; }
    .nf-pag__btn--active:hover { background: #0f766e; }
    .nf-pag__ellipsis { padding: 0 4px; color: #94a3b8; }
  `],
})
export class PaginationComponent {
  readonly total = input.required<number>();
  readonly page = input<number>(1);
  readonly pageSize = input<number>(25);

  readonly pageChange = output<PageChangeEvent>();

  readonly pageSizes = [25, 50, 100, 250];

  readonly totalPages = computed(() => Math.max(1, Math.ceil(this.total() / this.pageSize())));
  readonly from = computed(() => Math.min(this.total(), (this.page() - 1) * this.pageSize() + 1));
  readonly to = computed(() => Math.min(this.total(), this.page() * this.pageSize()));

  readonly visiblePages = computed(() => {
    const total = this.totalPages();
    const current = this.page();
    const pages: (number | -1)[] = [];

    if (total <= 7) {
      for (let i = 1; i <= total; i++) pages.push(i);
      return pages;
    }

    pages.push(1);
    if (current > 3) pages.push(-1);
    const start = Math.max(2, current - 1);
    const end = Math.min(total - 1, current + 1);
    for (let i = start; i <= end; i++) pages.push(i);
    if (current < total - 2) pages.push(-1);
    pages.push(total);
    return pages;
  });

  goto(p: number): void {
    const clipped = Math.max(1, Math.min(this.totalPages(), p));
    if (clipped !== this.page()) {
      this.pageChange.emit({ page: clipped, pageSize: this.pageSize() });
    }
  }

  onSizeChange(size: string): void {
    this.pageChange.emit({ page: 1, pageSize: Number(size) });
  }
}
