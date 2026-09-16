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
      display: block;
      background-color: transparent;
      font-size: 0.75rem;

      ::ng-deep {
        .mat-mdc-paginator-container {
          padding: 6px 4px;
          min-height: 36px;
          justify-content: flex-end;
          align-items: center;
          gap: 12px;
          font-family: inherit;
        }

        .mat-mdc-paginator-page-size {
          display: inline-flex;
          align-items: center;
          gap: 6px;
          margin-right: 4px;
        }

        .mat-mdc-paginator-page-size-label {
          font-size: 0.75rem;
          color: var(--nf-text-muted, #6b7280);
          margin: 0;
        }

        .mat-mdc-paginator-page-size-select {
          margin: 0 !important;
          width: auto !important;

          .mat-mdc-form-field-infix {
            padding: 1px 0 !important;
            min-height: 0 !important;
          }

          .mat-mdc-text-field-wrapper {
            padding: 0 8px !important;
            background: var(--nf-surface-section, #ffffff) !important;
            border: 1px solid var(--nf-border-default, #e5e7eb) !important;
            border-radius: 6px !important;
            height: 26px !important;
            box-shadow: 0 1px 2px 0 rgba(0, 0, 0, 0.04);
            display: flex;
            align-items: center;
          }

          .mat-mdc-form-field-subscript-wrapper,
          .mdc-line-ripple {
            display: none !important;
          }

          .mat-mdc-select-value {
            font-size: 0.75rem !important;
            font-weight: 500 !important;
            color: var(--nf-text-primary, #111827) !important;
          }

          .mat-mdc-select-arrow svg {
            fill: var(--nf-text-muted, #6b7280) !important;
          }
        }

        .mat-mdc-paginator-range-label {
          font-size: 0.75rem;
          font-weight: 500;
          color: var(--nf-text-muted, #6b7280);
          margin: 0 8px;
        }

        .mat-mdc-paginator-range-actions {
          display: inline-flex;
          align-items: center;
          gap: 3px;
        }

        .mat-mdc-icon-button.mat-mdc-button-base {
          --mdc-icon-button-state-layer-size: 26px;
          width: 26px;
          height: 26px;
          padding: 0;
          border-radius: 6px;
          border: 1px solid var(--nf-border-default, #e5e7eb);
          background: var(--nf-surface-section, #ffffff);
          color: var(--nf-text-secondary, #4b5563);
          box-shadow: 0 1px 2px 0 rgba(0, 0, 0, 0.04);
          transition: all 0.1s ease;

          &:hover:not(:disabled) {
            background: var(--nf-surface-hover, #f9fafb);
            border-color: var(--nf-color-gray-300, #d1d5db);
            color: var(--nf-text-primary, #111827);
          }

          &:disabled {
            opacity: 0.35;
            background: transparent;
            box-shadow: none;
            border-color: transparent;
          }

          .mat-mdc-button-touch-target {
            display: none;
          }

          svg {
            width: 14px;
            height: 14px;
            fill: currentColor;
          }
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

    :host {
      display: block;
      min-width: 0;
      container-type: inline-size;
    }

    /* ── Container-driven compaction (pane width, not viewport) ── */
    @container (max-width: 560px) {
      .nf-pagination ::ng-deep .mat-mdc-paginator-container {
        justify-content: space-between;
        flex-wrap: nowrap;
        padding: 2px 4px;
        min-height: 32px;
        gap: 6px;
      }
      .nf-pagination ::ng-deep .mat-mdc-paginator-page-size {
        margin-right: 4px;
      }
      .nf-pagination ::ng-deep .mat-mdc-paginator-range-label {
        margin: 0 4px;
      }
    }
    @container (max-width: 460px) {
      .nf-pagination ::ng-deep .mat-mdc-paginator-page-size-label {
        display: none;
      }
    }
    @container (max-width: 380px) {
      .nf-pagination ::ng-deep .mat-mdc-paginator-page-size {
        display: none;
      }
      .nf-pagination ::ng-deep .mat-mdc-paginator-navigation-first,
      .nf-pagination ::ng-deep .mat-mdc-paginator-navigation-last {
        display: none;
      }
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
