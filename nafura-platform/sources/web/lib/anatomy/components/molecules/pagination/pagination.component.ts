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
    .nf-pag {
      display: flex;
      align-items: center;
      gap: 1rem;
      padding: 10px 16px;
      font-size: 0.8125rem;
      color: var(--nf-text-secondary, #4b5563);
      flex-wrap: wrap;
      background: var(--nf-surface-section, #ffffff);
      border-top: 1px solid var(--nf-border-default, #e5e7eb);
    }
    .nf-pag__sizer {
      display: flex;
      align-items: center;
      gap: 8px;
    }
    .nf-pag__sizer select {
      padding: 3px 8px;
      border: 1px solid var(--nf-border-default, #d1d5db);
      border-radius: var(--nf-radius-sm, 6px);
      font-size: 0.8125rem;
      background: var(--nf-surface-section, #ffffff);
      color: var(--nf-text-primary, #111827);
      outline: none;
      cursor: pointer;
      transition: border-color 0.12s ease;
      &:focus {
        border-color: var(--nf-primary, #2563eb);
      }
    }
    .nf-pag__counter {
      color: var(--nf-text-muted, #6b7280);
      white-space: nowrap;
    }
    .nf-pag__nav {
      display: flex;
      align-items: center;
      gap: 4px;
      margin-left: auto;
    }
    .nf-pag__btn {
      min-width: 28px;
      height: 28px;
      padding: 0 8px;
      border: 1px solid var(--nf-border-default, #e5e7eb);
      border-radius: var(--nf-radius-sm, 6px);
      background: var(--nf-surface-section, #ffffff);
      font-size: 0.8125rem;
      cursor: pointer;
      display: flex;
      align-items: center;
      justify-content: center;
      color: var(--nf-text-primary, #111827);
      transition: all 0.12s ease;
      user-select: none;
    }
    .nf-pag__btn:hover:not(:disabled) {
      background: var(--nf-surface-hover, #f9fafb);
      border-color: var(--nf-border-default, #d1d5db);
    }
    .nf-pag__btn:disabled {
      opacity: 0.4;
      cursor: not-allowed;
      border-color: var(--nf-border-default, #e5e7eb);
    }
    .nf-pag__btn--active {
      background: var(--nf-primary, #2563eb) !important;
      color: #ffffff !important;
      border-color: var(--nf-primary, #2563eb) !important;
      font-weight: 600;
    }
    .nf-pag__btn--active:hover {
      background: var(--nf-primary-hover, #1d4ed8) !important;
    }
    .nf-pag__ellipsis {
      padding: 0 4px;
      color: var(--nf-text-muted, #9ca3af);
    }
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
