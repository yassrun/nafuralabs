import { CommonModule } from '@angular/common';
import {
  ChangeDetectionStrategy,
  Component,
  OnInit,
  computed,
  inject,
  signal,
} from '@angular/core';
import { FormsModule } from '@angular/forms';
import { DomSanitizer, SafeResourceUrl } from '@angular/platform-browser';
import { ActivatedRoute } from '@angular/router';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { firstValueFrom } from 'rxjs';

import { AuthFacade } from '@core/security/services/auth.facade';
import { ERP_ATTACHMENT_ENTITY_TYPES } from '@app/shared/config/attachment-detail.config';
import { DOCUMENT_CHANTIER_TYPE_KEYS } from '@app/shell/i18n-labels';
import type { Chantier } from '@app/chantiers/models';
import {
  ActionBarComponent,
  ButtonComponent,
  ConfirmDialogService,
  NfInputComponent,
  NfSelectComponent,
  PageHeaderComponent,
  PageShellComponent,
  PaginationComponent,
  ToastService,
  type NfSelectOption,
} from '@lib/anatomy';
import { FilterResetComponent } from '@lib/anatomy/components/molecules/filter-reset/filter-reset.component';
import { AttachmentApiService } from '@platform/features/collaboration/doc-manager/services/attachment-api.service';
import { ChantierApiService } from '../../services/chantier-api.service';
import type { DocumentChantier, DocumentChantierType } from '../models';
import { DocumentsApiService } from '../services/documents-api.service';
import {
  DOCUMENT_CATEGORIES,
  type DocumentCategory,
  countByCategory,
  typesForCategory,
} from '../utils/document-category.util';

type ViewMode = 'chantiers' | 'documents';

interface ChantierDocumentGroup {
  chantierId: string;
  code: string;
  name: string;
  documents: DocumentChantier[];
  previewDocuments: DocumentChantier[];
  categoryCounts: Record<DocumentCategory, number>;
}

const TYPE_ICONS: Record<DocumentChantierType, string> = {
  MARCHE: '📄',
  AVENANT: '📋',
  PV_RECEPTION: '✅',
  PLAN: '📐',
  PHOTO: '📷',
  BC: '🧾',
  FACTURE: '💰',
  ATTESTATION_ASSURANCE: '🛡️',
  CAUTION_BANCAIRE: '🏦',
  PPSPS: '⛑️',
  PLAN_PREVENTION: '⚠️',
  NOTE_CALCUL: '📊',
  AUTRE: '📎',
};

const CATEGORY_ICONS: Record<DocumentCategory, string> = {
  CONTRACTS: '📑',
  PLANS_STUDIES: '📐',
  EXECUTION: '🏗️',
  PURCHASES_FINANCE: '🧾',
  HSE_ADMIN: '🛡️',
  OTHER: '📁',
};

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
    NfSelectComponent,
    NfInputComponent,
    ActionBarComponent,
    PaginationComponent,
    TranslateModule,
  ],
  template: `
    <nf-page-shell scroll>
      <nf-page-header [config]="headerConfig" (actionClick)="onHeaderAction($event)"></nf-page-header>

      @if (routeChantierId() && selectedChantier(); as chantier) {
        <div class="scope-banner">
          <div>
            <span class="scope-label">{{ 'chantiers.documents.scope.label' | translate }}</span>
            <strong>{{ chantier.code }} — {{ chantier.name }}</strong>
          </div>
          <nf-button variant="ghost" size="sm" (clicked)="leaveChantierScope()">
            {{ 'chantiers.documents.scope.viewAll' | translate }}
          </nf-button>
        </div>
      }

      <div class="topbar">
        <div class="view-switch" role="tablist" [attr.aria-label]="'chantiers.documents.views.label' | translate">
          <nf-button
            role="tab"
            size="sm"
            [variant]="viewMode() === 'chantiers' ? 'primary' : 'ghost'"
            [attr.aria-selected]="viewMode() === 'chantiers'"
            (clicked)="viewMode.set('chantiers')">
            {{ 'chantiers.documents.views.byChantier' | translate }}
          </nf-button>
          <nf-button
            role="tab"
            size="sm"
            [variant]="viewMode() === 'documents' ? 'primary' : 'ghost'"
            [attr.aria-selected]="viewMode() === 'documents'"
            (clicked)="viewMode.set('documents')">
            {{ 'chantiers.documents.views.allDocuments' | translate }}
          </nf-button>
        </div>
      </div>

      <section class="filters" [attr.aria-label]="'chantiers.documents.filters.label' | translate">
        <nf-input
          class="search"
          type="search"
          name="search"
          [placeholder]="'chantiers.documents.filters.search' | translate"
          [ngModel]="search()"
          (ngModelChange)="onSearch($event)"
        />
        <nf-select
          name="filterChantier"
          [placeholder]="'chantiers.documents.filters.allChantiers' | translate"
          [options]="chantierFilterOptions()"
          [ngModel]="filterChantierId()"
          (ngModelChange)="setChantierFilter($event)"
        />
        <nf-select
          name="filterCategory"
          [placeholder]="'chantiers.documents.filters.allCategories' | translate"
          [options]="categoryFilterOptions()"
          [ngModel]="filterCategory()"
          (ngModelChange)="setCategoryFilter($event)"
        />
        <input type="date" [value]="dateFrom()" [attr.aria-label]="'chantiers.documents.filters.dateFrom' | translate"
          (change)="dateFrom.set($any($event.target).value); applyFilters()" />
        <input type="date" [value]="dateTo()" [attr.aria-label]="'chantiers.documents.filters.dateTo' | translate"
          (change)="dateTo.set($any($event.target).value); applyFilters()" />
        <nf-input
          type="search"
          name="uploadedBy"
          [placeholder]="'chantiers.documents.filters.uploadedBy' | translate"
          [ngModel]="uploadedBy()"
          (ngModelChange)="onUploadedBy($event)"
        />
        <span class="count">{{ 'chantiers.documents.count' | translate:{ count: total() } }}</span>
        <nf-filter-reset [active]="hasFilters()" (reset)="resetFilters()"></nf-filter-reset>
      </section>

      @if (showUploadForm()) {
        <section class="upload-panel">
          <div class="panel-heading">
            <h2>{{ 'chantiers.documents.create.title' | translate }}</h2>
            <nf-button
              variant="ghost"
              size="sm"
              icon="x"
              iconLibrary="lucide"
              (clicked)="closeUploadForm()"
              [attr.aria-label]="'chantiers.common.actions.cancel' | translate"
            ></nf-button>
          </div>
          <div class="form-grid">
            <nf-select
              name="chantierId"
              [label]="'chantiers.documents.create.fields.chantier' | translate"
              [placeholder]="'chantiers.documents.create.fields.chantierPlaceholder' | translate"
              [options]="chantierUploadOptions()"
              [(ngModel)]="uploadDraft.chantierId"
              [disabled]="!!routeChantierId()"
              [required]="true"
            />
            <nf-select
              name="type"
              [label]="'chantiers.documents.create.fields.type' | translate"
              [options]="typeUploadOptions()"
              [(ngModel)]="uploadDraft.type"
            />
            <nf-input
              name="titre"
              [label]="'chantiers.documents.create.fields.titre' | translate"
              [(ngModel)]="uploadDraft.titre"
              [required]="true"
            />
            <label>
              <span>{{ 'chantiers.documents.create.fields.file' | translate }}</span>
              <input class="field" type="file" (change)="onFileSelected($event)" required />
            </label>
          </div>
          <nf-action-bar align="right">
            <nf-button variant="secondary" (clicked)="closeUploadForm()">
              {{ 'chantiers.common.actions.cancel' | translate }}
            </nf-button>
            <nf-button variant="primary" [disabled]="uploading()" [loading]="uploading()" (clicked)="submitUpload()">
              {{ 'chantiers.documents.create.submit' | translate }}
            </nf-button>
          </nf-action-bar>
        </section>
      }

      @if (loading()) {
        <div class="state">{{ 'chantiers.documents.loading' | translate }}</div>
      } @else if (!documents().length) {
        <div class="state empty">
          <span>📂</span>
          <strong>{{ 'chantiers.documents.emptyState' | translate }}</strong>
          <p>{{ 'chantiers.documents.emptyHint' | translate }}</p>
        </div>
      } @else if (viewMode() === 'chantiers') {
        <div class="chantier-groups">
          @for (group of groups(); track group.chantierId) {
            <section class="chantier-section">
              <header>
                <div>
                  <span class="chantier-code">{{ group.code }}</span>
                  <h2>{{ group.name }}</h2>
                </div>
                <nf-button variant="ghost" size="sm" (clicked)="showChantierDocuments(group.chantierId)">
                  {{ 'chantiers.documents.actions.showAll' | translate:{ count: group.documents.length } }}
                </nf-button>
              </header>
              <div class="folder-grid">
                @for (category of categories; track category) {
                  @if (group.categoryCounts[category] > 0) {
                    <nf-button
                      variant="ghost"
                      size="sm"
                      class="folder-card"
                      [fullWidth]="true"
                      (clicked)="openCategory(group.chantierId, category)">
                      <span class="folder-icon">{{ categoryIcon(category) }}</span>
                      <span class="folder-meta">
                        <strong>{{ categoryLabel(category) }}</strong>
                        <small>{{ 'chantiers.documents.folderCount' | translate:{ count: group.categoryCounts[category] } }}</small>
                      </span>
                    </nf-button>
                  }
                }
              </div>
              <div class="recent-docs">
                @for (document of group.previewDocuments; track document.id) {
                  <nf-button variant="ghost" size="sm" class="recent-doc" (clicked)="preview(document)">
                    <span>{{ typeIcon(document.type) }}</span>
                    <span class="recent-meta">
                      <strong>{{ document.titre }}</strong>
                      <small>{{ document.uploadedAt | date:'dd/MM/yyyy' }}</small>
                    </span>
                  </nf-button>
                }
              </div>
            </section>
          }
        </div>
      } @else {
        <div class="table-wrap">
          <table>
            <thead>
              <tr>
                <th>{{ 'chantiers.documents.columns.document' | translate }}</th>
                <th>{{ 'chantiers.documents.columns.chantier' | translate }}</th>
                <th>{{ 'chantiers.documents.columns.category' | translate }}</th>
                <th>{{ 'chantiers.documents.columns.size' | translate }}</th>
                <th>{{ 'chantiers.documents.columns.uploadedBy' | translate }}</th>
                <th>{{ 'chantiers.documents.columns.date' | translate }}</th>
                <th><span class="sr-only">{{ 'chantiers.documents.columns.actions' | translate }}</span></th>
              </tr>
            </thead>
            <tbody>
              @for (document of documents(); track document.id) {
                <tr>
                  <td>
                    <nf-button variant="ghost" size="sm" class="document-title" (clicked)="preview(document)">
                      <span>{{ typeIcon(document.type) }}</span>
                      <span class="doc-meta">
                        <strong>{{ document.titre }}</strong>
                        <small>{{ document.fichier }}</small>
                      </span>
                    </nf-button>
                  </td>
                  <td>{{ document.chantierCode }}</td>
                  <td><span class="type-badge">{{ typeLabel(document.type) }}</span></td>
                  <td>{{ formatSize(document.taille) }}</td>
                  <td>{{ document.uploadedPar }}</td>
                  <td>{{ document.uploadedAt | date:'dd/MM/yyyy' }}</td>
                  <td class="actions-cell">
                    <div class="row-actions">
                      <nf-button variant="ghost" size="sm" (clicked)="preview(document)">
                        {{ 'chantiers.documents.actions.preview' | translate }}
                      </nf-button>
                      <nf-button variant="ghost" size="sm" (clicked)="downloadDoc(document)">
                        {{ 'attachments.download' | translate }}
                      </nf-button>
                      <nf-button variant="ghost" size="sm" (clicked)="renameDoc(document)">
                        {{ 'chantiers.documents.actions.rename' | translate }}
                      </nf-button>
                      <nf-button variant="danger" size="sm" (clicked)="deleteDoc(document)">
                        {{ 'chantiers.common.actions.delete' | translate }}
                      </nf-button>
                    </div>
                  </td>
                </tr>
              }
            </tbody>
          </table>
        </div>
      }

      @if (total() > 0) {
        <nf-pagination
          [total]="total()"
          [page]="page()"
          [pageSize]="pageSize"
          (pageChange)="onPagination($event)"
        />
      }

      @if (previewedDocument(); as document) {
        <div class="modal-backdrop" (click)="closePreview()">
          <section class="preview-modal" role="dialog" aria-modal="true"
            [attr.aria-label]="'chantiers.documents.actions.preview' | translate" (click)="$event.stopPropagation()">
            <header>
              <div><strong>{{ document.titre }}</strong><small>{{ document.fichier }}</small></div>
              <nf-button
                variant="ghost"
                size="sm"
                icon="x"
                iconLibrary="lucide"
                (clicked)="closePreview()"
              ></nf-button>
            </header>
            <div class="preview-body">
              @if (isImage(document)) {
                <img [src]="previewUrl()" [alt]="document.titre" />
              } @else if (isPdf(document)) {
                <iframe [src]="safePreviewUrl()" [title]="document.titre"></iframe>
              } @else {
                <div class="unsupported">
                  <span>{{ typeIcon(document.type) }}</span>
                  <p>{{ 'chantiers.documents.preview.unsupported' | translate }}</p>
                </div>
              }
            </div>
            <footer>
              <nf-button variant="secondary" iconLibrary="lucide" icon="download" (clicked)="downloadDoc(document)">
                {{ 'attachments.download' | translate }}
              </nf-button>
            </footer>
          </section>
        </div>
      }
    </nf-page-shell>
  `,
  styles: [`
    :host { display: block; height: 100%; }
    input.field { font: inherit; }
    .scope-banner, .topbar, .filters, .panel-heading, .chantier-section > header,
    .preview-modal > header, .preview-modal > footer { display: flex; align-items: center; }
    .scope-banner { justify-content: space-between; padding: .75rem 1rem; margin-bottom: 1rem; border: 1px solid var(--nf-color-primary-200); border-radius: .75rem; background: var(--nf-color-primary-50); }
    .scope-banner > div { display: grid; gap: .15rem; }
    .scope-label { color: var(--nf-color-text-secondary); font-size: .75rem; text-transform: uppercase; letter-spacing: .04em; }
    .topbar { justify-content: flex-start; gap: 1rem; margin-bottom: 1rem; }
    .view-switch { display: inline-flex; gap: .25rem; padding: 3px; border: 1px solid var(--nf-color-border); border-radius: .6rem; background: var(--nf-color-bg-muted); }
    .filters { gap: .6rem; flex-wrap: wrap; padding: .75rem; margin-bottom: 1rem; border: 1px solid var(--nf-color-border); border-radius: .75rem; background: var(--nf-color-surface); }
    .filters input[type="date"], .field { min-height: 38px; padding: .45rem .65rem; border: 1px solid var(--nf-color-border); border-radius: .45rem; background: var(--nf-color-surface); color: var(--nf-color-text-primary); }
    .filters .search { flex: 1 1 220px; min-width: 180px; }
    .filters .count { margin-inline-start: auto; color: var(--nf-color-text-secondary); font-size: .8rem; white-space: nowrap; }
    .upload-panel { padding: 1rem 1.25rem; margin-bottom: 1rem; border: 1px solid var(--nf-color-border); border-radius: .75rem; background: var(--nf-color-surface); }
    .panel-heading { justify-content: space-between; margin-bottom: 1rem; }
    .panel-heading h2 { margin: 0; font-size: 1rem; }
    .form-grid { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: .8rem; margin-bottom: 1rem; }
    .form-grid label { display: grid; gap: .35rem; color: var(--nf-color-text-secondary); font-size: .8rem; font-weight: 600; }
    .state { display: grid; place-items: center; min-height: 180px; color: var(--nf-color-text-secondary); }
    .state.empty { align-content: center; gap: .35rem; }
    .state.empty > span { font-size: 2rem; }
    .state.empty p { margin: 0; font-size: .85rem; }
    .chantier-groups { display: grid; gap: 1rem; }
    .chantier-section { padding: 1rem; border: 1px solid var(--nf-color-border); border-radius: .8rem; background: var(--nf-color-surface); }
    .chantier-section > header { justify-content: space-between; gap: 1rem; margin-bottom: .85rem; }
    .chantier-section h2 { display: inline; margin: 0 0 0 .45rem; font-size: 1rem; }
    .chantier-code { padding: .2rem .45rem; border-radius: .35rem; background: var(--nf-color-bg-muted); color: var(--nf-color-text-secondary); font-size: .72rem; font-weight: 700; }
    .folder-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(155px, 1fr)); gap: .65rem; }
    .folder-card {
      border: 1px solid var(--nf-color-border);
      border-radius: .6rem;
      background: var(--nf-color-bg-muted);
    }
    .folder-card:hover { border-color: var(--nf-color-primary-300); background: var(--nf-color-primary-50); }
    .folder-icon { font-size: 1.35rem; }
    .folder-meta, .recent-meta, .doc-meta, .preview-modal header div { display: grid; min-width: 0; text-align: start; }
    .folder-meta strong, .recent-meta strong, .doc-meta strong { overflow: hidden; text-overflow: ellipsis; white-space: nowrap; font-size: .82rem; }
    .folder-meta small, .recent-meta small, .doc-meta small, .preview-modal header small { color: var(--nf-color-text-muted); font-size: .72rem; }
    .recent-docs { display: grid; grid-template-columns: repeat(auto-fit, minmax(190px, 1fr)); gap: .5rem; margin-top: .85rem; padding-top: .85rem; border-top: 1px solid var(--nf-color-border); }
    .recent-doc { min-width: 0; justify-self: start; }
    .table-wrap { overflow: visible; border: 1px solid var(--nf-color-border); border-radius: .75rem; background: var(--nf-color-surface); }
    table { width: 100%; border-collapse: collapse; }
    th, td { padding: .7rem .8rem; text-align: start; border-bottom: 1px solid var(--nf-color-border); font-size: .8rem; }
    th { color: var(--nf-color-text-secondary); background: var(--nf-color-bg-muted); font-weight: 600; }
    tbody tr:last-child td { border-bottom: 0; }
    .document-title { max-width: 320px; }
    .type-badge { display: inline-block; padding: .15rem .4rem; border-radius: .35rem; background: var(--nf-color-bg-muted); white-space: nowrap; }
    .actions-cell { white-space: nowrap; }
    .row-actions { display: inline-flex; flex-wrap: wrap; gap: .15rem; align-items: center; }
    .modal-backdrop { position: fixed; z-index: 1000; inset: 0; display: grid; place-items: center; padding: 2rem; background: rgba(15, 23, 42, .55); }
    .preview-modal { width: min(900px, 96vw); height: min(720px, 90vh); display: grid; grid-template-rows: auto 1fr auto; overflow: hidden; border-radius: .8rem; background: var(--nf-color-surface); box-shadow: 0 24px 60px rgba(0, 0, 0, .25); }
    .preview-modal > header, .preview-modal > footer { justify-content: space-between; gap: 1rem; padding: .8rem 1rem; border-bottom: 1px solid var(--nf-color-border); }
    .preview-modal > footer { justify-content: flex-end; border-top: 1px solid var(--nf-color-border); border-bottom: 0; }
    .preview-body { min-height: 0; display: grid; place-items: center; background: var(--nf-color-bg-muted); }
    .preview-body img { max-width: 100%; max-height: 100%; object-fit: contain; }
    .preview-body iframe { width: 100%; height: 100%; border: 0; }
    .unsupported { text-align: center; color: var(--nf-color-text-secondary); }
    .unsupported span { font-size: 3rem; }
    .sr-only { position: absolute; width: 1px; height: 1px; padding: 0; margin: -1px; overflow: hidden; clip: rect(0,0,0,0); white-space: nowrap; border: 0; }
    @media (max-width: 800px) {
      .form-grid { grid-template-columns: 1fr; }
      .table-wrap { overflow-x: auto; }
      table { min-width: 760px; }
      .topbar { align-items: stretch; flex-direction: column; }
      .view-switch { align-self: flex-start; }
      .modal-backdrop { padding: .5rem; }
    }
  `],
})
export class DocumentsListingPage implements OnInit {
  private readonly api = inject(DocumentsApiService);
  private readonly attachmentApi = inject(AttachmentApiService);
  private readonly chantierApi = inject(ChantierApiService);
  private readonly translate = inject(TranslateService);
  private readonly toast = inject(ToastService);
  private readonly confirmDialog = inject(ConfirmDialogService);
  private readonly auth = inject(AuthFacade);
  private readonly route = inject(ActivatedRoute);
  private readonly sanitizer = inject(DomSanitizer);
  private searchTimer: ReturnType<typeof setTimeout> | undefined;
  private uploaderTimer: ReturnType<typeof setTimeout> | undefined;
  private selectedFile: File | null = null;

  readonly categories = DOCUMENT_CATEGORIES;
  readonly allTypes: DocumentChantierType[] = [
    'MARCHE', 'AVENANT', 'PV_RECEPTION', 'PLAN', 'PHOTO', 'BC', 'FACTURE',
    'ATTESTATION_ASSURANCE', 'CAUTION_BANCAIRE', 'PPSPS', 'PLAN_PREVENTION',
    'NOTE_CALCUL', 'AUTRE',
  ];

  readonly documents = signal<DocumentChantier[]>([]);
  readonly chantiers = signal<Chantier[]>([]);
  readonly loading = signal(true);
  readonly total = signal(0);
  readonly page = signal(1);
  pageSize = 48;
  readonly viewMode = signal<ViewMode>('chantiers');
  readonly routeChantierId = signal('');
  readonly filterChantierId = signal('');
  readonly filterCategory = signal<DocumentCategory | ''>('');
  readonly search = signal('');
  readonly uploadedBy = signal('');
  readonly dateFrom = signal('');
  readonly dateTo = signal('');
  readonly showUploadForm = signal(false);
  readonly uploading = signal(false);
  readonly previewedDocument = signal<DocumentChantier | null>(null);

  uploadDraft = {
    chantierId: '',
    type: 'AUTRE' as DocumentChantierType,
    titre: '',
  };

  readonly headerConfig = {
    title: this.translate.instant('chantiers.documents.title'),
    subtitle: this.translate.instant('chantiers.documents.subtitle'),
    breadcrumbs: [
      { label: this.translate.instant('chantiers.routes.chantiersCrumb'), route: '/chantiers' },
      { label: this.translate.instant('chantiers.documents.title') },
    ],
    primaryAction: {
      id: 'upload',
      label: this.translate.instant('chantiers.documents.create.cta'),
      icon: 'add',
    },
  };

  readonly selectedChantier = computed(() =>
    this.chantiers().find((chantier) => chantier.id === this.routeChantierId()),
  );

  readonly groups = computed<ChantierDocumentGroup[]>(() => {
    const byChantier = new Map<string, DocumentChantier[]>();
    for (const document of this.documents()) {
      const rows = byChantier.get(document.chantierId) ?? [];
      rows.push(document);
      byChantier.set(document.chantierId, rows);
    }
    return [...byChantier.entries()].map(([chantierId, documents]) => {
      const chantier = this.chantiers().find((item) => item.id === chantierId);
      return {
        chantierId,
        code: chantier?.code ?? documents[0]?.chantierCode ?? chantierId,
        name: chantier?.name ?? documents[0]?.chantierCode ?? chantierId,
        documents,
        previewDocuments: documents.slice(0, 4),
        categoryCounts: countByCategory(documents),
      };
    });
  });

  readonly totalPages = computed(() => Math.max(1, Math.ceil(this.total() / this.pageSize)));
  readonly hasFilters = computed(() =>
    !!this.search() || !!this.filterCategory() || !!this.uploadedBy() || !!this.dateFrom()
    || !!this.dateTo() || this.filterChantierId() !== this.routeChantierId(),
  );
  readonly previewUrl = computed(() => {
    const storageKey = this.previewedDocument()?.storageKey;
    return storageKey ? this.attachmentApi.getAttachmentDownloadUrl(storageKey) : '';
  });
  readonly safePreviewUrl = computed<SafeResourceUrl>(() =>
    this.sanitizer.bypassSecurityTrustResourceUrl(this.previewUrl()),
  );

  ngOnInit(): void {
    const chantierId = this.route.snapshot.queryParamMap.get('chantierId')?.trim() ?? '';
    this.routeChantierId.set(chantierId);
    this.filterChantierId.set(chantierId);
    void this.load();
  }

  chantierFilterOptions(): NfSelectOption[] {
    return [
      { value: '', label: this.translate.instant('chantiers.documents.filters.allChantiers') },
      ...this.chantiers().map((chantier) => ({
        value: chantier.id,
        label: `${chantier.code} — ${chantier.name}`,
      })),
    ];
  }

  categoryFilterOptions(): NfSelectOption[] {
    return [
      { value: '', label: this.translate.instant('chantiers.documents.filters.allCategories') },
      ...this.categories.map((category) => ({
        value: category,
        label: this.categoryLabel(category),
      })),
    ];
  }

  chantierUploadOptions(): NfSelectOption[] {
    return [
      {
        value: '',
        label: this.translate.instant('chantiers.documents.create.fields.chantierPlaceholder'),
      },
      ...this.chantiers().map((chantier) => ({
        value: chantier.id,
        label: `${chantier.code} — ${chantier.name}`,
      })),
    ];
  }

  typeUploadOptions(): NfSelectOption[] {
    return this.allTypes.map((type) => ({
      value: type,
      label: this.typeLabel(type),
    }));
  }

  private async load(): Promise<void> {
    this.loading.set(true);
    try {
      const [response, chantiers] = await Promise.all([
        this.api.list({
          page: this.page(),
          pageSize: this.pageSize,
          search: this.search(),
          chantierId: this.filterChantierId(),
          types: typesForCategory(this.filterCategory()),
          uploadedBy: this.uploadedBy(),
          dateFrom: this.dateFrom(),
          dateTo: this.dateTo(),
        }),
        this.chantiers().length
          ? Promise.resolve({ items: this.chantiers(), total: this.chantiers().length })
          : this.chantierApi.getAll({ page: 1, pageSize: 500 }),
      ]);
      this.documents.set(response.items);
      this.total.set(response.total);
      this.chantiers.set(chantiers.items);
    } catch {
      this.documents.set([]);
      this.total.set(0);
      this.toast.error(this.translate.instant('chantiers.documents.errors.loadFailed'));
    } finally {
      this.loading.set(false);
    }
  }

  onHeaderAction(event: { type: 'primary' | 'secondary'; action: { id?: string } }): void {
    if (event.action.id === 'upload') {
      this.openUploadForm();
    }
  }

  onSearch(value: string): void {
    this.search.set(value);
    clearTimeout(this.searchTimer);
    this.searchTimer = setTimeout(() => this.applyFilters(), 300);
  }

  onUploadedBy(value: string): void {
    this.uploadedBy.set(value);
    clearTimeout(this.uploaderTimer);
    this.uploaderTimer = setTimeout(() => this.applyFilters(), 300);
  }

  setChantierFilter(chantierId: string): void {
    this.filterChantierId.set(chantierId);
    this.applyFilters();
  }

  setCategoryFilter(category: DocumentCategory | ''): void {
    this.filterCategory.set(category);
    this.applyFilters();
  }

  applyFilters(): void {
    this.page.set(1);
    void this.load();
  }

  resetFilters(): void {
    this.search.set('');
    this.filterCategory.set('');
    this.uploadedBy.set('');
    this.dateFrom.set('');
    this.dateTo.set('');
    this.filterChantierId.set(this.routeChantierId());
    this.applyFilters();
  }

  leaveChantierScope(): void {
    this.routeChantierId.set('');
    this.filterChantierId.set('');
    this.applyFilters();
  }

  showChantierDocuments(chantierId: string): void {
    this.filterChantierId.set(chantierId);
    this.filterCategory.set('');
    this.viewMode.set('documents');
    this.applyFilters();
  }

  openCategory(chantierId: string, category: DocumentCategory): void {
    this.filterChantierId.set(chantierId);
    this.filterCategory.set(category);
    this.viewMode.set('documents');
    this.applyFilters();
  }

  onPagination(event: { page: number; pageSize: number }): void {
    if (event.pageSize !== this.pageSize) {
      this.pageSize = event.pageSize;
    }
    this.page.set(event.page);
    void this.load();
  }

  openUploadForm(): void {
    this.uploadDraft = {
      chantierId: this.routeChantierId() || this.filterChantierId() || this.chantiers()[0]?.id || '',
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
        this.attachmentApi.uploadAttachment(
          ERP_ATTACHMENT_ENTITY_TYPES.CHANTIER,
          chantierId,
          this.selectedFile,
        ),
      );
      await this.api.createForChantier(chantierId, {
        type,
        titre: titre.trim(),
        fichier: this.selectedFile.name,
        storageKey: uploaded?.fileUrl,
        taille: this.selectedFile.size,
        uploadedAt: todayIso(),
        uploadedPar: this.auth.displayName(),
      });
      this.toast.success(this.translate.instant('chantiers.documents.create.success'));
      this.closeUploadForm();
      this.page.set(1);
      await this.load();
    } catch {
      this.toast.error(this.translate.instant('chantiers.documents.create.errors.failed'));
    } finally {
      this.uploading.set(false);
    }
  }

  preview(document: DocumentChantier): void {
    if (!document.storageKey) {
      this.toast.warning(this.translate.instant('chantiers.documents.preview.unavailable'));
      return;
    }
    this.previewedDocument.set(document);
  }

  closePreview(): void {
    this.previewedDocument.set(null);
  }

  downloadDoc(document: DocumentChantier): void {
    if (!document.storageKey) return;
    const url = this.attachmentApi.getAttachmentDownloadUrl(document.storageKey);
    window.open(url, '_blank', 'noopener,noreferrer');
  }

  async renameDoc(document: DocumentChantier): Promise<void> {
    const values = await this.confirmDialog.prompt({
      title: this.translate.instant('chantiers.documents.actions.renamePrompt'),
      fields: [
        {
          key: 'titre',
          label: this.translate.instant('chantiers.documents.create.fields.titre'),
          initial: document.titre,
          required: true,
        },
      ],
      confirmLabel: this.translate.instant('chantiers.common.actions.save'),
      cancelLabel: this.translate.instant('chantiers.common.actions.cancel'),
    });
    const title = values?.['titre']?.trim();
    if (!title || title === document.titre) return;
    try {
      await this.api.updateForChantier(document.chantierId, document.id, { titre: title });
      await this.load();
      this.toast.success(this.translate.instant('chantiers.documents.actions.renamed'));
    } catch {
      this.toast.error(this.translate.instant('chantiers.documents.errors.updateFailed'));
    }
  }

  async deleteDoc(document: DocumentChantier): Promise<void> {
    const confirmed = await this.confirmDialog.confirm({
      title: this.translate.instant('chantiers.common.actions.delete'),
      message: this.translate.instant('chantiers.documents.actions.deleteConfirm', {
        title: document.titre,
      }),
      confirmLabel: this.translate.instant('chantiers.common.actions.delete'),
      cancelLabel: this.translate.instant('chantiers.common.actions.cancel'),
      variant: 'danger',
      icon: 'delete',
    });
    if (!confirmed) return;
    try {
      await this.api.deleteForChantier(document.chantierId, document.id);
      await this.load();
      this.toast.success(this.translate.instant('chantiers.documents.actions.deleted'));
    } catch {
      this.toast.error(this.translate.instant('chantiers.documents.errors.deleteFailed'));
    }
  }

  isImage(document: DocumentChantier): boolean {
    return /\.(png|jpe?g|gif|webp|bmp)$/i.test(document.fichier);
  }

  isPdf(document: DocumentChantier): boolean {
    return /\.pdf$/i.test(document.fichier);
  }

  categoryLabel(category: DocumentCategory): string {
    return this.translate.instant(`chantiers.documents.categories.${category}`);
  }

  categoryIcon(category: DocumentCategory): string {
    return CATEGORY_ICONS[category];
  }

  typeLabel(type: DocumentChantierType): string {
    return this.translate.instant(DOCUMENT_CHANTIER_TYPE_KEYS[type]);
  }

  typeIcon(type: DocumentChantierType): string {
    return TYPE_ICONS[type] ?? '📎';
  }

  formatSize = formatSize;
}
