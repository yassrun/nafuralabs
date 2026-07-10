import { CommonModule } from '@angular/common';
import { Component, inject } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { ActivatedRoute, RouterModule } from '@angular/router';
import { map, switchMap } from 'rxjs/operators';
import { of } from 'rxjs';
import { TranslateModule, TranslateService } from '@ngx-translate/core';

import { PageHeaderComponent, PageShellComponent } from '@lib/anatomy';

import { MaterielGmaoFacadeService } from '@applications/erp/inventory/services/materiel-gmao-facade.service';

@Component({
  selector: 'app-ot-detail',
  standalone: true,
  imports: [CommonModule, RouterModule, TranslateModule, PageShellComponent, PageHeaderComponent],
  template: `
    <nf-page-shell [scroll]="true">
      @if (ot(); as o) {
        <nf-page-header [config]="header(o)">
        </nf-page-header>

        <div class="grid">
          <section class="card">
            <h3>{{ 'materielGmao.ot.costs' | translate }}</h3>
            <p>{{ 'materielGmao.ot.pieces' | translate }}: {{ o.coutPieces | number: '1.0-0' }} MAD</p>
            <p>{{ 'materielGmao.ot.mo' | translate }}: {{ o.coutMO | number: '1.0-0' }} MAD</p>
            <p>
              <strong>{{ 'materielGmao.ot.total' | translate }}: {{ o.coutTotal | number: '1.0-0' }} MAD</strong>
            </p>
          </section>
          <section class="card">
            <h3>{{ 'materielGmao.ot.piecesList' | translate }}</h3>
            <ul>
              @for (p of o.piecesConsommees; track p.id) {
                <li>{{ p.reference }} — {{ p.quantity }} × {{ p.unitPrice | number: '1.0-2' }} MAD</li>
              }
            </ul>
          </section>
        </div>
      } @else {
        <p>{{ 'materielGmao.empty.ot' | translate }}</p>
      }
    </nf-page-shell>
  `,
  styles: [
    `
      .grid {
        display: grid;
        gap: 0.75rem;
        grid-template-columns: repeat(auto-fit, minmax(240px, 1fr));
      }
      .card {
        border: 1px solid var(--nf-color-border);
        border-radius: 0.75rem;
        padding: 0.75rem 1rem;
        background: var(--nf-color-surface);
      }
      h3 {
        margin: 0 0 0.5rem;
        font-size: 1rem;
      }
    `,
  ],
})
export class OtDetailPage {
  private readonly gmao = inject(MaterielGmaoFacadeService);
  private readonly route = inject(ActivatedRoute);
  private readonly translate = inject(TranslateService);

  readonly ot = toSignal(
    this.route.paramMap.pipe(
      map((pm) => pm.get('id') ?? ''),
      switchMap((id) => (id ? this.gmao.getOrdreTravail(id) : of(undefined))),
    ),
    { initialValue: undefined },
  );

  header(o: { numero: string; description: string }) {
    return {
      title: o.numero,
      subtitle: o.description,
      breadcrumbs: [
        { label: this.translate.instant('nav.stock'), route: '/inventory/suivi/etat-stock' },
        { label: this.translate.instant('nav.materiel'), route: '/materiel/parc' },
        { label: this.translate.instant('materielGmao.ot.listTitle'), route: '/materiel/maintenance/ot' },
        { label: o.numero },
      ],
    };
  }
}
