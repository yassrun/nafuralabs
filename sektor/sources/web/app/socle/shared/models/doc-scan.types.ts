import type { DocTypeDefinition } from '@platform/app/document-extraction/models/doc-type-definition.model';
import type { ExtractionValidation } from '@platform/app/document-extraction/models/extraction.model';
import type { JsonSchemaRoot } from '@platform/app/document-extraction/models/json-schema.model';
import type { UiSchema } from '@platform/app/document-extraction/models/ui-schema.model';

export interface LookupEntry {
  key: string;
  value: string;
  data?: Record<string, unknown>;
}

export type LookupMap = Record<string, LookupEntry[]>;

export interface DocScanLookupContext {
  lookups: LookupMap;
  resolveLookupId: (lookupKey: string, label?: string) => string | undefined;
  findByAliases: (root: unknown, aliases: string[]) => unknown;
  findStringByAliases: (root: unknown, aliases: string[]) => string | undefined;
  normalizeDate: (value?: string) => string | undefined;
  normalizeText: (value: string) => string;
  toNumber: (value: unknown) => number;
  extractLines: (root: unknown, aliases?: string[]) => Record<string, unknown>[];
}

export interface DocScanSchemaArgs {
  dataSchema: JsonSchemaRoot;
  presentationSchema?: UiSchema;
  instructions?: string;
  /** Name shown in optional review UI. */
  schemaName?: string;
  schemaDescription?: string;
}

export interface ScanAndMapArgs<T> extends DocScanSchemaArgs {
  file: File;
  mapper: (data: Record<string, unknown>, ctx: DocScanLookupContext) => Partial<T> | Promise<Partial<T>>;
  lookups: () => LookupMap;
  review?: (payload: DocScanReviewPayload) => Promise<Record<string, unknown> | undefined>;
}

export interface DocScanReviewPayload {
  data: Record<string, unknown>;
  /** Synthetic definition for review dialogs that still expect DocTypeDefinition shape. */
  definition: DocTypeDefinition;
  validation?: ExtractionValidation;
  requestId?: string;
}
