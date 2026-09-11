import {
  ChangeDetectionStrategy,
  Component,
  inject,
  OnInit,
  signal,
} from '@angular/core';
import { Router } from '@angular/router';

import { ButtonComponent } from '@platform/lib/anatomy';

import { DossierEtudeApiService } from '../services/dossier-etude-api.service';

/**
 * Lanceur : crée un brouillon de cadrage. Le chargé d’étude est affecté au go DG.
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

  readonly enCours = signal(true);
  readonly erreur = signal<string | undefined>(undefined);

  async ngOnInit(): Promise<void> {
    try {
      const dossier = await this.api.create({
        objet: 'Nouvelle étude',
        clientNom: 'À préciser',
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
