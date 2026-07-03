import { Component, input, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatIconModule } from '@angular/material/icon';

/**
 * Icon size types.
 */
export type IconSize = 'xs' | 'sm' | 'md' | 'lg' | 'xl';

/**
 * Icon Component
 *
 * Wrapper for Material Icons with size control.
 *
 * @stable
 *
 * @example
 * <nf-icon name="check" size="sm" color="success"></nf-icon>
 * <nf-icon name="sync" [spin]="isLoading"></nf-icon>
 */
@Component({
  selector: 'nf-icon',
  standalone: true,
  imports: [CommonModule, MatIconModule],
  template: `
    <mat-icon
      [class]="iconClasses()"
      [style.color]="colorStyle()"
    >{{ name() }}</mat-icon>
  `,
  styles: [`
    :host {
      display: inline-flex;
      align-items: center;
      justify-content: center;
    }

    mat-icon {
      display: flex;
      align-items: center;
      justify-content: center;
    }

    // Sizes
    .nf-icon--xs {
      font-size: 14px;
      width: 14px;
      height: 14px;
    }

    .nf-icon--sm {
      font-size: 18px;
      width: 18px;
      height: 18px;
    }

    .nf-icon--md {
      font-size: 24px;
      width: 24px;
      height: 24px;
    }

    .nf-icon--lg {
      font-size: 32px;
      width: 32px;
      height: 32px;
    }

    .nf-icon--xl {
      font-size: 48px;
      width: 48px;
      height: 48px;
    }

    // Spin animation
    .nf-icon--spin {
      animation: nf-icon-spin 1s linear infinite;
    }

    @keyframes nf-icon-spin {
      from {
        transform: rotate(0deg);
      }
      to {
        transform: rotate(360deg);
      }
    }

    // Theme colors
    .nf-icon--primary {
      color: var(--nf-color-primary, #1976d2);
    }

    .nf-icon--success {
      color: var(--nf-color-success, #388e3c);
    }

    .nf-icon--warning {
      color: var(--nf-color-warning, #f57c00);
    }

    .nf-icon--danger {
      color: var(--nf-color-danger, #d32f2f);
    }

    .nf-icon--info {
      color: var(--nf-color-info, #0288d1);
    }
  `],
})
export class IconComponent {
  // Inputs
  name = input.required<string>();
  size = input<IconSize>('md');
  color = input<string | undefined>(undefined);
  spin = input<boolean>(false);

  // Computed classes
  iconClasses = computed(() => {
    const classes = ['nf-icon', `nf-icon--${this.size()}`];

    if (this.spin()) {
      classes.push('nf-icon--spin');
    }

    // Add theme color class if it's a known color
    const themeColors = ['primary', 'success', 'warning', 'danger', 'info'];
    const colorValue = this.color();
    if (colorValue && themeColors.includes(colorValue)) {
      classes.push(`nf-icon--${colorValue}`);
    }

    return classes.join(' ');
  });

  // Custom color style (for non-theme colors)
  colorStyle = computed(() => {
    const themeColors = ['primary', 'success', 'warning', 'danger', 'info'];
    const colorValue = this.color();

    if (colorValue && !themeColors.includes(colorValue)) {
      return colorValue;
    }

    return undefined;
  });
}
