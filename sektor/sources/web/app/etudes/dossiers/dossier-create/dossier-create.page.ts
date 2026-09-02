import {
  ChangeDetectionStrategy,
  Component,
  inject,
  OnInit,
  signal,
} from '@angular/core';
import { Router } from '@angular/router';

import { AuthFacade } from '@platform/core/security/services/auth.facade';
import { ButtonComponent } from '@platform/lib/anatomy';

import { DossierEtudeApiService } from '../services/dossier-etude-api.service';

/**
 * Lanceur : crée un brouillon coquille et ouvre le wizard (étape 1).
 * L’identité et la revue CPS se font dans le cadrage, pas ici.
 */
@Component({
  selector: 'app-dossier-create',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [ButtonComponent],
  templateUrl: './dossier-create.page.html',
  styleUrl: './dossier-create.page.scss',
})
export class DossierCreatePage implements OnInit {
  private readonly api = inject(DossierEtudeApiService);
  private readonly nav = inject(Router);
  private readonly auth = inject(AuthFacade);

  readonly enCours = signal(true);
  readonly erreur = signal<string | undefined>(undefined);

  async ngOnInit(): Promise<void> {
    try {
      const list = await this.api.listIngenieurs();
      const me = this.auth.user();
      const charge =
        (me?.id && list.find((c) => c.userId === me.id)) || list[0];
      if (!charge) {
        this.erreur.set(
          'Aucun ingénieur. Affectez le rôle BTP_INGENIEUR dans Administration → Membres.',
        );
        this.enCours.set(false);
        return;
      }
      const dossier = await this.api.create({
        objet: 'Nouvelle étude',
        clientNom: 'À préciser',
        chargeEtudeUserId: charge.userId,
        chargeEtudeNom: charge.displayName ?? charge.email,
      });
      await this.nav.navigate(['/etudes/dossiers', dossier.id], { replaceUrl: true });
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

  retourListe(): void {
    void this.nav.navigate(['/etudes/dossiers']);
  }
}
