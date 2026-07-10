import { Component, input, output, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';

/**
 * Modal size types.
 */
export type ModalSize = 'sm' | 'md' | 'lg' | 'xl' | 'full';

/**
 * Modal Component
 *
 * Dialog/modal wrapper (wraps Material Dialog).
 * Use ModalService to open modals programmatically.
 *
 * @example
 * <nf-modal title="Edit Location" size="lg" (closed)="onClose($event)">
 *   <div body>
 *     <nf-form [fields]="fields" [values]="item"></nf-form>
 *   </div>
 *   <div footer>
 *     <nf-button variant="secondary" (clicked)="cancel()">Cancel</nf-button>
 *     <nf-button variant="primary" (clicked)="save()">Save</nf-button>
 *   </div>
 * </nf-modal>
 */
@Component({
  selector: 'nf-modal',
  standalone: true,
  imports: [CommonModule, MatDialogModule, MatIconModule, MatButtonModule],
  template: `
    <div [class]="modalClasses()">
      @if (title()) {
        <div class="nf-modal__header">
          <h2 class="nf-modal__title">{{ title() }}</h2>
          @if (closable()) {
            <button
              mat-icon-button
              class="nf-modal__close"
              aria-label="Close"
              (click)="onClose()"
            >
              <mat-icon>close</mat-icon>
            </button>
          }
        </div>
      }

      <div class="nf-modal__body">
        <ng-content select="[body]"></ng-content>
        <ng-content></ng-content>
      </div>

      <div class="nf-modal__footer">
        <ng-content select="[footer]"></ng-content>
      </div>
    </div>
  `,
  styles: [`
    .nf-modal {
      display: flex;
      flex-direction: column;
      max-height: 90vh;
    }

    // Sizes
    .nf-modal--sm {
      width: 400px;
    }

    .nf-modal--md {
      width: 560px;
    }

    .nf-modal--lg {
      width: 800px;
    }

    .nf-modal--xl {
      width: 1140px;
    }

    .nf-modal--full {
      width: 100vw;
      height: 100vh;
      max-height: 100vh;
    }

    .nf-modal__header {
      display: flex;
      align-items: center;
      justify-content: space-between;
      padding: 16px 24px;
      border-bottom: 1px solid var(--nf-color-border, #e0e0e0);
    }

    .nf-modal__title {
      margin: 0;
      font-size: 1.25rem;
      font-weight: 600;
      color: var(--nf-color-text, #333);
    }

    .nf-modal__close {
      margin: -8px -12px -8px 0;
    }

    .nf-modal__body {
      flex: 1;
      padding: 24px;
      overflow-y: auto;
    }

    .nf-modal__footer {
      display: flex;
      align-items: center;
      justify-content: flex-end;
      gap: 12px;
      padding: 16px 24px;
      border-top: 1px solid var(--nf-color-border, #e0e0e0);

      &:empty {
        display: none;
      }
    }
  `],
})
export class ModalComponent {
  // Inputs
  title = input<string | undefined>(undefined);
  size = input<ModalSize>('md');
  closable = input<boolean>(true);
  closeOnBackdrop = input<boolean>(true);
  closeOnEscape = input<boolean>(true);

  // Outputs
  closed = output<unknown>();

  // Computed
  modalClasses = computed(() => {
    return `nf-modal nf-modal--${this.size()}`;
  });

  onClose(result?: unknown): void {
    this.closed.emit(result);
  }
}
