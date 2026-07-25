import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';

import {
  ClientPartnerSelectComponent,
  type ClientPartnerSelection,
} from '@app/shared/components/client-partner-select/client-partner-select.component';

import { DossierEtudeApiService } from '../services/dossier-etude-api.service';

/**
 * Création d'un dossier d'étude.
 *
 * <p>Objet + client Partner (rôle CLIENT) sont obligatoires dès la création.
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
  readonly enCours = signal(false);
  readonly erreur = signal<string | undefined>(undefined);

  onClientSelection(sel: ClientPartnerSelection): void {
    this.clientId.set(sel.clientId);
    this.clientNom.set(sel.clientNom);
  }

  async creer(): Promise<void> {
    const objet = this.objet().trim();
    const clientId = this.clientId();
    if (!objet || !clientId || this.enCours()) return;

    this.enCours.set(true);
    this.erreur.set(undefined);
    try {
      const dossier = await this.api.create({
        objet,
        clientId,
        clientNom: this.clientNom() ?? undefined,
      });
      await this.nav.navigate(['/etudes/dossiers', dossier.id]);
    } catch (e) {
      const err = e as { status?: number; error?: { message?: string } };
      this.erreur.set(
        err?.status === 403
          ? "Vous n'avez pas la permission de créer un dossier d'étude."
          : (err?.error?.message ?? 'La création a échoué.'),
      );
      this.enCours.set(false);
    }
  }

  annuler(): void {
    void this.nav.navigate(['/etudes/dossiers']);
  }
}
