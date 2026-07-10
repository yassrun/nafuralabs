import { Component, input, computed } from '@angular/core';
import { CommonModule } from '@angular/common';

/**
 * Divider orientation types.
 */
export type DividerOrientation = 'horizontal' | 'vertical';

/**
 * Divider spacing types.
 */
export type DividerSpacing = 'sm' | 'md' | 'lg';

/**
 * Divider Component
 *
 * Visual separator.
 *
 * @stable
 *
 * @example
 * <nf-divider></nf-divider>
 * <nf-divider label="Or"></nf-divider>
 * <nf-divider orientation="vertical"></nf-divider>
 */
@Component({
  selector: 'nf-divider',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div [class]="dividerClasses()">
      @if (label() && orientation() === 'horizontal') {
        <span class="nf-divider__line"></span>
        <span class="nf-divider__label">{{ label() }}</span>
        <span class="nf-divider__line"></span>
      }
    </div>
  `,
  styles: [`
    :host {
      display: block;
    }

    .nf-divider {
      display: flex;
      align-items: center;
    }

    // Horizontal
    .nf-divider--horizontal {
      width: 100%;
      height: 1px;
      background-color: var(--nf-color-border, #e0e0e0);
    }

    .nf-divider--horizontal.nf-divider--has-label {
      height: auto;
      background-color: transparent;
    }

    // Vertical
    .nf-divider--vertical {
      width: 1px;
      height: 100%;
      min-height: 20px;
      background-color: var(--nf-color-border, #e0e0e0);
    }

    // Spacing
    .nf-divider--sm {
      margin: 8px 0;
    }

    .nf-divider--md {
      margin: 16px 0;
    }

    .nf-divider--lg {
      margin: 24px 0;
    }

    .nf-divider--vertical.nf-divider--sm {
      margin: 0 8px;
    }

    .nf-divider--vertical.nf-divider--md {
      margin: 0 16px;
    }

    .nf-divider--vertical.nf-divider--lg {
      margin: 0 24px;
    }

    // Label
    .nf-divider__line {
      flex: 1;
      height: 1px;
      background-color: var(--nf-color-border, #e0e0e0);
    }

    .nf-divider__label {
      padding: 0 16px;
      font-size: 0.875rem;
      color: var(--nf-color-text-secondary, #666);
      white-space: nowrap;
    }
  `],
})
export class DividerComponent {
  // Inputs
  orientation = input<DividerOrientation>('horizontal');
  spacing = input<DividerSpacing>('md');
  label = input<string | undefined>(undefined);

  // Computed classes
  dividerClasses = computed(() => {
    const classes = [
      'nf-divider',
      `nf-divider--${this.orientation()}`,
      `nf-divider--${this.spacing()}`,
    ];

    if (this.label()) {
      classes.push('nf-divider--has-label');
    }

    return classes.join(' ');
  });
}
