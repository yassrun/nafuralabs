import { ChangeDetectionStrategy, Component, input, output } from '@angular/core';
import { TranslateModule } from '@ngx-translate/core';

import { ButtonComponent } from '../../atoms/button';

/**
 * Contextual save bar: appears at the bottom of a record while it has unsaved changes (or is being created).
 * Business actions stay in the toolbar; saving lives here only.
 */
@Component({
  selector: 'nf-save-bar',
  standalone: true,
  imports: [TranslateModule, ButtonComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    @if (visible()) {
      <div class="nf-save-bar" role="region" [attr.aria-label]="message() | translate">
        <span class="nf-save-bar__message">
          <span class="nf-save-bar__dot" aria-hidden="true"></span>
          {{ message() | translate }}
        </span>
        <span class="nf-save-bar__hint">Ctrl+S</span>
        <div class="nf-save-bar__actions">
          <nf-button variant="secondary" size="sm" [disabled]="saving()" (clicked)="discard.emit()">
            {{ discardLabel() | translate }}
          </nf-button>
          <nf-button variant="primary" size="sm" [loading]="saving()" [disabled]="saving()" (clicked)="save.emit()">
            {{ saveLabel() | translate }}
          </nf-button>
        </div>
      </div>
    }
  `,
  styles: [`
    :host {
      position: sticky;
      bottom: 0;
      z-index: 5;
      display: block;
    }
    .nf-save-bar {
      display: flex;
      align-items: center;
      gap: 12px;
      margin-top: 16px;
      padding: 10px 14px;
      border: 1px solid var(--nf-border-default, #e5e7eb);
      border-radius: var(--nf-radius-md, 8px);
      background: var(--nf-surface-section, #fff);
      box-shadow: var(--nf-shadow-md, 0 8px 24px rgba(15, 23, 42, 0.12));
      animation: nf-save-bar-in 160ms ease-out;
    }
    .nf-save-bar__message {
      display: inline-flex;
      align-items: center;
      gap: 8px;
      font-size: 0.875rem;
      font-weight: 500;
      color: var(--nf-text-primary, #111827);
    }
    .nf-save-bar__dot {
      width: 8px;
      height: 8px;
      border-radius: 999px;
      background: var(--nf-color-warning-500, #f59e0b);
    }
    .nf-save-bar__hint {
      font-size: 0.75rem;
      color: var(--nf-text-muted, #6b7280);
    }
    .nf-save-bar__actions {
      display: flex;
      gap: 8px;
      margin-left: auto;
    }
    @keyframes nf-save-bar-in {
      from { transform: translateY(8px); opacity: 0; }
      to { transform: none; opacity: 1; }
    }
    @media (prefers-reduced-motion: reduce) {
      .nf-save-bar { animation: none; }
    }
  `],
})
export class SaveBarComponent {
  readonly visible = input(false);
  readonly saving = input(false);
  readonly message = input('Unsaved changes');
  readonly saveLabel = input('Save');
  readonly discardLabel = input('Discard');

  readonly save = output<void>();
  readonly discard = output<void>();
}
