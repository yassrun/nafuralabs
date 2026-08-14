import { Component, input, output, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatPaginatorModule, PageEvent } from '@angular/material/paginator';

/**
 * Page change event.
 */
export interface PageChangeEvent {
  page: number;
  pageSize: number;
}

/**
 * Pagination Component
 *
 * Page navigation (wraps Material Paginator).
 *
 * @example
 * <nf-pagination
 *   [total]="pagination().total"
 *   [page]="pagination().page"
 *   [pageSize]="pagination().pageSize"
 *   (pageChange)="onPageChange($event)">
 * </nf-pagination>
 */
@Component({
  selector: 'nf-pagination',
  standalone: true,
  imports: [CommonModule, MatPaginatorModule],
  template: `
    <mat-paginator
      class="nf-pagination"
      [length]="total()"
      [pageIndex]="pageIndex()"
      [pageSize]="pageSize()"
      [pageSizeOptions]="pageSizeOptions()"
      [showFirstLastButtons]="showFirstLast()"
      [hidePageSize]="!showPageSize()"
      (page)="onPage($event)"
    ></mat-paginator>
  `,
  styles: [`
    .nf-pagination {
      background-color: transparent;

      ::ng-deep {
        .mat-mdc-paginator-container {
          padding: 0 var(--nf-space-1, 4px);
          min-height: 36px;
          justify-content: flex-end;
        }

        .mat-mdc-paginator-range-label {
          margin: 0 12px;
        }
      }
    }

    /* No-spacing: zero all layout when ancestor has .nf-listing-page--no-spacing */
    :host-context(.nf-listing-page--no-spacing) {
      margin: 0;
      padding: 0;
    }
    :host-context(.nf-listing-page--no-spacing) .nf-pagination ::ng-deep .mat-mdc-paginator-container {
      padding: 0 !important;
      margin: 0 !important;
      min-height: 0 !important;
    }
  `],
})
export class PaginationComponent {
  // Inputs
  total = input.required<number>();
  page = input<number>(1);
  pageSize = input<number>(20);
  pageSizeOptions = input<number[]>([10, 20, 50, 100]);
  showFirstLast = input<boolean>(true);
  showPageSize = input<boolean>(true);

  // Outputs
  pageChange = output<PageChangeEvent>();

  // Material paginator uses 0-indexed pages
  pageIndex = computed(() => this.page() - 1);

  onPage(event: PageEvent): void {
    this.pageChange.emit({
      page: event.pageIndex + 1, // Convert back to 1-indexed
      pageSize: event.pageSize,
    });
  }
}
