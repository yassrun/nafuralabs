import { ChangeDetectionStrategy, Component, inject } from '@angular/core';

import { AppShellContextRailService } from '@platform/platform/app-shell';

@Component({
  selector: 'sb-nafura-contexts',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <section class="page">
      <h1>Contextes métier</h1>
      <p class="hint">
        Réglage Nafura pour cette app. Un contexte inactif disparaît du rail et sa route
        ne se monte plus. Le code métier n'est pas ici.
      </p>
      <ul>
        @for (slot of rail.slots(); track slot.id) {
          <li>
            <div>
              <strong>{{ slot.label }}</strong>
              <span>{{ slot.id }}</span>
            </div>
            <button type="button" (click)="rail.setEnabled(slot.id, !slot.enabled)">
              {{ slot.enabled ? 'Désactiver' : 'Activer' }}
            </button>
          </li>
        }
      </ul>
    </section>
  `,
  styles: [`
    .page { padding: 28px 32px; max-width: 720px; }
    h1 { margin: 0 0 8px; font-size: 1.5rem; }
    .hint { margin: 0 0 20px; color: var(--nf-text-muted, #64748b); line-height: 1.5; }
    ul { list-style: none; margin: 0; padding: 0; display: grid; gap: 8px; }
    li {
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 16px;
      padding: 12px 14px;
      border: 1px solid var(--nf-border-default, #e2e8f0);
      border-radius: 10px;
      background: #fff;
    }
    li span { display: block; color: var(--nf-text-muted, #64748b); font-size: 0.75rem; }
    button {
      border: 1px solid var(--nf-border-default, #e2e8f0);
      background: #fff;
      border-radius: 8px;
      padding: 6px 12px;
      font-weight: 600;
      cursor: pointer;
    }
  `],
})
export class NafuraContextsPage {
  readonly rail = inject(AppShellContextRailService);
}
