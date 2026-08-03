import { ChangeDetectionStrategy, Component, inject, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';

import { DossierEtudeApiService } from '../../dossiers/services/dossier-etude-api.service';

/**
 * Bookmark legacy `/etudes/appels-offres-clients/:id` → dossier lié, sinon listing.
 */
@Component({
  selector: 'app-aoc-to-dossier-redirect',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `<p class="redirect">Redirection vers l’étude…</p>`,
  styles: [
    `
      .redirect {
        margin: 2rem;
        color: var(--nf-color-text-secondary);
      }
    `,
  ],
})
export class AocToDossierRedirectPage implements OnInit {
  private readonly route = inject(ActivatedRoute);
  private readonly nav = inject(Router);
  private readonly dossiers = inject(DossierEtudeApiService);

  ngOnInit(): void {
    const aocId = this.route.snapshot.paramMap.get('id');
    void this.redirect(aocId);
  }

  private async redirect(aocId: string | null): Promise<void> {
    if (!aocId) {
      await this.nav.navigate(['/etudes/dossiers']);
      return;
    }
    try {
      const dossier = await this.dossiers.findByAppelOffreClientId(aocId);
      if (dossier?.id) {
        await this.nav.navigate(['/etudes/dossiers', dossier.id]);
        return;
      }
    } catch {
      /* fall through */
    }
    await this.nav.navigate(['/etudes/dossiers']);
  }
}
