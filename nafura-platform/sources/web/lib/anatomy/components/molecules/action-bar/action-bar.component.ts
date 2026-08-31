import { Component, input, computed } from '@angular/core';
import { CommonModule } from '@angular/common';

/**
 * Action bar alignment types.
 */
export type ActionBarAlign = 'left' | 'right' | 'between' | 'center';

/**
 * Action bar spacing types.
 */
export type ActionBarSpacing = 'sm' | 'md' | 'lg';

/**
 * Action Bar Component
 *
 * Horizontal action container with alignment.
 *
 * @example
 * <nf-action-bar align="between">
 *   <nf-button variant="ghost" icon="arrow_back">Back</nf-button>
 *   <div>
 *     <nf-button variant="secondary">Cancel</nf-button>
 *     <nf-button variant="primary" [loading]="isSaving">Save</nf-button>
 *   </div>
 * </nf-action-bar>
 */
@Component({
  selector: 'nf-action-bar',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div [class]="actionBarClasses()">
      <ng-content></ng-content>
    </div>
  `,
  styles: [`
    .nf-action-bar {
      display: flex;
      align-items: center;
      flex-wrap: wrap;
    }

    // Alignment
    .nf-action-bar--left {
      justify-content: flex-start;
    }

    .nf-action-bar--right {
      justify-content: flex-end;
    }

    .nf-action-bar--between {
      justify-content: space-between;
    }

    .nf-action-bar--center {
      justify-content: center;
    }

    // Spacing
    .nf-action-bar--sm {
      gap: 8px;
    }

    .nf-action-bar--md {
      gap: 12px;
    }

    .nf-action-bar--lg {
      gap: 16px;
    }

    /* AC-4 homogenisation-ux — form long */
    .nf-action-bar--sticky {
      position: sticky;
      bottom: 0;
      z-index: 2;
      padding-top: 0.75rem;
      padding-bottom: 0.75rem;
      margin-top: 1rem;
      border-top: 1px solid var(--nf-border-default, var(--nf-color-bg-muted, #e5e7eb));
      background: var(--nf-surface-page, var(--nf-color-surface, #fff));
    }
  `],
})
export class ActionBarComponent {
  // Inputs
  align = input<ActionBarAlign>('right');
  spacing = input<ActionBarSpacing>('md');
  /** Sticky bottom bar for long scrolling forms (homogenisation-ux AC-4). */
  sticky = input(false);

  // Computed classes
  actionBarClasses = computed(() => {
    return [
      'nf-action-bar',
      `nf-action-bar--${this.align()}`,
      `nf-action-bar--${this.spacing()}`,
      this.sticky() ? 'nf-action-bar--sticky' : '',
    ]
      .filter(Boolean)
      .join(' ');
  });
}
