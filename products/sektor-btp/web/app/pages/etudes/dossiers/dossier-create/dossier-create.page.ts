import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';

import { DossierEtudeApiService } from '../services/dossier-etude-api.service';

/**
 * Création d'un dossier d'étude.
 *
 * <p>Volontairement minimale : l'objet suffit à démarrer. Le numéro est attribué par le back,
 * et tout le reste — pièces du marché, bordereau, chiffrage — se renseigne dans le parcours,
 * étape par étape. Demander ici ce qui sera demandé plus tard ferait un formulaire d'entrée
 * décourageant pour un dossier qui, à ce stade, n'est qu'une intention.
 */
@Component({
  selector: 'app-dossier-create',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [FormsModule],
  templateUrl: './dossier-create.page.html',
  styleUrl: './dossier-create.page.scss',
})
export class DossierCreatePage {
  private readonly api = inject(DossierEtudeApiService);
  private readonly nav = inject(Router);

  readonly objet = signal('');
  readonly clientNom = signal('');
  readonly enCours = signal(false);
  readonly erreur = signal<string | undefined>(undefined);

  async creer(): Promise<void> {
    const objet = this.objet().trim();
    if (!objet || this.enCours()) return;

    this.enCours.set(true);
    this.erreur.set(undefined);
    try {
      const dossier = await this.api.create({
        objet,
        clientNom: this.clientNom().trim() || undefined,
      });
      // On enchaîne directement sur le parcours : créer un dossier pour retomber sur une
      // liste obligerait à le rouvrir aussitôt.
      await this.nav.navigate(['/etudes/dossiers', dossier.id]);
    } catch (e) {
      const err = e as { status?: number; error?: { message?: string } };
      this.erreur.set(
        err?.status === 403
          ? "Vous n'avez pas la permission de créer un dossier d'étude."
          : (err?.error?.message ?? "La création a échoué."),
      );
      this.enCours.set(false);
    }
  }

  annuler(): void {
    void this.nav.navigate(['/etudes/dossiers']);
  }
}
