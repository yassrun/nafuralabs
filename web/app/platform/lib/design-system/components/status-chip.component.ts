import { Component, Input, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';

export type DoxStatus = 'Draft' | 'Valid' | 'Invalid' | 'Corrected' | 'Exported';

@Component({
  selector: 'dox-status-chip',
  standalone: true,
  imports: [CommonModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <span class="dox-status-chip" [class]="'dox-status-chip--' + status.toLowerCase()">
      {{ status }}
    </span>
  `,
  styles: [`
    .dox-status-chip {
      display: inline-flex;
      align-items: center;
      padding: 2px 8px;
      border-radius: var(--dox-radius-full, 9999px);
      font-size: 0.75rem;
      font-weight: 600;
      line-height: 1rem;
      white-space: nowrap;
      border: 1px solid transparent;
    }

    .dox-status-chip--draft {
      background: var(--dox-status-draft-bg, #f1f5f9);
      color: var(--dox-status-draft-text, #475569);
    }

    .dox-status-chip--valid {
      background: var(--dox-status-valid-bg, #f0fdf4);
      color: var(--dox-status-valid-text, #166534);
    }

    .dox-status-chip--invalid {
      background: var(--dox-status-invalid-bg, #fef2f2);
      color: var(--dox-status-invalid-text, #991b1b);
    }

    .dox-status-chip--corrected {
      background: var(--dox-status-corrected-bg, #fff7ed);
      color: var(--dox-status-corrected-text, #9a3412);
    }

    .dox-status-chip--exported {
      background: var(--dox-status-exported-bg, #f0f9ff);
      color: var(--dox-status-exported-text, #075985);
    }
  `]
})
export class StatusChipComponent {
  @Input({ required: true }) status!: DoxStatus | string;
}
