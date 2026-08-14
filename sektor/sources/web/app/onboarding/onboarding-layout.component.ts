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
          class="onb-layout__mark"
          src="/assets/branding/sektor-icon.svg"
          alt=""
          width="56"
          height="56"
          aria-hidden="true" />
        <div class="onb-layout__lockup">
          <span class="onb-layout__name">Sektor</span>
          <span class="onb-layout__byline">by nafuralabs</span>
        </div>
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
      background: var(--nf-surface-muted, #f3f4f6);
    }

    .onb-layout {
      min-height: 100dvh;
      display: flex;
      flex-direction: column;
      align-items: center;
      padding: clamp(1.5rem, 4vw, 2.75rem) 1.25rem 2rem;
      box-sizing: border-box;
    }

    .onb-layout__brand {
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 1rem;
      margin-bottom: clamp(1.5rem, 3vw, 2rem);
      text-align: center;
    }

    .onb-layout__mark {
      display: block;
      width: 56px;
      height: 56px;
      flex-shrink: 0;
    }

    .onb-layout__lockup {
      display: inline-flex;
      align-items: baseline;
      gap: 0.4rem;
      flex-wrap: wrap;
      justify-content: center;
    }

    .onb-layout__name {
      font-size: clamp(1.5rem, 4vw, 1.75rem);
      font-weight: 700;
      letter-spacing: -0.03em;
      line-height: 1.1;
      color: var(--nf-color-primary-700, #1b3fae);
    }

    .onb-layout__byline {
      font-size: 0.8125rem;
      font-weight: 400;
      color: var(--nf-text-muted, #6b7280);
      letter-spacing: 0.01em;
    }

    .onb-layout__main {
      width: 100%;
      max-width: 1200px;
    }
  `],
})
export class OnboardingLayoutComponent {}
