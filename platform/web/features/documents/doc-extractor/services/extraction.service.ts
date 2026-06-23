import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';

import { ExportRequest, ExtractedRecord, ExtractionDraft, ValidateRequest, RecordSearchRequest, RecordSearchResponse } from '../models/extraction.model';
import { ExtractionResponse } from '../models/extraction.model';
import { ApiConfigService } from '../../../../core/config/api-config.service';

@Injectable({ providedIn: 'root' })
export class ExtractionService {
  private readonly http = inject(HttpClient);
  private readonly apiConfig = inject(ApiConfigService);
  
  private get apiBaseUrl(): string {
    return this.apiConfig.getApiBaseUrl();
  }

  /**
   * Convert tenant ID to UUID format.
   * For mock data like "tenant-acme", maps to a fixed UUID.
   * For actual UUIDs, returns as-is.
   */
  private toTenantUuid(tenantId: string): string {
    // Check if it's already a valid UUID format
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    if (uuidRegex.test(tenantId)) {
      return tenantId;
    }

    // Map mock tenant IDs to fixed UUIDs for development
    const mockTenantUuidMap: Record<string, string> = {
      'tenant-acme': '3c5f2c63-5d93-46a2-9ed2-07dbd1047bb0', // Fixed UUID for tenant-acme
    };

    return mockTenantUuidMap[tenantId] || tenantId; // Fallback to original if not mapped
  }

  uploadDraft(args: {
    file: File;
    domainKey: string;
    docTypeKey: string;
    docTypeVersion: number;
  }): Observable<ExtractionDraft> {
    const formData = new FormData();
    formData.append('file', args.file);
    formData.append('domainKey', args.domainKey);
    formData.append('docTypeKey', args.docTypeKey);
    formData.append('docTypeVersion', String(args.docTypeVersion));

    return this.http.post<ExtractionDraft>(`${this.apiBaseUrl}/api/extractions/draft`, formData);
  }

  validate(request: ValidateRequest): Observable<ExtractedRecord> {
    // Convert tenantId to UUID format for backend
    const convertedRequest = {
      ...request,
      tenantId: this.toTenantUuid(request.tenantId),
    };
    return this.http.post<ExtractedRecord>(`${this.apiBaseUrl}/api/extractions/validate`, convertedRequest);
  }

  listSession(args: {
    domainKey: string;
    docTypeKey: string;
    docTypeVersion: number;
    tenantId: string;
  }): Observable<ExtractedRecord[]> {
    // Convert tenantId to UUID format for backend
    const tenantUuid = this.toTenantUuid(args.tenantId);
    const params = new HttpParams()
      .set('domainKey', args.domainKey)
      .set('docTypeKey', args.docTypeKey)
      .set('docTypeVersion', String(args.docTypeVersion))
      .set('tenantId', tenantUuid);
    return this.http.get<ExtractedRecord[]>(`${this.apiBaseUrl}/api/extractions/session`, { params });
  }

  /**
   * Search extracted records with filters, pagination, and sorting.
   */
  searchRecords(request: RecordSearchRequest): Observable<RecordSearchResponse> {
    return this.http.post<RecordSearchResponse>(
      `${this.apiBaseUrl}/api/extractions/records/search`,
      request
    );
  }

  /**
   * Download a stored document binary from backend (streams from MinIO).
   * Use this instead of window.open(URL) so auth + tenant headers are included.
   */
  downloadStoredDocument(documentId: string): Observable<Blob> {
    return this.http.get(`${this.apiBaseUrl}/api/v1/documents/${documentId}/download`, {
      responseType: 'blob',
    });
  }

  exportXlsx(request: ExportRequest): Observable<Blob> {
    // Convert tenantId to UUID format for backend
    const convertedRequest = {
      ...request,
      tenantId: this.toTenantUuid(request.tenantId),
    };
    return this.http.post(`${this.apiBaseUrl}/api/extractions/export`, convertedRequest, {
      responseType: 'blob',
    });
  }

  exportToSeyruraInternal(request: ExportRequest): Observable<{
    success: boolean;
    message: string;
    createdItems: number;
    createdSuppliers: number;
    createdTransactions: number;
    totalTransactionLines?: number;
    errors?: string[];
  }> {
    // Convert tenantId to UUID format for backend
    const convertedRequest = {
      ...request,
      tenantId: this.toTenantUuid(request.tenantId),
    };
    return this.http.post<{
      success: boolean;
      message: string;
      createdItems: number;
      createdSuppliers: number;
      createdTransactions: number;
      totalTransactionLines?: number;
      errors?: string[];
    }>(`${this.apiBaseUrl}/api/extractions/export-to-seyrura`, convertedRequest);
  }

  /**
   * Extract data from a document without persisting.
   * Uses the unified /extract endpoint with persist=false.
   */
  extract(args: {
    file: File;
    docTypeDefinitionId: string;
    persist?: boolean;
  }): Observable<ExtractionResponse> {
    const formData = new FormData();
    formData.append('file', args.file);
    formData.append('docTypeDefinitionId', args.docTypeDefinitionId);
    formData.append('persist', String(args.persist ?? false));

    return this.http.post<ExtractionResponse>(`${this.apiBaseUrl}/api/extractions/extract`, formData);
  }

  /**
   * Delete a single extracted record.
   */
  deleteRecord(recordId: string): Observable<{ success: boolean; message: string; recordId: string }> {
    return this.http.delete<{ success: boolean; message: string; recordId: string }>(
      `${this.apiBaseUrl}/api/extractions/records/${recordId}`
    );
  }

  /**
   * Delete multiple extracted records.
   */
  deleteRecords(recordIds: string[]): Observable<{ success: boolean; message: string; deletedCount: number; requestedCount: number }> {
    return this.http.post<{ success: boolean; message: string; deletedCount: number; requestedCount: number }>(
      `${this.apiBaseUrl}/api/extractions/records/delete-batch`,
      { recordIds }
    );
  }
}


