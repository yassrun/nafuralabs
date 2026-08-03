import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';

import {
  ClientPartnerSelectComponent,
  type ClientPartnerSelection,
} from '@app/shared/components/client-partner-select/client-partner-select.component';

import { DossierEtudeApiService } from '../services/dossier-etude-api.service';

/**
 * Création unifiée dossier d'étude + appel d'offres client (S5).
 */
@Component({
  selector: 'app-dossier-create',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [FormsModule, ClientPartnerSelectComponent],
  templateUrl: './dossier-create.page.html',
  styleUrl: './dossier-create.page.scss',
})
export class DossierCreatePage {
  private readonly api = inject(DossierEtudeApiService);
  private readonly nav = inject(Router);

  readonly objet = signal('');
  readonly clientId = signal<string | null>(null);
  readonly clientNom = signal<string | null>(null);
  readonly dateLimiteDepot = signal('');
  readonly aoReference = signal('');
  readonly aoType = signal<'PUBLIC' | 'PRIVE'>('PUBLIC');
  readonly ville = signal('');
  readonly dateOuverturePlis = signal('');
  readonly delaiExecutionJours = signal<number | null>(null);
  readonly estimationMoaHt = signal<number | null>(null);
  readonly cautionProvisoire = signal<number | null>(null);
  readonly cautionDefinitive = signal<number | null>(null);

  readonly enCours = signal(false);
  readonly erreur = signal<string | undefined>(undefined);

  readonly peutCreer = computed(
    () =>
      !!this.objet().trim() &&
      !!this.clientId() &&
      !!this.dateLimiteDepot() &&
      !this.enCours(),
  );

  onClientSelection(sel: ClientPartnerSelection): void {
    this.clientId.set(sel.clientId);
    this.clientNom.set(sel.clientNom);
  }

  async creer(): Promise<void> {
    if (!this.peutCreer()) return;

    this.enCours.set(true);
    this.erreur.set(undefined);
    try {
      const dossier = await this.api.create({
        objet: this.objet().trim(),
        clientId: this.clientId()!,
        clientNom: this.clientNom() ?? undefined,
        dateLimiteDepot: this.dateLimiteDepot(),
        aoReference: this.aoReference().trim() || undefined,
        aoType: this.aoType(),
        ville: this.ville().trim() || undefined,
        dateOuverturePlis: this.dateOuverturePlis() || undefined,
        delaiExecutionJours: this.delaiExecutionJours() ?? undefined,
        estimationMoaHt: this.estimationMoaHt() ?? undefined,
        cautionProvisoire: this.cautionProvisoire() ?? undefined,
        cautionDefinitive: this.cautionDefinitive() ?? undefined,
      });
      await this.nav.navigate(['/etudes/dossiers', dossier.id]);
    } catch (e) {
      const err = e as { status?: number; error?: { message?: string; code?: string } };
      this.erreur.set(
        err?.status === 403
          ? "Vous n'avez pas la permission de créer un dossier d'étude."
          : (err?.error?.message ?? err?.error?.code ?? 'La création a échoué.'),
      );
      this.enCours.set(false);
    }
  }

  annuler(): void {
    void this.nav.navigate(['/etudes/dossiers']);
  }
}
