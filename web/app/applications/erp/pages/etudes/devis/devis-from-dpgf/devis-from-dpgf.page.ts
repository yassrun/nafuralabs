import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, Component, DestroyRef, inject } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { ActivatedRoute, Router } from '@angular/router';
import { TranslateModule } from '@ngx-translate/core';

import { PageShellComponent } from '@lib/anatomy';

import { DevisApiService } from '../services/devis-api.service';

@Component({
  selector: 'app-devis-from-dpgf',
  standalone: true,
  imports: [CommonModule, TranslateModule, PageShellComponent],
  template: `
    <nf-page-shell scroll>
      <p style="padding: 24px">{{ 'etudesDpu.loadingDevis' | translate }}</p>
    </nf-page-shell>
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class DevisFromDpgfPage {
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly devisApi = inject(DevisApiService);
  private readonly destroyRef = inject(DestroyRef);

  constructor() {
    this.route.paramMap.pipe(takeUntilDestroyed(this.destroyRef)).subscribe((p) => {
      const dpgfId = p.get('dpgfId');
      if (!dpgfId) {
        void this.router.navigate(['/etudes/devis']);
        return;
      }
      void this.run(dpgfId);
    });
  }

  private async run(dpgfId: string): Promise<void> {
    try {
      const devis = await this.devisApi.createFromDpgf(dpgfId);
      await this.router.navigate(['/etudes/devis', devis.id]);
    } catch {
      await this.router.navigate(['/etudes/devis']);
    }
  }
}
