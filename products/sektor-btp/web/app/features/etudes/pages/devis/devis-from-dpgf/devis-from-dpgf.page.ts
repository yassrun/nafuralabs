import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, Component, DestroyRef, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { TranslateModule } from '@ngx-translate/core';

import {
  ActionBarComponent,
  ButtonComponent,
  PageHeaderComponent,
  PageShellComponent,
} from '@lib/anatomy';

import {
  ClientPartnerSelectComponent,
  type ClientPartnerSelection,
} from '@app/shared/components/client-partner-select/client-partner-select.component';

import { DevisApiService } from '../services/devis-api.service';

@Component({
  selector: 'app-devis-from-dpgf',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    TranslateModule,
    PageShellComponent,
    PageHeaderComponent,
    ActionBarComponent,
    ButtonComponent,
    ClientPartnerSelectComponent,
  ],
  template: `
    <nf-page-shell scroll>
      <nf-page-header [config]="headerConfig"></nf-page-header>

      <section class="from-dpgf">
        @if (erreur(); as msg) {
          <p class="from-dpgf__err" role="alert">{{ msg }}</p>
        }
        <app-client-partner-select
          controlId="devis-from-dpgf-client"
          label="Client"
          [required]="true"
          [clientId]="clientId()"
          [clientNom]="clientNom()"
          (selectionChange)="onClient($event)"
        />
        <nf-action-bar align="right">
          <nf-button variant="secondary" (clicked)="annuler()">Annuler</nf-button>
          <nf-button
            variant="primary"
            [loading]="enCours()"
            [disabled]="!clientId() || enCours()"
            (clicked)="generer()"
          >
            Créer le devis
          </nf-button>
        </nf-action-bar>
      </section>
    </nf-page-shell>
  `,
  styles: [
    `
      .from-dpgf {
        max-width: 480px;
        padding: 24px;
        display: flex;
        flex-direction: column;
        gap: 16px;
      }
      .from-dpgf__err {
        color: var(--nf-color-danger-700, #b91c1c);
      }
    `,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class DevisFromDpgfPage {
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly devisApi = inject(DevisApiService);
  private readonly destroyRef = inject(DestroyRef);

  readonly headerConfig = {
    title: 'Générer un devis depuis le DPGF',
    subtitle: 'Sélectionnez le client Partner avant de créer le devis.',
  };

  private dpgfId: string | null = null;
  readonly clientId = signal<string | null>(null);
  readonly clientNom = signal<string | null>(null);
  readonly enCours = signal(false);
  readonly erreur = signal<string | undefined>(undefined);

  constructor() {
    this.route.paramMap.pipe(takeUntilDestroyed(this.destroyRef)).subscribe((p) => {
      this.dpgfId = p.get('dpgfId');
      if (!this.dpgfId) {
        void this.router.navigate(['/etudes/devis']);
      }
    });
  }

  onClient(sel: ClientPartnerSelection): void {
    this.clientId.set(sel.clientId);
    this.clientNom.set(sel.clientNom);
  }

  annuler(): void {
    void this.router.navigate(['/etudes/devis']);
  }

  async generer(): Promise<void> {
    const dpgfId = this.dpgfId;
    const clientId = this.clientId();
    if (!dpgfId || !clientId || this.enCours()) return;
    this.enCours.set(true);
    this.erreur.set(undefined);
    try {
      const devis = await this.devisApi.createFromDpgf(dpgfId, clientId);
      await this.router.navigate(['/etudes/devis', devis.id]);
    } catch (e) {
      const err = e as { error?: { message?: string } };
      this.erreur.set(err?.error?.message ?? 'Impossible de générer le devis.');
      this.enCours.set(false);
    }
  }
}
