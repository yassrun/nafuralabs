import {
  ChangeDetectionStrategy,
  Component,
  effect,
  inject,
  input,
  signal,
} from '@angular/core';

import { ButtonComponent, ToastService } from '@platform/lib/anatomy';

import {
  DossierEtudeApiService,
  type DossierAgentContext,
  type DossierAgentSuggestion,
} from '../../services/dossier-etude-api.service';

@Component({
  selector: 'app-dossier-agent-panel',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [ButtonComponent],
  templateUrl: './dossier-agent-panel.component.html',
  styleUrl: './dossier-agent-panel.component.scss',
})
export class DossierAgentPanelComponent {
  private readonly api = inject(DossierEtudeApiService);
  private readonly toast = inject(ToastService);

  readonly dossierId = input.required<string>();
  readonly modifiable = input(true);

  readonly contexte = signal<DossierAgentContext | null>(null);
  readonly chargement = signal(false);
  readonly actionEnCours = signal<string | null>(null);
  readonly erreur = signal<string | undefined>(undefined);

  constructor() {
    effect(() => {
      const id = this.dossierId();
      if (id) void this.reload();
    });
  }

  async reload(): Promise<void> {
    this.chargement.set(true);
    this.erreur.set(undefined);
    try {
      this.contexte.set(await this.api.getAgentContext(this.dossierId()));
    } catch (e) {
      const err = e as { error?: { code?: string; message?: string } };
      this.erreur.set(err?.error?.message ?? err?.error?.code ?? 'Agent indisponible.');
    } finally {
      this.chargement.set(false);
    }
  }

  async lancerAction(kind: 'chiffrage' | 'incoherences' | 'rattachements'): Promise<void> {
    if (this.actionEnCours()) return;
    this.actionEnCours.set(kind);
    this.erreur.set(undefined);
    try {
      switch (kind) {
        case 'chiffrage':
          await this.api.agentChiffrage(this.dossierId());
          break;
        case 'incoherences':
          await this.api.agentIncoherences(this.dossierId());
          break;
        case 'rattachements':
          await this.api.agentRattachements(this.dossierId());
          break;
      }
      await this.reload();
    } catch (e) {
      const err = e as { error?: { code?: string; message?: string } };
      this.erreur.set(err?.error?.message ?? err?.error?.code ?? 'Action impossible.');
    } finally {
      this.actionEnCours.set(null);
    }
  }

  async accepter(s: DossierAgentSuggestion): Promise<void> {
    if (!this.modifiable() || s.etat !== 'EN_ATTENTE') return;
    try {
      await this.api.agentAccepter(this.dossierId(), s.id);
      await this.reload();
    } catch (e) {
      this.toast.error(this.messageErreur(e));
    }
  }

  async refuser(s: DossierAgentSuggestion): Promise<void> {
    if (!this.modifiable() || s.etat !== 'EN_ATTENTE') return;
    try {
      await this.api.agentRefuser(this.dossierId(), s.id);
      await this.reload();
    } catch (e) {
      this.toast.error(this.messageErreur(e));
    }
  }

  async corriger(s: DossierAgentSuggestion): Promise<void> {
    if (!this.modifiable() || s.etat !== 'EN_ATTENTE') return;
    const note = window.prompt('Correction proposée :', '');
    if (!note?.trim()) return;
    try {
      await this.api.agentCorriger(this.dossierId(), s.id, note.trim());
      await this.reload();
    } catch (e) {
      this.toast.error(this.messageErreur(e));
    }
  }

  libelleEtat(etat: string): string {
    switch (etat) {
      case 'ACCEPTEE':
        return 'Acceptée';
      case 'REFUSEE':
        return 'Refusée';
      case 'CORRIGEE':
        return 'Corrigée';
      default:
        return 'En attente';
    }
  }

  formatDate(iso?: string | null): string {
    if (!iso) return '—';
    try {
      return new Date(iso).toLocaleString('fr-FR', {
        day: '2-digit',
        month: '2-digit',
        hour: '2-digit',
        minute: '2-digit',
      });
    } catch {
      return iso;
    }
  }

  private messageErreur(e: unknown): string {
    const err = e as { error?: { code?: string; message?: string } };
    return err?.error?.message ?? err?.error?.code ?? 'Erreur agent.';
  }
}
