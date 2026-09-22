import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { LucideAngularModule } from 'lucide-angular';
import { TranslateModule } from '@ngx-translate/core';

import { AiPanelService } from '../../../core/shell/ai-panel.service';

/** Side panel toggled by `nf-ai-toggle` via {@link AiPanelService}. */
@Component({
  selector: 'nf-app-shell-ai-panel',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [LucideAngularModule, TranslateModule],
  template: `
    <aside
      class="nf-app-shell-ai-panel"
      [class.is-open]="aiPanel.open()"
      [attr.aria-hidden]="!aiPanel.open()"
      [attr.aria-label]="'core.conversation.title' | translate">
      <header class="nf-app-shell-ai-panel__header">
        <div class="nf-app-shell-ai-panel__title">
          <lucide-icon name="sparkles" [size]="16" aria-hidden="true"></lucide-icon>
          <span>{{ 'core.conversation.title' | translate }}</span>
        </div>
        <button
          type="button"
          class="nf-app-shell-ai-panel__close"
          [attr.aria-label]="'core.conversation.close' | translate"
          (click)="aiPanel.setOpen(false)">
          <lucide-icon name="x" [size]="18" aria-hidden="true"></lucide-icon>
        </button>
      </header>

      <div class="nf-app-shell-ai-panel__body">
        <p class="nf-app-shell-ai-panel__welcome">
          {{ 'core.conversation.welcome' | translate }}
        </p>
      </div>
    </aside>
  `,
  styles: [`
    :host {
      display: contents;
    }
    .nf-app-shell-ai-panel {
      grid-column: -1;
      grid-row: 2;
      display: flex;
      flex-direction: column;
      width: 0;
      min-width: 0;
      overflow: hidden;
      border-left: 0 solid var(--nf-border-default, #e2e8f0);
      background: var(--nf-color-surface, #ffffff);
      transition: width 160ms ease, border-width 160ms ease;
    }
    .nf-app-shell-ai-panel.is-open {
      width: var(--nf-app-shell-ai-width, 360px);
      border-left-width: 1px;
    }
    .nf-app-shell-ai-panel__header {
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 8px;
      min-height: 48px;
      padding: 0 12px;
      border-bottom: 1px solid var(--nf-border-default, #e2e8f0);
    }
    .nf-app-shell-ai-panel__title {
      display: inline-flex;
      align-items: center;
      gap: 8px;
      font-size: 0.875rem;
      font-weight: 600;
      color: var(--nf-text-primary, #172033);
      white-space: nowrap;
    }
    .nf-app-shell-ai-panel__close {
      display: inline-flex;
      align-items: center;
      justify-content: center;
      width: 32px;
      height: 32px;
      border: 0;
      border-radius: 8px;
      background: transparent;
      color: var(--nf-text-muted, #64748b);
      cursor: pointer;
    }
    .nf-app-shell-ai-panel__close:hover {
      background: var(--nf-surface-hover, #f8fafc);
      color: var(--nf-text-primary, #172033);
    }
    .nf-app-shell-ai-panel__body {
      flex: 1;
      min-height: 0;
      overflow: auto;
      padding: 16px;
    }
    .nf-app-shell-ai-panel__welcome {
      margin: 0;
      font-size: 0.875rem;
      line-height: 1.5;
      color: var(--nf-text-muted, #64748b);
    }
    @media (max-width: 800px) {
      .nf-app-shell-ai-panel {
        position: fixed;
        top: var(--nf-app-shell-topbar-height, 56px);
        right: 0;
        bottom: 0;
        z-index: 30;
        grid-column: auto;
        grid-row: auto;
        box-shadow: var(--nf-shadow-lg, 0 10px 30px rgb(15 23 42 / 12%));
      }
      .nf-app-shell-ai-panel.is-open {
        width: min(100vw, var(--nf-app-shell-ai-width, 360px));
      }
    }
  `],
})
export class AppShellAiPanelComponent {
  readonly aiPanel = inject(AiPanelService);
}
