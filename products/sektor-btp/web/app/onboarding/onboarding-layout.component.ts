import { ChangeDetectionStrategy, Component } from '@angular/core';
import { RouterOutlet } from '@angular/router';

@Component({
  selector: 'naf-onboarding-layout',
  standalone: true,
  imports: [RouterOutlet],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="onb-layout">
      <header class="onb-layout__brand">
        <img
          class="onb-layout__logo"
          src="/assets/branding/sektor-logo-horizontal.svg"
          alt="Sektor — ERP Construction"
          width="230"
          height="60" />
      </header>
      <main class="onb-layout__main">
        <router-outlet />
      </main>
    </div>
  `,
  styles: [`
    :host {
      display: block;
      min-height: 100dvh;
      background:
        radial-gradient(1100px 520px at 50% -220px, var(--nf-color-primary-100, #dce2f6) 0%, transparent 68%),
        var(--nf-surface-muted, #f3f4f6);
      border-top: 4px solid var(--nf-color-accent-400, #f2d544);
      box-sizing: border-box;
    }

    .onb-layout {
      min-height: calc(100dvh - 4px);
      display: flex;
      flex-direction: column;
      align-items: center;
      padding: clamp(1.5rem, 4vw, 3rem) 1.25rem 2.5rem;
      box-sizing: border-box;
    }

    .onb-layout__brand {
      display: flex;
      justify-content: center;
      margin-bottom: clamp(1.5rem, 3.5vw, 2.5rem);
    }

    .onb-layout__logo {
      display: block;
      width: clamp(180px, 30vw, 230px);
      height: auto;
    }

    .onb-layout__main {
      width: 100%;
      max-width: 1100px;
    }
  `],
})
export class OnboardingLayoutComponent {}
