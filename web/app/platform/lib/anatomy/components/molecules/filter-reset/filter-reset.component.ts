import { Component, inject, input, output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { TooltipDirective } from '../../atoms/tooltip';

/**
 * FilterReset — standardized reset button for filter bars.
 * Disabled when no filter is active.
 *
 * @example
 * <nf-filter-reset [active]="hasActiveFilter()" (reset)="resetFilters()"></nf-filter-reset>
 */
@Component({
  selector: 'nf-filter-reset',
  standalone: true,
  imports: [CommonModule, TooltipDirective, TranslateModule],
  template: `
    <button
      type="button"
      class="nf-filter-reset"
      [class.nf-filter-reset--active]="active()"
      [disabled]="!active()"
      (click)="reset.emit()"
      [title]="'shared.filters.resetTitle' | translate"
      [nfTooltip]="tooltipMessage"
      position="bottom">
      <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
        <path d="M3 6h18M8 6V4h8v2M19 6l-1 14H6L5 6"/>
      </svg>
      @if (showLabel()) { {{ 'shared.filters.reset' | translate }} }
    </button>
  `,
  styles: [`
    .nf-filter-reset { display: inline-flex; align-items: center; gap: 5px; padding: 6px 10px; border: 1px solid #e2e8f0; border-radius: 6px; background: white; font-size: 12px; color: #94a3b8; cursor: not-allowed; transition: all 80ms; }
    .nf-filter-reset--active { color: #475569; cursor: pointer; }
    .nf-filter-reset--active:hover { background: #fee2e2; border-color: #fca5a5; color: #dc2626; }
    .nf-filter-reset:disabled { opacity: 0.5; }
  `],
})
export class FilterResetComponent {
  private readonly translate = inject(TranslateService);

  readonly active = input<boolean>(false);
  readonly showLabel = input<boolean>(true);
  readonly reset = output<void>();

  readonly tooltipMessage = this.translate.instant('shared.filters.resetTooltip');
}
