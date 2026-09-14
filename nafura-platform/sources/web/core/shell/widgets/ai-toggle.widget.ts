import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { LucideAngularModule } from 'lucide-angular';
import { TranslateModule } from '@ngx-translate/core';

import { AiPanelService } from '../ai-panel.service';

/**
 * Default topbar AI toggle — reusable chrome for any platform app.
 *
 * Override via SHELL_EXTENSIONS slot `header-ai`. The panel open state lives
 * on {@link AiPanelService} so shortcuts and replacements stay in sync.
 */
@Component({
  selector: 'nf-ai-toggle',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [LucideAngularModule, TranslateModule],
  template: `
    <button
      type="button"
      class="naf-shell__ai-toggle"
      [class.is-active]="aiPanel.open()"
      [attr.aria-label]="'core.conversation.toggle' | translate"
      (click)="aiPanel.toggle()">
      <lucide-icon name="sparkles" [size]="16" class="naf-shell__icon" aria-hidden="true"></lucide-icon>
      <span class="naf-shell__ai-toggle-label">AI</span>
    </button>
  `,
  styles: [`
    :host { display: inline-flex; align-items: center; }

    .naf-shell__ai-toggle {
      display: inline-flex;
      align-items: center;
      gap: var(--nf-space-1, 0.25rem);
      height: 34px;
      padding: 0 var(--nf-space-2-5, 0.625rem);
      border-radius: var(--nf-radius-full, 9999px);
      border: 1px solid var(--nf-border-default, #e5e7eb);
      background: var(--nf-color-surface, #ffffff);
      color: var(--nf-text-secondary, #4b5563);
      cursor: pointer;
      font-size: var(--nf-font-size-xs, 0.75rem);
      font-weight: var(--nf-font-weight-semibold, 600);
      transition: background var(--nf-transition-fast, 100ms ease),
                  border-color var(--nf-transition-fast, 100ms ease),
                  color var(--nf-transition-fast, 100ms ease);
    }

    .naf-shell__ai-toggle:hover {
      border-color: var(--nf-color-primary-300, #93c5fd);
      background: var(--nf-primary-subtle, #eff6ff);
      color: var(--nf-color-primary-700, #1d4ed8);
    }

    .naf-shell__ai-toggle.is-active {
      border-color: var(--nf-color-primary, #3b82f6);
      background: var(--nf-color-primary, #3b82f6);
      color: var(--nf-color-text-inverse, #ffffff);
    }

    .naf-shell__ai-toggle .naf-shell__icon {
      font-size: 16px;
      width: 16px;
      height: 16px;
    }

    .naf-shell__ai-toggle-label {
      letter-spacing: var(--nf-letter-spacing-wide, 0.025em);
    }

    @media (pointer: coarse) {
      .naf-shell__ai-toggle {
        height: 40px;
      }
    }

    @media (max-width: 640px) {
      .naf-shell__ai-toggle-label { display: none; }
    }
  `],
})
export class AiToggleWidget {
  readonly aiPanel = inject(AiPanelService);
}
