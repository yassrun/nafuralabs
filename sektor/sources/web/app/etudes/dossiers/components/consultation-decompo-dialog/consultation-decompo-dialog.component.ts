import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { MAT_DIALOG_DATA, MatDialog, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { firstValueFrom } from 'rxjs';

import { ButtonComponent, ToastService } from '@platform/lib/anatomy';
import { AuthFacade } from '@platform/core/security/services/auth.facade';
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
  imports: [MatDialogModule, ButtonComponent],
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
                <li class="cs-liee-row">
                  <button
                    type="button"
                    class="cs-liee"
                    data-cs-liee
                    [attr.data-cs-numero]="row.numero"
                    (click)="ouvrirDetail(row)"
                  >
                    <span class="cs-liee-main">
                      <strong>{{ row.numero }}</strong>
                      <span>{{ destinatairesLabel(row) }}</span>
                    </span>
                    <span class="cs-liee-meta">
                      <span class="cs-statut" [attr.data-cs-statut]="row.statut">{{
                        statutLabel(row)
                      }}</span>
                      {{ avancementLabel(row) }}
                      ·
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
                  <button
                    type="button"
                    class="cs-eye"
                    data-cs-fiche
                    aria-label="Voir la fiche"
                    title="Voir la fiche"
                    (click)="ouvrirFiche(row, $event)"
                  >
                    <svg aria-hidden="true" viewBox="0 0 24 24" width="18" height="18" fill="currentColor">
                      <path
                        d="M12 4.5C7 4.5 2.73 7.61 1 12c1.73 4.39 6 7.5 11 7.5s9.27-3.11 11-7.5c-1.73-4.39-6-7.5-11-7.5zM12 17c-2.76 0-5-2.24-5-5s2.24-5 5-5 5 2.24 5 5-2.24 5-5 5zm0-8c-1.66 0-3 1.34-3 3s1.34 3 3 3 3-1.34 3-3-1.34-3-3-3z"
                      />
                    </svg>
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
            <span class="cs-statut" [attr.data-cs-statut]="sel.statut">{{ statutLabel(sel) }}</span>
            · {{ destinatairesLabel(sel) }}
            · {{ avancementLabel(sel) }}
            · liée à cette étude.
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
            Les destinataires se saisissent ensuite sur la fiche Achats.
          </p>
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
          <nf-button variant="secondary" [disabled]="saving()" (clicked)="ouvrirFiche(sel)">
            Voir la fiche
          </nf-button>
          <nf-button variant="secondary" [disabled]="saving()" (clicked)="retourListe()">
            Retour liste
          </nf-button>
        }
        @if (pane() === 'creer') {
          <nf-button
            variant="primary"
            data-testid="consultation-decompo-creer"
            [disabled]="saving() || !articleCle()"
            (clicked)="creerConsultation()"
          >
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
      min-width: 0;
      width: 100%;
      box-sizing: border-box;
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
    .cs-pane {
      display: flex;
      flex-direction: column;
      gap: 0.65rem;
      min-height: 0;
      overflow: auto;
      overflow-x: hidden;
    }
    .cs-pane[data-cs-pane='creer'] {
      overflow: visible;
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
    .cs-liee-row {
      display: flex;
      align-items: stretch;
      gap: 0.35rem;
      width: 100%;
      min-width: 0;
    }
    .cs-liee {
      flex: 1 1 auto;
      min-width: 0;
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
    .cs-eye {
      flex: 0 0 2.5rem;
      width: 2.5rem;
      display: inline-flex;
      align-items: center;
      justify-content: center;
      border: 1px solid var(--nf-color-border, #d1d5db);
      border-radius: 0.35rem;
      background: var(--nf-color-background, #fff);
      color: var(--nf-color-text-muted, #64748b);
      cursor: pointer;
    }
    .cs-eye:hover {
      color: var(--nf-color-primary, #3b82f6);
      border-color: var(--nf-color-primary, #3b82f6);
      background: var(--nf-color-primary-50, #eff6ff);
    }
    .cs-statut {
      font-size: 0.75rem;
      font-weight: 600;
      letter-spacing: 0.02em;
      text-transform: uppercase;
      color: var(--nf-color-text-secondary, #5c6570);
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
      min-width: 0;
    }
    .cs-liee-main span {
      min-width: 0;
      flex: 1 1 auto;
      overflow: hidden;
      text-overflow: ellipsis;
      white-space: nowrap;
    }
    .cs-liees {
      min-width: 0;
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
  private readonly toast = inject(ToastService);
  private readonly auth = inject(AuthFacade);

  readonly pane = signal<OverlayPane>('liste');
  readonly liees = signal<ConsultationAchat[]>([]);
  readonly selected = signal<ConsultationAchat | null>(null);
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
      return `${s.numero} — ${this.destinatairesLabel(s)}`;
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

  destinatairesLabel(row: ConsultationAchat): string {
    const names = (row.destinataires ?? [])
      .map((d) => (d.fournisseurNom || '').trim())
      .filter(Boolean);
    if (names.length) {
      return `${names.join(', ')} (${names.length})`;
    }
    return (row.fournisseurNom || '').trim() || 'Aucun destinataire';
  }

  avancementLabel(row: ConsultationAchat): string {
    const n = (row.destinataires ?? []).length;
    const k = row.devisRecus ?? 0;
    return `${k}/${n} devis`;
  }

  statutLabel(row: ConsultationAchat): string {
    const code = (row.statut ?? '').toUpperCase();
    switch (code) {
      case 'COMPLETE':
        return 'Complète';
      case 'PARTIELLE':
        return 'Partielle';
      case 'OUVERTE':
        return 'En attente de réponses';
      case 'PREPARATION':
        return 'Préparation';
      case 'DEVIS_RECU':
        return (row.devisRecus ?? 0) > 1 ? `${row.devisRecus} devis reçus` : 'Devis reçu';
      default:
        return code || 'Préparation';
    }
  }

  ouvrirFiche(row: ConsultationAchat, event?: Event): void {
    event?.preventDefault();
    event?.stopPropagation();
    this.auth.persistSessionForNewTab();
    window.open(
      `${window.location.origin}/achats/consultations/${row.id}`,
      '_blank',
      'noopener',
    );
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

  ouvrirCreer(): void {
    if (!this.articleCle()) return;
    this.erreur.set(undefined);
    this.pane.set('creer');
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
    const cle = this.articleCle();
    if (!cle) {
      this.erreur.set('Ouvrir depuis un article / composant pour créer.');
      return;
    }
    this.saving.set(true);
    this.erreur.set(undefined);
    try {
      const created = await this.api.create({
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
    width: '36rem',
    maxWidth: '94vw',
    maxHeight: '80vh',
    autoFocus: 'first-tabbable',
    restoreFocus: true,
    hasBackdrop: true,
    panelClass: 'consultation-decompo-overlay',
  });
  return firstValueFrom(ref.afterClosed());
}
