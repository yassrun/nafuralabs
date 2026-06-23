import { ChangeDetectionStrategy, Component, computed, input } from '@angular/core';

const FLAGS: Record<string, string> = {
  MAD: '🇲🇦',
  EUR: '🇪🇺',
  USD: '🇺🇸',
  GBP: '🇬🇧',
  AED: '🇦🇪',
  SAR: '🇸🇦',
  CHF: '🇨🇭',
  JPY: '🇯🇵',
  CAD: '🇨🇦',
};

@Component({
  selector: 'app-devise-flag',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <span class="dev" [class.dev--lg]="size() === 'lg'">
      <span class="dev__flag" [attr.aria-hidden]="true">{{ flag() }}</span>
      @if (showCode()) {
        <span class="dev__code">{{ code() }}</span>
      }
      @if (showSymbol() && symbol()) {
        <span class="dev__sym">{{ symbol() }}</span>
      }
    </span>
  `,
  styles: [
    `
      .dev {
        display: inline-flex;
        align-items: center;
        gap: 4px;
        font-size: 13px;
        line-height: 1;
      }
      .dev--lg {
        font-size: 15px;
        gap: 6px;
      }
      .dev__flag {
        font-size: 1.15em;
      }
      .dev__code {
        font-weight: 600;
        color: var(--nf-text-primary);
        letter-spacing: 0.02em;
      }
      .dev__sym {
        color: var(--nf-color-text-secondary);
      }
    `,
  ],
})
export class DeviseFlagComponent {
  readonly code = input.required<string>();
  readonly symbol = input<string | undefined>(undefined);
  readonly showCode = input<boolean>(true);
  readonly showSymbol = input<boolean>(false);
  readonly size = input<'sm' | 'lg'>('sm');

  readonly flag = computed(() => FLAGS[this.code()?.toUpperCase()] ?? '🏳️');
}
