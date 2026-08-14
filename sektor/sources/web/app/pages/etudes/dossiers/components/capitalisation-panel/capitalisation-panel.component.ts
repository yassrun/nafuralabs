import { CommonModule } from '@angular/common';
import {
  ChangeDetectionStrategy,
  Component,
  computed,
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
  type CapitalisationArticle,
  type CapitalisationResume,
} from '../../services/dossier-etude-api.service';

type Mode = 'offer' | 'list' | 'collision' | 'done';

@Component({
  selector: 'app-capitalisation-panel',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CommonModule, FormsModule, ButtonComponent],
  templateUrl: './capitalisation-panel.component.html',
  styleUrl: './capitalisation-panel.component.scss',
})
export class CapitalisationPanelComponent {
  private readonly dossierApi = inject(DossierEtudeApiService);
  private readonly toast = inject(ToastService);

  readonly dossierId = input.required<string>();
  readonly statut = input<string | null>(null);
  readonly change = output<void>();

  readonly resume = signal<CapitalisationResume | null>(null);
  readonly chargement = signal(false);
  readonly erreur = signal<string | undefined>(undefined);
  readonly saving = signal(false);
  readonly mode = signal<Mode>('offer');
  readonly selected = signal<Record<string, boolean>>({});
  readonly decisions = signal<Record<string, string>>({});
  readonly codeOverrides = signal<Record<string, string>>({});
  readonly collision = signal<CapitalisationArticle | null>(null);
  readonly lastResult = signal<{ crees: number; remplaces: number; ignores: number } | null>(
    null,
  );

  readonly visible = computed(() => {
    const s = this.statut();
    return s === 'VALIDEE' || s === 'DEVIS_GENERE';
  });

  readonly candidatsActifs = computed(() => {
    const r = this.resume();
    if (!r) return [];
    return r.articles.filter((a) => a.statut !== 'DEJA_VERSE');
  });

  readonly aTraiter = computed(() => this.candidatsActifs().length > 0);

  constructor() {
    effect(() => {
      const id = this.dossierId();
      const vis = this.visible();
      if (id && vis) void this.reload();
    });
  }

  async reload(): Promise<void> {
    this.chargement.set(true);
    this.erreur.set(undefined);
    try {
      const data = await this.dossierApi.getCapitalisation(this.dossierId());
      this.resume.set(data);
      const sel: Record<string, boolean> = {};
      const dec: Record<string, string> = {};
      for (const a of data.articles) {
        if (a.statut === 'NOUVEAU') {
          sel[a.noeudId] = true;
          dec[a.noeudId] = 'CREER';
        } else if (a.statut === 'COLLISION') {
          sel[a.noeudId] = false;
          dec[a.noeudId] = 'IGNORER';
        }
      }
      this.selected.set(sel);
      this.decisions.set(dec);
      this.mode.set(this.aTraiter() ? 'offer' : 'done');
      this.collision.set(null);
      this.lastResult.set(null);
    } catch (e) {
      this.erreur.set(e instanceof Error ? e.message : 'Erreur capitalisation');
    } finally {
      this.chargement.set(false);
    }
  }

  openList(): void {
    this.mode.set('list');
  }

  toggle(noeudId: string, value: boolean): void {
    this.selected.update((s) => ({ ...s, [noeudId]: value }));
  }

  setDecision(noeudId: string, decision: string): void {
    this.decisions.update((d) => ({ ...d, [noeudId]: decision }));
    if (decision === 'NOUVEAU_CODE' || decision === 'REMPLACER') {
      this.selected.update((s) => ({ ...s, [noeudId]: true }));
    }
  }

  setCodeOverride(noeudId: string, code: string): void {
    this.codeOverrides.update((c) => ({ ...c, [noeudId]: code }));
  }

  openCollision(a: CapitalisationArticle): void {
    this.collision.set(a);
    this.mode.set('collision');
  }

  backToList(): void {
    this.collision.set(null);
    this.mode.set('list');
  }

  async verser(): Promise<void> {
    const r = this.resume();
    if (!r) return;
    const selections = r.articles
      .filter((a) => a.statut !== 'DEJA_VERSE' && this.selected()[a.noeudId])
      .map((a) => ({
        noeudId: a.noeudId,
        decision: this.decisions()[a.noeudId] ?? (a.statut === 'COLLISION' ? 'IGNORER' : 'CREER'),
        codeOverride: this.codeOverrides()[a.noeudId] || undefined,
      }));

    if (selections.length === 0) {
      this.toast.error('Aucune ligne sélectionnée');
      return;
    }

    for (const sel of selections) {
      const art = r.articles.find((a) => a.noeudId === sel.noeudId);
      if (art?.statut === 'COLLISION' && sel.decision === 'CREER') {
        this.toast.error('Collision : choisir Ignorer, Nouveau code ou Remplacer');
        return;
      }
      if (sel.decision === 'NOUVEAU_CODE' && !sel.codeOverride?.trim()) {
        this.toast.error('Nouveau code requis pour ' + art?.designation);
        return;
      }
    }

    this.saving.set(true);
    try {
      const result = await this.dossierApi.capitalisationVerser(this.dossierId(), selections);
      this.lastResult.set(result);
      this.mode.set('done');
      this.toast.success(
        `${result.crees} créé(s) · ${result.remplaces} remplacé(s) · ${result.ignores} ignoré(s)`,
      );
      this.change.emit();
      await this.reload();
      this.mode.set('done');
      this.lastResult.set(result);
    } catch (e) {
      this.toast.error(e instanceof Error ? e.message : 'Versement impossible');
    } finally {
      this.saving.set(false);
    }
  }
}
