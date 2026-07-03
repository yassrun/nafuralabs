/**
 * Send Email Dialog Component
 *
 * Compose entity email: recipient, template, body preview, optional PDF attachment.
 */

import {
  Component,
  OnInit,
  inject,
  signal,
  computed,
  ChangeDetectorRef,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import {
  MatDialogModule,
  MatDialogRef,
  MAT_DIALOG_DATA,
} from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatButtonModule } from '@angular/material/button';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatIconModule } from '@angular/material/icon';
import { TranslateModule } from '@ngx-translate/core';
import { FormControl, ReactiveFormsModule, Validators } from '@angular/forms';

import {
  EntityEmailApiService,
  type EmailTemplateDto,
  type SendEntityEmailRequest,
} from '../../../services/entity-email-api.service';
import type { DocumentTemplateDto } from '../../../services/print-template-api.service';
import { PrintTemplateApiService } from '../../../services/print-template-api.service';
import type { SendEmailDialogData } from './send-email-dialog.data';

@Component({
  selector: 'nf-send-email-dialog',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatDialogModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatButtonModule,
    MatCheckboxModule,
    MatProgressSpinnerModule,
    MatIconModule,
    TranslateModule,
  ],
  templateUrl: './send-email-dialog.component.html',
  styleUrl: './send-email-dialog.component.scss',
})
export class SendEmailDialogComponent implements OnInit {
  private readonly dialogRef = inject(MatDialogRef<SendEmailDialogComponent>);
  private readonly data = inject<SendEmailDialogData>(MAT_DIALOG_DATA);
  private readonly entityEmailApi = inject(EntityEmailApiService);
  private readonly printTemplateApi = inject(PrintTemplateApiService);
  private readonly cdr = inject(ChangeDetectorRef);

  readonly toControl = new FormControl<string>('', [
    Validators.required,
    Validators.email,
  ]);
  readonly ccControl = new FormControl<string>('', [Validators.email]);
  readonly subjectControl = new FormControl<string>('', [Validators.required]);
  readonly emailTemplateIdControl = new FormControl<string | null>(null, [
    Validators.required,
  ]);
  readonly attachPdfControl = new FormControl<boolean>(false);
  readonly printTemplateIdControl = new FormControl<string | null>(null);

  readonly emailTemplates = signal<EmailTemplateDto[]>([]);
  readonly emailTemplatesLoading = signal(true);
  readonly printTemplates = signal<DocumentTemplateDto[]>([]);
  readonly printTemplatesLoading = signal(false);
  readonly bodyPreview = signal<string>('');
  readonly previewLoading = signal(false);
  readonly sending = signal(false);
  readonly showCc = signal(false);

  readonly entityType = () => this.data.entityType;
  readonly entityId = () => this.data.entityId;
  readonly entityCode = () => this.data.entityCode ?? this.data.entityId;

  readonly canSend = computed(() => {
    return (
      this.toControl.valid &&
      this.subjectControl.valid &&
      this.emailTemplateIdControl.valid &&
      (!this.attachPdfControl.value || !!this.printTemplateIdControl.value) &&
      !this.sending()
    );
  });

  ngOnInit(): void {
    if (this.data.initialTo) {
      this.toControl.setValue(this.data.initialTo);
    }
    this.loadEmailTemplates();
  }

  private async loadEmailTemplates(): Promise<void> {
    this.emailTemplatesLoading.set(true);
    try {
      const list = await this.entityEmailApi.listTemplatesByEntityType(
        this.data.entityType
      );
      this.emailTemplates.set(list);
      if (list.length === 1) {
        this.emailTemplateIdControl.setValue(list[0].id);
        this.loadPreview();
      }
    } catch {
      this.emailTemplates.set([]);
    } finally {
      this.emailTemplatesLoading.set(false);
      this.cdr.markForCheck();
    }
  }

  onEmailTemplateChange(templateId: string | null): void {
    if (templateId) {
      this.loadPreview();
    } else {
      this.subjectControl.setValue('');
      this.bodyPreview.set('');
    }
  }

  private async loadPreview(): Promise<void> {
    const templateId = this.emailTemplateIdControl.value;
    if (!templateId) return;
    this.previewLoading.set(true);
    this.bodyPreview.set('');
    try {
      const res = await this.entityEmailApi.preview({
        emailTemplateId: templateId,
        entityType: this.data.entityType,
        entityId: this.data.entityId,
      });
      this.subjectControl.setValue(res.subject);
      this.bodyPreview.set(res.htmlBody ?? '');
    } catch {
      this.bodyPreview.set('');
    } finally {
      this.previewLoading.set(false);
      this.cdr.markForCheck();
    }
  }

  onAttachPdfChange(checked: boolean): void {
    if (checked && this.printTemplates().length === 0) {
      this.loadPrintTemplates();
    }
    if (!checked) {
      this.printTemplateIdControl.setValue(null);
    }
  }

  private async loadPrintTemplates(): Promise<void> {
    this.printTemplatesLoading.set(true);
    try {
      const list = await this.printTemplateApi.listByEntityType(
        this.data.entityType
      );
      this.printTemplates.set(list);
      if (list.length === 1) {
        this.printTemplateIdControl.setValue(list[0].id);
      }
    } catch {
      this.printTemplates.set([]);
    } finally {
      this.printTemplatesLoading.set(false);
      this.cdr.markForCheck();
    }
  }

  toggleCc(): void {
    this.showCc.update((v) => !v);
  }

  close(): void {
    this.dialogRef.close();
  }

  async send(): Promise<void> {
    if (!this.canSend()) return;
    const to = this.toControl.value?.trim();
    if (!to) return;
    const toList = to.split(/[\s,;]+/).map((e) => e.trim()).filter(Boolean);
    const ccRaw = this.ccControl.value?.trim();
    const ccList = ccRaw
      ? ccRaw.split(/[\s,;]+/).map((e) => e.trim()).filter(Boolean)
      : [];
    const request: SendEntityEmailRequest = {
      to: toList,
      cc: ccList.length > 0 ? ccList : undefined,
      emailTemplateId: this.emailTemplateIdControl.value!,
      entityType: this.data.entityType,
      entityId: this.data.entityId,
      attachPdf: this.attachPdfControl.value ?? false,
      printTemplateId: this.attachPdfControl.value
        ? this.printTemplateIdControl.value ?? undefined
        : undefined,
    };
    this.sending.set(true);
    this.cdr.markForCheck();
    try {
      await this.entityEmailApi.send(request);
      this.dialogRef.close(true);
    } catch {
      this.sending.set(false);
      this.cdr.markForCheck();
    }
  }
}
