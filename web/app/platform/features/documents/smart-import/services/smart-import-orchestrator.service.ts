import { Injectable, inject } from '@angular/core';
import { firstValueFrom } from 'rxjs';

import { TenantContextService } from '@platform/core/tenant/tenant.context';
import { ExtractionService } from '../../doc-extractor/services/extraction.service';
import type {
  ExtractionValidation,
  FieldIssue,
} from '../../doc-extractor/models/extraction.model';
import type { JsonSchemaObject } from '../../doc-extractor/models/json-schema.model';
import {
  DEFAULT_SMART_IMPORT_CONFIG,
  emptySmartImportResult,
  schemaViewFromHandler,
  type ImportHandler,
  type SmartImportConfig,
  type SmartImportProgress,
  type SmartImportResult,
  type SmartImportRow,
  type SmartImportSchemaView,
  type SmartImportSession,
} from '../models/smart-import.model';
import {
  SmartImportError,
  mapSmartImportError,
} from '../models/smart-import.errors';
import { ImportHandlerRegistry } from './import-handler.registry';

@Injectable({ providedIn: 'root' })
export class SmartImportOrchestratorService {
  private readonly tenantContext = inject(TenantContextService);
  private readonly extractionService = inject(ExtractionService);
  private readonly registry = inject(ImportHandlerRegistry);

  async describe(entityKey: string): Promise<{
    schema: SmartImportSchemaView;
    config: SmartImportConfig;
    arrayPath: string;
  }> {
    const handler = this.registry.require(entityKey);
    const tenantId = this.tenantContext.tenantId();
    if (!tenantId) {
      throw new SmartImportError(
        'TENANT_MISSING',
        'platform.smartImport.errors.tenantMissing',
      );
    }
    const schema = schemaViewFromHandler(handler);
    const config = this.resolveConfig(handler);
    config.importPolicy =
      handler.presentationSchema?.importPolicy === 'STRICT' ? 'STRICT' : config.importPolicy;
    return { schema, config, arrayPath: handler.arrayPath };
  }

  async prepare(
    entityKey: string,
    file: File,
    progress?: (value: SmartImportProgress) => void,
  ): Promise<SmartImportSession> {
    const handler = this.registry.require(entityKey);
    const config = this.resolveConfig(handler);
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
      const schema = schemaViewFromHandler(handler);
      config.importPolicy =
        handler.presentationSchema?.importPolicy === 'STRICT' ? 'STRICT' : config.importPolicy;

      const response = await firstValueFrom(
        this.extractionService.extractStateless({
          file,
          inlineSchema: handler.dataSchema,
          presentationSchema: handler.presentationSchema,
          instructions: handler.instructions,
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
      const rawRows = data[handler.arrayPath];
      if (!Array.isArray(rawRows) || rawRows.length === 0) {
        throw new SmartImportError('NO_ROWS', 'platform.smartImport.errors.noRows');
      }

      const existingKeys = handler.loadExistingKeys
        ? await handler.loadExistingKeys()
        : new Set<string>();
      const normalizedKeys = new Set([...existingKeys].map((key) => this.normalize(key)));
      const seenFileKeys = new Set<string>();
      const itemSchema = this.itemSchema(
        handler.dataSchema as unknown as Record<string, unknown>,
        handler.arrayPath,
      );
      const validation: ExtractionValidation | undefined = response.validation
        ? {
            state: response.validation.state,
            issues: response.validation.issues,
            importPolicy: response.validation.importPolicy === 'STRICT' ? 'STRICT' : 'PARTIAL',
          }
        : undefined;
      const rows = rawRows
        .filter((row): row is Record<string, unknown> =>
          !!row && typeof row === 'object' && !Array.isArray(row),
        )
        .map((row, sourceIndex) =>
          this.prepareRow(
            handler,
            row,
            sourceIndex,
            itemSchema,
            validation,
            normalizedKeys,
            seenFileKeys,
          ),
        );

      if (rows.length === 0) {
        throw new SmartImportError('NO_ROWS', 'platform.smartImport.errors.noRows');
      }

      progress?.({ phase: 'REVIEWING', totalRows: rows.length, processedRows: 0 });
      return {
        entityKey,
        schema,
        arrayPath: handler.arrayPath,
        config,
        rows,
        existingKeys: normalizedKeys,
        phase: 'REVIEWING',
      };
    } catch (error) {
      throw mapSmartImportError(error);
    }
  }

  revalidate(session: SmartImportSession): void {
    const handler = this.registry.require(session.entityKey);
    const schema = this.itemSchema(
      session.schema.jsonSchema as unknown as Record<string, unknown>,
      session.arrayPath,
    );
    for (const row of session.rows) {
      if (row.status === 'IGNORED' || row.status === 'DUPLICATE' || row.status === 'IMPORTED') {
        continue;
      }
      row.issues = [
        ...this.validateAgainstSchema(row.data, schema, row.sourceIndex),
        ...(handler.validateRow?.(row.data, row.sourceIndex) ?? []),
      ];
      row.corrected = JSON.stringify(row.data) !== JSON.stringify(row.originalData);
      row.status = row.issues.length > 0 ? 'NEEDS_REVIEW' : 'READY';
      row.error = undefined;
    }
  }

  async importReady(
    session: SmartImportSession,
    progress?: (value: SmartImportProgress) => void,
  ): Promise<SmartImportResult> {
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

    const handler = this.registry.require(session.entityKey);
    const candidates = session.rows.filter((row) => row.status === 'READY');
    const result = emptySmartImportResult(session.rows);
    result.skippedDuplicates = session.rows.filter((row) => row.status === 'DUPLICATE').length;
    result.skippedByUser = session.rows.filter((row) => row.status === 'IGNORED').length;
    result.skippedInvalid = session.rows.filter((row) => row.status === 'NEEDS_REVIEW').length;

    progress?.({ phase: 'IMPORTING', totalRows: candidates.length, processedRows: 0 });
    let processed = 0;
    for (let offset = 0; offset < candidates.length; offset += session.config.concurrency) {
      const batch = candidates.slice(offset, offset + session.config.concurrency);
      await Promise.all(batch.map((row) => this.importRow(handler, row, session.existingKeys)));
      processed += batch.length;
      progress?.({ phase: 'IMPORTING', totalRows: candidates.length, processedRows: processed });
    }

    result.imported = session.rows.filter((row) => row.status === 'IMPORTED' && !row.corrected).length;
    result.corrected = session.rows.filter((row) => row.status === 'IMPORTED' && row.corrected).length;
    result.failed = session.rows.filter((row) => row.status === 'FAILED').length;
    session.phase = 'COMPLETED';
    progress?.({ phase: 'COMPLETED', totalRows: candidates.length, processedRows: processed });
    return result;
  }

  async retryFailed(
    session: SmartImportSession,
    progress?: (value: SmartImportProgress) => void,
  ): Promise<SmartImportResult> {
    const failed = session.rows.filter((row) => row.status === 'FAILED');
    for (const row of failed) {
      row.status = 'READY';
      row.error = undefined;
    }
    return this.importReady(session, progress);
  }

  private async importRow(
    handler: ImportHandler<unknown>,
    row: SmartImportRow,
    existingKeys: Set<string>,
  ): Promise<void> {
    const dedupeKey = handler.dedupeKey(row.data);
    const normalized = dedupeKey ? this.normalize(dedupeKey) : null;
    if (normalized && existingKeys.has(normalized)) {
      row.status = 'DUPLICATE';
      return;
    }
    try {
      await handler.create(handler.mapRowToPayload(row.data));
      if (normalized) existingKeys.add(normalized);
      row.status = 'IMPORTED';
    } catch (error) {
      row.status = 'FAILED';
      row.error = mapSmartImportError(error);
    }
  }

  private prepareRow(
    handler: ImportHandler<unknown>,
    data: Record<string, unknown>,
    sourceIndex: number,
    schema: JsonSchemaObject,
    validation: ExtractionValidation | undefined,
    existingKeys: Set<string>,
    seenFileKeys: Set<string>,
  ): SmartImportRow {
    const backendIssues = (validation?.issues ?? []).filter(
      (issue) => issue.rowIndex === sourceIndex,
    );
    const issues = [
      ...backendIssues,
      ...this.validateAgainstSchema(data, schema, sourceIndex),
      ...(handler.validateRow?.(data, sourceIndex) ?? []),
    ].filter(
      (issue, index, all) =>
        all.findIndex((other) => other.path === issue.path && other.kind === issue.kind) === index,
    );
    const key = handler.dedupeKey(data);
    const normalizedKey = key ? this.normalize(key) : null;
    const duplicate =
      !!normalizedKey &&
      (existingKeys.has(normalizedKey) || seenFileKeys.has(normalizedKey));
    if (normalizedKey && !duplicate) seenFileKeys.add(normalizedKey);
    return {
      sourceIndex,
      data: { ...data },
      originalData: { ...data },
      label: handler.formatRowLabel?.(data, sourceIndex) ?? key ?? `#${sourceIndex + 1}`,
      status: duplicate ? 'DUPLICATE' : issues.length > 0 ? 'NEEDS_REVIEW' : 'READY',
      issues,
      corrected: false,
    };
  }

  private validateAgainstSchema(
    row: Record<string, unknown>,
    schema: JsonSchemaObject,
    rowIndex: number,
  ): FieldIssue[] {
    const issues: FieldIssue[] = [];
    const required = Array.isArray(schema.required) ? schema.required : [];
    const properties = schema.properties ?? {};
    for (const path of required) {
      const value = row[path];
      if (value == null || (typeof value === 'string' && !value.trim())) {
        issues.push({ path, rowIndex, kind: 'MISSING_REQUIRED', message: `Required field missing: ${path}` });
      }
    }
    for (const [path, fieldSchema] of Object.entries(properties)) {
      const value = row[path];
      if (value == null || value === '') continue;
      const rawType = fieldSchema.type;
      const types = Array.isArray(rawType) ? rawType : [rawType];
      const validType =
        types.some((type) =>
          (type === 'string' && typeof value === 'string') ||
          ((type === 'number' || type === 'integer') && typeof value === 'number' && Number.isFinite(value)) ||
          (type === 'boolean' && typeof value === 'boolean') ||
          (type === 'array' && Array.isArray(value)) ||
          (type === 'object' && typeof value === 'object' && !Array.isArray(value)),
        );
      if (!validType) {
        issues.push({ path, rowIndex, kind: 'TYPE_MISMATCH', message: `Invalid type for ${path}` });
      } else if (
        fieldSchema.format === 'date' &&
        typeof value === 'string' &&
        !/^\d{4}-\d{2}-\d{2}$/.test(value)
      ) {
        issues.push({ path, rowIndex, kind: 'FORMAT_INVALID', message: `Invalid date for ${path}` });
      }
    }
    return issues;
  }

  private resolveConfig(handler: ImportHandler<unknown>): SmartImportConfig {
    return {
      ...DEFAULT_SMART_IMPORT_CONFIG,
      ...handler.config,
      acceptedExtensions:
        handler.config?.acceptedExtensions ?? DEFAULT_SMART_IMPORT_CONFIG.acceptedExtensions,
      acceptedMimeTypes:
        handler.config?.acceptedMimeTypes ?? DEFAULT_SMART_IMPORT_CONFIG.acceptedMimeTypes,
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
