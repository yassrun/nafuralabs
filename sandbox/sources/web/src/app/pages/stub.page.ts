import { Component, ChangeDetectionStrategy, computed, inject } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { ActivatedRoute, NavigationEnd, Router } from '@angular/router';
import { filter, map, startWith } from 'rxjs';

@Component({
  selector: 'sb-stub',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="stub">
      <h1>{{ title() }}</h1>
      <p class="stub__status">Stub — démo live pas encore branchée</p>
      @if (hint()) {
        <p class="stub__hint">{{ hint() }}</p>
      }
      <p class="stub__doc">
        Voir Anatomy :
        <code>nafura-platform/sources/web/lib/anatomy/</code>
      </p>
    </div>
  `,
  styles: [
    `
      .stub {
        max-width: 40rem;
        padding: 24px;
        border: 1px dashed var(--nf-border-subtle, #c5cad3);
        border-radius: 8px;
        background: var(--nf-bg-elevated, #fff);
      }
      h1 {
        margin: 0 0 8px;
        font-size: 1.35rem;
      }
      .stub__status {
        margin: 0 0 12px;
        font-weight: 600;
        color: #92400e;
      }
      .stub__hint,
      .stub__doc {
        margin: 0 0 8px;
        color: var(--nf-text-muted, #6b7280);
        font-size: 0.9rem;
      }
      code {
        font-size: 0.85em;
      }
    `,
  ],
})
export class StubPage {
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);

  private readonly navTick = toSignal(
    this.router.events.pipe(
      filter((e): e is NavigationEnd => e instanceof NavigationEnd),
      startWith(null),
      map(() => this.router.url)
    ),
    { initialValue: this.router.url }
  );

  readonly title = computed(() => {
    this.navTick();
    const t = this.route.snapshot.data['title'];
    return typeof t === 'string' ? t : 'Stub';
  });

  readonly hint = computed(() => {
    this.navTick();
    const h = this.route.snapshot.data['hint'];
    return typeof h === 'string' ? h : '';
  });
}
