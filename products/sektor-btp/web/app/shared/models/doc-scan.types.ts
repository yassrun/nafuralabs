import type { DocTypeDefinition } from '@platform/features/documents/doc-extractor/models/doc-type-definition.model';
import type { ExtractionValidation } from '@platform/features/documents/doc-extractor/models/extraction.model';
import type { JsonSchemaRoot } from '@platform/features/documents/doc-extractor/models/json-schema.model';
import type { UiSchema } from '@platform/features/documents/doc-extractor/models/ui-schema.model';

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
  definition: DocTypeDefinition;
  validation?: ExtractionValidation;
  requestId?: string;
}
