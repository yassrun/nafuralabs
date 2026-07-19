import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';

import { WizardShellComponent } from '@lib/anatomy';
import type { WizardStepConfig } from '@lib/anatomy';

import { ETAPES_DOSSIER_ETUDE } from '@app/etudes/models';
import type { DossierEtude, ProblemeGate, ResultatGate } from '@app/etudes/models';

import { GateBlocageComponent } from '../components/gate-blocage/gate-blocage.component';
import { DossierEtudeApiService } from '../services/dossier-etude-api.service';

/**
 * Le parcours d'étude en cinq étapes.
 *
 * <p>Deux règles héritées des défauts du module supprimé :
 *
 * <p>1. <b>Aucune règle de gate n'est rejouée ici.</b> L'état vient de `GET /gates`. Le front qui
 * recalculait ses propres conditions finissait par diverger du back.
 *
 * <p>2. <b>Pas de rechargement global.</b> Seuls le dossier et les gates sont rechargés après une
 * transition — l'arbre du bordereau, qui peut compter des milliers de nœuds, se charge à part.
 */
@Component({
  selector: 'app-dossier-detail',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [WizardShellComponent, GateBlocageComponent],
  templateUrl: './dossier-detail.page.html',
  styleUrl: './dossier-detail.page.scss',
})
export class DossierDetailPage {
  private readonly api = inject(DossierEtudeApiService);
  private readonly route = inject(ActivatedRoute);
  private readonly nav = inject(Router);

  readonly dossier = signal<DossierEtude | undefined>(undefined);
  readonly gates = signal<ResultatGate[]>([]);
  readonly chargement = signal(true);
  readonly erreur = signal<string | undefined>(undefined);

  readonly etapes: WizardStepConfig[] = ETAPES_DOSSIER_ETUDE.map((e) => ({
    id: String(e.etape),
    label: e.libelle,
  }));

  /**
   * Le back numérote les étapes de 1 à 5 ; le composant de wizard indexe à partir de 0.
   * La conversion est faite ici, une fois, explicitement — la confondre était un défaut connu
   * de l'ancien écran.
   */
  readonly etapeCourante = computed(() => this.dossier()?.currentStep ?? 1);
  readonly indexCourant = computed(() => this.etapeCourante() - 1);

  readonly gateCourant = computed(() =>
    this.gates().find((g) => g.etape === this.etapeCourante()),
  );

  /** Les étapes 2 et 4 signalent sans bloquer : un problème non bloquant laisse passer. */
  readonly peutContinuer = computed(() => {
    const gate = this.gateCourant();
    if (!gate) return true;
    return !gate.bloquant || gate.problemes.length === 0;
  });

  readonly modifiable = computed(() => {
    const statut = this.dossier()?.status;
    return statut === 'BROUILLON' || statut === 'EN_ETUDE';
  });

  constructor() {
    const id = this.route.snapshot.paramMap.get('id');
    if (id) {
      void this.charger(id);
    } else {
      this.chargement.set(false);
      this.erreur.set('Identifiant de dossier manquant.');
    }
  }

  private async charger(id: string): Promise<void> {
    this.chargement.set(true);
    this.erreur.set(undefined);
    try {
      const [dossier, gates] = await Promise.all([this.api.getById(id), this.api.gates(id)]);
      this.dossier.set(dossier);
      this.gates.set(gates);
    } catch (e) {
      this.erreur.set(this.messageErreur(e));
    } finally {
      this.chargement.set(false);
    }
  }

  async suivant(): Promise<void> {
    await this.changerEtape(this.etapeCourante() + 1);
  }

  async precedent(): Promise<void> {
    await this.changerEtape(this.etapeCourante() - 1);
  }

  private async changerEtape(etape: number): Promise<void> {
    const dossier = this.dossier();
    if (!dossier || etape < 1 || etape > this.etapes.length) return;
    this.erreur.set(undefined);
    try {
      const maj = await this.api.allerAEtape(dossier.id, etape);
      this.dossier.set(maj);
      this.gates.set(await this.api.gates(dossier.id));
    } catch (e) {
      this.erreur.set(this.messageErreur(e));
    }
  }

  async soumettre(): Promise<void> {
    const dossier = this.dossier();
    if (!dossier) return;
    this.erreur.set(undefined);
    try {
      this.dossier.set(await this.api.soumettre(dossier.id));
    } catch (e) {
      this.erreur.set(this.messageErreur(e));
    }
  }

  /** Ouvre l'article fautif signalé par un gate. */
  corriger(probleme: ProblemeGate): void {
    if (!probleme.noeudId) return;
    void this.nav.navigate(['.'], {
      relativeTo: this.route,
      queryParams: { noeudId: probleme.noeudId },
      queryParamsHandling: 'merge',
    });
  }

  private messageErreur(e: unknown): string {
    const err = e as { status?: number; error?: { message?: string } };
    if (err?.status === 409) {
      return "Ce dossier a été modifié entre-temps par quelqu'un d'autre. Rechargez la page avant de reprendre — vos modifications n'ont pas été enregistrées.";
    }
    if (err?.status === 403) {
      return "Vous n'avez pas la permission nécessaire pour cette action.";
    }
    return err?.error?.message ?? 'Une erreur est survenue.';
  }
}
