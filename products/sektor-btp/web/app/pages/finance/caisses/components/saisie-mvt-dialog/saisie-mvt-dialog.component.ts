import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, Component, computed, inject, input, LOCALE_ID, output, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { TranslateModule, TranslateService } from '@ngx-translate/core';

import { CaisseApiService } from '@applications/erp/finance/services/caisse-api.service';
import { ErpAttachmentUploadService } from '@applications/erp/shared/services/erp-attachment-upload.service';
import { ERP_ATTACHMENT_ENTITY_TYPES } from '@applications/erp/shared/config/attachment-detail.config';
import { TreasuryJournalEntryService } from '@applications/erp/finance/services/treasury-journal-entry.service';
import type {
  CompteFinancier,
  ModePaiement,
  MouvementTresorerie,
  MouvementTresorerieType,
} from '@applications/erp/finance/models';
import { ButtonComponent } from '@lib/anatomy/components';

interface TypeOption {
  value: MouvementTresorerieType;
  labelKey: string;
  hintKey: string;
  icon: string;
  delegated?: boolean;
}

@Component({
  selector: 'app-saisie-mvt-dialog',
  standalone: true,
  imports: [CommonModule, FormsModule, TranslateModule, ButtonComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="smv__backdrop" (click)="cancel.emit()"></div>
    <div class="smv__dialog" role="dialog">
      <header class="smv__head">
        <h2>{{ 'finance.mouvement.dialog.title' | translate }}</h2>
        <span class="smv__compte">
          {{ compte().libelle }} · {{ 'finance.compte.list.columns.soldeComptable' | translate }} : {{ formatSolde(compte().soldeActuel) }}
        </span>
        <nf-button variant="primary" class="smv__close" (clicked)="cancel.emit()">{{ 'finance.common.actions.close' | translate }}</nf-button>
      </header>

      <div class="smv__body">
        <div class="smv__types">
          @for (t of typeOptions; track t.value) {
            <nf-button variant="ghost" class="smv__type" [active]="selectedType() === t.value" (clicked)="selectType(t.value)">
              <span class="smv__type-icon">{{ t.icon }}</span>
              <span class="smv__type-label">{{ t.labelKey | translate }}</span>
              <span class="smv__type-hint">{{ t.hintKey | translate }}</span>
            </nf-button>
          }
        </div>

        @if (selectedType() && !isDelegated()) {
          <div class="smv__form">
            <div class="smv__row">
              <label class="smv__field">
                <span>{{ 'finance.reglement.form.fields.date' | translate }} *</span>
                <input
                  type="date"
                  [ngModel]="date()"
                  (ngModelChange)="date.set($event)"
                />
              </label>
              <label class="smv__field">
                <span>{{ 'finance.mouvement.dialog.mode' | translate }} *</span>
                <select [ngModel]="modePaiement()" (ngModelChange)="modePaiement.set($event)">
                  <option value="VIREMENT">{{ 'finance.mouvement.modes.VIREMENT' | translate }}</option>
                  <option value="CHEQUE">{{ 'finance.mouvement.modes.CHEQUE' | translate }}</option>
                  <option value="ESPECES">{{ 'finance.mouvement.modes.ESPECES' | translate }}</option>
                  <option value="CARTE">{{ 'finance.mouvement.modes.CARTE' | translate }}</option>
                  <option value="EFFET">{{ 'finance.mouvement.modes.EFFET' | translate }}</option>
                </select>
              </label>
              <label class="smv__field">
                <span>{{ 'finance.mouvement.form.fields.reference' | translate }}</span>
                <input
                  type="text"
                  [ngModel]="reference()"
                  (ngModelChange)="reference.set($event)"
                  [attr.placeholder]="'finance.mouvement.dialog.referencePlaceholder' | translate"
                />
              </label>
            </div>

            <label class="smv__field">
              <span>{{ 'finance.mouvement.form.fields.libelle' | translate }} *</span>
              <input
                type="text"
                [ngModel]="libelle()"
                (ngModelChange)="libelle.set($event)"
                [attr.placeholder]="'finance.mouvement.dialog.libellePlaceholder' | translate"
              />
            </label>

            <div class="smv__row">
              @if (isRecette()) {
                <label class="smv__field">
                  <span>{{ 'finance.mouvement.dialog.recetteLabel' | translate }} *</span>
                  <input
                    type="number"
                    min="0"
                    step="0.01"
                    [ngModel]="recette()"
                    (ngModelChange)="recette.set($event)"
                  />
                </label>
              } @else {
                <label class="smv__field">
                  <span>{{ 'finance.mouvement.dialog.depenseLabel' | translate }} *</span>
                  <input
                    type="number"
                    min="0"
                    step="0.01"
                    [ngModel]="depense()"
                    (ngModelChange)="depense.set($event)"
                  />
                </label>
              }
              <label class="smv__field">
                <span>{{ 'finance.mouvement.dialog.contrepartieLabel' | translate }}</span>
                <input
                  type="text"
                  [ngModel]="contrePartieName()"
                  (ngModelChange)="contrePartieName.set($event)"
                  [attr.placeholder]="'finance.mouvement.dialog.contrepartiePlaceholder' | translate"
                />
              </label>
            </div>

            @if (compte().type === 'CAISSE' && !isRecette()) {
              <label class="smv__field smv__field--required">
                <span>{{ 'finance.mouvement.dialog.justificatifLabel' | translate }} *</span>
                <input type="file" accept="image/*,application/pdf" (change)="onJustificatifSelected($event)" />
                @if (justificatifFileName()) {
                  <span class="smv__file-name">{{ justificatifFileName() }}</span>
                }
              </label>
            }

            <label class="smv__field">
              <span>{{ 'finance.ecriture.form.fields.libelle' | translate }}</span>
              <textarea
                rows="2"
                [ngModel]="notes()"
                (ngModelChange)="notes.set($event)"
              ></textarea>
            </label>
          </div>
        } @else if (selectedType() && isDelegated()) {
          <div class="smv__delegate">
            <p>{{ 'finance.mouvement.dialog.delegateInfo' | translate }}</p>
            <p class="smv__delegate-hint">{{ 'finance.mouvement.dialog.delegateHint' | translate }}</p>
          </div>
        } @else {
          <div class="smv__empty">{{ 'finance.mouvement.dialog.empty' | translate }}</div>
        }
      </div>

      <footer class="smv__foot">
        <nf-button variant="ghost" class="smv__btn smv__btn--ghost" (clicked)="cancel.emit()">
          {{ 'finance.common.actions.cancel' | translate }}
        </nf-button>
        @if (isDelegated()) {
          <nf-button variant="primary" class="smv__btn" (clicked)="goToDelegated()"  [disabled]="!selectedType()">
            {{ 'finance.mouvement.dialog.continueAction' | translate }}
          </nf-button>
        } @else {
          <nf-button variant="primary" class="smv__btn" (clicked)="save()"  [disabled]="!canSave()">
            {{ 'finance.common.actions.save' | translate }}
          </nf-button>
        }
      </footer>
    </div>
  `,
  styles: [
    `
      :host {
        position: fixed;
        inset: 0;
        z-index: 1100;
        display: flex;
        align-items: center;
        justify-content: center;
      }
      .smv__backdrop {
        position: absolute;
        inset: 0;
        background: rgba(15, 23, 42, 0.5);
      }
      .smv__dialog {
        position: relative;
        background: var(--nf-color-surface);
        border-radius: 12px;
        width: 720px;
        max-width: 95vw;
        max-height: 90vh;
        display: flex;
        flex-direction: column;
        overflow: hidden;
        box-shadow: 0 20px 50px -10px rgba(15, 23, 42, 0.3);
      }
      .smv__head {
        display: flex;
        align-items: center;
        gap: 12px;
        padding: 14px 18px;
        border-bottom: 1px solid var(--nf-color-border);
        h2 {
          margin: 0;
          font-size: 16px;
          font-weight: 700;
          color: var(--nf-text-primary);
        }
      }
      .smv__compte {
        flex: 1;
        font-size: 12px;
        color: var(--nf-color-text-secondary);
      }
      .smv__close {
        background: transparent;
        border: none;
        font-size: 18px;
        color: var(--nf-color-text-secondary);
        cursor: pointer;
        width: 32px;
        height: 32px;
        border-radius: 4px;
      }
      .smv__close:hover {
        background: var(--nf-color-bg-muted);
        color: var(--nf-text-primary);
      }
      .smv__body {
        flex: 1;
        overflow-y: auto;
        padding: 16px 18px;
        display: flex;
        flex-direction: column;
        gap: 16px;
      }
      .smv__types {
        display: grid;
        grid-template-columns: repeat(auto-fill, minmax(160px, 1fr));
        gap: 8px;
      }
      .smv__type {
        display: flex;
        flex-direction: column;
        gap: 2px;
        padding: 10px;
        border-radius: 8px;
        background: var(--nf-color-bg-subtle);
        border: 1px solid var(--nf-color-border);
        cursor: pointer;
        text-align: left;
        transition: border-color 0.15s, background 0.15s;
      }
      .smv__type:hover {
        border-color: var(--nf-color-primary-300);
        background: var(--nf-color-surface);
      }
      .smv__type--active {
        border-color: var(--nf-color-primary-600);
        background: var(--nf-color-primary-50);
        box-shadow: inset 0 0 0 1px var(--nf-color-primary-600);
      }
      .smv__type-icon {
        font-size: 18px;
      }
      .smv__type-label {
        font-size: 13px;
        font-weight: 600;
        color: var(--nf-text-primary);
      }
      .smv__type-hint {
        font-size: 11px;
        color: var(--nf-color-text-secondary);
      }
      .smv__form {
        display: flex;
        flex-direction: column;
        gap: 12px;
      }
      .smv__row {
        display: grid;
        grid-template-columns: repeat(auto-fit, minmax(160px, 1fr));
        gap: 12px;
      }
      .smv__field {
        display: flex;
        flex-direction: column;
        gap: 4px;
      }
      .smv__field span {
        font-size: 11px;
        font-weight: 600;
        text-transform: uppercase;
        letter-spacing: 0.05em;
        color: var(--nf-color-text-secondary);
      }
      .smv__field input,
      .smv__field select,
      .smv__field textarea {
        padding: 8px 10px;
        font-size: 13px;
        border-radius: 6px;
        border: 1px solid var(--nf-color-border);
        font-family: inherit;
      }
      .smv__field--required input {
        border-color: var(--nf-color-warning-500);
      }
      .smv__file-name {
        font-size: 12px;
        color: var(--nf-color-text-secondary);
        margin-top: 4px;
      }
      .smv__delegate {
        padding: 16px;
        background: var(--nf-color-primary-50);
        border: 1px solid var(--nf-color-primary-200);
        border-radius: 8px;
        font-size: 13px;
        color: var(--nf-color-primary-900);
      }
      .smv__delegate-hint {
        margin: 8px 0 0;
        font-size: 12px;
        color: var(--nf-color-primary-700);
      }
      .smv__empty {
        padding: 36px;
        text-align: center;
        color: var(--nf-color-text-muted);
        font-style: italic;
        font-size: 13px;
      }
      .smv__foot {
        display: flex;
        justify-content: flex-end;
        gap: 8px;
        padding: 14px 18px;
        border-top: 1px solid var(--nf-color-border);
        background: var(--nf-color-bg-subtle);
      }
      .smv__btn {
        padding: 8px 16px;
        border-radius: 6px;
        background: var(--nf-color-primary-600);
        color: white;
        border: none;
        font-weight: 600;
        font-size: 13px;
        cursor: pointer;
      }
      .smv__btn:disabled {
        background: var(--nf-color-border);
        cursor: not-allowed;
      }
      .smv__btn:hover:not(:disabled) {
        background: var(--nf-color-primary-700);
      }
      .smv__btn--ghost {
        background: transparent;
        color: var(--nf-color-text-secondary);
        border: 1px solid var(--nf-color-border);
      }
      .smv__btn--ghost:hover {
        background: var(--nf-color-surface);
        border-color: var(--nf-color-primary-300);
      }
    `,
  ],
})
export class SaisieMvtDialogComponent {
  private readonly treasuryEntries = inject(TreasuryJournalEntryService);
  private readonly caisseApi = inject(CaisseApiService);
  private readonly attachmentUpload = inject(ErpAttachmentUploadService);
  private readonly router = inject(Router);
  private readonly translate = inject(TranslateService);
  private readonly locale = inject(LOCALE_ID);

  readonly compte = input.required<CompteFinancier>();
  readonly useCaisseApi = input(false);
  readonly saved = output<MouvementTresorerie>();
  readonly cancel = output<void>();

  readonly typeOptions: TypeOption[] = [
    { value: 'REGLEMENT_CLIENT', labelKey: 'finance.mouvement.dialog.options.REGLEMENT_CLIENT.label', hintKey: 'finance.mouvement.dialog.options.REGLEMENT_CLIENT.hint', icon: '💰', delegated: true },
    { value: 'REGLEMENT_FOURN', labelKey: 'finance.mouvement.dialog.options.REGLEMENT_FOURN.label', hintKey: 'finance.mouvement.dialog.options.REGLEMENT_FOURN.hint', icon: '💸', delegated: true },
    { value: 'VIREMENT_INTERNE', labelKey: 'finance.mouvement.dialog.options.VIREMENT_INTERNE.label', hintKey: 'finance.mouvement.dialog.options.VIREMENT_INTERNE.hint', icon: '🔁', delegated: true },
    { value: 'AUTRE_RECETTE', labelKey: 'finance.mouvement.dialog.options.AUTRE_RECETTE.label', hintKey: 'finance.mouvement.dialog.options.AUTRE_RECETTE.hint', icon: '⬇️' },
    { value: 'AUTRE_DEPENSE', labelKey: 'finance.mouvement.dialog.options.AUTRE_DEPENSE.label', hintKey: 'finance.mouvement.dialog.options.AUTRE_DEPENSE.hint', icon: '⬆️' },
    { value: 'FRAIS_BANCAIRES', labelKey: 'finance.mouvement.dialog.options.FRAIS_BANCAIRES.label', hintKey: 'finance.mouvement.dialog.options.FRAIS_BANCAIRES.hint', icon: '🏦' },
    { value: 'COMMISSIONS', labelKey: 'finance.mouvement.dialog.options.COMMISSIONS.label', hintKey: 'finance.mouvement.dialog.options.COMMISSIONS.hint', icon: '%' },
    { value: 'PAIEMENT_PAIE', labelKey: 'finance.mouvement.dialog.options.PAIEMENT_PAIE.label', hintKey: 'finance.mouvement.dialog.options.PAIEMENT_PAIE.hint', icon: '👥' },
  ];

  protected readonly selectedType = signal<MouvementTresorerieType | null>(null);
  protected readonly date = signal<string>(new Date().toISOString().slice(0, 10));
  protected readonly modePaiement = signal<ModePaiement>('VIREMENT');
  protected readonly reference = signal<string>('');
  protected readonly libelle = signal<string>('');
  protected readonly contrePartieName = signal<string>('');
  protected readonly recette = signal<number>(0);
  protected readonly depense = signal<number>(0);
  protected readonly justificatifFile = signal<File | null>(null);
  protected readonly justificatifFileName = signal<string>('');
  protected readonly notes = signal<string>('');

  readonly isDelegated = computed(() => {
    const t = this.selectedType();
    return !!this.typeOptions.find((o) => o.value === t)?.delegated;
  });

  readonly isRecette = computed(() => this.selectedType() === 'AUTRE_RECETTE');

  readonly canSave = computed(() => {
    if (!this.selectedType() || this.isDelegated()) return false;
    if (!this.libelle()) return false;
    const amt = this.isRecette() ? this.recette() : this.depense();
    if (!amt || amt <= 0) return false;
    if (this.compte().type === 'CAISSE' && !this.isRecette() && !this.justificatifFile()) return false;
    return true;
  });

  selectType(t: MouvementTresorerieType): void {
    this.selectedType.set(t);
    if (t === 'FRAIS_BANCAIRES' || t === 'COMMISSIONS') {
      if (!this.libelle()) {
        const key = t === 'FRAIS_BANCAIRES'
          ? 'finance.mouvement.defaultLibelle.FRAIS_BANCAIRES'
          : 'finance.mouvement.defaultLibelle.COMMISSIONS';
        this.libelle.set(this.translate.instant(key));
      }
      this.modePaiement.set('VIREMENT');
    }
    if (t === 'AUTRE_RECETTE') {
      this.depense.set(0);
    } else {
      this.recette.set(0);
    }
  }

  onJustificatifSelected(event: Event): void {
    const file = (event.target as HTMLInputElement).files?.[0] ?? null;
    this.justificatifFile.set(file);
    this.justificatifFileName.set(file?.name ?? '');
  }

  async save(): Promise<void> {
    const t = this.selectedType();
    if (!t || this.isDelegated()) return;
    const amt = this.isRecette() ? this.recette() : this.depense();
    const justificatifFile = this.justificatifFile();
    const justificatifLabel = justificatifFile?.name ?? '';
    const noteWithJust = [
      this.notes(),
      justificatifLabel
        ? this.translate.instant('finance.mouvement.dialog.justificatifPrefix', { ref: justificatifLabel })
        : '',
    ]
      .filter(Boolean)
      .join(' · ');
    if (this.useCaisseApi()) {
      const pendingId = crypto.randomUUID();
      let photoTicketUrl: string | undefined;
      if (justificatifFile) {
        photoTicketUrl = await this.attachmentUpload.uploadFile(
          ERP_ATTACHMENT_ENTITY_TYPES.CAISSE_MOUVEMENT,
          pendingId,
          justificatifFile,
        );
      }
      await this.caisseApi.createMouvement({
        caisseId: this.compte().id,
        date: this.date(),
        type: this.isRecette() ? 'AVANCE_RECUE' : 'DEPENSE',
        montant: amt,
        description: this.libelle() + (noteWithJust ? ` — ${noteWithJust}` : ''),
        photoTicketUrl,
      });
      this.saved.emit({
        id: '',
        numero: '',
        compteFinancierId: this.compte().id,
        date: this.date(),
        type: t,
        modePaiement: this.modePaiement(),
        recette: this.isRecette() ? amt : 0,
        depense: this.isRecette() ? 0 : amt,
        libelle: this.libelle(),
        createdAt: new Date().toISOString(),
      });
      return;
    }
    const created = await this.treasuryEntries.createFromReleveLine({
      date: this.date(),
      libelle: this.libelle(),
      reference: this.reference() || undefined,
      recette: this.isRecette() ? amt : 0,
      depense: this.isRecette() ? 0 : amt,
      compteFinancierId: this.compte().id,
      compteFinancierLibelle: this.compte().libelle,
      glAccountCode: this.compte().compteCgncCode,
    });
    this.saved.emit({
      ...created,
      type: t,
      modePaiement: this.modePaiement(),
      contrePartieName: this.contrePartieName() || undefined,
      notes: noteWithJust || undefined,
    });
  }

  goToDelegated(): void {
    const t = this.selectedType();
    if (!t) return;
    const compteId = this.compte().id;
    switch (t) {
      case 'REGLEMENT_CLIENT':
        void this.router.navigate(['/finance/reglements/new'], {
          queryParams: { type: 'CLIENT', compteId },
        });
        break;
      case 'REGLEMENT_FOURN':
        void this.router.navigate(['/finance/reglements/new'], {
          queryParams: { type: 'FOURNISSEUR', compteId },
        });
        break;
      case 'PAIEMENT_PAIE':
        void this.router.navigate(['/finance/reglements/new'], {
          queryParams: { type: 'EMPLOYE', compteId },
        });
        break;
      case 'VIREMENT_INTERNE':
        void this.router.navigate(['/finance/virements/new'], {
          queryParams: { sourceId: compteId },
        });
        break;
      default:
        break;
    }
    const stub: MouvementTresorerie = {
      id: '',
      numero: '',
      compteFinancierId: compteId,
      date: this.date(),
      type: t,
      modePaiement: this.modePaiement(),
      recette: 0,
      depense: 0,
      libelle: '',
      createdAt: new Date().toISOString(),
    };
    this.saved.emit(stub);
  }

  formatSolde(v: number): string {
    return (
      v.toLocaleString(this.locale, { minimumFractionDigits: 2 }) +
      ' ' +
      this.translate.instant('finance.common.currency.mad')
    );
  }
}
