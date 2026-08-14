import { CommonModule } from '@angular/common';
import { Component, DestroyRef, OnDestroy, computed, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatSlideToggleModule } from '@angular/material/slide-toggle';
import { MatTabsModule } from '@angular/material/tabs';
import { TranslateModule, TranslateService } from '@ngx-translate/core';

import { ConfirmDialogService, PageHeaderComponent, PageShellComponent, ToastService } from '@lib/anatomy';
import type { CanComponentDeactivate } from '@core/guards/unsaved-changes.guard';

import { TemplatesApiService } from '../templates/services';
import type { PrintEntityType } from '../templates/models';
import {
  HEADER_FIELDS,
  LINE_COLUMNS,
  type DocumentSettings,
  type HeaderField,
  type LineColumn,
} from './models/document-settings.model';
import { DocumentSettingsApiService } from './services/document-settings-api.service';

const PREVIEW_DEBOUNCE_MS = 400;
const PAPER_SIZES = ['A4', 'Letter', 'Legal'];
const ORIENTATIONS = ['portrait', 'landscape'];
/** Closed list: the PDF renderer only carries these families. */
const FONT_FAMILIES = ['sans-serif', 'serif'];

/**
 * What a customer uses to make documents theirs: logo, letterhead, legal identifiers, footer,
 * columns, page setup.
 *
 * No HTML, no Thymeleaf, no `${...}` anywhere on this screen. Free text takes `{{token}}`
 * placeholders inserted from a menu, and the server turns the whole thing into the shared header
 * and footer used by every document.
 */
@Component({
  selector: 'app-document-settings-page',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    TranslateModule,
    MatButtonModule,
    MatCheckboxModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatSlideToggleModule,
    MatTabsModule,
    PageShellComponent,
    PageHeaderComponent,
  ],
  template: `
    <nf-page-shell>
      <nf-page-header [config]="headerConfig()"></nf-page-header>

      @if (settings(); as s) {
        <div class="doc-settings">
          <div class="doc-settings__form">
            <mat-tab-group>
              <mat-tab [label]="'administration.documentSettings.tabs.header' | translate">
                <div class="doc-settings__section">
                  <mat-form-field appearance="outline">
                    <mat-label>{{ 'administration.documentSettings.header.layout' | translate }}</mat-label>
                    <mat-select [(ngModel)]="s.header.layout" (ngModelChange)="onChange()">
                      @for (l of layouts; track l) {
                        <mat-option [value]="l">
                          {{ 'administration.documentSettings.header.layouts.' + l | translate }}
                        </mat-option>
                      }
                    </mat-select>
                  </mat-form-field>

                  <mat-slide-toggle [(ngModel)]="s.header.showLogo" (ngModelChange)="onChange()">
                    {{ 'administration.documentSettings.header.showLogo' | translate }}
                  </mat-slide-toggle>
                  <p class="doc-settings__hint">
                    {{ 'administration.documentSettings.header.logoHint' | translate }}
                  </p>

                  <h4>{{ 'administration.documentSettings.header.fields' | translate }}</h4>
                  <div class="doc-settings__checks">
                    @for (f of headerFields; track f) {
                      <mat-checkbox
                        [checked]="s.header.fields.includes(f)"
                        (change)="toggleHeaderField(f, $event.checked)">
                        {{ 'administration.documentSettings.fields.' + f | translate }}
                      </mat-checkbox>
                    }
                  </div>
                </div>
              </mat-tab>

              <mat-tab [label]="'administration.documentSettings.tabs.footer' | translate">
                <div class="doc-settings__section">
                  <mat-form-field appearance="outline" class="doc-settings__full">
                    <mat-label>{{ 'administration.documentSettings.footer.text' | translate }}</mat-label>
                    <textarea
                      matInput
                      rows="4"
                      #footerText
                      [(ngModel)]="s.footer.text"
                      (ngModelChange)="onChange()"></textarea>
                    <mat-hint>{{ 'administration.documentSettings.footer.textHint' | translate }}</mat-hint>
                  </mat-form-field>

                  <div class="doc-settings__tokens">
                    <span>{{ 'administration.documentSettings.footer.insert' | translate }}</span>
                    <mat-form-field appearance="outline">
                      <mat-label>{{ 'administration.documentSettings.footer.value' | translate }}</mat-label>
                      <mat-select [(ngModel)]="selectedToken">
                        @for (t of tokens(); track t) {
                          <mat-option [value]="t">{{ t }}</mat-option>
                        }
                      </mat-select>
                    </mat-form-field>
                    <button mat-stroked-button type="button" [disabled]="!selectedToken"
                            (click)="insertToken(footerText)">
                      {{ 'administration.documentSettings.footer.insertAction' | translate }}
                    </button>
                  </div>

                  <mat-slide-toggle [(ngModel)]="s.footer.showLegalIdentifiers" (ngModelChange)="onChange()">
                    {{ 'administration.documentSettings.footer.showLegal' | translate }}
                  </mat-slide-toggle>
                  <mat-slide-toggle [(ngModel)]="s.footer.showPageNumber" (ngModelChange)="onChange()">
                    {{ 'administration.documentSettings.footer.showPageNumber' | translate }}
                  </mat-slide-toggle>
                </div>
              </mat-tab>

              <mat-tab [label]="'administration.documentSettings.tabs.lines' | translate">
                <div class="doc-settings__section">
                  <h4>{{ 'administration.documentSettings.lines.columns' | translate }}</h4>
                  <div class="doc-settings__checks">
                    @for (c of lineColumns; track c) {
                      <mat-checkbox
                        [checked]="s.lines.columns.includes(c)"
                        (change)="toggleColumn(c, $event.checked)">
                        {{ 'administration.documentSettings.columns.' + c | translate }}
                      </mat-checkbox>
                    }
                  </div>
                  <mat-slide-toggle [(ngModel)]="s.lines.showTva" (ngModelChange)="onChange()">
                    {{ 'administration.documentSettings.lines.showTva' | translate }}
                  </mat-slide-toggle>
                  <mat-slide-toggle [(ngModel)]="s.lines.showRemise" (ngModelChange)="onChange()">
                    {{ 'administration.documentSettings.lines.showRemise' | translate }}
                  </mat-slide-toggle>
                </div>
              </mat-tab>

              <mat-tab [label]="'administration.documentSettings.tabs.page' | translate">
                <div class="doc-settings__section">
                  <div class="doc-settings__row">
                    <mat-form-field appearance="outline">
                      <mat-label>{{ 'administration.templates.paperSize' | translate }}</mat-label>
                      <mat-select [(ngModel)]="s.page.paperSize" (ngModelChange)="onChange()">
                        @for (p of paperSizes; track p) {
                          <mat-option [value]="p">{{ p }}</mat-option>
                        }
                      </mat-select>
                    </mat-form-field>
                    <mat-form-field appearance="outline">
                      <mat-label>{{ 'administration.templates.orientation' | translate }}</mat-label>
                      <mat-select [(ngModel)]="s.page.orientation" (ngModelChange)="onChange()">
                        @for (o of orientations; track o) {
                          <mat-option [value]="o">{{ o }}</mat-option>
                        }
                      </mat-select>
                    </mat-form-field>
                  </div>
                  <div class="doc-settings__row">
                    @for (m of marginKeys; track m) {
                      <mat-form-field appearance="outline" class="doc-settings__margin">
                        <mat-label>
                          {{ 'administration.documentSettings.page.' + m | translate }}
                        </mat-label>
                        <input matInput type="number" min="0" max="60"
                               [ngModel]="marginValue(m)"
                               (ngModelChange)="setMargin(m, $event)" />
                        <span matTextSuffix>mm</span>
                      </mat-form-field>
                    }
                  </div>
                  <div class="doc-settings__row">
                    <mat-form-field appearance="outline">
                      <mat-label>{{ 'administration.documentSettings.appearance.font' | translate }}</mat-label>
                      <mat-select [(ngModel)]="s.appearance.fontFamily" (ngModelChange)="onChange()">
                        @for (f of fontFamilies; track f) {
                          <mat-option [value]="f">{{ f }}</mat-option>
                        }
                      </mat-select>
                    </mat-form-field>
                    <mat-form-field appearance="outline">
                      <mat-label>{{ 'administration.documentSettings.appearance.accent' | translate }}</mat-label>
                      <input matInput type="color" [(ngModel)]="s.appearance.accentColor"
                             (ngModelChange)="onChange()" />
                    </mat-form-field>
                  </div>
                </div>
              </mat-tab>
            </mat-tab-group>

            <div class="doc-settings__actions">
              <button mat-flat-button color="primary" (click)="save()" [disabled]="saving() || !isDirty()">
                {{ 'administration.documentSettings.save' | translate }}
              </button>
              <button mat-button (click)="reset()" [disabled]="saving()">
                {{ 'administration.documentSettings.reset' | translate }}
              </button>
              @if (isDirty()) {
                <span class="doc-settings__dirty">
                  {{ 'administration.templates.editor.unsavedChanges' | translate }}
                </span>
              }
            </div>
          </div>

          <div class="doc-settings__preview">
            <div class="doc-settings__preview-header">
              <mat-form-field appearance="outline" class="doc-settings__preview-type">
                <mat-label>{{ 'administration.documentSettings.previewOn' | translate }}</mat-label>
                <mat-select [(ngModel)]="previewType" (ngModelChange)="schedulePreview()">
                  @for (t of entityTypes(); track t.code) {
                    <mat-option [value]="t.code">{{ t.labelKey | translate }}</mat-option>
                  }
                </mat-select>
              </mat-form-field>
            </div>
            @if (previewHtml()) {
              <iframe
                [srcdoc]="previewHtml()"
                sandbox="allow-same-origin"
                class="doc-settings__preview-frame"
                [title]="'administration.templates.editor.preview' | translate">
              </iframe>
            } @else {
              <p class="doc-settings__preview-empty">
                {{ 'administration.documentSettings.previewEmpty' | translate }}
              </p>
            }
          </div>
        </div>
      }
    </nf-page-shell>
  `,
  styles: [
    `
      .doc-settings {
        display: grid;
        grid-template-columns: 1fr 460px;
        gap: 1.5rem;
        padding: 0 1rem 1rem;
      }
      @media (max-width: 1200px) {
        .doc-settings { grid-template-columns: 1fr; }
      }
      .doc-settings__section {
        display: flex;
        flex-direction: column;
        gap: 1rem;
        padding: 1rem 0.25rem;
      }
      .doc-settings__section h4 { margin: 0; font-size: 0.875rem; }
      .doc-settings__row { display: flex; gap: 1rem; flex-wrap: wrap; }
      .doc-settings__margin { width: 120px; }
      .doc-settings__full { width: 100%; }
      .doc-settings__checks {
        display: grid;
        grid-template-columns: repeat(auto-fill, minmax(180px, 1fr));
        gap: 0.5rem;
      }
      .doc-settings__tokens { display: flex; align-items: center; gap: 0.75rem; flex-wrap: wrap; }
      .doc-settings__hint { margin: 0; font-size: 0.8125rem; color: var(--nf-text-muted); }
      .doc-settings__actions {
        display: flex;
        align-items: center;
        gap: 0.75rem;
        padding-top: 1rem;
        border-top: 1px solid var(--nf-border-default);
      }
      .doc-settings__dirty { font-size: 0.8125rem; color: var(--nf-warning, #b45309); }
      .doc-settings__preview {
        border: 1px solid var(--nf-border-default);
        border-radius: 8px;
        overflow: hidden;
        display: flex;
        flex-direction: column;
        background: var(--nf-surface-subtle);
        min-height: 560px;
      }
      .doc-settings__preview-header { padding: 8px 12px; border-bottom: 1px solid var(--nf-border-default); }
      .doc-settings__preview-type { width: 100%; }
      .doc-settings__preview-frame { flex: 1; min-height: 480px; border: none; background: #fff; }
      .doc-settings__preview-empty { padding: 2rem; text-align: center; color: var(--nf-text-muted); }
    `,
  ],
})
export class DocumentSettingsPage implements OnDestroy, CanComponentDeactivate {
  private readonly api = inject(DocumentSettingsApiService);
  private readonly templatesApi = inject(TemplatesApiService);
  private readonly toast = inject(ToastService);
  private readonly i18n = inject(TranslateService);
  private readonly confirmDialog = inject(ConfirmDialogService);
  private readonly destroyRef = inject(DestroyRef);

  readonly settings = signal<DocumentSettings | null>(null);
  readonly tokens = signal<string[]>([]);
  readonly entityTypes = signal<PrintEntityType[]>([]);
  readonly previewHtml = signal<string>('');
  readonly saving = signal(false);

  /** Serialized snapshot of the last saved state; cheaper than a deep comparison per field. */
  private readonly baseline = signal<string>('');
  private readonly currentJson = signal<string>('');
  readonly isDirty = computed(() => !!this.baseline() && this.currentJson() !== this.baseline());

  previewType = '';
  selectedToken = '';

  readonly layouts = ['LOGO_LEFT', 'LOGO_CENTER', 'LOGO_RIGHT'];
  readonly headerFields = HEADER_FIELDS;
  readonly lineColumns = LINE_COLUMNS;
  readonly paperSizes = PAPER_SIZES;
  readonly orientations = ORIENTATIONS;
  readonly fontFamilies = FONT_FAMILIES;
  readonly marginKeys = ['marginTop', 'marginRight', 'marginBottom', 'marginLeft'] as const;

  private previewTimer: ReturnType<typeof setTimeout> | null = null;

  readonly headerConfig = computed(() => ({
    title: this.i18n.instant('administration.documentSettings.title'),
    breadcrumbs: [
      { label: 'administration.title', route: '/administration' },
      { label: 'administration.documentSettings.title' },
    ],
  }));

  constructor() {
    void this.load();
  }

  ngOnDestroy(): void {
    if (this.previewTimer) clearTimeout(this.previewTimer);
  }

  hasUnsavedChanges(): boolean {
    return this.isDirty();
  }

  private async load(): Promise<void> {
    const [settings, tokens, types] = await Promise.all([
      this.api.get(),
      this.api.getTokens().catch((): string[] => []),
      this.templatesApi.getEntityTypes().catch((): PrintEntityType[] => []),
    ]);
    this.settings.set(settings);
    this.tokens.set(tokens);
    this.entityTypes.set(types);
    this.previewType = types[0]?.code ?? '';
    this.markPristine();
    this.schedulePreview();
  }

  private markPristine(): void {
    const json = JSON.stringify(this.settings());
    this.baseline.set(json);
    this.currentJson.set(json);
  }

  onChange(): void {
    this.currentJson.set(JSON.stringify(this.settings()));
    this.schedulePreview();
  }

  toggleHeaderField(field: HeaderField, checked: boolean): void {
    const s = this.settings();
    if (!s) return;
    s.header.fields = checked
      ? [...s.header.fields, field]
      : s.header.fields.filter((f) => f !== field);
    this.onChange();
  }

  toggleColumn(column: LineColumn, checked: boolean): void {
    const s = this.settings();
    if (!s) return;
    // Keep the declared order rather than click order, so the table stays stable.
    s.lines.columns = checked
      ? LINE_COLUMNS.filter((c) => c === column || s.lines.columns.includes(c))
      : s.lines.columns.filter((c) => c !== column);
    this.onChange();
  }

  marginValue(key: (typeof this.marginKeys)[number]): number {
    return this.settings()?.page[key] ?? 0;
  }

  setMargin(key: (typeof this.marginKeys)[number], value: number): void {
    const s = this.settings();
    if (!s) return;
    s.page[key] = Number(value) || 0;
    this.onChange();
  }

  /** Inserts the placeholder at the caret; the administrator never types the braces. */
  insertToken(textarea: HTMLTextAreaElement): void {
    const s = this.settings();
    if (!s || !this.selectedToken) return;
    const snippet = `{{${this.selectedToken}}}`;
    const start = textarea.selectionStart ?? s.footer.text.length;
    const end = textarea.selectionEnd ?? start;
    s.footer.text = s.footer.text.slice(0, start) + snippet + s.footer.text.slice(end);
    this.onChange();
    queueMicrotask(() => {
      textarea.focus();
      const caret = start + snippet.length;
      textarea.setSelectionRange(caret, caret);
    });
  }

  async save(): Promise<void> {
    const s = this.settings();
    if (!s) return;
    this.saving.set(true);
    try {
      const saved = await this.api.save(s);
      this.settings.set(saved);
      this.markPristine();
      this.toast.success(this.i18n.instant('administration.documentSettings.saveSuccess'));
      this.schedulePreview();
    } catch {
      this.toast.error(this.i18n.instant('administration.documentSettings.saveError'));
    } finally {
      this.saving.set(false);
    }
  }

  async reset(): Promise<void> {
    const confirmed = await this.confirmDialog.confirm({
      title: this.i18n.instant('administration.documentSettings.resetTitle'),
      message: this.i18n.instant('administration.documentSettings.resetMessage'),
      confirmLabel: this.i18n.instant('administration.documentSettings.reset'),
      variant: 'danger',
    });
    if (!confirmed) return;
    this.saving.set(true);
    try {
      this.settings.set(await this.api.reset());
      this.markPristine();
      this.schedulePreview();
    } finally {
      this.saving.set(false);
    }
  }

  schedulePreview(): void {
    if (this.previewTimer) clearTimeout(this.previewTimer);
    this.previewTimer = setTimeout(() => void this.refreshPreview(), PREVIEW_DEBOUNCE_MS);
  }

  /**
   * Renders the default template of the selected type with the settings currently on screen —
   * unsaved ones included, otherwise the preview would show the state just changed away from.
   * The whole document is rendered, not the header in isolation, so the result is seen in context.
   */
  private async refreshPreview(): Promise<void> {
    const s = this.settings();
    if (!s || !this.previewType) {
      this.previewHtml.set('');
      return;
    }
    try {
      this.previewHtml.set(await this.api.preview(s, this.previewType));
    } catch {
      this.previewHtml.set('');
    }
  }
}
