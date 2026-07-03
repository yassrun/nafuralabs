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
        <span class="onb-layout__logo" aria-hidden="true">S</span>
        <span class="onb-layout__name">Nafura</span>
      </header>
      <main class="onb-layout__main">
        <router-outlet />
      </main>
    </div>
  `,
  styles: [`
    :host { display: block; min-height: 100dvh; background: var(--nf-surface-muted); }
    .onb-layout { min-height: 100dvh; display: flex; flex-direction: column; }
    .onb-layout__brand {
      display: flex; align-items: center; gap: 0.5rem;
      padding: 1rem 1.25rem;
      background: var(--nf-color-surface);
      border-bottom: 1px solid var(--nf-border-default);
    }
    .onb-layout__logo {
      width: 32px; height: 32px; border-radius: 8px;
      background: linear-gradient(135deg, var(--nf-color-primary-700), var(--nf-color-primary-500));
      color: var(--nf-color-surface); display: grid; place-items: center; font-weight: 700;
      box-shadow: 0 8px 18px rgba(37, 99, 235, 0.22);
    }
    .onb-layout__name { font-weight: 600; font-size: 1.125rem; }
    .onb-layout__main { flex: 1; padding: 1rem; max-width: 1200px; margin: 0 auto; width: 100%; box-sizing: border-box; }
    @media (min-width: 768px) { .onb-layout__main { padding: 2rem; } }
  `],
})
export class OnboardingLayoutComponent {}
