import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { MAT_DIALOG_DATA, MatDialog, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { firstValueFrom } from 'rxjs';

import { ButtonComponent, ToastService } from '@platform/lib/anatomy';
import { FournisseurApiService } from '@app/achats/fournisseurs/services/fournisseur-api.service';
import type { Fournisseur } from '@app/achats/models';
import {
  ConsultationAchatApiService,
  type ConsultationAchat,
} from '@app/achats/consultations/services/consultation-achat-api.service';

export interface ConsultationDecompoDialogData {
  dossierId: string;
  dpgfId: string;
  preselectedCles?: string[];
  articleLibelle?: string;
}

type OverlayPane = 'liste' | 'detail' | 'creer';

@Component({
  selector: 'app-consultation-decompo-dialog',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [FormsModule, MatDialogModule, ButtonComponent],
  template: `
    <div class="cs-overlay" data-cs-overlay role="dialog" aria-labelledby="cs-overlay-title">
      <header>
        <h2 id="cs-overlay-title">{{ titre() }}</h2>
        <nf-button variant="ghost" (clicked)="close()" aria-label="Fermer">✕</nf-button>
      </header>

      @if (articleCle(); as cle) {
        <p class="cs-hint">
          Article courant : {{ articleLibelle() }}
          @if (articleLibelle() !== cle) {
            <span class="cs-cle">({{ cle }})</span>
          }
        </p>
      }

      @if (erreur(); as err) {
        <p class="cs-error">{{ err }}</p>
      }

      @if (pane() === 'liste') {
        <div data-cs-pane="liste" class="cs-pane">
          @if (chargement()) {
            <p class="cs-hint">Chargement des consultations liées…</p>
          } @else if (liees().length === 0) {
            <p class="cs-hint">Aucune consultation liée à cette étude.</p>
          } @else {
            <ul class="cs-liees">
              @for (row of liees(); track row.id) {
                <li>
                  <button
                    type="button"
                    class="cs-liee"
                    data-cs-liee
                    [attr.data-cs-numero]="row.numero"
                    (click)="ouvrirDetail(row)"
                  >
                    <span class="cs-liee-main">
                      <strong>{{ row.numero }}</strong>
                      <span>{{ row.fournisseurNom }}</span>
                    </span>
                    <span class="cs-liee-meta">
                      {{ row.clesStables.length }}
                      article{{ row.clesStables.length > 1 ? 's' : '' }}
                      @if (articleCle()) {
                        @if (dejaDedans(row)) {
                          <span class="cs-flag cs-flag--in">déjà dedans</span>
                        } @else {
                          <span class="cs-flag cs-flag--out">pas encore</span>
                        }
                      }
                    </span>
                  </button>
                </li>
              }
            </ul>
          }
        </div>
      }

      @if (pane() === 'detail' && selected(); as sel) {
        <div data-cs-pane="detail" class="cs-pane">
          <p class="cs-hint">
            Liée à cette étude.
            @if (sel.devisRecus) {
              Devis : {{ sel.devisRecus }}.
            } @else {
              Devis : 0.
            }
          </p>
          <h3>Articles du panier</h3>
          <ul class="cs-panier" data-cs-panier>
            @for (cle of sel.clesStables; track cle) {
              <li>
                {{ cle }}
                @if (cle === articleCle()) {
                  <span class="cs-flag cs-flag--in">déjà dedans</span>
                }
              </li>
            } @empty {
              <li class="cs-hint">Panier vide.</li>
            }
          </ul>
          @if (articleCle() && dejaDedans(sel)) {
            <p class="cs-callout">
              {{ articleLibelle() }} est déjà dans ce panier — on ne le re-coche pas.
            </p>
          }
        </div>
      }

      @if (pane() === 'creer') {
        <div data-cs-pane="creer" class="cs-pane">
          <p class="cs-hint">
            Article de départ : {{ articleLibelle() }} — déjà posé, pas tout l’arbre à cocher.
          </p>
          <label>
            Fournisseur
            <select
              [ngModel]="fournisseurId()"
              (ngModelChange)="fournisseurId.set($event)"
              name="fournisseurId"
            >
              <option value="">— fiche Achats —</option>
              @for (f of fournisseurs(); track f.id) {
                <option [value]="f.id">{{ f.raisonSociale }} ({{ f.code }})</option>
              }
            </select>
          </label>
        </div>
      }

      <footer>
        @if (pane() === 'liste') {
          @if (articleCle()) {
            <nf-button variant="secondary" [disabled]="saving()" (clicked)="ouvrirCreer()">
              Nouvelle consultation
            </nf-button>
          }
        }
        @if (pane() === 'detail' && selected(); as sel) {
          @if (articleCle() && !dejaDedans(sel)) {
            <nf-button variant="primary" [disabled]="saving()" (clicked)="ajouterArticleCourant()">
              Ajouter {{ articleLibelle() }}
            </nf-button>
          }
          <nf-button variant="secondary" [disabled]="saving()" (clicked)="retourListe()">
            Retour liste
          </nf-button>
        }
        @if (pane() === 'creer') {
          <nf-button variant="primary" [disabled]="saving() || !articleCle()" (clicked)="creerConsultation()">
            Créer et y mettre {{ articleLibelle() }}
          </nf-button>
          <nf-button variant="secondary" [disabled]="saving()" (clicked)="retourListe()">
            Annuler
          </nf-button>
        }
      </footer>
    </div>
  `,
  styles: `
    .cs-overlay {
      min-width: min(32rem, 92vw);
      max-width: 92vw;
      padding: 1rem 1.1rem 1.1rem;
      display: flex;
      flex-direction: column;
      gap: 0.75rem;
      max-height: min(80vh, 40rem);
    }
    header,
    footer {
      display: flex;
      justify-content: space-between;
      align-items: center;
      gap: 0.5rem;
      flex-shrink: 0;
    }
    footer {
      justify-content: flex-start;
      flex-wrap: wrap;
    }
    h2,
    h3 {
      margin: 0;
      font-size: 1.05rem;
    }
    h3 {
      font-size: 0.9rem;
    }
    label {
      display: flex;
      flex-direction: column;
      gap: 0.35rem;
      margin: 0;
    }
    select {
      padding: 0.45rem 0.6rem;
    }
    .cs-pane {
      display: flex;
      flex-direction: column;
      gap: 0.65rem;
      min-height: 0;
      overflow: auto;
    }
    .cs-liees,
    .cs-panier {
      list-style: none;
      margin: 0;
      padding: 0;
      display: flex;
      flex-direction: column;
      gap: 0.4rem;
    }
    .cs-liee {
      width: 100%;
      text-align: left;
      display: flex;
      flex-direction: column;
      gap: 0.2rem;
      padding: 0.55rem 0.7rem;
      border: 1px solid var(--nf-color-border, #d5d9de);
      border-radius: 0.35rem;
      background: var(--nf-color-surface, #fff);
      cursor: pointer;
    }
    .cs-liee:hover {
      border-color: var(--nf-color-text-secondary, #5c6570);
    }
    .cs-liee-main,
    .cs-liee-meta {
      display: flex;
      gap: 0.5rem;
      align-items: baseline;
      flex-wrap: wrap;
    }
    .cs-liee-meta {
      font-size: 0.8125rem;
      color: var(--nf-color-text-secondary, #5c6570);
    }
    .cs-flag {
      font-weight: 600;
    }
    .cs-flag--in {
      color: var(--nf-color-success, #17663a);
    }
    .cs-flag--out {
      color: var(--nf-color-text-secondary, #5c6570);
    }
    .cs-callout {
      margin: 0;
      padding: 0.5rem 0.65rem;
      background: var(--nf-color-info-bg, #eef4fb);
      border-radius: 0.3rem;
      font-size: 0.875rem;
    }
    .cs-hint {
      margin: 0;
      color: var(--nf-color-text-secondary, #5c6570);
      font-size: 0.8125rem;
    }
    .cs-cle {
      margin-left: 0.25rem;
    }
    .cs-error {
      margin: 0;
      color: var(--nf-color-danger, #b42318);
    }
  `,
})
export class ConsultationDecompoDialogComponent {
  readonly data = inject<ConsultationDecompoDialogData>(MAT_DIALOG_DATA);
  private readonly dialogRef = inject(MatDialogRef<ConsultationDecompoDialogComponent, boolean>);
  private readonly api = inject(ConsultationAchatApiService);
  private readonly fournisseursApi = inject(FournisseurApiService);
  private readonly toast = inject(ToastService);

  readonly pane = signal<OverlayPane>('liste');
  readonly liees = signal<ConsultationAchat[]>([]);
  readonly selected = signal<ConsultationAchat | null>(null);
  readonly fournisseurs = signal<Fournisseur[]>([]);
  readonly fournisseurId = signal('');
  readonly chargement = signal(true);
  readonly saving = signal(false);
  readonly erreur = signal<string | undefined>(undefined);
  readonly changed = signal(false);

  readonly articleCle = computed(() => {
    const raw = (this.data.preselectedCles ?? []).map((c) => c.trim()).filter(Boolean);
    return raw[0] ?? '';
  });

  readonly articleLibelle = computed(() => {
    const label = (this.data.articleLibelle ?? '').trim();
    return label || this.articleCle() || 'article courant';
  });

  readonly titre = computed(() => {
    if (this.pane() === 'detail' && this.selected()) {
      const s = this.selected()!;
      return `${s.numero} — ${s.fournisseurNom}`;
    }
    if (this.pane() === 'creer') return 'Nouvelle consultation';
    return 'Consultations de cette étude';
  });

  constructor() {
    void this.boot();
  }

  close(): void {
    this.dialogRef.close(this.changed());
  }

  dejaDedans(row: ConsultationAchat): boolean {
    const cle = this.articleCle();
    if (!cle) return false;
    return (row.clesStables ?? []).includes(cle);
  }

  ouvrirDetail(row: ConsultationAchat): void {
    this.selected.set(row);
    this.erreur.set(undefined);
    this.pane.set('detail');
  }

  retourListe(): void {
    this.selected.set(null);
    this.erreur.set(undefined);
    this.pane.set('liste');
  }

  async ouvrirCreer(): Promise<void> {
    if (!this.articleCle()) return;
    this.erreur.set(undefined);
    this.pane.set('creer');
    if (this.fournisseurs().length === 0) {
      try {
        const frn = await this.fournisseursApi.getAll({ page: 0, pageSize: 200 });
        this.fournisseurs.set(frn.items ?? []);
      } catch {
        this.erreur.set('Impossible de charger les fournisseurs.');
      }
    }
  }

  async ajouterArticleCourant(): Promise<void> {
    const sel = this.selected();
    const cle = this.articleCle();
    if (!sel || !cle) return;
    if (this.dejaDedans(sel)) return;
    this.saving.set(true);
    this.erreur.set(undefined);
    try {
      const updated = await this.api.addToPanier(sel.id, {
        clesStables: [cle],
        dossierEtudeId: this.data.dossierId,
      });
      this.selected.set(updated);
      this.replaceLiee(updated);
      this.changed.set(true);
      this.toast.success(`${this.articleLibelle()} ajouté à ${updated.numero}`);
    } catch {
      this.erreur.set('Ajout impossible.');
    } finally {
      this.saving.set(false);
    }
  }

  async creerConsultation(): Promise<void> {
    const fournisseurId = this.fournisseurId().trim();
    const cle = this.articleCle();
    if (!fournisseurId) {
      this.erreur.set('Choisir un fournisseur (fiche Achats).');
      return;
    }
    if (!cle) {
      this.erreur.set('Ouvrir depuis un article / composant pour créer.');
      return;
    }
    this.saving.set(true);
    this.erreur.set(undefined);
    try {
      const created = await this.api.create({
        fournisseurId,
        clesStables: [cle],
        dossierEtudeId: this.data.dossierId,
      });
      this.toast.success(`Consultation ${created.numero} créée`);
      this.dialogRef.close(true);
    } catch {
      this.erreur.set('Création impossible.');
    } finally {
      this.saving.set(false);
    }
  }

  private replaceLiee(updated: ConsultationAchat): void {
    this.liees.update((rows) => rows.map((r) => (r.id === updated.id ? updated : r)));
  }

  private async boot(): Promise<void> {
    this.chargement.set(true);
    try {
      const listed = await this.api.list('liee');
      const dossierId = this.data.dossierId;
      this.liees.set((listed ?? []).filter((c) => c.dossierEtudeId === dossierId));
    } catch {
      this.erreur.set('Impossible de charger les consultations liées.');
    } finally {
      this.chargement.set(false);
    }
  }
}

export function openConsultationDecompoDialog(
  dialog: MatDialog,
  data: ConsultationDecompoDialogData,
): Promise<boolean | undefined> {
  const ref = dialog.open<
    ConsultationDecompoDialogComponent,
    ConsultationDecompoDialogData,
    boolean | undefined
  >(ConsultationDecompoDialogComponent, {
    data,
    width: 'min(36rem, 94vw)',
    maxHeight: '80vh',
    autoFocus: 'first-tabbable',
    restoreFocus: true,
    hasBackdrop: true,
    panelClass: 'consultation-decompo-overlay',
  });
  return firstValueFrom(ref.afterClosed());
}
