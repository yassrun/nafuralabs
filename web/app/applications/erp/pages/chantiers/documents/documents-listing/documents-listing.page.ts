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
import { ERP_ATTACHMENT_ENTITY_TYPES } from '@applications/erp/shared/config/attachment-detail.config';
import { DOCUMENT_CHANTIER_TYPE_KEYS } from '@applications/erp/shell/i18n-labels';
import type { Chantier } from '@applications/erp/chantiers/models';
import { ButtonComponent, PageHeaderComponent, PageShellComponent, ToastService } from '@lib/anatomy';
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
    TranslateModule,
  ],
  template: `
    <nf-page-shell scroll>
      <nf-page-header [config]="headerConfig"></nf-page-header>

      @if (routeChantierId() && selectedChantier(); as chantier) {
        <div class="scope-banner">
          <div>
            <span class="scope-label">{{ 'chantiers.documents.scope.label' | translate }}</span>
            <strong>{{ chantier.code }} — {{ chantier.name }}</strong>
          </div>
          <button type="button" class="link-button" (click)="leaveChantierScope()">
            {{ 'chantiers.documents.scope.viewAll' | translate }}
          </button>
        </div>
      }

      <div class="topbar">
        <div class="view-switch" role="tablist" [attr.aria-label]="'chantiers.documents.views.label' | translate">
          <button type="button" role="tab" [class.active]="viewMode() === 'chantiers'"
            [attr.aria-selected]="viewMode() === 'chantiers'" (click)="viewMode.set('chantiers')">
            {{ 'chantiers.documents.views.byChantier' | translate }}
          </button>
          <button type="button" role="tab" [class.active]="viewMode() === 'documents'"
            [attr.aria-selected]="viewMode() === 'documents'" (click)="viewMode.set('documents')">
            {{ 'chantiers.documents.views.allDocuments' | translate }}
          </button>
        </div>
        <nf-button variant="primary" iconLibrary="lucide" icon="plus" (clicked)="openUploadForm()">
          {{ 'chantiers.documents.create.cta' | translate }}
        </nf-button>
      </div>

      <section class="filters" [attr.aria-label]="'chantiers.documents.filters.label' | translate">
        <input class="search" type="search" [placeholder]="'chantiers.documents.filters.search' | translate"
          [value]="search()" (input)="onSearch($any($event.target).value)" />
        <select [value]="filterChantierId()" (change)="setChantierFilter($any($event.target).value)">
          <option value="">{{ 'chantiers.documents.filters.allChantiers' | translate }}</option>
          @for (chantier of chantiers(); track chantier.id) {
            <option [value]="chantier.id">{{ chantier.code }} — {{ chantier.name }}</option>
          }
        </select>
        <select [value]="filterCategory()" (change)="setCategoryFilter($any($event.target).value)">
          <option value="">{{ 'chantiers.documents.filters.allCategories' | translate }}</option>
          @for (category of categories; track category) {
            <option [value]="category">{{ categoryLabel(category) }}</option>
          }
        </select>
        <input type="date" [value]="dateFrom()" [attr.aria-label]="'chantiers.documents.filters.dateFrom' | translate"
          (change)="dateFrom.set($any($event.target).value); applyFilters()" />
        <input type="date" [value]="dateTo()" [attr.aria-label]="'chantiers.documents.filters.dateTo' | translate"
          (change)="dateTo.set($any($event.target).value); applyFilters()" />
        <input type="search" [placeholder]="'chantiers.documents.filters.uploadedBy' | translate"
          [value]="uploadedBy()" (input)="onUploadedBy($any($event.target).value)" />
        <span class="count">{{ 'chantiers.documents.count' | translate:{ count: total() } }}</span>
        <nf-filter-reset [active]="hasFilters()" (reset)="resetFilters()"></nf-filter-reset>
      </section>

      @if (showUploadForm()) {
        <section class="upload-panel">
          <div class="panel-heading">
            <h2>{{ 'chantiers.documents.create.title' | translate }}</h2>
            <button type="button" class="icon-button" (click)="closeUploadForm()"
              [attr.aria-label]="'chantiers.common.actions.cancel' | translate">×</button>
          </div>
          <div class="form-grid">
            <label>
              <span>{{ 'chantiers.documents.create.fields.chantier' | translate }}</span>
              <select class="field" [(ngModel)]="uploadDraft.chantierId" name="chantierId"
                [disabled]="!!routeChantierId()" required>
                <option value="">{{ 'chantiers.documents.create.fields.chantierPlaceholder' | translate }}</option>
                @for (chantier of chantiers(); track chantier.id) {
                  <option [value]="chantier.id">{{ chantier.code }} — {{ chantier.name }}</option>
                }
              </select>
            </label>
            <label>
              <span>{{ 'chantiers.documents.create.fields.type' | translate }}</span>
              <select class="field" [(ngModel)]="uploadDraft.type" name="type">
                @for (type of allTypes; track type) {
                  <option [value]="type">{{ typeLabel(type) }}</option>
                }
              </select>
            </label>
            <label>
              <span>{{ 'chantiers.documents.create.fields.titre' | translate }}</span>
              <input class="field" type="text" [(ngModel)]="uploadDraft.titre" name="titre" required />
            </label>
            <label>
              <span>{{ 'chantiers.documents.create.fields.file' | translate }}</span>
              <input class="field" type="file" (change)="onFileSelected($event)" required />
            </label>
          </div>
          <div class="upload-actions">
            <nf-button variant="secondary" (clicked)="closeUploadForm()">
              {{ 'chantiers.common.actions.cancel' | translate }}
            </nf-button>
            <nf-button variant="primary" [disabled]="uploading()" (clicked)="submitUpload()">
              {{ 'chantiers.documents.create.submit' | translate }}
            </nf-button>
          </div>
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
                <button type="button" class="link-button" (click)="showChantierDocuments(group.chantierId)">
                  {{ 'chantiers.documents.actions.showAll' | translate:{ count: group.documents.length } }}
                </button>
              </header>
              <div class="folder-grid">
                @for (category of categories; track category) {
                  @if (group.categoryCounts[category] > 0) {
                    <button type="button" class="folder-card"
                      (click)="openCategory(group.chantierId, category)">
                      <span class="folder-icon">{{ categoryIcon(category) }}</span>
                      <span>
                        <strong>{{ categoryLabel(category) }}</strong>
                        <small>{{ 'chantiers.documents.folderCount' | translate:{ count: group.categoryCounts[category] } }}</small>
                      </span>
                    </button>
                  }
                }
              </div>
              <div class="recent-docs">
                @for (document of group.previewDocuments; track document.id) {
                  <button type="button" class="recent-doc" (click)="preview(document)">
                    <span>{{ typeIcon(document.type) }}</span>
                    <span>
                      <strong>{{ document.titre }}</strong>
                      <small>{{ document.uploadedAt | date:'dd/MM/yyyy' }}</small>
                    </span>
                  </button>
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
                    <button type="button" class="document-title" (click)="preview(document)">
                      <span>{{ typeIcon(document.type) }}</span>
                      <span><strong>{{ document.titre }}</strong><small>{{ document.fichier }}</small></span>
                    </button>
                  </td>
                  <td>{{ document.chantierCode }}</td>
                  <td><span class="type-badge">{{ typeLabel(document.type) }}</span></td>
                  <td>{{ formatSize(document.taille) }}</td>
                  <td>{{ document.uploadedPar }}</td>
                  <td>{{ document.uploadedAt | date:'dd/MM/yyyy' }}</td>
                  <td class="actions-cell">
                    <details>
                      <summary [attr.aria-label]="'chantiers.documents.columns.actions' | translate">⋮</summary>
                      <div class="action-menu">
                        <button type="button" (click)="preview(document)">{{ 'chantiers.documents.actions.preview' | translate }}</button>
                        <button type="button" (click)="downloadDoc(document)">{{ 'attachments.download' | translate }}</button>
                        <button type="button" (click)="renameDoc(document)">{{ 'chantiers.documents.actions.rename' | translate }}</button>
                        <button type="button" class="danger" (click)="deleteDoc(document)">{{ 'chantiers.common.actions.delete' | translate }}</button>
                      </div>
                    </details>
                  </td>
                </tr>
              }
            </tbody>
          </table>
        </div>
      }

      @if (totalPages() > 1) {
        <nav class="pagination" [attr.aria-label]="'chantiers.documents.pagination.label' | translate">
          <button type="button" [disabled]="page() === 1" (click)="changePage(page() - 1)">
            {{ 'chantiers.documents.pagination.previous' | translate }}
          </button>
          <span>{{ 'chantiers.documents.pagination.status' | translate:{ page: page(), pages: totalPages() } }}</span>
          <button type="button" [disabled]="page() === totalPages()" (click)="changePage(page() + 1)">
            {{ 'chantiers.documents.pagination.next' | translate }}
          </button>
        </nav>
      }

      @if (previewedDocument(); as document) {
        <div class="modal-backdrop" (click)="closePreview()">
          <section class="preview-modal" role="dialog" aria-modal="true"
            [attr.aria-label]="'chantiers.documents.actions.preview' | translate" (click)="$event.stopPropagation()">
            <header>
              <div><strong>{{ document.titre }}</strong><small>{{ document.fichier }}</small></div>
              <button type="button" class="icon-button" (click)="closePreview()">×</button>
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
    button, input, select { font: inherit; }
    .scope-banner, .topbar, .filters, .panel-heading, .upload-actions, .chantier-section > header,
    .preview-modal > header, .preview-modal > footer, .pagination { display: flex; align-items: center; }
    .scope-banner { justify-content: space-between; padding: .75rem 1rem; margin-bottom: 1rem; border: 1px solid var(--nf-color-primary-200, #bfdbfe); border-radius: .75rem; background: var(--nf-color-primary-50, #eff6ff); }
    .scope-banner > div { display: grid; gap: .15rem; }
    .scope-label { color: var(--nf-color-text-secondary); font-size: .75rem; text-transform: uppercase; letter-spacing: .04em; }
    .topbar { justify-content: space-between; gap: 1rem; margin-bottom: 1rem; }
    .view-switch { display: inline-flex; padding: 3px; border: 1px solid var(--nf-color-border); border-radius: .6rem; background: var(--nf-color-bg-muted); }
    .view-switch button { border: 0; border-radius: .45rem; padding: .45rem .8rem; color: var(--nf-color-text-secondary); background: transparent; cursor: pointer; }
    .view-switch button.active { color: var(--nf-color-text-primary); background: var(--nf-color-surface); box-shadow: 0 1px 3px rgba(0,0,0,.08); font-weight: 600; }
    .filters { gap: .6rem; flex-wrap: wrap; padding: .75rem; margin-bottom: 1rem; border: 1px solid var(--nf-color-border); border-radius: .75rem; background: var(--nf-color-surface); }
    .filters input, .filters select, .field { min-height: 38px; padding: .45rem .65rem; border: 1px solid var(--nf-color-border); border-radius: .45rem; background: var(--nf-color-surface); color: var(--nf-color-text-primary); }
    .filters .search { flex: 1 1 220px; }
    .filters .count { margin-inline-start: auto; color: var(--nf-color-text-secondary); font-size: .8rem; white-space: nowrap; }
    .link-button { padding: 0; border: 0; color: var(--nf-color-primary-600, #2563eb); background: transparent; cursor: pointer; font-weight: 600; }
    .upload-panel { padding: 1rem 1.25rem; margin-bottom: 1rem; border: 1px solid var(--nf-color-border); border-radius: .75rem; background: var(--nf-color-surface); }
    .panel-heading { justify-content: space-between; margin-bottom: 1rem; }
    .panel-heading h2 { margin: 0; font-size: 1rem; }
    .icon-button { border: 0; background: transparent; cursor: pointer; font-size: 1.4rem; color: var(--nf-color-text-secondary); }
    .form-grid { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: .8rem; }
    .form-grid label { display: grid; gap: .35rem; color: var(--nf-color-text-secondary); font-size: .8rem; font-weight: 600; }
    .upload-actions { justify-content: flex-end; gap: .5rem; margin-top: 1rem; }
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
    .folder-card { display: flex; align-items: center; gap: .65rem; padding: .7rem; text-align: start; border: 1px solid var(--nf-color-border); border-radius: .6rem; background: var(--nf-color-bg-muted); cursor: pointer; }
    .folder-card:hover { border-color: var(--nf-color-primary-300, #93c5fd); background: var(--nf-color-primary-50, #eff6ff); }
    .folder-icon { font-size: 1.35rem; }
    .folder-card span:last-child, .recent-doc span:last-child, .document-title span:last-child, .preview-modal header div { display: grid; min-width: 0; }
    .folder-card strong, .recent-doc strong, .document-title strong { overflow: hidden; text-overflow: ellipsis; white-space: nowrap; font-size: .82rem; }
    .folder-card small, .recent-doc small, .document-title small, .preview-modal header small { color: var(--nf-color-text-muted); font-size: .72rem; }
    .recent-docs { display: grid; grid-template-columns: repeat(auto-fit, minmax(190px, 1fr)); gap: .5rem; margin-top: .85rem; padding-top: .85rem; border-top: 1px solid var(--nf-color-border); }
    .recent-doc { display: flex; align-items: center; gap: .55rem; min-width: 0; padding: .4rem; border: 0; text-align: start; background: transparent; cursor: pointer; }
    .table-wrap { overflow: visible; border: 1px solid var(--nf-color-border); border-radius: .75rem; background: var(--nf-color-surface); }
    table { width: 100%; border-collapse: collapse; }
    th, td { padding: .7rem .8rem; text-align: start; border-bottom: 1px solid var(--nf-color-border); font-size: .8rem; }
    th { color: var(--nf-color-text-secondary); background: var(--nf-color-bg-muted); font-weight: 600; }
    tbody tr:last-child td { border-bottom: 0; }
    .document-title { display: flex; align-items: center; gap: .55rem; max-width: 320px; padding: 0; border: 0; text-align: start; background: transparent; cursor: pointer; }
    .type-badge { display: inline-block; padding: .15rem .4rem; border-radius: .35rem; background: var(--nf-color-bg-muted); white-space: nowrap; }
    .actions-cell { position: relative; width: 32px; }
    details summary { cursor: pointer; list-style: none; font-size: 1.2rem; }
    .action-menu { position: absolute; z-index: 5; inset-inline-end: .6rem; min-width: 150px; display: grid; padding: .3rem; border: 1px solid var(--nf-color-border); border-radius: .5rem; background: var(--nf-color-surface); box-shadow: 0 8px 24px rgba(0,0,0,.14); }
    .action-menu button { padding: .45rem .6rem; border: 0; border-radius: .3rem; text-align: start; background: transparent; cursor: pointer; }
    .action-menu button:hover { background: var(--nf-color-bg-muted); }
    .action-menu .danger { color: var(--nf-color-danger-600, #dc2626); }
    .pagination { justify-content: center; gap: 1rem; margin-top: 1rem; color: var(--nf-color-text-secondary); font-size: .82rem; }
    .pagination button { padding: .4rem .7rem; border: 1px solid var(--nf-color-border); border-radius: .4rem; background: var(--nf-color-surface); cursor: pointer; }
    .pagination button:disabled { opacity: .45; cursor: default; }
    .modal-backdrop { position: fixed; z-index: 1000; inset: 0; display: grid; place-items: center; padding: 2rem; background: rgba(15,23,42,.55); }
    .preview-modal { width: min(900px, 96vw); height: min(720px, 90vh); display: grid; grid-template-rows: auto 1fr auto; overflow: hidden; border-radius: .8rem; background: var(--nf-color-surface); box-shadow: 0 24px 60px rgba(0,0,0,.25); }
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
  readonly pageSize = 48;
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

  changePage(page: number): void {
    if (page < 1 || page > this.totalPages()) return;
    this.page.set(page);
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
    const title = window.prompt(
      this.translate.instant('chantiers.documents.actions.renamePrompt'),
      document.titre,
    )?.trim();
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
    const confirmed = window.confirm(
      this.translate.instant('chantiers.documents.actions.deleteConfirm', { title: document.titre }),
    );
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
