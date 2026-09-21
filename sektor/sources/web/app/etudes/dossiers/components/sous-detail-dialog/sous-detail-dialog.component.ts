import { CommonModule } from '@angular/common';
import {
  AfterViewInit,
  Component,
  ElementRef,
  computed,
  inject,
  signal,
  viewChild,
  ChangeDetectionStrategy,
} from '@angular/core';
import { FormsModule } from '@angular/forms';
import { MAT_DIALOG_DATA, MatDialogModule, MatDialogRef } from '@angular/material/dialog';

import { ButtonComponent, NfSelectComponent, type NfSelectOption } from '@platform/lib/anatomy';

import type { DpuComposantType } from '@app/etudes/models';
import type { UniteOption } from '../../utils/unite-options.util';
import {
  DossierEtudeApiService,
  type HistoriquePrixComposant,
  type HistoriquePrixComposantLigne,
} from '../../services/dossier-etude-api.service';
import {
  compactHistoriquePrix,
  historiquePrixPreview,
} from '../../utils/historique-prix.util';

export interface SousDetailDialogData {
  mode: 'create' | 'edit';
  premier?: boolean;
  uniteOptions: UniteOption[];
  dossierId?: string | null;
  articleLibelle?: string | null;
  articleCode?: string | null;
  initial?: {
    type?: DpuComposantType;
    designation?: string;
    unite?: string;
    quantite?: number;
    prixUnitaire?: number;
    sourcePrix?: string;
    offreFournisseurId?: string | null;
    itemId?: string | null;
  };
}

export interface SousDetailDialogResult {
  type: DpuComposantType;
  designation: string;
  unite: string;
  quantite: number;
  prixUnitaire: number;
  total: number;
  sourcePrix?: string;
  offreFournisseurId?: string | null;
  itemId?: string | null;
  prixSourceRefId?: string | null;
  prixDateSource?: string | null;
  prixLibelleSource?: string | null;
}

const SOURCES: { value: string; label: string }[] = [
  { value: 'MANUEL', label: 'Manuel' },
  { value: 'HISTORIQUE', label: 'Achat (facture / commande)' },
  { value: 'CONSULTE', label: 'Consulté (offre / devis)' },
  { value: 'CATALOGUE', label: 'Catalogue fournisseur' },
  { value: 'BIBLIOTHEQUE', label: 'Bibliothèque de prix' },
];

const TYPES: { value: DpuComposantType; label: string }[] = [
  { value: 'MATIERE', label: 'Matière' },
  { value: 'MAIN_DOEUVRE', label: 'Main-d’œuvre' },
  { value: 'MATERIEL', label: 'Matériel' },
  { value: 'SOUS_TRAITANCE', label: 'Sous-traitance' },
];

@Component({
  selector: 'app-sous-detail-dialog',
  standalone: true,
  imports: [CommonModule, FormsModule, MatDialogModule, ButtonComponent, NfSelectComponent],
  template: `
    <div class="dialog-shell">
      <header>
        <h2>{{ title }}</h2>
        <nf-button variant="ghost" (clicked)="close()" aria-label="Fermer">✕</nf-button>
      </header>

      <nf-select
        label="Type *"
        name="type"
        [options]="typeOptions"
        [ngModel]="type"
        (ngModelChange)="onTypeChange($event)"
        [required]="true"
      />

      <label class="field">
        <span>Désignation *</span>
        <input
          #designationInput
          name="designation"
          type="text"
          [(ngModel)]="designation"
          (ngModelChange)="onDesignationChange($event)"
          autocomplete="off"
          required
          placeholder="Ex. Béton C25/30"
        />
      </label>

      @if (linkedItem(); as item) {
        <p class="catalog-chip">
          <span>Catalogue · {{ item.code || item.cleStable }} — {{ item.name }}</span>
          <button type="button" class="linkish" (click)="delier()">Délier</button>
        </p>
      } @else if (suggestions().length) {
        <div class="suggest">
          <p>Article catalogue possible — lier pour voir l’historique.</p>
          <ul>
            @for (hit of suggestions(); track hit.itemId) {
              <li>
                <button type="button" (click)="lier(hit)">
                  {{ hit.code }} — {{ hit.name }}
                  @if (hit.unite) {
                    <span class="muted">· {{ hit.unite }}</span>
                  }
                </button>
              </li>
            }
          </ul>
        </div>
      }

      <div class="grid-3">
        <nf-select
          label="Unité *"
          name="unite"
          [options]="uniteOptions"
          [ngModel]="unite"
          (ngModelChange)="unite = $event"
          [required]="true"
        />
        <label class="field">
          <span>Quantité *</span>
          <input name="quantite" type="number" step="any" min="0" [(ngModel)]="quantite" required />
        </label>
        <label class="field">
          <span>Prix unitaire *</span>
          <input
            name="prixUnitaire"
            type="number"
            step="any"
            min="0"
            [(ngModel)]="prixUnitaire"
            required
          />
        </label>
      </div>

      <section class="hist" aria-live="polite">
        <header class="hist-head">
          <h3>Historique de prix</h3>
          @if (hasAchat()) {
            <span class="hist-flag">Achat plus pertinent</span>
          }
        </header>
        @if (loadingHist()) {
          <p class="pu-hint">Recherche de l’historique…</p>
        } @else if (histError()) {
          <p class="pu-hint pu-hint--warn">{{ histError() }}</p>
        } @else if (!linkedItem() && !suggestions().length) {
          <p class="pu-hint">Pas dans le catalogue — saisissez le PU à la main.</p>
        } @else if (!lignes().length) {
          <p class="pu-hint">Aucun achat ni consultation pour cet article. Saisissez le PU.</p>
        } @else {
          <ul class="hist-list">
            @for (groupe of histVisibles(); track groupe.key) {
              <li>
                <button
                  type="button"
                  [class.hist-row--achat]="estAchat(groupe.ligne)"
                  (click)="appliquer(groupe.ligne)"
                >
                  <span class="hist-partner">{{ groupe.partenaire }}</span>
                  <span class="hist-meta">
                    {{ kindLabel(groupe.ligne) }}
                    · {{ groupe.ligne.dateSource | date: 'dd/MM/yyyy' }}
                    @if (groupe.count > 1) {
                      · {{ groupe.count }} offres
                    }
                  </span>
                  <strong>{{ groupe.ligne.prixUnitaire | number: '1.2-2' }} MAD</strong>
                </button>
              </li>
            }
          </ul>
          @if (histReste() > 0) {
            <button type="button" class="hist-more" (click)="histExpanded.set(true)">
              Voir {{ histReste() }} autre{{ histReste() > 1 ? 's' : '' }} partenaire{{
                histReste() > 1 ? 's' : ''
              }}
            </button>
          }
        }
      </section>

      <nf-select
        label="Source du prix"
        name="sourcePrix"
        [options]="sourceOptions"
        [ngModel]="sourcePrix"
        (ngModelChange)="sourcePrix = $event"
      />

      <p class="total" aria-live="polite">
        Montant
        <strong>{{ montant | number: '1.2-2' }} MAD</strong>
      </p>

      <footer>
        <nf-button variant="secondary" (clicked)="close()">Annuler</nf-button>
        <nf-button variant="primary" [disabled]="!canSave()" (clicked)="save()">
          {{ data.mode === 'edit' ? 'Enregistrer' : 'Ajouter' }}
        </nf-button>
      </footer>
    </div>
  `,
  changeDetection: ChangeDetectionStrategy.Eager,
  styles: `
    .dialog-shell {
      display: grid;
      gap: 1rem;
      padding: 1.25rem;
      min-width: min(36rem, 92vw);
      overflow: visible;
      background: var(--nf-color-surface, #fff);
    }
    header {
      display: flex;
      justify-content: space-between;
      gap: 1rem;
      align-items: start;
    }
    header h2 {
      margin: 0;
      font-size: 1.125rem;
    }
    .field {
      display: flex;
      flex-direction: column;
      gap: 0.35rem;
      font-size: 0.875rem;
    }
    .field input,
    .field select {
      padding: 0.625rem 0.75rem;
      border: 1px solid var(--nf-color-border, #d1d5db);
      border-radius: 8px;
      font: inherit;
      background: var(--nf-color-surface, #fff);
      color: var(--nf-color-text-primary, #1a1a1a);
    }
    .field input:focus,
    .field select:focus {
      outline: none;
      border-color: var(--nf-color-primary-600, #0b6e7a);
      box-shadow: 0 0 0 3px color-mix(in srgb, var(--nf-color-primary-600, #0b6e7a) 18%, transparent);
    }
    .grid-3 {
      display: grid;
      grid-template-columns: 1fr 1fr 1fr;
      gap: 0.75rem;
    }
    .catalog-chip,
    .suggest {
      margin: 0;
      padding: 0.55rem 0.75rem;
      border-radius: 8px;
      background: color-mix(in srgb, var(--nf-color-primary-600, #0b6e7a) 8%, transparent);
      font-size: 0.8125rem;
    }
    .catalog-chip {
      display: flex;
      justify-content: space-between;
      gap: 0.75rem;
      align-items: center;
    }
    .suggest p {
      margin: 0 0 0.35rem;
    }
    .suggest ul {
      margin: 0;
      padding: 0;
      list-style: none;
    }
    .suggest button,
    .linkish {
      border: 0;
      background: none;
      padding: 0;
      font: inherit;
      color: var(--nf-color-primary-700, #0a5c66);
      cursor: pointer;
      text-decoration: underline;
    }
    .muted {
      color: var(--nf-color-text-secondary, #4b5563);
    }
    .hist {
      display: grid;
      gap: 0.5rem;
    }
    .hist-head {
      display: flex;
      justify-content: space-between;
      align-items: center;
      gap: 0.75rem;
    }
    .hist-head h3 {
      margin: 0;
      font-size: 0.875rem;
    }
    .hist-flag {
      font-size: 0.75rem;
      font-weight: 600;
      color: var(--nf-color-success-700, #166534);
    }
    .hist-list {
      margin: 0;
      padding: 0;
      list-style: none;
      display: grid;
      gap: 0.35rem;
    }
    .hist-list button {
      display: grid;
      grid-template-columns: 1fr auto;
      grid-template-rows: auto auto;
      column-gap: 0.5rem;
      width: 100%;
      align-items: center;
      padding: 0.5rem 0.65rem;
      border: 1px solid var(--nf-color-border, #d1d5db);
      border-radius: 8px;
      background: var(--nf-color-surface, #fff);
      font: inherit;
      font-size: 0.8125rem;
      text-align: left;
      cursor: pointer;
    }
    .hist-row--achat {
      border-color: color-mix(in srgb, var(--nf-color-success-600, #16a34a) 45%, transparent);
      background: color-mix(in srgb, var(--nf-color-success-600, #16a34a) 8%, transparent);
    }
    .hist-partner {
      font-weight: 650;
      grid-column: 1;
    }
    .hist-meta {
      grid-column: 1;
      color: var(--nf-color-text-secondary, #4b5563);
      font-size: 0.75rem;
    }
    .hist-list strong {
      grid-column: 2;
      grid-row: 1 / span 2;
    }
    .hist-more {
      border: 0;
      background: none;
      padding: 0.15rem 0;
      font: inherit;
      font-size: 0.75rem;
      font-weight: 650;
      color: var(--nf-color-primary-700, #0a5c66);
      cursor: pointer;
      text-decoration: underline;
      text-align: left;
    }
    .pu-hint {
      margin: 0;
      font-size: 0.75rem;
      color: var(--nf-color-text-secondary, #4b5563);
      line-height: 1.35;
    }
    .pu-hint--warn {
      color: var(--nf-color-warning-700, #92400e);
    }
    .total {
      margin: 0;
      display: flex;
      justify-content: space-between;
      align-items: baseline;
      padding: 0.75rem 0.9rem;
      border-radius: 8px;
      background: var(--nf-color-bg-subtle, #f3f4f6);
      font-size: 0.875rem;
      font-variant-numeric: tabular-nums;
    }
    footer {
      display: flex;
      justify-content: flex-end;
      gap: 0.75rem;
    }
    @media (max-width: 640px) {
      .grid-3,
      .hist-list button {
        grid-template-columns: 1fr;
      }
    }
  `,
})
export class SousDetailDialogComponent implements AfterViewInit {
  private readonly dialogRef = inject(
    MatDialogRef<SousDetailDialogComponent, SousDetailDialogResult | null>,
  );
  readonly data = inject<SousDetailDialogData>(MAT_DIALOG_DATA);
  private readonly api = inject(DossierEtudeApiService);
  private readonly designationInput = viewChild<ElementRef<HTMLInputElement>>('designationInput');
  private histTimer: ReturnType<typeof setTimeout> | null = null;
  private histSeq = 0;

  readonly loadingHist = signal(false);
  readonly histError = signal<string | undefined>(undefined);
  readonly linkedItem = signal<NonNullable<HistoriquePrixComposant['item']> | null>(null);
  readonly suggestions = signal<NonNullable<HistoriquePrixComposant['suggestions']>>([]);
  readonly lignes = signal<HistoriquePrixComposantLigne[]>([]);
  readonly histExpanded = signal(false);
  readonly histGroupes = computed(() => compactHistoriquePrix(this.lignes()));
  readonly histVisibles = computed(() =>
    historiquePrixPreview(this.histGroupes(), this.histExpanded()),
  );
  readonly histReste = computed(() =>
    Math.max(0, this.histGroupes().length - this.histVisibles().length),
  );

  readonly types = TYPES;
  readonly sources = SOURCES;
  readonly typeOptions: NfSelectOption[] = TYPES.map((t) => ({
    value: t.value,
    label: t.label,
  }));
  readonly sourceOptions: NfSelectOption[] = SOURCES.map((s) => ({
    value: s.value,
    label: s.label,
  }));
  readonly uniteOptions: NfSelectOption[] = [
    { value: '', label: '—' },
    ...this.data.uniteOptions.map((u) => ({ value: u.code, label: u.code })),
  ];
  type: DpuComposantType = this.data.initial?.type ?? 'MATIERE';
  designation = this.data.initial?.designation ?? '';
  unite = this.data.initial?.unite ?? this.data.uniteOptions[0]?.code ?? '';
  quantite = this.data.initial?.quantite != null ? String(this.data.initial.quantite) : '1';
  prixUnitaire =
    this.data.initial?.prixUnitaire != null ? String(this.data.initial.prixUnitaire) : '0';
  sourcePrix = this.data.initial?.sourcePrix ?? 'MANUEL';
  offreFournisseurId = this.data.initial?.offreFournisseurId ?? null;
  itemId = this.data.initial?.itemId ?? null;
  prixSourceRefId: string | null = null;
  prixDateSource: string | null = null;
  prixLibelleSource: string | null = null;

  get title(): string {
    if (this.data.mode === 'edit') return 'Modifier le composant';
    return this.data.premier ? 'Premier composant' : 'Ajouter un composant';
  }

  onTypeChange(value: string): void {
    this.type = (value as DpuComposantType) || 'MATIERE';
    this.scheduleHist();
  }

  onDesignationChange(value: string): void {
    this.designation = value;
    this.scheduleHist();
  }

  ngAfterViewInit(): void {
    queueMicrotask(() => this.designationInput()?.nativeElement?.focus());
    void this.refreshHist();
  }

  lier(hit: NonNullable<HistoriquePrixComposant['suggestions']>[number]): void {
    this.itemId = hit.itemId;
    this.designation = hit.name?.trim() || this.designation;
    if (hit.unite?.trim()) this.unite = hit.unite.trim();
    void this.refreshHist();
  }

  delier(): void {
    this.itemId = null;
    this.linkedItem.set(null);
    this.lignes.set([]);
    void this.refreshHist();
  }

  hasAchat(): boolean {
    return this.lignes().some((row) => this.estAchat(row));
  }

  estAchat(row: HistoriquePrixComposantLigne): boolean {
    return row.kind === 'ACHATS';
  }

  kindLabel(row: HistoriquePrixComposantLigne): string {
    if (row.kind === 'ACHATS' && row.detail === 'FACTURE') return 'Achat facturé';
    if (row.kind === 'ACHATS') return 'Commande';
    if (row.kind === 'CONSULTATION') return 'Consultation';
    if (row.kind === 'TARIF') return 'Tarif';
    return 'Catalogue';
  }

  appliquer(row: HistoriquePrixComposantLigne): void {
    this.prixUnitaire = String(row.prixUnitaire);
    this.sourcePrix = row.sourcePrix || (this.estAchat(row) ? 'HISTORIQUE' : 'CONSULTE');
    this.offreFournisseurId = row.kind === 'CONSULTATION' ? (row.sourceRefId ?? null) : null;
    this.prixSourceRefId = row.sourceRefId ?? null;
    this.prixDateSource = row.dateSource ?? null;
    this.prixLibelleSource = row.libelle ?? null;
  }

  get montant(): number {
    const q = this.parseNumber(this.quantite);
    const pu = this.parseNumber(this.prixUnitaire);
    if (!Number.isFinite(q) || !Number.isFinite(pu)) return 0;
    return Math.round(Math.max(0, q) * Math.max(0, pu) * 100) / 100;
  }

  canSave(): boolean {
    if (!this.designation.trim() || !this.unite.trim()) return false;
    const q = this.parseNumber(this.quantite);
    const pu = this.parseNumber(this.prixUnitaire);
    return Number.isFinite(q) && q > 0 && Number.isFinite(pu) && pu >= 0;
  }

  save(): void {
    if (!this.canSave()) return;
    this.dialogRef.close({
      type: this.type,
      designation: this.designation.trim(),
      unite: this.unite.trim(),
      quantite: this.parseNumber(this.quantite),
      prixUnitaire: this.parseNumber(this.prixUnitaire),
      total: this.montant,
      sourcePrix: this.sourcePrix,
      offreFournisseurId: this.offreFournisseurId,
      itemId: this.itemId,
      prixSourceRefId: this.prixSourceRefId,
      prixDateSource: this.prixDateSource,
      prixLibelleSource: this.prixLibelleSource,
    });
  }

  close(): void {
    this.dialogRef.close(null);
  }

  private scheduleHist(): void {
    if (this.histTimer) clearTimeout(this.histTimer);
    this.histTimer = setTimeout(() => void this.refreshHist(), 350);
  }

  private async refreshHist(): Promise<void> {
    const dossierId = this.data.dossierId?.trim();
    if (!dossierId) return;
    const seq = ++this.histSeq;
    this.loadingHist.set(true);
    this.histError.set(undefined);
    try {
      const row = await this.api.historiquePrixComposant(dossierId, {
        itemId: this.itemId,
        designation: this.designation.trim() || undefined,
        type: this.type,
      });
      if (seq !== this.histSeq) return;
      this.linkedItem.set(row.item ?? null);
      if (row.item?.itemId) this.itemId = row.item.itemId;
      this.suggestions.set(row.item ? [] : (row.suggestions ?? []));
      this.lignes.set(row.lignes ?? []);
      if (row.item?.unite?.trim() && !this.unite.trim()) this.unite = row.item.unite.trim();
    } catch {
      if (seq !== this.histSeq) return;
      this.histError.set('Historique indisponible — saisissez le prix.');
      this.lignes.set([]);
    } finally {
      if (seq === this.histSeq) this.loadingHist.set(false);
    }
  }

  private parseNumber(value: string): number {
    return Number.parseFloat(String(value).replace(',', '.'));
  }
}
