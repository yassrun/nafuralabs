import { ChangeDetectionStrategy, Component, input } from '@angular/core';

@Component({
  selector: 'nf-app-shell-top-bar-application-identity',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <span class="nf-app-shell-top-bar-application-identity">{{ applicationName() }}</span>
  `,
  styles: [`
    :host { display: block; min-width: 0; }
    .nf-app-shell-top-bar-application-identity {
      display: block;
      font-size: 0.9375rem;
      font-weight: 700;
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
    }
  `],
})
export class TopBarApplicationIdentityComponent {
  readonly applicationName = input.required<string>();
}
