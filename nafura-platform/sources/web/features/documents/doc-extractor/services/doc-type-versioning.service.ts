/**
 * DocTypeVersioningService
 * 
 * Frontend service for DocType versioning workflow.
 * Communicates with the v2 versioning API endpoints.
 */

import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';

import { 
  DocTypeDefinition, 
  DocTypeVersionSummary,
  CreateDocTypeRequest,
  CloneDocTypeRequest,
  SaveDraftRequest,
  ValidationResult
} from '../models/doc-type-definition.model';
import { BuilderState } from '../models/builder-state.model';
import { ApiConfigService } from '../../../../core/config/api-config.service';

@Injectable({ providedIn: 'root' })
export class DocTypeVersioningService {
  private readonly http = inject(HttpClient);
  private readonly apiConfig = inject(ApiConfigService);
  
  private get apiBaseUrl(): string {
    return `${this.apiConfig.getApiBaseUrl()}/api/doc-types/v2`;
  }

  /**
   * List all versions of a doc type.
   */
  listVersions(domainKey: string, docTypeKey: string): Observable<DocTypeVersionSummary[]> {
    return this.http.get<DocTypeVersionSummary[]>(
      `${this.apiBaseUrl}/${encodeURIComponent(domainKey)}/${encodeURIComponent(docTypeKey)}/versions`
    );
  }

  /**
   * Get version details including builder state and schemas.
   */
  getVersion(versionId: string): Observable<DocTypeDefinition> {
    return this.http.get<DocTypeDefinition>(`${this.apiBaseUrl}/versions/${versionId}`);
  }

  /**
   * Get the latest published version.
   */
  getLatestPublished(domainKey: string, docTypeKey: string): Observable<DocTypeDefinition> {
    return this.http.get<DocTypeDefinition>(
      `${this.apiBaseUrl}/${encodeURIComponent(domainKey)}/${encodeURIComponent(docTypeKey)}/latest`
    );
  }

  /**
   * Create a new doc type with v1 draft.
   */
  createDocType(request: CreateDocTypeRequest): Observable<DocTypeDefinition> {
    return this.http.post<DocTypeDefinition>(this.apiBaseUrl, request);
  }

  /**
   * Clone an existing version to a new draft.
   */
  cloneToNewDraft(domainKey: string, docTypeKey: string, fromVersionId: string): Observable<DocTypeDefinition> {
    const request: CloneDocTypeRequest = { fromVersionId };
    return this.http.post<DocTypeDefinition>(
      `${this.apiBaseUrl}/${encodeURIComponent(domainKey)}/${encodeURIComponent(docTypeKey)}/clone`,
      request
    );
  }

  /**
   * Save changes to a draft version.
   * Server generates schemas from builder state.
   */
  saveDraft(versionId: string, request: SaveDraftRequest): Observable<DocTypeDefinition> {
    return this.http.put<DocTypeDefinition>(
      `${this.apiBaseUrl}/versions/${versionId}/draft`,
      request
    );
  }

  /**
   * Validate and publish a draft version.
   */
  publish(versionId: string): Observable<DocTypeDefinition> {
    return this.http.post<DocTypeDefinition>(
      `${this.apiBaseUrl}/versions/${versionId}/publish`,
      {}
    );
  }

  /**
   * Validate a builder state without saving.
   */
  validateBuilderState(builderState: BuilderState): Observable<ValidationResult> {
    return this.http.post<ValidationResult>(`${this.apiBaseUrl}/validate`, builderState);
  }
}

