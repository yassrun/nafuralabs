import { ChangeDetectionStrategy, Component, computed, inject, signal, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { firstValueFrom } from 'rxjs';
import { FilterResetComponent } from '@lib/anatomy/components/molecules/filter-reset/filter-reset.component';

import { ButtonComponent, PageHeaderComponent, PageShellComponent, ToastService } from '@lib/anatomy';
import { AttachmentApiService } from '@platform/features/collaboration/doc-manager/services/attachment-api.service';
import { ERP_ATTACHMENT_ENTITY_TYPES } from '@applications/erp/shared/config/attachment-detail.config';
import { AuthFacade } from '@core/security/services/auth.facade';
import { DocumentsApiService } from '../services/documents-api.service';
import type { DocumentChantier } from '../models';
import { DOCUMENT_CHANTIER_TYPE_KEYS } from '@applications/erp/shell/i18n-labels';
import { type DocumentChantierType } from '../models';
import type { Chantier } from '@applications/erp/chantiers/models';
import { ChantierApiService } from '../../services/chantier-api.service';

const TYPE_ICONS: Record<DocumentChantierType, string> = {
  MARCHE: '📄', AVENANT: '📋', PV_RECEPTION: '✅', PLAN: '📐',
  PHOTO: '📷', BC: '🧾', FACTURE: '💰',
  ATTESTATION_ASSURANCE: '🛡️', CAUTION_BANCAIRE: '🏦',
  PPSPS: '⛑️', PLAN_PREVENTION: '⚠️', NOTE_CALCUL: '📊',
  AUTRE: '📎',
};

const ALL_TYPES: DocumentChantierType[] = [
  'MARCHE', 'AVENANT', 'PV_RECEPTION', 'PLAN', 'PHOTO', 'BC', 'FACTURE',
  'ATTESTATION_ASSURANCE', 'CAUTION_BANCAIRE', 'PPSPS', 'PLAN_PREVENTION', 'NOTE_CALCUL',
  'AUTRE',
];

function formatSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} o`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} Ko`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} Mo`;
}

function todayIso(): string {
  return new Date().toISOString().slice(0, 10);
}

@Component({
  selector: 'app-documents-listing',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    CommonModule,
    FormsModule,
    PageShellComponent,
    PageHeaderComponent,
    FilterResetComponent,
    ButtonComponent,
    TranslateModule,
  ],
  template: `
    <nf-page-shell scroll>
      <nf-page-header [config]="headerConfig"></nf-page-header>

      <div class="toolbar">
        <input class="search" type="search" placeholder="Titre, chantier, type…"
          [value]="search()" (input)="search.set($any($event.target).value)" />
        <select [value]="filterType()" (change)="filterType.set($any($event.target).value)">
          <option value="">{{ 'chantiers.documents.filters.allTypes' | translate }}</option>
          @for (entry of typeEntries(); track entry[0]) {
            <option [value]="entry[0]">{{ entry[1] }}</option>
          }
        </select>
        <span class="count">{{ filtered().length <= 1 ? filtered().length + ' document' : filtered().length + ' documents' }}</span>
        <nf-filter-reset [active]="hasFilter()" (reset)="resetFilters()"></nf-filter-reset>
        <nf-button variant="primary" iconLibrary="lucide" icon="plus" (clicked)="openUploadForm()">
          {{ 'chantiers.documents.create.cta' | translate }}
        </nf-button>
      </div>

      @if (showUploadForm()) {
        <div class="upload-panel">
          <h3>{{ 'chantiers.documents.create.title' | translate }}</h3>
          <label>{{ 'chantiers.documents.create.fields.chantier' | translate }}</label>
          <select class="fld" [(ngModel)]="uploadDraft.chantierId" name="chantierId" required>
            <option value="">{{ 'chantiers.documents.create.fields.chantierPlaceholder' | translate }}</option>
            @for (c of chantiers(); track c.id) {
              <option [value]="c.id">{{ c.code }} — {{ c.name }}</option>
            }
          </select>
          <label>{{ 'chantiers.documents.create.fields.type' | translate }}</label>
          <select class="fld" [(ngModel)]="uploadDraft.type" name="type">
            @for (entry of typeEntries(); track entry[0]) {
              <option [value]="entry[0]">{{ entry[1] }}</option>
            }
          </select>
          <label>{{ 'chantiers.documents.create.fields.titre' | translate }}</label>
          <input class="fld" type="text" [(ngModel)]="uploadDraft.titre" name="titre" required />
          <label>{{ 'chantiers.documents.create.fields.file' | translate }}</label>
          <input class="fld" type="file" (change)="onFileSelected($event)" required />
          <div class="upload-actions">
            <nf-button variant="secondary" (clicked)="closeUploadForm()">
              {{ 'chantiers.common.actions.cancel' | translate }}
            </nf-button>
            <nf-button variant="primary" [disabled]="uploading()" (clicked)="submitUpload()">
              {{ 'chantiers.documents.create.submit' | translate }}
            </nf-button>
          </div>
        </div>
      }

      <div class="docs-grid">
        @for (doc of filtered(); track doc.id) {
          <article class="doc-card">
            <div class="doc-icon">{{ typeIcon(doc.type) }}</div>
            <div class="doc-body">
              <p class="doc-titre">{{ doc.titre }}</p>
              <p class="doc-meta">
                <span class="badge-type">{{ typeLabel(doc.type) }}</span>
                <span class="sep">·</span>
                <strong>{{ doc.chantierCode }}</strong>
                <span class="sep">·</span>
                {{ formatSize(doc.taille) }}
              </p>
              <p class="doc-date">{{ 'chantiers.documents.fields.deposeLeBy' | translate:{ date: (doc.uploadedAt | date:'dd/MM/yyyy'), user: doc.uploadedPar } }}</p>
              @if (doc.storageKey) {
                <nf-button variant="secondary" size="sm" iconLibrary="lucide" icon="download" (clicked)="downloadDoc(doc)">
                  {{ 'attachments.download' | translate }}
                </nf-button>
              }
            </div>
          </article>
        } @empty {
          <p class="empty">{{ 'chantiers.documents.emptyState' | translate }}</p>
        }
      </div>
    </nf-page-shell>
  `,
  styles: [`
    :host { display: block; height: 100%; }
    .toolbar { display: flex; gap: 10px; align-items: center; margin-bottom: 16px; flex-wrap: wrap; }
    .search { flex: 1; min-width: 180px; max-width: 320px; padding: 7px 12px; border: 1px solid var(--nf-color-border); border-radius: 6px; font-size: 13px; }
    select { padding: 7px 10px; border: 1px solid var(--nf-color-border); border-radius: 6px; font-size: 13px; background: var(--nf-color-surface); cursor: pointer; }
    .count { font-size: 13px; color: var(--nf-color-text-secondary); }
    .upload-panel {
      background: var(--nf-color-surface); border: 1px solid var(--nf-color-border); border-radius: 0.75rem;
      padding: 1rem 1.25rem; margin-bottom: 16px; display: grid; gap: 0.5rem;
    }
    .upload-panel h3 { margin: 0 0 0.25rem; font-size: 0.95rem; color: var(--nf-text-primary); }
    .upload-panel label { font-size: 0.8rem; font-weight: 600; color: var(--nf-color-text-secondary); }
    .fld { width: 100%; padding: 7px 10px; border: 1px solid var(--nf-color-border); border-radius: 6px; font-size: 13px; }
    .upload-actions { display: flex; gap: 8px; justify-content: flex-end; margin-top: 0.5rem; }
    .docs-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(300px, 1fr)); gap: 0.875rem; }
    .doc-card { display: flex; gap: 0.875rem; padding: 0.875rem 1rem; background: var(--nf-color-surface); border: 1px solid var(--nf-color-border); border-radius: 0.75rem; cursor: default; transition: box-shadow 120ms; }
    .doc-card:hover { box-shadow: 0 2px 8px rgba(0,0,0,0.08); }
    .doc-icon { font-size: 1.75rem; flex-shrink: 0; }
    .doc-body { min-width: 0; }
    .doc-titre { margin: 0 0 0.3rem; font-size: 0.9rem; font-weight: 600; color: var(--nf-color-text-primary); overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
    .doc-meta { margin: 0 0 0.2rem; display: flex; gap: 0.4rem; align-items: center; flex-wrap: wrap; font-size: 0.8rem; color: var(--nf-color-text-secondary); }
    .doc-date { margin: 0; font-size: 0.75rem; color: var(--nf-color-text-muted); }
    .badge-type { background: var(--nf-color-bg-muted); color: var(--nf-color-text-secondary); padding: 1px 6px; border-radius: 4px; font-size: 0.72rem; font-weight: 600; }
    .sep { color: var(--nf-color-border); }
    .empty { grid-column: 1 / -1; text-align: center; padding: 3rem; color: var(--nf-color-text-muted); }
  `],
})
export class DocumentsListingPage implements OnInit {
  private readonly api = inject(DocumentsApiService);
  private readonly attachmentApi = inject(AttachmentApiService);
  private readonly chantierApi = inject(ChantierApiService);
  private readonly translate = inject(TranslateService);
  private readonly toast = inject(ToastService);
  private readonly auth = inject(AuthFacade);

  private readonly documents = signal<DocumentChantier[]>([]);
  readonly chantiers = signal<Chantier[]>([]);
  readonly showUploadForm = signal(false);
  readonly uploading = signal(false);
  private selectedFile: File | null = null;

  uploadDraft = {
    chantierId: '',
    type: 'AUTRE' as DocumentChantierType,
    titre: '',
  };

  readonly search = signal('');
  readonly filterType = signal<DocumentChantierType | ''>('');

  readonly headerConfig = {
    title: this.translate.instant('chantiers.documents.title'),
    subtitle: 'Tous les documents liés aux chantiers',
    breadcrumbs: [
      { label: this.translate.instant('chantiers.routes.chantiersCrumb'), route: '/chantiers' },
      { label: this.translate.instant('chantiers.routes.documentsCrumb') },
    ],
  };

  private trEnum(t: DocumentChantierType): string {
    const key = (DOCUMENT_CHANTIER_TYPE_KEYS as Record<string, string>)[t];
    if (!key) return t;
    const resolved = this.translate.instant(key);
    return resolved === key ? t : resolved;
  }

  readonly typeEntries = computed<[DocumentChantierType, string][]>(() => ALL_TYPES.map((t) => [t, this.trEnum(t)]));

  ngOnInit(): void {
    void this.load();
  }

  private async load(): Promise<void> {
    try {
      const [docs, chantiers] = await Promise.all([
        this.api.getAll(),
        this.chantierApi.getAll(),
      ]);
      this.documents.set(docs.items);
      this.chantiers.set(chantiers.items);
    } catch {
      this.documents.set([]);
      this.chantiers.set([]);
    }
  }

  openUploadForm(): void {
    this.uploadDraft = {
      chantierId: this.chantiers()[0]?.id ?? '',
      type: 'AUTRE',
      titre: '',
    };
    this.selectedFile = null;
    this.showUploadForm.set(true);
  }

  closeUploadForm(): void {
    this.showUploadForm.set(false);
    this.selectedFile = null;
  }

  onFileSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    this.selectedFile = input.files?.[0] ?? null;
    if (this.selectedFile && !this.uploadDraft.titre.trim()) {
      this.uploadDraft.titre = this.selectedFile.name.replace(/\.[^.]+$/, '');
    }
  }

  async submitUpload(): Promise<void> {
    const { chantierId, type, titre } = this.uploadDraft;
    if (!chantierId || !titre.trim() || !this.selectedFile) {
      this.toast.error(this.translate.instant('chantiers.documents.create.errors.required'));
      return;
    }
    this.uploading.set(true);
    try {
      const uploaded = await firstValueFrom(
        this.attachmentApi.uploadAttachment(ERP_ATTACHMENT_ENTITY_TYPES.CHANTIER, chantierId, this.selectedFile),
      );
      const doc = await this.api.createForChantier(chantierId, {
        type,
        titre: titre.trim(),
        fichier: this.selectedFile.name,
        storageKey: uploaded?.fileUrl,
        taille: this.selectedFile.size,
        uploadedAt: todayIso(),
        uploadedPar: this.auth.displayName(),
      });
      this.documents.update((list) => [doc, ...list]);
      this.toast.success(this.translate.instant('chantiers.documents.create.success'));
      this.closeUploadForm();
    } catch {
      this.toast.error(this.translate.instant('chantiers.documents.create.errors.failed'));
    } finally {
      this.uploading.set(false);
    }
  }

  readonly filtered = computed(() => {
    const q = this.search().toLowerCase().trim();
    const t = this.filterType();
    let all = this.documents();
    if (t) all = all.filter(d => d.type === t);
    if (!q) return all;
    return all.filter(d =>
      d.titre.toLowerCase().includes(q) ||
      d.chantierCode.toLowerCase().includes(q) ||
      this.trEnum(d.type).toLowerCase().includes(q),
    );
  });

  typeLabel(t: DocumentChantierType): string { return this.trEnum(t); }
  typeIcon(t: DocumentChantierType): string { return TYPE_ICONS[t] ?? '📎'; }
  formatSize = formatSize;
  readonly hasFilter = computed(() => !!this.search() || !!this.filterType());

  resetFilters(): void {
    this.search.set('');
    this.filterType.set('');
  }

  downloadDoc(doc: DocumentChantier): void {
    if (!doc.storageKey) return;
    const url = this.attachmentApi.getAttachmentDownloadUrl(doc.storageKey);
    window.open(url, '_blank', 'noopener,noreferrer');
  }
}
