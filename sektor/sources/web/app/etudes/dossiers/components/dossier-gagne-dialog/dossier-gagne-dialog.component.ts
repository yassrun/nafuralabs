import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { MAT_DIALOG_DATA, MatDialogModule, MatDialogRef } from '@angular/material/dialog';

import { ButtonComponent, NfInputComponent } from '@platform/lib/anatomy';

import {
  DossierEtudeApiService,
  type SyntheseCoutAffaire,
} from '../../services/dossier-etude-api.service';

export interface DossierGagneDialogData {
  dossierId: string;
  devisId: string;
  devisNumero?: string | null;
  totalHt: number;
  peutDeroger: boolean;
}

export interface DossierGagneDialogResult {
  dateAttribution: string;
  referenceMarche?: string;
  montantAttribue: number;
  motifDerogation?: string;
  acceptWarnings?: boolean;
}

interface ControleEtudeLite {
  code?: string;
  severite?: string;
  messageKey?: string;
}

interface CompletudeLite {
  controles?: ControleEtudeLite[];
}

@Component({
  selector: 'app-dossier-gagne-dialog',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [FormsModule, MatDialogModule, ButtonComponent, NfInputComponent],
  template: `
    <div class="dialog-shell">
      <header>
        <h2>Marquer l’affaire gagnée</h2>
        <nf-button variant="ghost" (clicked)="close()" aria-label="Fermer">✕</nf-button>
      </header>
      <p class="hint">
        Le devis
        @if (data.devisNumero) {
          <strong>{{ data.devisNumero }}</strong>
        }
        est approuvé en même temps. Le montant attribué est celui du devis — pas de saisie manuelle.
      </p>

      <dl class="recap">
        <div>
          <dt>Montant attribué HT</dt>
          <dd>{{ formatMad(montantAttribue()) }}</dd>
        </div>
        @if (cout(); as c) {
          <div>
            <dt>Déboursé établi</dt>
            <dd>{{ formatMad(c.coutTotalEtabli) }}</dd>
          </div>
          <div>
            <dt>Marge</dt>
            <dd [class.recap__warn]="margeNegative()">
              {{ formatMad(marge()) }}
              @if (margeNegative()) {
                <span> — négative</span>
              }
            </dd>
          </div>
        }
      </dl>

      <nf-input
        label="Date d’attribution"
        type="date"
        [required]="true"
        [ngModel]="dateAttribution()"
        (ngModelChange)="dateAttribution.set($event || '')"
      />
      <nf-input
        label="Référence marché"
        [ngModel]="referenceMarche()"
        (ngModelChange)="referenceMarche.set($event || '')"
      />
      <p class="hint hint--muted">Facultatif — n° de marché, OS ou notification.</p>

      @if (bloquants().length) {
        <div class="error-box" role="alert">
          <p>Le gain est bloqué tant que le chiffrage n’est pas établi :</p>
          <ul>
            @for (b of bloquants(); track b.code ?? b.messageKey) {
              <li>{{ libelleControle(b) }}</li>
            }
          </ul>
        </div>
      }

      @if (warnings().length) {
        <div class="warn" role="status">
          <p>Avertissements commerciaux à accepter pour gagner :</p>
          <ul>
            @for (w of warnings(); track w.code ?? w.messageKey) {
              <li>{{ libelleControle(w) }}</li>
            }
          </ul>
          <label class="check">
            <input
              type="checkbox"
              [ngModel]="acceptWarnings()"
              (ngModelChange)="acceptWarnings.set($event)"
            />
            J’accepte ces avertissements
          </label>
        </div>
      }

      @if (margeNegative() && !data.peutDeroger) {
        <p class="error" role="alert">
          Marge négative : seul le DG ou l’owner peut confirmer le gain, avec un motif.
        </p>
      }

      @if (motifRequis()) {
        <label class="motif">
          <span>{{ labelMotif() }}</span>
          <textarea
            rows="4"
            [ngModel]="motif()"
            (ngModelChange)="motif.set($event || '')"
            placeholder="Motif audité (obligatoire)"
          ></textarea>
        </label>
      }

      @if (erreur()) {
        <p class="error" role="alert">{{ erreur() }}</p>
      }

      <footer>
        <nf-button variant="ghost" (clicked)="close()">Annuler</nf-button>
        <nf-button variant="primary" [disabled]="!peutConfirmer() || busy()" (clicked)="confirmer()">
          {{ busy() ? 'Enregistrement…' : 'Marquer gagné' }}
        </nf-button>
      </footer>
    </div>
  `,
  styles: `
    .dialog-shell {
      min-width: min(32rem, 92vw);
      padding: 1rem 1.1rem 1.1rem;
    }
    header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      gap: 0.5rem;
    }
    h2 {
      margin: 0;
      font-size: 1.05rem;
    }
    .hint {
      margin: 0.6rem 0 1rem;
      color: var(--nf-color-text-muted, #5b6472);
      font-size: 0.875rem;
    }
    .hint--muted {
      margin-top: 0.25rem;
      font-style: italic;
    }
    .recap {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(8rem, 1fr));
      gap: 0.75rem;
      margin: 0 0 1rem;
      padding: 0.75rem 0.85rem;
      border: 1px solid var(--nf-color-border, #e5e7eb);
      border-radius: 8px;
      background: var(--nf-color-bg-subtle, #f8fafc);
    }
    .recap dt {
      margin: 0;
      font-size: 0.75rem;
      color: var(--nf-color-text-muted, #5b6472);
    }
    .recap dd {
      margin: 0.15rem 0 0;
      font-weight: 600;
    }
    .recap__warn {
      color: var(--nf-color-danger, #b42318);
    }
    .warn {
      margin: 0.85rem 0;
      padding: 0.7rem 0.8rem;
      border-radius: 8px;
      background: color-mix(in srgb, #b45309 10%, transparent);
      font-size: 0.85rem;
    }
    .warn ul {
      margin: 0.35rem 0 0.6rem;
      padding-left: 1.1rem;
    }
    .check {
      display: flex;
      align-items: center;
      gap: 0.45rem;
    }
    .motif {
      display: flex;
      flex-direction: column;
      gap: 0.35rem;
      margin-top: 0.85rem;
      font-size: 0.85rem;
    }
    .motif textarea {
      width: 100%;
      resize: vertical;
      border: 1px solid var(--nf-color-border, #d0d5dd);
      border-radius: 6px;
      padding: 0.5rem 0.6rem;
      font: inherit;
    }
    footer {
      display: flex;
      justify-content: flex-end;
      gap: 0.5rem;
      margin-top: 1rem;
    }
    .error {
      color: var(--nf-color-danger, #b42318);
      font-size: 0.85rem;
    }
    .error-box {
      margin: 0.85rem 0;
      padding: 0.7rem 0.8rem;
      border-radius: 8px;
      background: color-mix(in srgb, var(--nf-color-danger, #b42318) 10%, transparent);
      color: var(--nf-color-danger, #b42318);
      font-size: 0.85rem;
    }
    .error-box ul {
      margin: 0.35rem 0 0;
      padding-left: 1.1rem;
    }
  `,
})
export class DossierGagneDialogComponent {
  private readonly dialogRef = inject(
    MatDialogRef<DossierGagneDialogComponent, DossierGagneDialogResult>,
  );
  private readonly api = inject(DossierEtudeApiService);
  readonly data = inject<DossierGagneDialogData>(MAT_DIALOG_DATA);

  readonly dateAttribution = signal(new Date().toISOString().slice(0, 10));
  readonly referenceMarche = signal('');
  readonly motif = signal('');
  readonly acceptWarnings = signal(false);
  readonly busy = signal(false);
  readonly erreur = signal<string | undefined>(undefined);
  readonly cout = signal<SyntheseCoutAffaire | null>(null);
  readonly bloquants = signal<ControleEtudeLite[]>([]);
  readonly warnings = signal<ControleEtudeLite[]>([]);

  readonly montantAttribue = computed(() => arrondiMad(this.data.totalHt));
  readonly marge = computed(() => {
    const c = this.cout();
    if (!c) return 0;
    return arrondiMad(this.montantAttribue() - (c.coutTotalEtabli ?? 0));
  });
  readonly margeNegative = computed(() => {
    const c = this.cout();
    if (!c) return false;
    return this.montantAttribue() < (c.coutTotalEtabli ?? 0);
  });
  readonly motifRequis = computed(
    () => this.margeNegative() || this.warnings().length > 0,
  );

  constructor() {
    void this.charger();
  }

  libelleControle(c: ControleEtudeLite): string {
    if (c.code === 'ETU-130') {
      return 'Aucun coût établi — chiffrez au moins un poste avant de marquer gagné.';
    }
    if (c.code === 'ETU-120') return 'Une partie des coûts n’est pas encore établie.';
    if (c.code === 'ETU-131') return 'Des composants libres n’ont pas de décision Catalogue.';
    return c.messageKey || c.code || 'Avertissement commercial';
  }

  labelMotif(): string {
    if (this.margeNegative() && this.warnings().length) {
      return 'Motif (marge négative et avertissements)';
    }
    if (this.margeNegative()) return 'Motif de dérogation (marge négative)';
    return 'Motif d’acceptation des avertissements';
  }

  formatMad(v: number | null | undefined): string {
    if (v == null || Number.isNaN(v)) return '—';
    return `${v.toLocaleString('fr-FR', { maximumFractionDigits: 2 })} MAD`;
  }

  peutConfirmer(): boolean {
    if (this.bloquants().length) return false;
    if (!this.dateAttribution().trim()) return false;
    if (this.margeNegative() && !this.data.peutDeroger) return false;
    if (this.warnings().length && !this.acceptWarnings()) return false;
    if (this.motifRequis() && !this.motif().trim()) return false;
    return true;
  }

  close(): void {
    this.dialogRef.close();
  }

  confirmer(): void {
    if (!this.peutConfirmer()) return;
    this.dialogRef.close({
      dateAttribution: this.dateAttribution().trim(),
      referenceMarche: this.referenceMarche().trim() || undefined,
      montantAttribue: this.montantAttribue(),
      motifDerogation: this.motif().trim() || undefined,
      acceptWarnings: this.warnings().length ? this.acceptWarnings() : undefined,
    });
  }

  private async charger(): Promise<void> {
    this.busy.set(true);
    try {
      const [cout, completude] = await Promise.all([
        this.api.getSyntheseCout(this.data.dossierId),
        this.api.completude(this.data.dossierId).catch(() => null),
      ]);
      this.cout.set(cout);
      const controles = (completude as CompletudeLite | null)?.controles ?? [];
      this.bloquants.set(
        controles.filter((c) => (c.severite ?? '').toUpperCase() === 'BLOCKING'),
      );
      this.warnings.set(
        controles.filter((c) => (c.severite ?? '').toUpperCase() === 'WARNING'),
      );
    } catch {
      this.erreur.set('Impossible de charger la synthèse des coûts. Vous pouvez quand même continuer.');
    } finally {
      this.busy.set(false);
    }
  }
}

function arrondiMad(n: number): number {
  return Math.round((n ?? 0) * 100) / 100;
}
