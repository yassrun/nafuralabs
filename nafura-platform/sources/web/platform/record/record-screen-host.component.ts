import { NgComponentOutlet } from '@angular/common';
import {
  ChangeDetectionStrategy,
  Component,
  Type,
  effect,
  input,
  signal,
} from '@angular/core';

import { LoadingStateComponent } from '../../lib/anatomy/components/molecules/loading-state';
import type { ScreenLoader } from './record-section.context';

/**
 * Loads a `kind: 'screen'` section body on demand and projects it.
 * Loading and error chrome stay here; the screen draws only its body.
 */
@Component({
  selector: 'nf-record-screen-host',
  standalone: true,
  imports: [NgComponentOutlet, LoadingStateComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    @if (loading()) {
      <nf-loading-state message="Chargement…" />
    } @else if (failed()) {
      <p class="nf-record-screen-host__error">{{ failed() }}</p>
    } @else if (component(); as screen) {
      <ng-container *ngComponentOutlet="screen" />
    }
  `,
  styles: `
    .nf-record-screen-host__error {
      margin: 0;
      color: var(--nf-color-danger, #b42318);
      font-size: 0.875rem;
    }
  `,
})
export class RecordScreenHostComponent {
  readonly screen = input<Type<unknown> | undefined>();
  readonly loadScreen = input<ScreenLoader | undefined>();

  readonly component = signal<Type<unknown> | null>(null);
  readonly loading = signal(false);
  readonly failed = signal<string | null>(null);

  constructor() {
    effect(() => {
      const eager = this.screen();
      const loader = this.loadScreen();
      void this.resolve(eager, loader);
    });
  }

  private async resolve(eager: Type<unknown> | undefined, loader: ScreenLoader | undefined): Promise<void> {
    if (eager) {
      this.component.set(eager);
      this.loading.set(false);
      this.failed.set(null);
      return;
    }
    if (!loader) {
      this.component.set(null);
      this.failed.set('Écran de section manquant.');
      return;
    }
    this.loading.set(true);
    this.failed.set(null);
    try {
      this.component.set(await loader());
    } catch {
      this.component.set(null);
      this.failed.set('Impossible de charger la section.');
    } finally {
      this.loading.set(false);
    }
  }
}
