import { CommonModule } from '@angular/common';
import { Component, computed, inject } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { ActivatedRoute, RouterModule } from '@angular/router';
import { combineLatest, map } from 'rxjs';
import { TranslateModule, TranslateService } from '@ngx-translate/core';

import { PageHeaderComponent, PageShellComponent } from '@lib/anatomy';

import { MaterielGmaoFacadeService } from '@applications/erp/inventory/services/materiel-gmao-facade.service';
import type { OrdreTravail } from '@applications/erp/inventory/models/materiel-gmao.models';

@Component({
  selector: 'app-historique-ot',
  standalone: true,
  imports: [CommonModule, RouterModule, TranslateModule, PageShellComponent, PageHeaderComponent],
  template: `
    <nf-page-shell [scroll]="true">
      <nf-page-header [config]="header()">
      </nf-page-header>

      <ul class="timeline">
        @for (o of rows(); track o.id) {
          <li>
            <strong>{{ o.numero }}</strong> — {{ o.type }} — {{ o.status }}
            <span class="meta">{{ o.dateOuverture }} → {{ clotureLabel(o) }}</span>
            <a [routerLink]="['/materiel/maintenance/ot', o.id]">{{ 'materielGmao.actions.open' | translate }}</a>
          </li>
        } @empty {
          <li>{{ 'materielGmao.empty.history' | translate }}</li>
        }
      </ul>
    </nf-page-shell>
  `,
  styles: [
    `
      .timeline {
        list-style: none;
        padding: 0;
        margin: 0;
      }
      .timeline li {
        border: 1px solid var(--nf-color-border);
        border-radius: 0.5rem;
        padding: 0.65rem 0.75rem;
        margin-bottom: 0.5rem;
        background: var(--nf-color-surface);
      }
      .meta {
        display: block;
        color: var(--nf-color-text-secondary);
        font-size: 0.85rem;
      }
      a {
        font-weight: 600;
        color: var(--nf-color-primary-700);
      }
    `,
  ],
})
export class HistoriqueOtPage {
  private readonly gmao = inject(MaterielGmaoFacadeService);
  private readonly route = inject(ActivatedRoute);
  private readonly translate = inject(TranslateService);

  readonly engineId = toSignal(this.route.paramMap.pipe(map((p) => p.get('engineId') ?? '')), {
    initialValue: '',
  });

  readonly rows = toSignal(
    combineLatest([this.route.paramMap, this.gmao.getOrdresTravail()]).pipe(
      map(([pm, list]) => {
        const engineId = pm.get('engineId') ?? '';
        return list.filter((o) => !engineId || o.engineId === engineId);
      }),
    ),
    { initialValue: [] },
  );

  readonly header = computed(() => ({
    title: 'materielGmao.history.title',
    subtitle: this.engineId() || '—',
    breadcrumbs: [
      { label: this.translate.instant('nav.stock'), route: '/inventory/suivi/etat-stock' },
      { label: this.translate.instant('nav.materiel'), route: '/materiel/parc' },
      { label: this.translate.instant('materielGmao.history.title') },
    ],
  }));

  /** Closure date — bracket access avoids Angular template lexer issues with `ô` in `dateClôture`. */
  clotureLabel(o: OrdreTravail): string {
    const v = o['dateClôture' as keyof OrdreTravail];
    return typeof v === 'string' && v.length > 0 ? v : '\u2026';
  }
}
