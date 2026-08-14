import { Component, input, output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { LoadingStateComponent, type LoadingStateVariant } from '../loading-state';
import { EmptyStateComponent } from '../empty-state';
import { ErrorStateComponent } from '../error-state';

export type DataStateValue = 'loading' | 'empty' | 'error' | 'loaded';

/**
 * DataState — unified loading/empty/error/loaded switcher.
 *
 * @example
 * <nf-data-state [state]="pageState()" (retry)="reload()" (emptyAction)="onCreate()">
 *   <table>...</table>
 * </nf-data-state>
 */
@Component({
  selector: 'nf-data-state',
  standalone: true,
  imports: [CommonModule, LoadingStateComponent, EmptyStateComponent, ErrorStateComponent],
  template: `
    @switch (state()) {
      @case ('loading') {
        <nf-loading-state
          [variant]="loadingVariant()"
          [message]="loadingMessage()">
        </nf-loading-state>
      }
      @case ('empty') {
        <nf-empty-state
          [icon]="emptyIcon()"
          [title]="emptyTitle()"
          [message]="emptyMessage()"
          [actionLabel]="emptyActionLabel()"
          (action)="emptyAction.emit()">
        </nf-empty-state>
      }
      @case ('error') {
        <nf-error-state
          [message]="errorMessage()"
          (retry)="retry.emit()">
        </nf-error-state>
      }
      @default {
        <ng-content></ng-content>
      }
    }
  `,
})
export class DataStateComponent {
  readonly state = input.required<DataStateValue>();

  readonly skeletonRows = input<number>(5);

  /** When `skeleton`, ignores `loadingMessage`. Use `inline` or `overlay` for spinner + text. */
  readonly loadingVariant = input<LoadingStateVariant>('skeleton');

  readonly loadingMessage = input<string | undefined>(undefined);

  readonly emptyIcon = input<string>('inbox');
  readonly emptyTitle = input<string>('Aucune donnée');
  readonly emptyMessage = input<string>('');
  readonly emptyActionLabel = input<string>('');

  readonly errorMessage = input<string>('Une erreur est survenue. Veuillez réessayer.');

  readonly emptyAction = output<void>();
  readonly retry = output<void>();
}
