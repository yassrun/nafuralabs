import { Component, Input, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { StatusChipComponent, DoxStatus } from './status-chip.component';

@Component({
  selector: 'dox-context-header',
  standalone: true,
  imports: [CommonModule, StatusChipComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <header class="dox-context-header">
      @if (docType) {
        <div class="dox-context-header__main">
          <div class="dox-context-header__title-row">
            <h1 class="dox-h1">{{ docType }}</h1>
            @if (status) {
              <dox-status-chip [status]="status" />
            }
          </div>
          
          <div class="dox-context-header__meta">
            @if (version) {
              <span class="dox-context-header__meta-item">
                <span class="dox-label">Definition:</span>
                <span class="dox-body-sm dox-mono">v{{ version }}</span>
              </span>
            }
            @if (hint) {
              <span class="dox-context-header__meta-divider">|</span>
              <span class="dox-context-header__hint">{{ hint }}</span>
            }
          </div>
        </div>
      } @else {
        <div class="dox-context-header__empty">
          <p class="dox-body-sm">{{ emptyMessage }}</p>
        </div>
      }
    </header>
  `,
  styles: [`
    .dox-context-header {
      padding: var(--dox-spacing-md) var(--dox-spacing-lg);
      background: var(--dox-color-surface, #ffffff);
      border-bottom: 1px solid var(--dox-color-border, #e2e8f0);
      min-height: 64px;
      display: flex;
      align-items: center;
    }

    .dox-context-header__main {
      display: flex;
      flex-direction: column;
      gap: var(--dox-spacing-4xs, 2px);
    }

    .dox-context-header__title-row {
      display: flex;
      align-items: center;
      gap: var(--dox-spacing-md, 16px);
    }

    .dox-context-header__meta {
      display: flex;
      align-items: center;
      gap: var(--dox-spacing-sm, 12px);
      color: var(--dox-color-text-secondary, #64748b);
    }

    .dox-context-header__meta-item {
      display: flex;
      align-items: center;
      gap: var(--dox-spacing-xs, 8px);
    }

    .dox-context-header__meta-divider {
      color: var(--dox-color-border, #e2e8f0);
    }

    .dox-context-header__hint {
      font-size: 0.75rem;
      opacity: 0.8;
    }

    .dox-context-header__empty {
      color: var(--dox-color-text-muted, #94a3b8);
    }
  `]
})
export class ContextHeaderComponent {
  @Input() docType?: string;
  @Input() version?: string;
  @Input() status?: DoxStatus | string;
  @Input() hint?: string;
  @Input() emptyMessage = 'Select a document type from the sidebar to initialize workspace.';
}
