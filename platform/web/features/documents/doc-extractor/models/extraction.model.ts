export type ExtractionStatus = 'draft' | 'validated' | 'invalid' | 'corrected' | 'exported' | 'error';

/** Workflow status indicates the processing state of extraction */
export type WorkflowStatus = 'PENDING' | 'PROCESSING' | 'COMPLETED' | 'REJECTED' | 'FAILED';

export interface ExtractionDraft {
  draftId: string;
  domainKey: string;
  docTypeKey: string;
  docTypeVersion: number;
  dataJson: Record<string, unknown>;
  status: 'draft';
}

export interface ExtractedRecord {
  recordId: string;
  domainKey: string;
  docTypeKey: string;
  docTypeVersion: number;
  /** Direct reference to the exact DocTypeDefinition version used */
  docTypeDefinitionId?: string;
  dataJson: Record<string, unknown>;
  status: ExtractionStatus;
  /** Workflow status indicates if extraction succeeded or failed */
  workflowStatus?: WorkflowStatus;
  /** Reason for rejection if workflowStatus is REJECTED */
  rejectionReason?: string;
  storedDocumentId?: string; // UUID of stored document if linked
  sourceFileName?: string;
  sourceMimeType?: string;
  sourceFileSizeBytes?: number;
  createdAt: string; // ISO string
}

export interface ValidateDraftRequest {
  draftId: string;
  dataJson: Record<string, unknown>;
  domainKey: string;
  docTypeKey: string;
  docTypeVersion: number;
  tenantId: string;
}

export interface ValidateRecordEditRequest {
  recordId: string;
  dataJson: Record<string, unknown>;
  domainKey: string;
  docTypeKey: string;
  docTypeVersion: number;
  tenantId: string;
}

export type ValidateRequest = ValidateDraftRequest | ValidateRecordEditRequest;

export interface ExportRequest {
  domainKey: string;
  docTypeKey: string;
  docTypeVersion: number;
  tenantId: string;
  recordIds?: string[];
}

export type DateFieldType = 'CREATED_AT';

export interface StandardRecordFilters {
  status?: ExtractionStatus;
  dateField: DateFieldType;
  dateFrom?: string; // ISO date string
  dateTo?: string;   // ISO date string
}

export interface RecordSearchRequest {
  context: {
    domainKey: string;
    docTypeKey: string;
    version: number;
  };
  page: {
    index: number;
    size: number;
  };
  sort: Array<{
    field: string;
    dir: 'ASC' | 'DESC';
  }>;
  filters?: StandardRecordFilters;
}

export interface RecordSearchResponse {
  items: ExtractedRecord[];
  page: {
    index: number;
    size: number;
    totalItems: number;
    totalPages: number;
  };
}

/**
 * Extraction response status.
 */
export type ExtractionResponseStatus = 'SUCCESS' | 'DUPLICATE' | 'IN_PROGRESS' | 'FAILED';

/**
 * Deduplication result for exact duplicate detection.
 */
export interface ExactDuplicateResult {
  isDuplicate: boolean;
  existingRecordId?: string;
  existingStatus?: ExtractionStatus;
}

/**
 * Deduplication result for near duplicate detection.
 */
export interface NearDuplicateResult {
  isNearDuplicate: boolean;
  candidateRecordId?: string;
  distance: number | null;
}

/**
 * Deduplication results combined.
 */
export interface DeduplicationResult {
  exactDuplicate: ExactDuplicateResult;
  nearDuplicate: NearDuplicateResult;
}

/**
 * Response from extraction API.
 */
export interface ExtractionResponse {
  /** Response status */
  status: ExtractionResponseStatus;
  /** The request/draft ID */
  requestId: string;
  /** The created record ID (if persisted) */
  recordId?: string;
  /** Extracted JSON data (may be string or object) */
  extractedJson: string | Record<string, unknown>;
  /** The extracted record (if available) */
  record?: ExtractedRecord;
  /** Deduplication check results */
  dedup: DeduplicationResult;
}

