import { NgComponentOutlet } from '@angular/common';
import { Component, inject, Type } from '@angular/core';
import { ActivatedRoute } from '@angular/router';

import { LoadingStateComponent } from '../../lib/anatomy/components/molecules/loading-state';
import { ScreenComponent } from '../../lib/anatomy/components/organisms/page-screen';
import type { BreadcrumbItem } from '../../lib/anatomy/types';
import { ScreenState } from './screen-state';

/** What a business context puts in the route `data.screen`. */
export interface ScreenPageConfig {
  id: string;
  title: string;
  subtitle?: string;
  icon?: string;
  /** `{id}` is the route param. */
  back?: { label: string; route: string };
  component: Type<unknown>;
}

/**
 * Page frame of a business-context screen: header, breadcrumb, loading and error.
 * The context component is projected in the body and may inject {@link ScreenState}.
 */
@Component({
  selector: 'nf-screen-page',
  standalone: true,
  imports: [NgComponentOutlet, ScreenComponent, LoadingStateComponent],
  providers: [ScreenState],
  template: `
    <nf-screen [header]="header()" [scroll]="true">
      @if (state.loading()) {
        <nf-loading-state message="Chargement…" />
      }
      @if (state.error()) {
        <p class="nf-screen-page__error">{{ state.error() }}</p>
      }
      <ng-container *ngComponentOutlet="config().component" />
    </nf-screen>
  `,
  styles: [
    `
      .nf-screen-page__error {
        margin: 0 0 var(--nf-space-3, 12px);
        color: var(--nf-color-danger, #b42318);
      }
    `,
  ],
})
export class ScreenPageComponent {
  private readonly route = inject(ActivatedRoute);
  readonly state = inject(ScreenState);

  config(): ScreenPageConfig {
    return this.route.snapshot.data['screen'] as ScreenPageConfig;
  }

  header() {
    const config = this.config();
    const crumbs: BreadcrumbItem[] = [];
    if (config.back) {
      crumbs.push({ label: config.back.label, route: this.fill(config.back.route) });
    }
    crumbs.push({ label: config.title });
    return { title: config.title, subtitle: config.subtitle, icon: config.icon, breadcrumbs: crumbs };
  }

  private fill(route: string): string {
    return route.replace('{id}', this.route.snapshot.paramMap.get('id') ?? '');
  }
}

export { ScreenState } from './screen-state';
