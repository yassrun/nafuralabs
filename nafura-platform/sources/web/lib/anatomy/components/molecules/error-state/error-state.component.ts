import { Component, input, output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatIconModule } from '@angular/material/icon';
import { LucideAngularModule } from 'lucide-angular';
import { ButtonComponent } from '../../atoms/button';

/**
 * Error State Component
 *
 * Error display with retry.
 *
 * @example
 * <nf-error-state
 *   [message]="error()"
 *   (retry)="loadData()">
 * </nf-error-state>
 */
@Component({
  selector: 'nf-error-state',
  standalone: true,
  imports: [CommonModule, MatIconModule, LucideAngularModule, ButtonComponent],
  template: `
    <div class="nf-error-state" role="alert">
      @if (icon().includes('-')) {
        <lucide-icon class="nf-error-state__icon" [name]="icon()" [size]="48" aria-hidden="true"></lucide-icon>
      } @else {
        <mat-icon class="nf-error-state__icon" aria-hidden="true">{{ icon() }}</mat-icon>
      }
      <h3 class="nf-error-state__title">{{ title() }}</h3>
      @if (message()) {
        <p class="nf-error-state__message">{{ message() }}</p>
      }
      @if (showRetry()) {
        <nf-button
          variant="secondary"
          icon="refresh-cw"
          iconLibrary="lucide"
          (clicked)="retry.emit()"
        >{{ retryLabel() }}</nf-button>
      }
    </div>
  `,
  styles: [`
    .nf-error-state {
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      padding: 48px 24px;
      text-align: center;
    }

    .nf-error-state__icon {
      font-size: 64px;
      width: 64px;
      height: 64px;
      color: var(--nf-color-danger, #d32f2f);
      margin-bottom: 16px;
    }

    .nf-error-state__title {
      margin: 0 0 8px;
      font-size: 1.125rem;
      font-weight: 600;
      color: var(--nf-color-text, #333);
    }

    .nf-error-state__message {
      margin: 0 0 24px;
      font-size: 0.875rem;
      color: var(--nf-color-text-secondary, #666);
      max-width: 400px;
    }
  `],
})
export class ErrorStateComponent {
  // Inputs
  icon = input<string>('alert-circle');
  title = input<string>('Une erreur est survenue');
  message = input<string | undefined>(undefined);
  retryLabel = input<string>('Réessayer');
  showRetry = input<boolean>(true);

  // Outputs
  retry = output<void>();
}
