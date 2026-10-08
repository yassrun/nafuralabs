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
import type { ListingHeaderLoader } from './listing-header.context';

/** Loads a listing header screen on demand and projects it between the toolbar and the rows. */
@Component({
  selector: 'nf-listing-header-host',
  standalone: true,
  imports: [NgComponentOutlet, LoadingStateComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    @if (loading()) {
      <nf-loading-state message="Chargement…" />
    } @else if (failed()) {
      <p class="nf-listing-header-host__error">{{ failed() }}</p>
    } @else if (component(); as header) {
      <ng-container *ngComponentOutlet="header" />
    }
  `,
  styles: `
    :host { display: block; }
    .nf-listing-header-host__error {
      margin: 0 0 8px;
      color: var(--nf-color-danger, #b42318);
      font-size: 0.875rem;
    }
  `,
})
export class ListingHeaderHostComponent {
  readonly header = input<Type<unknown> | undefined>();
  readonly loadHeader = input<ListingHeaderLoader | undefined>();

  readonly component = signal<Type<unknown> | null>(null);
  readonly loading = signal(false);
  readonly failed = signal<string | null>(null);

  constructor() {
    effect(() => {
      void this.resolve(this.header(), this.loadHeader());
    });
  }

  private async resolve(eager: Type<unknown> | undefined, loader: ListingHeaderLoader | undefined): Promise<void> {
    if (eager) {
      this.component.set(eager);
      this.loading.set(false);
      this.failed.set(null);
      return;
    }
    if (!loader) {
      this.component.set(null);
      return;
    }
    this.loading.set(true);
    this.failed.set(null);
    try {
      this.component.set(await loader());
    } catch {
      this.component.set(null);
      this.failed.set('Impossible de charger l’en-tête.');
    } finally {
      this.loading.set(false);
    }
  }
}
