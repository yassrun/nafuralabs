import { ChangeDetectionStrategy, Component, input } from '@angular/core';

@Component({
  selector: 'sb-bc-slot',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <section class="slot">
      <h1>{{ title() }}</h1>
      <p>
        Slot de contexte métier monté par le chassis. Les sources métier restent dans le
        produit. Ce contexte est visible parce que Nafura l'a activé pour cette app.
      </p>
    </section>
  `,
  styles: [`
    .slot { padding: 28px 32px; max-width: 720px; }
    h1 { margin: 0 0 8px; font-size: 1.5rem; }
    p { margin: 0; color: var(--nf-text-muted, #64748b); line-height: 1.5; }
  `],
})
export class BcSlotPage {
  readonly title = input.required<string>();
}
