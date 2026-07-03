import { CommonModule } from '@angular/common';
import { Component, inject, OnInit, signal, computed, viewChild } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { DomSanitizer, SafeHtml } from '@angular/platform-browser';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { TranslateModule, TranslateService } from '@ngx-translate/core';

import { CodeEditorComponent, PageHeaderComponent, PageShellComponent, ToastService } from '@lib/anatomy';

import type { EmailTemplate } from '../models';
import { EmailTemplatesFacade } from '../services';

/** Sample variables for preview (Thymeleaf context). */
const SAMPLE_PREVIEW_VARS: Record<string, unknown> = {
  tenant: { name: 'Acme Corp' },
  user: { firstName: 'Jean', email: 'jean@example.com' },
  inviter: { name: 'Marie Dupont' },
  inviteLink: 'https://app.example.com/invite/accept?token=xxx',
  invitee: { email: 'invitee@example.com' },
  message: 'Welcome to the team!',
};

@Component({
  selector: 'app-email-template-editor-page',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    TranslateModule,
    MatButtonModule,
    MatFormFieldModule,
    MatInputModule,
    PageShellComponent,
    PageHeaderComponent,
    CodeEditorComponent,
  ],
  template: `
    <nf-page-shell>
      <nf-page-header [config]="headerConfig()"></nf-page-header>

      <div class="email-template-editor">
        <div class="email-template-editor__main">
          <div class="email-template-editor__form">
            <form [formGroup]="form" class="email-template-editor__meta">
              <mat-form-field appearance="outline">
                <mat-label>{{ 'administration.emailTemplates.fields.name' | translate }}</mat-label>
                <input matInput formControlName="name" [readonly]="isSystem()" />
              </mat-form-field>
              <mat-form-field appearance="outline">
                <mat-label>{{ 'administration.emailTemplates.fields.code' | translate }}</mat-label>
                <input matInput formControlName="code" readonly />
              </mat-form-field>
              <mat-form-field appearance="outline" class="full-width">
                <mat-label>{{ 'administration.emailTemplates.fields.subject' | translate }}</mat-label>
                <input matInput formControlName="subject" [readonly]="isSystem()" />
              </mat-form-field>
              <mat-form-field appearance="outline">
                <mat-label>{{ 'administration.emailTemplates.fields.entityType' | translate }}</mat-label>
                <input matInput formControlName="entityType" [readonly]="isSystem()" />
              </mat-form-field>
            </form>

            <div class="email-template-editor__editor-row">
              <div class="email-template-editor__editor-wrap">
                <label class="editor-label">{{ 'administration.emailTemplates.fields.htmlBody' | translate }}</label>
                <nf-code-editor
                  #codeEditor
                  [value]="htmlBody()"
                  [disabled]="isSystem()"
                  [rows]="14"
                  placeholder="<html>..."
                  (valueChange)="htmlBody.set($event)">
                </nf-code-editor>
              </div>
              <div class="email-template-editor__text-body">
                <mat-form-field appearance="outline" class="full-height">
                  <mat-label>{{ 'administration.emailTemplates.fields.textBody' | translate }}</mat-label>
                  <textarea matInput formControlName="textBody" rows="8" [readonly]="isSystem()"></textarea>
                </mat-form-field>
              </div>
            </div>

            <div class="email-template-editor__actions">
              @if (!isSystem()) {
                <button mat-flat-button color="primary" (click)="save()" [disabled]="form.invalid || saving()">
                  {{ 'administration.emailTemplates.editor.save' | translate }}
                </button>
              }
              @if (templateId()) {
                <button mat-button (click)="refreshPreview()" [disabled]="previewLoading()">
                  {{ 'administration.emailTemplates.editor.preview' | translate }}
                </button>
              }
            </div>
          </div>

          <div class="email-template-editor__preview">
            <div class="email-template-editor__preview-header">
              <span>{{ 'administration.emailTemplates.editor.preview' | translate }}</span>
            </div>
            @if (safePreviewHtml()) {
              <iframe
                [srcdoc]="safePreviewHtml()!"
                class="email-template-editor__preview-frame"
                title="Email Preview">
              </iframe>
            } @else if (previewLoading()) {
              <p class="email-template-editor__preview-loading">{{ 'common.loading' | translate }}</p>
            } @else {
              <p class="email-template-editor__preview-empty">{{ 'administration.emailTemplates.editor.previewEmpty' | translate }}</p>
            }
          </div>
        </div>
      </div>
    </nf-page-shell>
  `,
  styles: [
    `
      .email-template-editor { padding: 0 1rem 1rem; }
      .email-template-editor__main {
        display: grid;
        grid-template-columns: 1fr 420px;
        gap: 1.5rem;
        min-height: 520px;
      }
      .email-template-editor__form { display: flex; flex-direction: column; gap: 1rem; }
      .email-template-editor__meta {
        display: grid;
        grid-template-columns: 1fr 1fr;
        gap: 1rem;
      }
      .email-template-editor__meta .full-width { grid-column: 1 / -1; }
      .email-template-editor__editor-row {
        display: grid;
        grid-template-columns: 1fr 1fr;
        gap: 1rem;
      }
      .editor-label { font-size: 0.875rem; margin-bottom: 4px; display: block; }
      .email-template-editor__editor-wrap { min-height: 280px; }
      .email-template-editor__text-body .full-height { width: 100%; }
      .email-template-editor__actions { display: flex; gap: 0.5rem; margin-top: 0.5rem; }
      .email-template-editor__preview {
        border: 1px solid var(--nf-border-default);
        border-radius: 8px;
        overflow: hidden;
        display: flex;
        flex-direction: column;
        background: var(--nf-surface-subtle);
      }
      .email-template-editor__preview-header {
        padding: 8px 12px;
        border-bottom: 1px solid var(--nf-border-default);
        font-size: 0.875rem;
      }
      .email-template-editor__preview-frame {
        flex: 1;
        min-height: 460px;
        border: none;
      }
      .email-template-editor__preview-loading,
      .email-template-editor__preview-empty {
        padding: 2rem;
        text-align: center;
        color: var(--nf-text-muted);
      }
    `,
  ],
})
export class EmailTemplateEditorPage implements OnInit {
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly fb = inject(FormBuilder);
  private readonly facade = inject(EmailTemplatesFacade);
  private readonly toast = inject(ToastService);
  private readonly i18n = inject(TranslateService);

  readonly codeEditor = viewChild<CodeEditorComponent>('codeEditor');

  readonly templateId = signal<string | null>(null);
  readonly htmlBody = signal('');
  readonly saving = signal(false);
  readonly previewLoading = signal(false);
  private readonly sanitizer = inject(DomSanitizer);
  readonly previewHtml = signal<string | null>(null);
  readonly safePreviewHtml = computed<SafeHtml | null>(() => {
    const html = this.previewHtml();
    return html ? this.sanitizer.bypassSecurityTrustHtml(html) : null;
  });

  readonly isSystem = computed(() => (this.facade.current()?.isSystem ?? false));

  readonly form = this.fb.nonNullable.group({
    name: ['', [Validators.required, Validators.maxLength(200)]],
    code: ['', Validators.required],
    subject: ['', [Validators.required, Validators.maxLength(500)]],
    entityType: [''],
    textBody: [''],
  });

  readonly headerConfig = computed(() => {
    const current = this.facade.current();
    const title = current?.name ?? this.i18n.instant('administration.emailTemplates.editor.title');
    return {
      title,
      breadcrumbs: [
        { label: 'administration.emailTemplates.title', route: '/administration/email-templates' },
        { label: title },
      ],
    };
  });

  async ngOnInit(): Promise<void> {
    const id = this.route.snapshot.paramMap.get('id');
    if (!id) {
      await this.router.navigate(['/administration/email-templates']);
      return;
    }
    if (id === 'new') {
      this.form.patchValue({ name: '', code: '', subject: '', entityType: '', textBody: '' });
      this.htmlBody.set('');
      return;
    }
    this.templateId.set(id);
    const template = await this.facade.loadOne(id);
    if (!template) {
      this.toast.error(this.i18n.instant('administration.emailTemplates.loadError'));
      await this.router.navigate(['/administration/email-templates']);
      return;
    }
    this.form.patchValue({
      name: template.name,
      code: template.code,
      subject: template.subject,
      entityType: template.entityType ?? '',
      textBody: template.textBody ?? '',
    });
    this.htmlBody.set(template.htmlBody ?? '');
  }

  async save(): Promise<void> {
    const current = this.facade.current();
    const id = this.templateId();
    if (!id || id === 'new') return;
    if (current?.isSystem) return;
    if (this.form.invalid) return;
    this.saving.set(true);
    try {
      await this.facade.update(id, {
        name: this.form.controls.name.value,
        subject: this.form.controls.subject.value,
        htmlBody: this.htmlBody(),
        textBody: this.form.controls.textBody.value || undefined,
        entityType: this.form.controls.entityType.value || undefined,
      });
      this.toast.success(this.i18n.instant('administration.emailTemplates.saveSuccess'));
    } catch {
      this.toast.error(this.i18n.instant('administration.emailTemplates.saveError'));
    } finally {
      this.saving.set(false);
    }
  }

  async refreshPreview(): Promise<void> {
    const id = this.templateId();
    if (!id) return;
    this.previewLoading.set(true);
    this.previewHtml.set(null);
    try {
      const rendered = await this.facade.preview(id, SAMPLE_PREVIEW_VARS);
      const html = rendered.htmlBody ?? '<p>No HTML body</p>';
      this.previewHtml.set(html);
    } catch {
      this.toast.error(this.i18n.instant('administration.emailTemplates.previewError'));
    } finally {
      this.previewLoading.set(false);
    }
  }
}
