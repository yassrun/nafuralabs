import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';

import { ButtonComponent, PageHeaderComponent, PageShellComponent } from '@platform/lib/anatomy';
import type { PageHeaderConfig } from '@platform/lib/anatomy';

import { FournisseurApiService } from '../../fournisseurs/services/fournisseur-api.service';
import type { Fournisseur } from '../../models';
import { ConsultationAchatApiService } from '../services/consultation-achat-api.service';

@Component({
  selector: 'app-consultation-create',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    FormsModule,
    PageShellComponent,
    PageHeaderComponent,
    ButtonComponent,
  ],
  templateUrl: './consultation-create.page.html',
  styleUrl: './consultation-create.page.scss',
})
export class ConsultationCreatePage {
  private readonly api = inject(ConsultationAchatApiService);
  private readonly fournisseursApi = inject(FournisseurApiService);
  private readonly router = inject(Router);

  readonly headerConfig: PageHeaderConfig = {
    title: 'Nouvelle consultation',
    subtitle: 'Hors étude — un fournisseur + panier d’identités',
  };

  readonly fournisseurs = signal<Fournisseur[]>([]);
  readonly fournisseurId = signal('');
  readonly clesText = signal('');
  readonly saving = signal(false);
  readonly erreur = signal<string | undefined>(undefined);

  constructor() {
    void this.loadFournisseurs();
  }

  async loadFournisseurs(): Promise<void> {
    try {
      const res = await this.fournisseursApi.getAll({ page: 0, pageSize: 200 });
      this.fournisseurs.set(res.items ?? []);
    } catch {
      this.erreur.set('Impossible de charger les fiches fournisseurs.');
    }
  }

  async submit(): Promise<void> {
    const fournisseurId = this.fournisseurId().trim();
    if (!fournisseurId) {
      this.erreur.set('Choisir un fournisseur (fiche Achats).');
      return;
    }
    const clesStables = this.clesText()
      .split(/[\n,;]+/)
      .map((s) => s.trim())
      .filter(Boolean);
    this.saving.set(true);
    this.erreur.set(undefined);
    try {
      const created = await this.api.create({ fournisseurId, clesStables });
      await this.router.navigateByUrl(`/achats/consultations/${created.id}`);
    } catch {
      this.erreur.set('Création impossible.');
    } finally {
      this.saving.set(false);
    }
  }

  cancel(): void {
    void this.router.navigateByUrl('/achats/consultations');
  }
}
