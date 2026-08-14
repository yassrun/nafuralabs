import { Component, input, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { SpinnerComponent } from '../../atoms/spinner';
import { SkeletonComponent } from '../../atoms/skeleton';

/**
 * Loading state variant types.
 */
export type LoadingStateVariant = 'overlay' | 'inline' | 'skeleton';

/**
 * Loading state size types.
 */
export type LoadingStateSize = 'sm' | 'md' | 'lg';

/**
 * Loading State Component
 *
 * Full loading overlay or inline.
 *
 * @example
 * <nf-loading-state message="Loading items..."></nf-loading-state>
 * <nf-loading-state variant="overlay" *ngIf="isLoading()"></nf-loading-state>
 */
@Component({
  selector: 'nf-loading-state',
  standalone: true,
  imports: [CommonModule, SpinnerComponent, SkeletonComponent],
  template: `
    @if (variant() === 'skeleton') {
      <div class="nf-loading-state nf-loading-state--skeleton">
        <nf-skeleton variant="text" [lines]="3"></nf-skeleton>
        <nf-skeleton variant="rect" width="100%" height="100px"></nf-skeleton>
        <nf-skeleton variant="text" [lines]="2"></nf-skeleton>
      </div>
    } @else {
      <div [class]="loadingClasses()">
        <div class="nf-loading-state__content">
          <nf-spinner [size]="size()"></nf-spinner>
          @if (message()) {
            <p class="nf-loading-state__message">{{ message() }}</p>
          }
        </div>
      </div>
    }
  `,
  styles: [`
    .nf-loading-state {
      display: flex;
      align-items: center;
      justify-content: center;
    }

    .nf-loading-state--inline {
      padding: 24px;
    }

    .nf-loading-state--overlay {
      position: absolute;
      inset: 0;
      background-color: rgba(255, 255, 255, 0.8);
      z-index: 100;
    }

    .nf-loading-state--skeleton {
      display: flex;
      flex-direction: column;
      gap: 16px;
      padding: 16px;
    }

    .nf-loading-state__content {
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 12px;
    }

    .nf-loading-state__message {
      margin: 0;
      font-size: 0.875rem;
      color: var(--nf-color-text-secondary, #666);
    }
  `],
})
export class LoadingStateComponent {
  // Inputs
  message = input<string | undefined>(undefined);
  variant = input<LoadingStateVariant>('inline');
  size = input<LoadingStateSize>('md');

  // Computed classes
  loadingClasses = computed(() => {
    return `nf-loading-state nf-loading-state--${this.variant()}`;
  });
}
