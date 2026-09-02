import { ChangeDetectionStrategy, Component, input } from '@angular/core';

export type EtudeBannerTone = 'error' | 'info' | 'success' | 'warning';

/**
 * Bandeau unique du parcours étude (sous le stepper) — erreur, info, succès.
 */
@Component({
  selector: 'app-etude-banner',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div
      class="etude-banner"
      [class.etude-banner--error]="tone() === 'error'"
      [class.etude-banner--info]="tone() === 'info'"
      [class.etude-banner--success]="tone() === 'success'"
      [class.etude-banner--warning]="tone() === 'warning'"
      [attr.role]="tone() === 'error' ? 'alert' : 'status'"
    >
      <span class="etude-banner__icone" aria-hidden="true">{{ icone() }}</span>
      @if (title()) {
        <strong class="etude-banner__title">{{ title() }}</strong>
      }
      <span class="etude-banner__msg">{{ message() }}</span>
      <ng-content />
    </div>
  `,
  styles: `
    :host {
      display: block;
    }

    .etude-banner {
      display: flex;
      align-items: baseline;
      flex-wrap: wrap;
      gap: 0.35rem 0.55rem;
      margin: 0 0 0.65rem;
      padding: 0.55rem 0.85rem;
      border: 1px solid var(--nf-color-border);
      border-left-width: 3px;
      border-radius: 6px;
      background: var(--nf-color-bg-subtle);
      font-size: 0.8125rem;
      line-height: 1.4;
      color: var(--nf-color-text-secondary);
    }

    .etude-banner--error {
      border-left-color: var(--nf-color-danger-600);
      color: var(--nf-color-danger-700, #9b1c1c);
      background: color-mix(in srgb, var(--nf-color-danger-600) 6%, transparent);
    }

    .etude-banner--info {
      border-left-color: var(--nf-color-primary-500, #0b6e7a);
      color: var(--nf-color-text-secondary);
      background: color-mix(in srgb, var(--nf-color-primary-500, #0b6e7a) 5%, transparent);
    }

    .etude-banner--success {
      border-left-color: var(--nf-color-success, #059669);
      color: var(--nf-color-success, #059669);
      background: color-mix(in srgb, var(--nf-color-success, #059669) 8%, transparent);
    }

    .etude-banner--warning {
      border-left-color: var(--nf-color-warning-600, #d97706);
      color: var(--nf-color-warning-700, #92400e);
      background: color-mix(in srgb, var(--nf-color-warning-600, #d97706) 8%, transparent);
    }

    .etude-banner__icone {
      flex-shrink: 0;
      font-size: 0.875rem;
    }

    .etude-banner__title {
      color: inherit;
      font-weight: 650;
      white-space: nowrap;
    }

    .etude-banner__msg {
      min-width: 0;
      overflow-wrap: anywhere;
    }
  `,
})
export class EtudeBannerComponent {
  readonly tone = input<EtudeBannerTone>('info');
  readonly title = input<string | undefined>(undefined);
  readonly message = input.required<string>();

  icone(): string {
    switch (this.tone()) {
      case 'error':
        return '⚠';
      case 'success':
        return '✓';
      case 'warning':
        return '⚠';
      default:
        return 'ℹ';
    }
  }
}
