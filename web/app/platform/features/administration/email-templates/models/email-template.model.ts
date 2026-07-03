/**
 * Email template model for listing and editor.
 * Aligns with backend EmailTemplate and spec 09a.
 */

export interface EmailTemplate {
  id: string;
  tenantId?: string | null;
  code: string;
  name: string;
  subject: string;
  htmlBody?: string | null;
  textBody?: string | null;
  entityType?: string | null;
  isSystem: boolean;
  createdAt?: string;
  updatedAt?: string;
}

export interface EmailTemplateCreate {
  code: string;
  name: string;
  subject: string;
  htmlBody?: string;
  textBody?: string;
  entityType?: string;
}

export interface EmailTemplateUpdate {
  name?: string;
  subject?: string;
  htmlBody?: string;
  textBody?: string;
  entityType?: string;
}

export interface EmailTemplatePreviewResponse {
  subject: string;
  htmlBody: string | null;
  textBody: string | null;
}
