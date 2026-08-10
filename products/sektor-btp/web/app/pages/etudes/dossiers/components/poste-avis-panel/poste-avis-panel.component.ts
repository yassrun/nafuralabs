import { CommonModule } from '@angular/common';
import {
  ChangeDetectionStrategy,
  Component,
  effect,
  inject,
  input,
  output,
  signal,
} from '@angular/core';
import { FormsModule } from '@angular/forms';

import { ButtonComponent, ToastService } from '@lib/anatomy';

import {
  DossierEtudeApiService,
  type AvisExecution,
  type NiveauAvisExecution,
} from '../../services/dossier-etude-api.service';

const NIVEAU_LABELS: Record<NiveauAvisExecution, string> = {
  REALISABLE: 'Réalisable',
  DIFFICILE: 'Difficile',
  IRREALISABLE: 'Irréalisable',
};

@Component({
  selector: 'app-poste-avis-panel',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CommonModule, FormsModule, ButtonComponent],
  templateUrl: './poste-avis-panel.component.html',
  styleUrl: './poste-avis-panel.component.scss',
})
export class PosteAvisPanelComponent {
  private readonly dossierApi = inject(DossierEtudeApiService);
  private readonly toast = inject(ToastService);

  readonly dossierId = input.required<string>();
  readonly noeudId = input.required<string>();
  /** Peut poser un avis (permission etude.avis approximée côté UI). */
  readonly peutPoser = input(false);
  /** Peut traiter (chiffreur — etude.update). */
  readonly peutTraiter = input(true);
  readonly modifiable = input(true);

  readonly change = output<void>();

  readonly avis = signal<AvisExecution[]>([]);
  readonly chargement = signal(false);
  readonly erreur = signal<string | undefined>(undefined);
  readonly formOpen = signal(false);
  readonly niveau = signal<NiveauAvisExecution>('DIFFICILE');
  readonly commentaire = signal('');
  readonly ecartPropose = signal<number | null>(null);
  readonly motifEcart = signal('');
  readonly ecarterId = signal<string | null>(null);
  readonly saving = signal(false);

  readonly niveauLabels = NIVEAU_LABELS;

  constructor() {
    effect(() => {
      const d = this.dossierId();
      const n = this.noeudId();
      if (d && n) void this.reload();
    });
  }

  ouverts(): AvisExecution[] {
    return this.avis().filter((a) => a.statut === 'OUVERT');
  }

  historique(): AvisExecution[] {
    return this.avis().filter((a) => a.statut !== 'OUVERT');
  }

  async reload(): Promise<void> {
    this.chargement.set(true);
    this.erreur.set(undefined);
    try {
      const list = await this.dossierApi.listAvis(this.dossierId(), this.noeudId());
      this.avis.set(list ?? []);
    } catch (e) {
      const err = e as { error?: { message?: string; code?: string } };
      this.erreur.set(err?.error?.message ?? err?.error?.code ?? 'Impossible de charger les avis.');
    } finally {
      this.chargement.set(false);
    }
  }

  openForm(): void {
    this.formOpen.set(true);
    this.niveau.set('DIFFICILE');
    this.commentaire.set('');
    this.ecartPropose.set(null);
  }

  async envoyer(): Promise<void> {
    if (this.saving()) return;
    const niveau = this.niveau();
    if (niveau !== 'REALISABLE' && !this.commentaire().trim()) {
      this.toast.error('Commentaire obligatoire pour une réserve.');
      return;
    }
    this.saving.set(true);
    try {
      await this.dossierApi.createAvis(this.dossierId(), {
        dpgfNoeudId: this.noeudId(),
        niveau,
        commentaire: this.commentaire().trim() || null,
        ecartPropose: this.ecartPropose(),
      });
      this.formOpen.set(false);
      this.toast.success('Avis envoyé.');
      await this.reload();
      this.change.emit();
    } catch (e) {
      const err = e as { error?: { code?: string; message?: string } };
      this.toast.error(err?.error?.code ?? err?.error?.message ?? 'Envoi impossible.');
    } finally {
      this.saving.set(false);
    }
  }

  async prendreEnCompte(avis: AvisExecution): Promise<void> {
    if (this.saving()) return;
    this.saving.set(true);
    try {
      await this.dossierApi.traiterAvis(this.dossierId(), avis.id, {
        statut: 'PRIS_EN_COMPTE',
      });
      this.toast.success('Avis pris en compte.');
      await this.reload();
      this.change.emit();
    } catch (e) {
      const err = e as { error?: { code?: string; message?: string } };
      this.toast.error(err?.error?.code ?? err?.error?.message ?? 'Traitement impossible.');
    } finally {
      this.saving.set(false);
    }
  }

  startEcarter(avis: AvisExecution): void {
    this.ecarterId.set(avis.id);
    this.motifEcart.set('');
  }

  async confirmerEcart(): Promise<void> {
    const id = this.ecarterId();
    if (!id || this.saving()) return;
    if (!this.motifEcart().trim()) {
      this.toast.error('Motif obligatoire pour écarter.');
      return;
    }
    this.saving.set(true);
    try {
      await this.dossierApi.traiterAvis(this.dossierId(), id, {
        statut: 'ECARTE',
        motifTraitement: this.motifEcart().trim(),
      });
      this.ecarterId.set(null);
      this.toast.success('Avis écarté.');
      await this.reload();
      this.change.emit();
    } catch (e) {
      const err = e as { error?: { code?: string; message?: string } };
      this.toast.error(err?.error?.code ?? err?.error?.message ?? 'Écart impossible.');
    } finally {
      this.saving.set(false);
    }
  }
}
