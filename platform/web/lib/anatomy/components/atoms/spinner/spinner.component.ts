import { Component, input, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';

/**
 * Spinner size types.
 */
export type SpinnerSize = 'sm' | 'md' | 'lg';

/**
 * Spinner color types.
 */
export type SpinnerColor = 'primary' | 'secondary' | 'white';

/**
 * Spinner Component
 *
 * Loading indicator.
 *
 * @stable
 *
 * @example
 * <nf-spinner size="sm"></nf-spinner>
 * <nf-spinner size="lg" color="white"></nf-spinner>
 */
@Component({
  selector: 'nf-spinner',
  standalone: true,
  imports: [CommonModule, MatProgressSpinnerModule],
  template: `
    <mat-spinner
      [diameter]="diameter()"
      [class]="spinnerClasses()"
    ></mat-spinner>
  `,
  styles: [`
    :host {
      display: inline-flex;
      align-items: center;
      justify-content: center;
    }

    .nf-spinner--primary {
      --mdc-circular-progress-active-indicator-color: var(--nf-color-primary, #1976d2);
    }

    .nf-spinner--secondary {
      --mdc-circular-progress-active-indicator-color: var(--nf-color-text-secondary, #666);
    }

    .nf-spinner--white {
      --mdc-circular-progress-active-indicator-color: white;
    }
  `],
})
export class SpinnerComponent {
  // Inputs
  size = input<SpinnerSize>('md');
  color = input<SpinnerColor>('primary');

  // Computed diameter
  diameter = computed(() => {
    const sizes: Record<SpinnerSize, number> = {
      sm: 20,
      md: 32,
      lg: 48,
    };
    return sizes[this.size()];
  });

  // Computed classes
  spinnerClasses = computed(() => {
    return `nf-spinner nf-spinner--${this.color()}`;
  });
}
