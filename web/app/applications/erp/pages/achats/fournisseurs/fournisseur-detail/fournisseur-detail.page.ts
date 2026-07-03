import { CommonModule } from '@angular/common';
import {
  ChangeDetectionStrategy,
  Component,
  computed,
  effect,
  inject,
  signal,
} from '@angular/core';
import { FormsModule } from '@angular/forms';
import { TranslateService } from '@ngx-translate/core';

import {ConfigDrivenDetailPage,
  ConfigDrivenDetailPageImports,
  ConfigDrivenDetailPageStyles,
  createDetailFacadeFromCrud, ButtonComponent} from '@lib/anatomy';
import type { PageHeaderConfig } from '@lib/anatomy/components/molecules/page-header/page-header.component';
import type {
  AttestationFournisseur,
  AttestationFournisseurCreate,
  AttestationFournisseurStatus,
  AttestationFournisseurType,
  CatalogueFournisseurLigne,
  CatalogueFournisseurLigneCreate,
  Fournisseur,
  FournisseurCreate,
  PartnerAttestationsStatus,
} from '@applications/erp/achats/models';
import { PartnersApiService, type Partner } from '@applications/erp/shared/services/partners-api.service';

import {
  AttestationsFournisseurApiService,
  CatalogueFournisseurApiService,
  FournisseurFacade,
} from '../services';
import { buildFournisseurDetailConfig } from '../config';

type DetailTab = 'informations' | 'attestations' | 'catalogue';

const TABS: { id: DetailTab; label: string }[] = [
  { id: 'informations', label: 'Informations' },
  { id: 'attestations', label: 'Attestations' },
  { id: 'catalogue', label: 'Catalogue' },
];

const ATTESTATION_TYPES: AttestationFournisseurType[] = [
  'CNSS',
  'FISCALE',
  'AMO',
  'RC',
  'IF',
  'ICE',
  'PATENTE',
  'RIB',
];

const ATTESTATION_TYPE_LABELS: Record<AttestationFournisseurType, string> = {
  CNSS: 'CNSS',
  FISCALE: 'Attestation fiscale',
  AMO: 'AMO',
  RC: 'Registre de commerce',
  IF: 'Identifiant fiscal',
  ICE: 'ICE',
  PATENTE: 'Patente',
  RIB: 'RIB',
};

const ATTESTATION_STATUS_LABELS: Record<AttestationFournisseurStatus, string> = {
  VALIDE: 'Valide',
  EXPIRE_BIENTOT: 'Expire bientôt',
  EXPIRE: 'Expiré',
};

const FMT = new Intl.NumberFormat('fr-MA', {
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
});

interface AttestationDraft {
  type: AttestationFournisseurType;
  dateEmission: string;
  dateExpiration: string;
  scanUrl: string;
}

interface CatalogueDraft {
  articleId: string;
  refFournisseur: string;
  designation: string;
  prixUnitaireHt: number;
  uom: string;
  actif: boolean;
}

function emptyAttestationDraft(): AttestationDraft {
  return { type: 'CNSS', dateEmission: '', dateExpiration: '', scanUrl: '' };
}

function emptyCatalogueDraft(): CatalogueDraft {
  return {
    articleId: '',
    refFournisseur: '',
    designation: '',
    prixUnitaireHt: 0,
    uom: '',
    actif: true,
  };
}

@Component({
  selector: 'app-fournisseur-detail',
  standalone: true,
  imports: [
    ButtonComponent,CommonModule, FormsModule, ...ConfigDrivenDetailPageImports],
  templateUrl: './fournisseur-detail.page.html',
  styles: [
    ConfigDrivenDetailPageStyles,
    `
      .tabs {
        display: flex;
        gap: 0.25rem;
        padding: 0 0 0.75rem;
        border-bottom: 1px solid var(--nf-color-border);
        margin-bottom: 1rem;
      }
      .tab {
        padding: 0.45rem 0.9rem;
        border: none;
        background: transparent;
        color: var(--nf-color-text-secondary);
        font-size: 0.875rem;
        font-weight: 500;
        border-radius: 6px;
        cursor: pointer;
      }
      .tab:hover { background: var(--nf-color-bg-muted); color: var(--nf-text-primary); }
      .tab--active { background: var(--nf-color-success-50); color: var(--nf-color-teal-700, var(--nf-color-success-700)); }

      .panel { display: flex; flex-direction: column; gap: 1rem; }
      .panel__header {
        display: flex;
        align-items: center;
        justify-content: space-between;
        gap: 1rem;
      }
      .panel__title { margin: 0; font-size: 1rem; font-weight: 600; color: var(--nf-text-primary); }
      .panel__hint { margin: 0; font-size: 0.8rem; color: var(--nf-color-text-secondary); }

      .alert {
        padding: 0.65rem 0.85rem;
        border-radius: 6px;
        font-size: 0.85rem;
        border: 1px solid var(--nf-color-danger-200);
        background: var(--nf-color-danger-50);
        color: var(--nf-color-danger-700);
      }

      .chips {
        display: grid;
        grid-template-columns: repeat(auto-fill, minmax(140px, 1fr));
        gap: 0.5rem;
      }
      .chip {
        display: flex;
        flex-direction: column;
        gap: 0.15rem;
        padding: 0.55rem 0.65rem;
        border-radius: 8px;
        border: 1px solid var(--nf-color-border);
        background: var(--nf-color-surface);
        text-align: left;
        cursor: pointer;
      }
      .chip:hover { border-color: var(--nf-color-text-muted); }
      .chip__type { font-size: 0.72rem; font-weight: 600; color: var(--nf-color-text-secondary); text-transform: uppercase; }
      .chip__status { font-size: 0.8rem; font-weight: 600; }
      .chip--valid { border-color: var(--nf-color-success-200); background: var(--nf-color-success-50); }
      .chip--valid .chip__status { color: var(--nf-color-success-700); }
      .chip--soon { border-color: var(--nf-color-warning-200); background: var(--nf-color-warning-50); }
      .chip--soon .chip__status { color: var(--nf-color-warning-800); }
      .chip--expired { border-color: var(--nf-color-danger-200); background: var(--nf-color-danger-50); }
      .chip--expired .chip__status { color: var(--nf-color-danger-700); }

      .data-table {
        width: 100%;
        border-collapse: collapse;
        background: var(--nf-color-surface);
        border: 1px solid var(--nf-color-border);
        border-radius: 8px;
        overflow: hidden;
        font-size: 0.85rem;
      }
      .data-table th {
        padding: 0.65rem 0.85rem;
        background: var(--nf-color-bg-subtle);
        color: var(--nf-color-text-secondary);
        font-weight: 600;
        text-align: left;
        border-bottom: 1px solid var(--nf-color-border);
      }
      .data-table th.num, .data-table td.num { text-align: right; }
      .data-table td {
        padding: 0.6rem 0.85rem;
        border-bottom: 1px solid var(--nf-color-bg-muted);
        color: var(--nf-text-primary);
      }
      .data-table tbody tr:last-child td { border-bottom: none; }

      .badge {
        display: inline-block;
        padding: 2px 8px;
        border-radius: 4px;
        font-size: 0.72rem;
        font-weight: 600;
      }
      .badge--success { background: var(--nf-color-success-100); color: var(--nf-color-success-700); }
      .badge--warning { background: var(--nf-color-warning-100); color: var(--nf-color-warning-800); }
      .badge--danger { background: var(--nf-color-danger-100); color: var(--nf-color-danger-700); }
      .badge--muted { background: var(--nf-color-bg-muted); color: var(--nf-color-text-secondary); }

      .form-card {
        border: 1px solid var(--nf-color-border);
        border-radius: 8px;
        padding: 0.85rem;
        background: var(--nf-color-bg-subtle);
      }
      .form-card h4 { margin: 0 0 0.75rem; font-size: 0.9rem; color: var(--nf-text-primary); }
      .form-grid {
        display: grid;
        grid-template-columns: repeat(auto-fill, minmax(160px, 1fr));
        gap: 0.65rem;
      }
      .field { display: flex; flex-direction: column; gap: 0.25rem; }
      .field label { font-size: 0.72rem; font-weight: 600; color: var(--nf-color-text-secondary); }
      .field input, .field select {
        padding: 0.4rem 0.55rem;
        border: 1px solid var(--nf-color-border);
        border-radius: 6px;
        font-size: 0.85rem;
        background: var(--nf-color-surface);
      }
      .field--check { flex-direction: row; align-items: center; gap: 0.4rem; padding-top: 1.2rem; }
      .form-actions { display: flex; gap: 0.5rem; margin-top: 0.75rem; }
      .btn {
        padding: 0.4rem 0.75rem;
        border-radius: 6px;
        border: 1px solid var(--nf-color-border);
        background: var(--nf-color-surface);
        color: var(--nf-text-primary);
        font-size: 0.82rem;
        font-weight: 500;
        cursor: pointer;
      }
      .btn:hover { background: var(--nf-color-bg-subtle); }
      .btn--primary { background: var(--nf-color-teal-700, var(--nf-color-success-700)); border-color: var(--nf-color-teal-700, var(--nf-color-success-700)); color: var(--nf-color-surface); }
      .btn--primary:hover { background: var(--nf-color-teal-600, var(--nf-color-success-600)); }
      .btn--danger { color: var(--nf-color-danger-700); border-color: var(--nf-color-danger-200); }
      .btn--danger:hover { background: var(--nf-color-danger-50); }
      .btn--sm { padding: 0.25rem 0.5rem; font-size: 0.75rem; }

      .empty {
        padding: 1.25rem;
        text-align: center;
        color: var(--nf-color-text-secondary);
        font-size: 0.875rem;
        border: 1px dashed var(--nf-color-border);
        border-radius: 8px;
        background: var(--nf-color-surface);
      }
      .row-actions { display: flex; gap: 0.35rem; justify-content: flex-end; }
      .loading-inline { color: var(--nf-color-text-secondary); font-size: 0.85rem; padding: 0.5rem 0; }
    `,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class FournisseurDetailPage extends ConfigDrivenDetailPage<Fournisseur> {
  private readonly crud = inject(FournisseurFacade);
  private readonly partnersApi = inject(PartnersApiService);
  private readonly attestationsApi = inject(AttestationsFournisseurApiService);
  private readonly catalogueApi = inject(CatalogueFournisseurApiService);
  private readonly translate = inject(TranslateService);

  readonly facade = createDetailFacadeFromCrud<Fournisseur, FournisseurCreate>({
    crud: this.crud,
    lookups: () => this.crud.lookups(),
  });
  readonly config = buildFournisseurDetailConfig(this.translate);
  readonly tabs = TABS;
  readonly attestationTypes = ATTESTATION_TYPES;

  readonly partner = signal<Partner | null>(null);
  readonly activeTab = signal<DetailTab>('informations');
  readonly attestationStatus = signal<PartnerAttestationsStatus | null>(null);
  readonly attestations = signal<AttestationFournisseur[]>([]);
  readonly catalogue = signal<CatalogueFournisseurLigne[]>([]);
  readonly attestationsLoading = signal(false);
  readonly catalogueLoading = signal(false);
  attestationDraft: AttestationDraft = emptyAttestationDraft();
  catalogueDraft: CatalogueDraft = emptyCatalogueDraft();
  readonly editingAttestationId = signal<string | null>(null);
  readonly editingCatalogueId = signal<string | null>(null);

  readonly headerConfigOverride = computed((): PageHeaderConfig => {
    const base = super.headerConfig;
    const partner = this.partner();
    const item = this.item();
    const title =
      this.mode() === 'create'
        ? 'Nouveau fournisseur'
        : item
          ? `${item.code} — ${item.raisonSociale}`
          : partner
            ? `${partner.code} — ${partner.raisonSociale}`
            : base.title;

    const subtitleParts: string[] = [];
    const ice = partner?.ice ?? item?.ice;
    if (ice) subtitleParts.push(`ICE ${ice}`);
    if (partner?.isActive === false || item?.isActive === false) {
      subtitleParts.push('Inactif');
    }

    return {
      ...base,
      title,
      subtitle: subtitleParts.length ? subtitleParts.join(' · ') : base.subtitle,
    };
  });

  constructor() {
    super();
    effect(() => {
      const id = this.itemId();
      if (!id || this.mode() === 'create') {
        this.partner.set(null);
        return;
      }
      void this.partnersApi
        .getById(id)
        .then((p) => this.partner.set(p))
        .catch(() => this.partner.set(null));
    });

    effect(() => {
      const tab = this.activeTab();
      const id = this.itemId();
      if (!id || this.mode() === 'create') return;
      if (tab === 'attestations') void this.loadAttestations(id);
      if (tab === 'catalogue') void this.loadCatalogue(id);
    });
  }

  get headerTitle(): string {
    if (this.mode() === 'create') return this.translate.instant('achats.fournisseur.createTitle');
    const item = this.item();
    return item ? `${item.code} — ${item.raisonSociale}` : this.translate.instant('achats.fournisseur.detailTitle');
  }

  setTab(tab: DetailTab): void {
    this.activeTab.set(tab);
  }

  attestationTypeLabel(type: AttestationFournisseurType): string {
    return ATTESTATION_TYPE_LABELS[type] ?? type;
  }

  attestationStatusLabel(status: AttestationFournisseurStatus, present: boolean): string {
    if (!present) return 'Manquant';
    return ATTESTATION_STATUS_LABELS[status] ?? status;
  }

  attestationStatusClass(
    status: AttestationFournisseurStatus,
    present: boolean,
  ): Record<string, boolean> {
    return {
      'chip--expired': !present || status === 'EXPIRE',
      'chip--soon': present && status === 'EXPIRE_BIENTOT',
      'chip--valid': present && status === 'VALIDE',
    };
  }

  attestationBadgeClass(status: AttestationFournisseurStatus): Record<string, boolean> {
    return {
      'badge--success': status === 'VALIDE',
      'badge--warning': status === 'EXPIRE_BIENTOT',
      'badge--danger': status === 'EXPIRE',
    };
  }

  fmtPrice(value: number): string {
    return `${FMT.format(value)} MAD`;
  }

  selectChipType(type: AttestationFournisseurType): void {
    const existing = this.attestations().find((row) => row.type === type);
    if (existing) {
      this.startEditAttestation(existing);
      return;
    }
    this.editingAttestationId.set(null);
    this.attestationDraft = { ...emptyAttestationDraft(), type };
  }

  startEditAttestation(row: AttestationFournisseur): void {
    this.editingAttestationId.set(row.id);
    this.attestationDraft = {
      type: row.type,
      dateEmission: row.dateEmission,
      dateExpiration: row.dateExpiration,
      scanUrl: row.scanUrl ?? '',
    };
  }

  cancelAttestationForm(): void {
    this.editingAttestationId.set(null);
    this.attestationDraft = emptyAttestationDraft();
  }

  async saveAttestation(): Promise<void> {
    const partnerId = this.itemId();
    if (!partnerId) return;
    const draft = this.attestationDraft;
    if (!draft.dateEmission || !draft.dateExpiration) {
      this.showError('Dates émission et expiration requises');
      return;
    }

    const payload: AttestationFournisseurCreate = {
      partnerId,
      type: draft.type,
      dateEmission: draft.dateEmission,
      dateExpiration: draft.dateExpiration,
      scanUrl: draft.scanUrl.trim() || undefined,
    };

    try {
      const editId = this.editingAttestationId();
      if (editId) {
        await this.attestationsApi.update(editId, payload);
        this.showSuccess('Attestation mise à jour');
      } else {
        await this.attestationsApi.create(payload);
        this.showSuccess('Attestation créée');
      }
      this.cancelAttestationForm();
      await this.loadAttestations(partnerId);
    } catch {
      this.showError('Enregistrement attestation impossible');
    }
  }

  async deleteAttestation(row: AttestationFournisseur): Promise<void> {
    const partnerId = this.itemId();
    if (!partnerId) return;
    try {
      await this.attestationsApi.delete(row.id);
      this.showSuccess('Attestation supprimée');
      if (this.editingAttestationId() === row.id) this.cancelAttestationForm();
      await this.loadAttestations(partnerId);
    } catch {
      this.showError('Suppression impossible');
    }
  }

  startEditCatalogue(row: CatalogueFournisseurLigne): void {
    this.editingCatalogueId.set(row.id);
    this.catalogueDraft = {
      articleId: row.articleId,
      refFournisseur: row.refFournisseur ?? '',
      designation: row.designation,
      prixUnitaireHt: row.prixUnitaireHt,
      uom: row.uom ?? '',
      actif: row.actif,
    };
  }

  cancelCatalogueForm(): void {
    this.editingCatalogueId.set(null);
    this.catalogueDraft = emptyCatalogueDraft();
  }

  async saveCatalogue(): Promise<void> {
    const fournisseurId = this.itemId();
    if (!fournisseurId) return;
    const draft = this.catalogueDraft;
    if (!draft.articleId.trim() || !draft.designation.trim()) {
      this.showError('Article et désignation requis');
      return;
    }

    const payload: CatalogueFournisseurLigneCreate = {
      fournisseurId,
      articleId: draft.articleId.trim(),
      refFournisseur: draft.refFournisseur.trim() || undefined,
      designation: draft.designation.trim(),
      prixUnitaireHt: Number(draft.prixUnitaireHt) || 0,
      uom: draft.uom.trim() || undefined,
      actif: draft.actif,
    };

    try {
      const editId = this.editingCatalogueId();
      if (editId) {
        await this.catalogueApi.update(editId, payload);
        this.showSuccess('Ligne catalogue mise à jour');
      } else {
        await this.catalogueApi.create(payload);
        this.showSuccess('Ligne catalogue créée');
      }
      this.cancelCatalogueForm();
      await this.loadCatalogue(fournisseurId);
    } catch {
      this.showError('Enregistrement catalogue impossible');
    }
  }

  async deleteCatalogue(row: CatalogueFournisseurLigne): Promise<void> {
    const fournisseurId = this.itemId();
    if (!fournisseurId) return;
    try {
      await this.catalogueApi.delete(row.id);
      this.showSuccess('Ligne catalogue supprimée');
      if (this.editingCatalogueId() === row.id) this.cancelCatalogueForm();
      await this.loadCatalogue(fournisseurId);
    } catch {
      this.showError('Suppression impossible');
    }
  }

  private async loadAttestations(partnerId: string): Promise<void> {
    this.attestationsLoading.set(true);
    try {
      const [status, rows] = await Promise.all([
        this.attestationsApi.getPartnerStatus(partnerId),
        this.attestationsApi.listByPartner(partnerId),
      ]);
      this.attestationStatus.set(status);
      this.attestations.set(rows);
    } catch {
      this.attestationStatus.set(null);
      this.attestations.set([]);
      this.showError('Chargement attestations impossible');
    } finally {
      this.attestationsLoading.set(false);
    }
  }

  private async loadCatalogue(fournisseurId: string): Promise<void> {
    this.catalogueLoading.set(true);
    try {
      const res = await this.catalogueApi.getAll({ page: 0, pageSize: 500, fournisseurId });
      const rows = res.items;
      this.catalogue.set(rows);
    } catch {
      this.catalogue.set([]);
      this.showError('Chargement catalogue impossible');
    } finally {
      this.catalogueLoading.set(false);
    }
  }
}
