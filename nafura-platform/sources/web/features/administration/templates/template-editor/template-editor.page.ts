import { CommonModule } from '@angular/common';
import {
  Component,
  HostListener,
  inject,
  OnDestroy,
  OnInit,
  signal,
  viewChild,
  computed,
  DestroyRef,
} from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { ActivatedRoute, Router } from '@angular/router';
import { DomSanitizer, SafeResourceUrl } from '@angular/platform-browser';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatSlideToggleModule } from '@angular/material/slide-toggle';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { firstValueFrom } from 'rxjs';

import { CodeEditorComponent, PageHeaderComponent, PageShellComponent } from '@lib/anatomy';
import { ToastService } from '@lib/anatomy';
import type { CanComponentDeactivate } from '@core/guards/unsaved-changes.guard';

import type {
  PrintEntityType,
  PrintTemplate,
  TemplateRenderError,
  TemplateVariable,
} from '../models';
import { TemplatesApiService, TemplatesFacade } from '../services';
import {
  CreateTemplateDialogComponent,
  type CreateTemplateDialogData,
} from '../components/create-template-dialog.component';
import { TemplateVariablesSidebarComponent } from '../components';

const PAPER_SIZES = ['A4', 'Letter', 'Legal'];
const ORIENTATIONS = ['portrait', 'landscape'];
/** Long enough to not render on every keystroke, short enough to feel live. */
const PREVIEW_DEBOUNCE_MS = 400;

@Component({
  selector: 'app-template-editor-page',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    TranslateModule,
    MatButtonModule,
    MatDialogModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatSlideToggleModule,
    PageShellComponent,
    PageHeaderComponent,
    CodeEditorComponent,
    TemplateVariablesSidebarComponent,
  ],
  template: `
    <nf-page-shell>
      <nf-page-header [config]="headerConfig()"></nf-page-header>

      <div class="template-editor">
        @if (isSystem()) {
          <div class="template-editor__banner" role="status">
            <div>
              <strong>{{ 'administration.templates.editor.system' | translate }}</strong>
              <p>{{ 'administration.templates.editor.systemHint' | translate }}</p>
            </div>
            <button mat-flat-button color="primary" type="button" (click)="cloneCurrent()">
              {{ 'administration.templates.clone' | translate }}
            </button>
          </div>
        }

        <div class="template-editor__main">
          <div class="template-editor__form">
            <form [formGroup]="form" class="template-editor__meta">
              <mat-form-field appearance="outline">
                <mat-label>{{ 'administration.templates.fields.name' | translate }}</mat-label>
                <input matInput formControlName="name" [readonly]="isSystem()" />
              </mat-form-field>
              <mat-form-field appearance="outline">
                <mat-label>{{ 'administration.templates.fields.entityType' | translate }}</mat-label>
                <mat-select formControlName="entityType">
                  @for (et of entityTypes(); track et.code) {
                    <mat-option [value]="et.code">{{ et.labelKey | translate }}</mat-option>
                  }
                </mat-select>
                @if (entityTypes().length === 0) {
                  <mat-hint>{{ 'administration.templates.editor.noEntityTypes' | translate }}</mat-hint>
                }
              </mat-form-field>
            </form>

            @if (isDirty()) {
              <p class="template-editor__dirty" role="status">
                {{ 'administration.templates.editor.unsavedChanges' | translate }}
              </p>
            }

            @if (renderError(); as err) {
              <div class="template-editor__error" role="alert">
                <strong>{{ 'administration.templates.editor.renderError' | translate }}</strong>
                <p>{{ err.message }}</p>
                @if (err.line) {
                  <button type="button" class="template-editor__error-line" (click)="goToLine(err.line!)">
                    {{ 'administration.templates.editor.goToLine' | translate: { line: err.line } }}
                  </button>
                }
              </div>
            }

            <div class="template-editor__editor-row">
              <div class="template-editor__editor-wrap">
                <nf-code-editor
                  #codeEditor
                  [value]="templateBody()"
                  [disabled]="isSystem()"
                  [rows]="18"
                  placeholder="<div>HTML + Thymeleaf...</div>"
                  (valueChange)="onBodyChange($event)">
                </nf-code-editor>
              </div>
              <div class="template-editor__variables" [attr.aria-busy]="variablesLoading()">
                <app-template-variables-sidebar
                  [variables]="variables()"
                  (insertSnippet)="onInsertSnippet($event)">
                </app-template-variables-sidebar>
              </div>
            </div>

            <div class="template-editor__settings">
              <h4 class="template-editor__settings-title">{{ 'administration.templates.editor.settings' | translate }}</h4>
              <div class="template-editor__settings-row">
                <mat-form-field appearance="outline">
                  <mat-label>{{ 'administration.templates.paperSize' | translate }}</mat-label>
                  <mat-select formControlName="paperSize">
                    @for (p of paperSizes; track p) {
                      <mat-option [value]="p">{{ p }}</mat-option>
                    }
                  </mat-select>
                </mat-form-field>
                <mat-form-field appearance="outline">
                  <mat-label>{{ 'administration.templates.orientation' | translate }}</mat-label>
                  <mat-select formControlName="orientation">
                    @for (o of orientations; track o) {
                      <mat-option [value]="o">{{ o }}</mat-option>
                    }
                  </mat-select>
                </mat-form-field>
              </div>
              <p class="template-editor__logo-hint">
                {{ 'administration.templates.editor.logoHint' | translate }}
              </p>
              <div class="template-editor__actions">
                @if (!isSystem()) {
                  <button mat-flat-button color="primary" (click)="save()" [disabled]="form.invalid || saving()">
                    {{ 'administration.templates.editor.save' | translate }}
                  </button>
                }
                <button mat-button (click)="previewPdf()" [disabled]="previewLoading()">
                  {{ 'administration.templates.editor.previewPdf' | translate }}
                </button>
              </div>
            </div>
          </div>

          <div class="template-editor__preview">
            <div class="template-editor__preview-header">
              <span>{{ 'administration.templates.editor.preview' | translate }}</span>
              @if (previewLoading()) {
                <span class="template-editor__preview-status">
                  {{ 'administration.templates.editor.previewLoading' | translate }}
                </span>
              }
            </div>
            @if (safePreviewUrl()) {
              <iframe
                [src]="safePreviewUrl()"
                class="template-editor__preview-frame"
                title="PDF">
              </iframe>
            } @else if (previewHtml()) {
              <!-- Draft preview: sandboxed without allow-scripts. Rendered markup is data. -->
              <iframe
                [srcdoc]="previewHtml()"
                sandbox="allow-same-origin"
                class="template-editor__preview-frame"
                [title]="'administration.templates.editor.preview' | translate">
              </iframe>
            } @else {
              <p class="template-editor__preview-empty">{{ 'administration.templates.editor.previewEmpty' | translate }}</p>
            }
          </div>
        </div>
      </div>
    </nf-page-shell>
  `,
  styles: [
    `
      .template-editor { padding: 0 1rem 1rem; }
      .template-editor__banner {
        display: flex;
        align-items: center;
        justify-content: space-between;
        gap: 1rem;
        margin-bottom: 1rem;
        padding: 12px 16px;
        border: 1px solid var(--nf-border-default);
        border-radius: 8px;
        background: var(--nf-surface-subtle, #f6f6f6);
      }
      .template-editor__banner p {
        margin: 4px 0 0;
        font-size: 0.875rem;
        color: var(--nf-text-muted);
      }
      .template-editor__logo-hint {
        margin: 0.5rem 0 0;
        font-size: 0.8125rem;
        color: var(--nf-text-muted);
      }
      .template-editor__dirty {
        margin: 0;
        font-size: 0.8125rem;
        color: var(--nf-warning, #b45309);
      }
      .template-editor__main {
        display: grid;
        grid-template-columns: 1fr 400px;
        gap: 1.5rem;
        min-height: 560px;
      }
      .template-editor__form { display: flex; flex-direction: column; gap: 1rem; }
      .template-editor__meta {
        display: grid;
        grid-template-columns: 1fr 200px;
        gap: 1rem;
      }
      .template-editor__editor-row {
        display: grid;
        grid-template-columns: 1fr 260px;
        gap: 1rem;
      }
      .template-editor__editor-wrap { min-height: 320px; }
      .template-editor__variables { min-width: 0; }
      .template-editor__settings { border-top: 1px solid var(--nf-border-default); padding-top: 1rem; }
      .template-editor__settings-title { margin: 0 0 0.5rem 0; font-size: 0.875rem; }
      .template-editor__settings-row { display: flex; gap: 1rem; flex-wrap: wrap; }
      .template-editor__actions { display: flex; gap: 0.5rem; margin-top: 0.5rem; }
      .template-editor__preview {
        border: 1px solid var(--nf-border-default);
        border-radius: 8px;
        overflow: hidden;
        display: flex;
        flex-direction: column;
        background: var(--nf-surface-subtle);
      }
      .template-editor__preview-header { padding: 8px 12px; border-bottom: 1px solid var(--nf-border-default); font-size: 0.875rem; }
      .template-editor__preview-frame { flex: 1; min-height: 480px; border: none; }
      .template-editor__preview-loading, .template-editor__preview-empty { padding: 2rem; text-align: center; color: var(--nf-text-muted); }
    `,
  ],
})
export class TemplateEditorPage implements OnInit, OnDestroy, CanComponentDeactivate {
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly fb = inject(FormBuilder);
  private readonly facade = inject(TemplatesFacade);
  private readonly api = inject(TemplatesApiService);
  private readonly toast = inject(ToastService);
  private readonly i18n = inject(TranslateService);
  private readonly sanitizer = inject(DomSanitizer);
  private readonly dialog = inject(MatDialog);
  private readonly destroyRef = inject(DestroyRef);

  readonly codeEditor = viewChild<CodeEditorComponent>('codeEditor');

  readonly templateBody = signal('');
  readonly variables = signal<TemplateVariable[]>([]);
  readonly variablesLoading = signal(false);
  readonly saving = signal(false);
  readonly previewLoading = signal(false);
  readonly previewUrl = signal<string | null>(null);
  private objectUrl: string | null = null;

  /** Last saved/loaded state; `isDirty` is measured against it. */
  private readonly baseline = signal<EditorSnapshot | null>(null);
  /** Mirrors the form so dirtiness can be computed (form values are not signals). */
  private readonly formSnapshot = signal<Partial<EditorSnapshot>>({});

  readonly isDirty = computed(() => {
    const base = this.baseline();
    if (!base || this.isSystem()) return false;
    const current = { ...this.formSnapshot(), templateBody: this.templateBody() };
    return (
      current.name !== base.name ||
      current.entityType !== base.entityType ||
      current.paperSize !== base.paperSize ||
      current.orientation !== base.orientation ||
      current.templateBody !== base.templateBody
    );
  });

  readonly safePreviewUrl = computed<SafeResourceUrl | null>(() => {
    const url = this.previewUrl();
    return url ? this.sanitizer.bypassSecurityTrustResourceUrl(url) : null;
  });

  readonly isSystem = computed(() => (this.facade.current()?.isSystem ?? false));
  readonly entityTypes = signal<PrintEntityType[]>([]);

  /** Live HTML preview of the draft; the PDF is only produced on demand. */
  readonly previewHtml = signal<string>('');
  readonly renderError = signal<TemplateRenderError | null>(null);
  /** null = sample data; set = preview against that real record. */
  readonly sampleEntityId = signal<string | null>(null);
  private previewTimer: ReturnType<typeof setTimeout> | null = null;
  private previewAbort: AbortController | null = null;

  readonly form = this.fb.nonNullable.group({
    name: ['', [Validators.required, Validators.maxLength(200)]],
    entityType: ['', Validators.required],
    paperSize: ['A4'],
    orientation: ['portrait'],
    marginTop: [20],
    marginRight: [20],
    marginBottom: [20],
    marginLeft: [20],
  });

  readonly paperSizes = PAPER_SIZES;
  readonly orientations = ORIENTATIONS;

  readonly headerConfig = computed(() => {
    const current = this.facade.current();
    const title = current?.name ?? this.i18n.instant('administration.templates.editor.title');
    return {
      title,
      breadcrumbs: [
        { label: 'administration.templates.title', route: '/administration/templates' },
        { label: title },
      ],
    };
  });

  ngOnDestroy(): void {
    this.revokePreviewUrl();
    if (this.previewTimer) clearTimeout(this.previewTimer);
    this.previewAbort?.abort();
  }

  ngOnInit(): void {
    this.route.paramMap.pipe(takeUntilDestroyed(this.destroyRef)).subscribe((params) => {
      void this.loadTemplate(params.get('id'));
    });

    this.form.valueChanges.pipe(takeUntilDestroyed(this.destroyRef)).subscribe(() => {
      this.formSnapshot.set(this.form.getRawValue());
    });

    // The variable catalog is per entity type: reload it whenever the type changes,
    // otherwise the sidebar keeps advertising variables that no longer resolve.
    this.form.controls.entityType.valueChanges
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe((entityType) => {
        void this.reloadVariables(entityType);
      });
  }

  /** Used by `unsavedChangesGuard` on the route. */
  hasUnsavedChanges(): boolean {
    return this.isDirty();
  }

  @HostListener('window:keydown', ['$event'])
  onKeydown(event: KeyboardEvent): void {
    if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === 's') {
      event.preventDefault();
      if (!this.isSystem() && !this.saving()) void this.save();
    }
  }

  private async loadTemplate(id: string | null): Promise<void> {
    if (!id || id === 'new') {
      await this.router.navigate(['/administration/templates']);
      return;
    }
    const template = await this.facade.loadOne(id);
    if (!template) {
      this.toast.error(this.i18n.instant('administration.templates.loadError'));
      await this.router.navigate(['/administration/templates']);
      return;
    }
    // Silent patch: the catalog is loaded explicitly below, and the baseline is taken from
    // getRawValue(), so firing valueChanges here would only duplicate the request.
    this.form.patchValue(
      {
        name: template.name,
        entityType: template.entityType,
        paperSize: template.paperSize ?? 'A4',
        orientation: (template.orientation ?? 'portrait').toLowerCase(),
      },
      { emitEvent: false }
    );
    // Re-enable controls that may stay disabled after visiting a system template
    if (template.isSystem) {
      this.form.controls.name.disable({ emitEvent: false });
      this.form.controls.entityType.disable({ emitEvent: false });
      this.form.controls.paperSize.disable({ emitEvent: false });
      this.form.controls.orientation.disable({ emitEvent: false });
    } else {
      this.form.controls.name.enable({ emitEvent: false });
      this.form.controls.entityType.enable({ emitEvent: false });
      this.form.controls.paperSize.enable({ emitEvent: false });
      this.form.controls.orientation.enable({ emitEvent: false });
    }
    this.templateBody.set(template.templateBody ?? '');
    const types = await this.api.getEntityTypes().catch((): PrintEntityType[] => []);
    // A template may carry a type whose module is no longer installed: keep it selectable
    // so opening the template does not silently rewrite its type.
    const known = types.some((t) => t.code === template.entityType);
    this.entityTypes.set(
      template.entityType && !known
        ? [orphanEntityType(template.entityType), ...types]
        : types
    );
    this.markPristine();
    await this.reloadVariables(template.entityType);
    await this.refreshPreview();
  }


  /** Snapshot the current state as "saved", so `isDirty` reads false until the next edit. */
  private markPristine(): void {
    const raw = this.form.getRawValue();
    this.formSnapshot.set(raw);
    this.baseline.set({
      name: raw.name,
      entityType: raw.entityType,
      paperSize: raw.paperSize,
      orientation: raw.orientation,
      templateBody: this.templateBody(),
    });
  }

  private async reloadVariables(entityType: string | null | undefined): Promise<void> {
    if (!entityType) {
      this.variables.set([]);
      return;
    }
    this.variablesLoading.set(true);
    try {
      this.variables.set(await this.api.getVariables(entityType));
    } catch {
      this.variables.set([]);
    } finally {
      this.variablesLoading.set(false);
    }
  }

  onBodyChange(value: string): void {
    this.templateBody.set(value);
    this.schedulePreview();
  }

  onInsertSnippet(snippet: string): void {
    this.codeEditor()?.insertAtCursor(snippet);
  }

  async cloneCurrent(): Promise<void> {
    const current = this.facade.current();
    if (!current) return;
    const dialogRef = this.dialog.open(CreateTemplateDialogComponent, {
      width: '420px',
      data: { cloneFrom: current } satisfies CreateTemplateDialogData,
    });
    const created = (await firstValueFrom(dialogRef.afterClosed())) as PrintTemplate | undefined;
    if (created?.id) {
      this.toast.success(
        this.i18n.instant('administration.templates.cloneSuccess', { name: created.name })
      );
      await this.router.navigate(['/administration/templates', created.id]);
    }
  }

  async save(): Promise<void> {
    const current = this.facade.current();
    if (!current || current.isSystem) return;
    if (this.form.invalid) return;
    this.saving.set(true);
    try {
      await this.facade.update(current.id, {
        name: this.form.controls.name.value,
        entityType: this.form.controls.entityType.value,
        templateBody: this.templateBody(),
        paperSize: this.form.controls.paperSize.value,
        orientation: this.form.controls.orientation.value,
      });
      this.markPristine();
      this.toast.success(this.i18n.instant('administration.templates.saveSuccess'));
      await this.refreshPreview();
    } catch {
      this.toast.error(this.i18n.instant('administration.templates.saveError'));
    } finally {
      this.saving.set(false);
    }
  }

  /** Debounced live preview of the draft. Never renders a PDF: that is on demand only. */
  private schedulePreview(): void {
    if (this.previewTimer) clearTimeout(this.previewTimer);
    this.previewTimer = setTimeout(() => void this.refreshPreview(), PREVIEW_DEBOUNCE_MS);
  }

  async refreshPreview(): Promise<void> {
    const body = this.templateBody();
    const entityType = this.form.controls.entityType.value;
    if (!body.trim() || !entityType) {
      this.previewHtml.set('');
      return;
    }
    // Drop the render still in flight: only the latest keystroke matters.
    this.previewAbort?.abort();
    this.previewAbort = new AbortController();

    this.previewLoading.set(true);
    this.revokePreviewUrl();
    this.previewUrl.set(null);
    try {
      const html = await this.api.previewDraftHtml({
        templateBody: body,
        entityType,
        sampleEntityId: this.sampleEntityId() ?? undefined,
      });
      this.previewHtml.set(html);
      this.renderError.set(null);
    } catch (error) {
      this.renderError.set(toRenderError(error));
    } finally {
      this.previewLoading.set(false);
    }
  }

  /** Full-fidelity render, explicit only: it costs a Chromium conversion. */
  async previewPdf(): Promise<void> {
    const body = this.templateBody();
    const entityType = this.form.controls.entityType.value;
    if (!body.trim() || !entityType) return;
    this.previewLoading.set(true);
    try {
      const blob = await this.api.previewDraftPdf({
        templateBody: body,
        entityType,
        paperSize: this.form.controls.paperSize.value,
        orientation: this.form.controls.orientation.value,
        marginsCss: this.marginsCss(),
        sampleEntityId: this.sampleEntityId() ?? undefined,
      });
      this.revokePreviewUrl();
      this.objectUrl = URL.createObjectURL(blob);
      this.previewUrl.set(this.objectUrl);
      this.renderError.set(null);
    } catch (error) {
      this.renderError.set(toRenderError(error));
      this.toast.error(this.i18n.instant('administration.templates.editor.previewError'));
    } finally {
      this.previewLoading.set(false);
    }
  }

  /** Places the caret on the line the backend pointed at. */
  goToLine(line: number): void {
    this.codeEditor()?.revealLine(line);
  }

  private marginsCss(): string {
    const v = this.form.getRawValue();
    return `${v.marginTop}mm ${v.marginRight}mm ${v.marginBottom}mm ${v.marginLeft}mm`;
  }

  private revokePreviewUrl(): void {
    if (this.objectUrl) {
      URL.revokeObjectURL(this.objectUrl);
      this.objectUrl = null;
    }
  }
}

/**
 * A type no module declares any more. Shown with its raw code — there is no label to translate,
 * and hiding it would silently change the template's type on the next save.
 */
function orphanEntityType(code: string): PrintEntityType {
  return { code, labelKey: code, module: '', supportsRealPreview: false };
}

/** Unwrap the backend's TemplateRenderError, falling back to a generic message. */
function toRenderError(error: unknown): TemplateRenderError {
  const body = (error as { error?: unknown })?.error;
  if (body && typeof body === 'object' && 'message' in body) {
    return body as TemplateRenderError;
  }
  if (typeof body === 'string') {
    try {
      return JSON.parse(body) as TemplateRenderError;
    } catch {
      return { message: body, phase: 'PARSE' };
    }
  }
  return { message: String((error as Error)?.message ?? error), phase: 'PARSE' };
}

/** Editor state compared to detect unsaved changes. */
interface EditorSnapshot {
  name: string;
  entityType: string;
  paperSize: string;
  orientation: string;
  templateBody: string;
}
