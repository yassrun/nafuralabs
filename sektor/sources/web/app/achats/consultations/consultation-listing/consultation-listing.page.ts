import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { Router } from '@angular/router';
import { TranslateModule } from '@ngx-translate/core';

import { ButtonComponent, PageHeaderComponent, PageShellComponent } from '@platform/lib/anatomy';
import type { PageHeaderConfig } from '@platform/lib/anatomy';

import {
  ConsultationAchatApiService,
  type ConsultationAchat,
  type ConsultationLienFilter,
} from '../services/consultation-achat-api.service';

@Component({
  selector: 'app-consultation-listing',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    TranslateModule,
    PageShellComponent,
    PageHeaderComponent,
    ButtonComponent,
  ],
  templateUrl: './consultation-listing.page.html',
  styleUrl: './consultation-listing.page.scss',
})
export class ConsultationListingPage {
  private readonly api = inject(ConsultationAchatApiService);
  private readonly router = inject(Router);

  readonly headerConfig: PageHeaderConfig = {
    title: 'Consultations',
    subtitle: 'Demandes de prix fournisseur — Achats',
  };

  readonly rows = signal<ConsultationAchat[]>([]);
  readonly filter = signal<ConsultationLienFilter>('all');
  readonly chargement = signal(false);
  readonly erreur = signal<string | undefined>(undefined);

  readonly chips: { id: ConsultationLienFilter; label: string }[] = [
    { id: 'all', label: 'Toutes' },
    { id: 'hors', label: 'Hors étude' },
    { id: 'liee', label: 'Liée' },
  ];

  constructor() {
    void this.reload();
  }

  async selectFilter(id: ConsultationLienFilter): Promise<void> {
    this.filter.set(id);
    await this.reload();
  }

  async reload(): Promise<void> {
    this.chargement.set(true);
    this.erreur.set(undefined);
    try {
      this.rows.set(await this.api.list(this.filter()));
    } catch {
      this.erreur.set('Impossible de charger les consultations.');
      this.rows.set([]);
    } finally {
      this.chargement.set(false);
    }
  }

  panierLabel(row: ConsultationAchat): string {
    return row.clesStables?.length ? row.clesStables.join(', ') : '—';
  }

  statutLabel(row: ConsultationAchat): string {
    if ((row.devisRecus ?? 0) > 0) {
      return `${row.devisRecus} devis reçu${row.devisRecus > 1 ? 's' : ''}`;
    }
    return 'demande';
  }

  lienLabel(row: ConsultationAchat): string {
    return row.dossierEtudeId ? 'liée' : 'hors étude';
  }

  goNew(): void {
    void this.router.navigateByUrl('/achats/consultations/new');
  }

  goFiche(id: string): void {
    void this.router.navigateByUrl(`/achats/consultations/${id}`);
  }
}
