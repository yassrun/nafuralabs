import { CommonModule } from '@angular/common';
import { Component, inject, OnInit, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { TranslateModule } from '@ngx-translate/core';

import { ReservationStockService } from '@applications/erp/inventory/services/reservation-stock.service';
import type { ReservationStock } from '@applications/erp/inventory/models';

import { ButtonComponent } from '@lib/anatomy';

@Component({
  selector: 'app-reservations-stock-page',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink, TranslateModule, ButtonComponent],
  template: `
    <section class="page">
      <header>
        <h1>{{ 'inventory.reservations.headerTitle' | translate }}</h1>
        <p class="sub">{{ 'inventory.reservations.subtitle' | translate }}</p>
      </header>

      <form class="form" (ngSubmit)="onCreate()">
        <label>{{ 'inventory.reservations.form.articleId' | translate }}</label>
        <input name="articleId" [(ngModel)]="draft.articleId" required />
        <label>{{ 'inventory.reservations.form.chantierId' | translate }}</label>
        <input name="chantierId" [(ngModel)]="draft.chantierId" required />
        <label>{{ 'inventory.reservations.form.qte' | translate }}</label>
        <input name="qte" type="number" [(ngModel)]="draft.qte" required />
        <label>{{ 'inventory.reservations.form.uom' | translate }}</label>
        <input name="uom" [(ngModel)]="draft.uom" />
        <label>{{ 'inventory.reservations.form.dateBesoin' | translate }}</label>
        <input name="dateBesoin" type="date" [(ngModel)]="draft.dateBesoin" />
        <label>{{ 'inventory.reservations.form.dateExpiration' | translate }}</label>
        <input name="dateExpiration" type="date" [(ngModel)]="draft.dateExpiration" />
        <label>{{ 'inventory.reservations.form.motif' | translate }}</label>
        <input name="motif" [(ngModel)]="draft.motif" />
        <nf-button type="submit" class="primary" variant="primary">{{ 'inventory.reservations.form.submit' | translate }}</nf-button>
      </form>

      <table>
        <thead>
          <tr>
            <th>{{ 'inventory.reservations.columns.article' | translate }}</th>
            <th>{{ 'inventory.reservations.columns.chantier' | translate }}</th>
            <th>{{ 'inventory.reservations.columns.qte' | translate }}</th>
            <th>{{ 'inventory.reservations.columns.besoin' | translate }}</th>
            <th>{{ 'inventory.reservations.columns.expiration' | translate }}</th>
            <th>{{ 'inventory.reservations.columns.statut' | translate }}</th>
            <th></th>
          </tr>
        </thead>
        <tbody>
          @for (r of rows(); track r.id) {
            <tr>
              <td>{{ r.articleId }}</td>
              <td>{{ r.chantierId }}</td>
              <td>{{ r.qte }} {{ r.uom }}</td>
              <td>{{ r.dateBesoin }}</td>
              <td>{{ r.dateExpiration }}</td>
              <td>{{ r.status }}</td>
              <td>
                @if (r.status === 'ACTIVE') {
                  <nf-button type="button" (clicked)="onCancel(r.id)" variant="secondary">{{ 'inventory.reservations.actions.cancel' | translate }}</nf-button>
                }
              </td>
            </tr>
          }
        </tbody>
      </table>

      <p class="foot">
        <a routerLink="/inventory/mouvements/sorties">{{ 'inventory.reservations.footer.sortiesLink' | translate }}</a> {{ 'inventory.reservations.footer.sortiesText' | translate }}
      </p>
    </section>
  `,
  styles: [
    `
      .page {
        padding: 1.25rem;
        max-width: 1100px;
      }
      .sub {
        color: var(--nf-color-text-secondary);
      }
      .form {
        display: grid;
        grid-template-columns: repeat(2, minmax(0, 1fr));
        gap: 8px 12px;
        margin: 1rem 0;
        max-width: 640px;
      }
      .form label {
        grid-column: span 1;
        font-size: 0.8rem;
        color: var(--nf-color-text-secondary);
      }
      .form input {
        padding: 6px 8px;
      }
      .primary {
        grid-column: 1 / -1;
        justify-self: start;
        padding: 0.5rem 1rem;
        border-radius: 8px;
        border: 0;
        background: var(--nf-color-teal-800, var(--nf-color-primary-800));
        color: var(--nf-color-surface);
        font-weight: 600;
        cursor: pointer;
      }
      table {
        width: 100%;
        border-collapse: collapse;
        margin-top: 1rem;
      }
      th,
      td {
        padding: 0.5rem;
        border-bottom: 1px solid var(--nf-color-border);
        text-align: left;
      }
      .foot {
        margin-top: 1rem;
      }
    `,
  ],
})
export class ReservationsStockPage implements OnInit {
  readonly svc = inject(ReservationStockService);

  readonly rows = signal<import('@applications/erp/inventory/models').ReservationStock[]>([]);
  readonly loading = signal(false);

  draft: {
    articleId: string;
    chantierId: string;
    qte: number;
    uom: string;
    dateBesoin: string;
    dateExpiration: string;
    motif: string;
    creePar: string;
  } = {
    articleId: 'art-ciment',
    chantierId: 'ch-001',
    qte: 5,
    uom: 'T',
    dateBesoin: '2026-06-01',
    dateExpiration: '2026-12-31',
    motif: '',
    creePar: 'web',
  };

  ngOnInit(): void {
    void this.reload();
  }

  async reload(): Promise<void> {
    this.loading.set(true);
    try {
      await this.svc.refresh();
      this.rows.set(this.svc.all());
    } finally {
      this.loading.set(false);
    }
  }

  async onCreate(): Promise<void> {
    await this.svc.create({
      articleId: this.draft.articleId.trim(),
      chantierId: this.draft.chantierId.trim(),
      qte: Number(this.draft.qte),
      uom: this.draft.uom.trim() || 'u',
      dateBesoin: this.draft.dateBesoin,
      dateExpiration: this.draft.dateExpiration,
      creePar: this.draft.creePar,
      motif: this.draft.motif || undefined,
    });
    await this.reload();
  }

  async onCancel(id: string): Promise<void> {
    await this.svc.setStatus(id, 'ANNULEE');
    await this.reload();
  }
}
