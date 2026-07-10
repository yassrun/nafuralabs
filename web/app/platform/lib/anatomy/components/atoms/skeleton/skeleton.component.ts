import { Component, input, computed } from '@angular/core';
import { CommonModule } from '@angular/common';

/**
 * Skeleton variant types.
 */
export type SkeletonVariant = 'text' | 'circle' | 'rect';

/**
 * Skeleton Component
 *
 * Loading placeholder.
 *
 * @stable
 *
 * @example
 * <nf-skeleton variant="text" lines="3"></nf-skeleton>
 * <nf-skeleton variant="circle" width="40px" height="40px"></nf-skeleton>
 * <nf-skeleton variant="rect" width="100%" height="200px"></nf-skeleton>
 */
@Component({
  selector: 'nf-skeleton',
  standalone: true,
  imports: [CommonModule],
  template: `
    @if (variant() === 'text') {
      @for (line of lineArray(); track $index) {
        <div
          class="nf-skeleton nf-skeleton--text"
          [style.width]="$index === lineArray().length - 1 ? '80%' : width() || '100%'"
        ></div>
      }
    } @else {
      <div
        [class]="skeletonClasses()"
        [style.width]="width()"
        [style.height]="height()"
      ></div>
    }
  `,
  styles: [`
    :host {
      display: block;
    }

    .nf-skeleton {
      background: linear-gradient(
        90deg,
        var(--nf-color-skeleton, #e0e0e0) 25%,
        var(--nf-color-skeleton-highlight, #f5f5f5) 50%,
        var(--nf-color-skeleton, #e0e0e0) 75%
      );
      background-size: 200% 100%;
      animation: nf-skeleton-shimmer 1.5s ease-in-out infinite;
    }

    @keyframes nf-skeleton-shimmer {
      0% {
        background-position: 200% 0;
      }
      100% {
        background-position: -200% 0;
      }
    }

    // Text variant
    .nf-skeleton--text {
      height: 1em;
      margin-bottom: 8px;
      border-radius: 4px;

      &:last-child {
        margin-bottom: 0;
      }
    }

    // Circle variant
    .nf-skeleton--circle {
      border-radius: 50%;
    }

    // Rect variant
    .nf-skeleton--rect {
      border-radius: 4px;
    }
  `],
})
export class SkeletonComponent {
  // Inputs
  variant = input<SkeletonVariant>('text');
  width = input<string | undefined>(undefined);
  height = input<string | undefined>(undefined);
  lines = input<number>(1);

  // Computed line array for text variant
  lineArray = computed(() => {
    return Array(this.lines()).fill(0);
  });

  // Computed classes
  skeletonClasses = computed(() => {
    return `nf-skeleton nf-skeleton--${this.variant()}`;
  });
}
