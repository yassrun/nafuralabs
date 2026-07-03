import { CommonModule } from '@angular/common';
import { Component, inject, OnInit, signal, viewChild, computed } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { DomSanitizer, SafeResourceUrl } from '@angular/platform-browser';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatSlideToggleModule } from '@angular/material/slide-toggle';
import { TranslateModule, TranslateService } from '@ngx-translate/core';

import { CodeEditorComponent, PageHeaderComponent, PageShellComponent } from '@lib/anatomy';
import { ToastService } from '@lib/anatomy';

import type { PrintTemplate, TemplateVariable } from '../models';
import { TemplatesApiService, TemplatesFacade } from '../services';
import { TemplateVariablesSidebarComponent } from '../components';

const PAPER_SIZES = ['A4', 'Letter', 'Legal'];
const ORIENTATIONS = ['Portrait', 'Landscape'];

@Component({
  selector: 'app-template-editor-page',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    TranslateModule,
    MatButtonModule,
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
        <div class="template-editor__main">
          <div class="template-editor__form">
            <form [formGroup]="form" class="template-editor__meta">
              <mat-form-field appearance="outline">
                <mat-label>{{ 'administration.templates.fields.name' | translate }}</mat-label>
                <input matInput formControlName="name" [readonly]="isSystem()" />
              </mat-form-field>
              <mat-form-field appearance="outline">
                <mat-label>{{ 'administration.templates.fields.entityType' | translate }}</mat-label>
                <mat-select formControlName="entityType" [disabled]="isSystem()">
                  @for (et of entityTypes(); track et) {
                    <mat-option [value]="et">{{ et }}</mat-option>
                  }
                </mat-select>
              </mat-form-field>
            </form>

            <div class="template-editor__editor-row">
              <div class="template-editor__editor-wrap">
                <nf-code-editor
                  #codeEditor
                  [value]="templateBody()"
                  [disabled]="isSystem()"
                  [rows]="18"
                  placeholder="<div>HTML + Thymeleaf...</div>"
                  (valueChange)="templateBody.set($event)">
                </nf-code-editor>
              </div>
              <div class="template-editor__variables">
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
              <div class="template-editor__actions">
                @if (!isSystem()) {
                  <button mat-flat-button color="primary" (click)="save()" [disabled]="form.invalid || saving()">
                    {{ 'administration.templates.editor.save' | translate }}
                  </button>
                }
                <button mat-button (click)="refreshPreview()" [disabled]="previewLoading()">
                  {{ 'administration.templates.editor.preview' | translate }}
                </button>
              </div>
            </div>
          </div>

          <div class="template-editor__preview">
            <div class="template-editor__preview-header">
              <span>{{ 'administration.templates.editor.preview' | translate }}</span>
            </div>
            @if (safePreviewUrl()) {
              <iframe
                [src]="safePreviewUrl()"
                class="template-editor__preview-frame"
                title="PDF Preview">
              </iframe>
            } @else if (previewLoading()) {
              <p class="template-editor__preview-loading">{{ 'Loading...' | translate }}</p>
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
export class TemplateEditorPage implements OnInit {
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly fb = inject(FormBuilder);
  private readonly facade = inject(TemplatesFacade);
  private readonly api = inject(TemplatesApiService);
  private readonly toast = inject(ToastService);
  private readonly i18n = inject(TranslateService);
  private readonly sanitizer = inject(DomSanitizer);

  readonly codeEditor = viewChild<CodeEditorComponent>('codeEditor');

  readonly templateBody = signal('');
  readonly variables = signal<TemplateVariable[]>([]);
  readonly saving = signal(false);
  readonly previewLoading = signal(false);
  readonly previewUrl = signal<string | null>(null);
  readonly safePreviewUrl = computed<SafeResourceUrl | null>(() => {
    const url = this.previewUrl();
    return url ? this.sanitizer.bypassSecurityTrustResourceUrl(url) : null;
  });

  readonly isSystem = computed(() => (this.facade.current()?.isSystem ?? false));
  readonly entityTypes = signal<string[]>([]);

  readonly form = this.fb.nonNullable.group({
    name: ['', [Validators.required, Validators.maxLength(200)]],
    entityType: ['', Validators.required],
    paperSize: ['A4'],
    orientation: ['Portrait'],
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

  async ngOnInit(): Promise<void> {
    const id = this.route.snapshot.paramMap.get('id');
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
    this.form.patchValue({
      name: template.name,
      entityType: template.entityType,
      paperSize: template.paperSize ?? 'A4',
      orientation: template.orientation ?? 'Portrait',
    });
    this.templateBody.set(template.templateBody ?? '');
    this.entityTypes.set(await this.api.getEntityTypes());
    const varsRes = await this.api.getVariables(template.entityType).catch(() => ({ variables: [] }));
    this.variables.set(varsRes.variables ?? []);
    this.previewUrl.set(this.api.getPreviewUrl(id));
  }

  onInsertSnippet(snippet: string): void {
    this.codeEditor()?.insertAtCursor(snippet);
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
      this.toast.success(this.i18n.instant('administration.templates.saveSuccess'));
      this.previewUrl.set(this.api.getPreviewUrl(current.id));
    } catch {
      this.toast.error(this.i18n.instant('administration.templates.saveError'));
    } finally {
      this.saving.set(false);
    }
  }

  refreshPreview(): void {
    const current = this.facade.current();
    if (!current) return;
    this.previewUrl.set(null);
    this.previewLoading.set(true);
    this.previewUrl.set(this.api.getPreviewUrl(current.id));
    this.previewLoading.set(false);
  }
}
