import { Injectable, inject } from '@angular/core';
import { firstValueFrom } from 'rxjs';

import { TenantContextService } from '@platform/core/tenant/tenant.context';
import { ExtractionService } from '../../services/extraction.service';
import type { FieldIssue } from '../../models/extraction.model';
import type { JsonSchemaObject } from '../../models/json-schema.model';
import {
  DEFAULT_SMART_IMPORT_CONFIG,
  primaryArrayPath,
  schemaViewFromDefinition,
  type ExtractionDefinition,
  type ReviewedExtraction,
  type SmartImportConfig,
  type SmartImportProgress,
  type SmartImportRow,
  type SmartImportSchemaView,
  type SmartImportSession,
} from '../models/smart-import.model';
import {
  SmartImportError,
  mapSmartImportError,
} from '../models/smart-import.errors';
import {
  issuesForRootIndex,
  validateObjectDeep,
} from '../utils/nested-validation.util';
import { buildInstructionsForMode } from '../utils/import-mode.util';
import type { SmartImportMode } from '../models/smart-import.model';

@Injectable({ providedIn: 'root' })
export class SmartImportOrchestratorService {
  private readonly tenantContext = inject(TenantContextService);
  private readonly extractionService = inject(ExtractionService);

  describe(definition: ExtractionDefinition): {
    schema: SmartImportSchemaView;
    config: SmartImportConfig;
    arrayPath: string;
  } {
    const schema = schemaViewFromDefinition(definition);
    const config = this.resolveConfig(definition);
    config.importPolicy =
      definition.presentationSchema?.importPolicy === 'STRICT' ? 'STRICT' : config.importPolicy;
    return { schema, config, arrayPath: primaryArrayPath(definition) };
  }

  async prepare(
    definition: ExtractionDefinition,
    file: File,
    progress?: (value: SmartImportProgress) => void,
    options?: { mode?: SmartImportMode },
  ): Promise<SmartImportSession> {
    const config = this.resolveConfig(definition);
    progress?.({ phase: 'PREFLIGHT' });
    this.validateFile(file, config);

    const tenantId = this.tenantContext.tenantId();
    if (!tenantId) {
      throw new SmartImportError(
        'TENANT_MISSING',
        'platform.smartImport.errors.tenantMissing',
      );
    }

    try {
      progress?.({ phase: 'EXTRACTING' });
      const schema = schemaViewFromDefinition(definition);
      config.importPolicy =
        definition.presentationSchema?.importPolicy === 'STRICT' ? 'STRICT' : config.importPolicy;

      const arrayPath = primaryArrayPath(definition);
      const instructions = buildInstructionsForMode(
        definition.instructions,
        arrayPath,
        options?.mode ?? 'bulk',
      );

      const response = await firstValueFrom(
        this.extractionService.extractStateless({
          file,
          inlineSchema: definition.dataSchema,
          presentationSchema: definition.presentationSchema,
          instructions,
        }),
      );

      if (response.outcome === 'REJECTED' || response.outcome === 'TECHNICAL_FAILURE') {
        const failure = response.issues[0];
        const code = failure?.code;
        if (code === 'EXTRACTION_TIMEOUT') {
          throw new SmartImportError(
            'TIMEOUT',
            'platform.smartImport.errors.timeout',
            true,
          );
        }
        if (code === 'LLM_RESPONSE_INVALID' || code === 'INVALID_SCHEMA_PROPOSAL') {
          throw new SmartImportError(
            'INVALID_RESPONSE',
            'platform.smartImport.errors.invalidResponse',
            false,
          );
        }
        if (code === 'LLM_REQUEST_INVALID' || code === 'INVALID_INLINE_SCHEMA' || code === 'SCHEMA_REQUIRED') {
          throw new SmartImportError(
            'SCHEMA_INVALID',
            'platform.smartImport.errors.schemaInvalid',
            false,
            undefined,
            failure?.message,
          );
        }
        throw new SmartImportError(
          'EXTRACTION_FAILED',
          'platform.smartImport.errors.extractionFailed',
          failure?.retryable ?? true,
          undefined,
          failure?.message,
        );
      }
      if (response.outcome !== 'COMPLETED' && response.outcome !== 'REVIEW_REQUIRED') {
        throw new SmartImportError(
          'INVALID_RESPONSE',
          'platform.smartImport.errors.invalidResponse',
        );
      }

      const data = this.extractObject(response.data);
      const rawRows = data[arrayPath];
      if (!Array.isArray(rawRows) || rawRows.length === 0) {
        throw new SmartImportError('NO_ROWS', 'platform.smartImport.errors.noRows');
      }

      const seenFileKeys = new Set<string>();
      const itemSchema = this.itemSchema(
        definition.dataSchema as unknown as Record<string, unknown>,
        arrayPath,
      );
      const deepRootIssues = validateObjectDeep(
        data,
        definition.dataSchema as JsonSchemaObject,
        '',
        null,
      );
      const combinedIssues: FieldIssue[] = [
        ...(response.validation?.issues ?? []),
        ...deepRootIssues,
      ].filter(
        (issue, index, all) =>
          all.findIndex((other) => other.path === issue.path && other.kind === issue.kind) ===
          index,
      );
      const rows = rawRows
        .filter((row): row is Record<string, unknown> =>
          !!row && typeof row === 'object' && !Array.isArray(row),
        )
        .map((row, sourceIndex) =>
          this.prepareRow(
            definition,
            row,
            sourceIndex,
            itemSchema,
            combinedIssues,
            seenFileKeys,
          ),
        );

      if (rows.length === 0) {
        throw new SmartImportError('NO_ROWS', 'platform.smartImport.errors.noRows');
      }

      progress?.({ phase: 'REVIEWING', totalRows: rows.length, processedRows: 0 });
      return {
        definition,
        schema,
        arrayPath,
        config,
        rows,
        phase: 'REVIEWING',
        rootData: structuredClone(data),
        requestId: response.requestId,
      };
    } catch (error) {
      throw mapSmartImportError(error);
    }
  }

  revalidate(session: SmartImportSession): void {
    const definition = session.definition;
    const itemSchema = this.itemSchema(
      session.schema.jsonSchema as unknown as Record<string, unknown>,
      session.arrayPath,
    );
    const rootSchema = session.schema.jsonSchema as JsonSchemaObject;

    // Keep RECORD_TABLE root array in sync with editable rows.
    session.rootData[session.arrayPath] = session.rows.map((row) => row.data);

    for (const row of session.rows) {
      if (row.status === 'IGNORED' || row.status === 'DUPLICATE') {
        continue;
      }
      const pathPrefix = `${session.arrayPath}[${row.sourceIndex}]`;
      const deepIssues = validateObjectDeep(row.data, itemSchema, pathPrefix, row.sourceIndex);
      row.issues = [
        ...deepIssues,
        ...(definition.validateRow?.(row.data, row.sourceIndex) ?? []),
      ];
      if (row.sourceIndex === 0) {
        const headerIssues = validateObjectDeep(session.rootData, rootSchema, '', null).filter(
          (issue) => {
            const p = issue.path ?? '';
            return !p.startsWith(`${session.arrayPath}[`) && p !== session.arrayPath;
          },
        );
        row.issues = [...headerIssues, ...row.issues];
      }
      row.corrected = JSON.stringify(row.data) !== JSON.stringify(row.originalData);
      row.status = row.issues.length > 0 ? 'NEEDS_REVIEW' : 'READY';
    }
  }

  finalize<TData extends Record<string, unknown> = Record<string, unknown>>(
    session: SmartImportSession,
  ): ReviewedExtraction<TData> {
    this.revalidate(session);
    if (
      session.config.importPolicy === 'STRICT' &&
      session.rows.some((row) => row.status === 'NEEDS_REVIEW' || row.status === 'IGNORED')
    ) {
      throw new SmartImportError(
        'VALIDATION_REJECTED',
        'platform.smartImport.errors.strictBlocked',
      );
    }
    if (session.rows.some((row) => row.status === 'NEEDS_REVIEW')) {
      throw new SmartImportError(
        'VALIDATION_REJECTED',
        'platform.smartImport.errors.strictBlocked',
      );
    }

    const accepted = session.rows.filter((row) => row.status === 'READY');
    const ignored = session.rows.filter((row) => row.status === 'IGNORED');
    const duplicates = session.rows.filter((row) => row.status === 'DUPLICATE');
    const data = structuredClone(session.rootData);
    data[session.arrayPath] = accepted.map((row) => structuredClone(row.data));
    session.phase = 'COMPLETED';
    return {
      data: data as TData,
      acceptedRows: accepted.map((row) => structuredClone(row.data)),
      ignoredRows: ignored.map((row) => structuredClone(row.data)),
      duplicateRows: duplicates.map((row) => structuredClone(row.data)),
      corrected: accepted.filter((row) => row.corrected).length,
      requestId: session.requestId,
    };
  }

  private prepareRow(
    definition: ExtractionDefinition,
    data: Record<string, unknown>,
    sourceIndex: number,
    schema: JsonSchemaObject,
    allIssues: FieldIssue[],
    seenFileKeys: Set<string>,
  ): SmartImportRow {
    const pathPrefix = `${primaryArrayPath(definition)}[${sourceIndex}]`;
    const scopedBackend = issuesForRootIndex(allIssues, primaryArrayPath(definition), sourceIndex);
    const deepIssues = validateObjectDeep(data, schema, pathPrefix, sourceIndex);
    const issues = [
      ...scopedBackend,
      ...deepIssues,
      ...(definition.validateRow?.(data, sourceIndex) ?? []),
    ].filter(
      (issue, index, all) =>
        all.findIndex((other) => other.path === issue.path && other.kind === issue.kind) === index,
    );
    const key = definition.dedupeKey?.(data) ?? null;
    const normalizedKey = key ? this.normalize(key) : null;
    const duplicate = !!normalizedKey && seenFileKeys.has(normalizedKey);
    if (normalizedKey && !duplicate) seenFileKeys.add(normalizedKey);
    const cloned = structuredClone(data);
    return {
      sourceIndex,
      data: cloned,
      originalData: structuredClone(data),
      label: definition.formatRowLabel?.(data, sourceIndex) ?? key ?? `#${sourceIndex + 1}`,
      status: duplicate ? 'DUPLICATE' : issues.length > 0 ? 'NEEDS_REVIEW' : 'READY',
      issues,
      corrected: false,
    };
  }

  private resolveConfig(definition: ExtractionDefinition): SmartImportConfig {
    return {
      ...DEFAULT_SMART_IMPORT_CONFIG,
      ...definition.config,
      acceptedExtensions:
        definition.config?.acceptedExtensions ?? DEFAULT_SMART_IMPORT_CONFIG.acceptedExtensions,
      acceptedMimeTypes:
        definition.config?.acceptedMimeTypes ?? DEFAULT_SMART_IMPORT_CONFIG.acceptedMimeTypes,
    };
  }

  private validateFile(file: File, config: SmartImportConfig): void {
    if (!file || file.size === 0) {
      throw new SmartImportError('EMPTY', 'platform.smartImport.errors.empty');
    }
    if (file.size > config.maxFileSizeBytes) {
      throw new SmartImportError('TOO_LARGE', 'platform.smartImport.errors.tooLarge');
    }
    const extension = `.${file.name.split('.').pop()?.toLowerCase() ?? ''}`;
    if (!config.acceptedExtensions.map((item) => item.toLowerCase()).includes(extension)) {
      throw new SmartImportError('TYPE_NOT_ALLOWED', 'platform.smartImport.errors.typeNotAllowed');
    }
  }

  private extractObject(value: unknown): Record<string, unknown> {
    if (typeof value === 'string') {
      try {
        return this.extractObject(JSON.parse(value));
      } catch {
        throw new SmartImportError('INVALID_RESPONSE', 'platform.smartImport.errors.invalidResponse');
      }
    }
    if (value && typeof value === 'object' && !Array.isArray(value)) {
      return value as Record<string, unknown>;
    }
    throw new SmartImportError('INVALID_RESPONSE', 'platform.smartImport.errors.invalidResponse');
  }

  private itemSchema(root: Record<string, unknown>, arrayPath: string): JsonSchemaObject {
    const properties = root['properties'] as Record<string, unknown> | undefined;
    const arraySchema = properties?.[arrayPath] as Record<string, unknown> | undefined;
    const items = arraySchema?.['items'];
    if (!items || typeof items !== 'object') {
      throw new SmartImportError('SCHEMA_INVALID', 'platform.smartImport.errors.schemaInvalid');
    }
    return items as JsonSchemaObject;
  }

  private normalize(value: string): string {
    return value.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase().trim();
  }
}
