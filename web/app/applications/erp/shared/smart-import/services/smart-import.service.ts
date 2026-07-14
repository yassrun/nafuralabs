import { Injectable, inject } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { firstValueFrom } from 'rxjs';

import { TenantContextService } from '@platform/core/tenant/tenant.context';
import { ExtractionService } from '@platform/features/documents/doc-extractor/services/extraction.service';
import type { ExtractionValidation, FieldIssue } from '@platform/features/documents/doc-extractor/models/extraction.model';
import type { SmartImportSchemaView } from '@platform/features/documents/smart-import/models/smart-import.model';

import { extractObject, normalizeText } from '../../utils/extraction-json.utils';
import {
  extractArrayRows,
  issuesForRow,
  requiredFieldsFromArraySchema,
  rowsWithIssues,
  validateRowRequired,
  type ImportHandler,
  type SmartImportResult,
} from '../models/smart-import.model';
import { ImportHandlerRegistry } from './import-handler.registry';
import {
  SmartImportCompletionDialogComponent,
  type SmartImportCompletionDialogResult,
} from '../components/smart-import-completion-dialog/smart-import-completion-dialog.component';

type CorrectionRow = {
  rowIndex: number;
  row: Record<string, unknown>;
  issues: FieldIssue[];
};

@Injectable({ providedIn: 'root' })
export class SmartImportService {
  private readonly tenantContext = inject(TenantContextService);
  private readonly extractionService = inject(ExtractionService);
  private readonly registry = inject(ImportHandlerRegistry);
  private readonly dialog = inject(MatDialog);

  async importFromFile(entityKey: string, file: File): Promise<SmartImportResult> {
    const handler = this.registry.require(entityKey);
    const tenantId = this.tenantContext.tenantId();
    if (!tenantId) {
      throw new Error('SMART_IMPORT_TENANT_MISSING');
    }

    const schema: SmartImportSchemaView = {
      name: handler.schemaName ?? handler.entityKey,
      description: handler.schemaDescription,
      jsonSchema: handler.dataSchema,
      uiSchema: handler.presentationSchema,
      instructions: handler.instructions,
    };

    const response = await firstValueFrom(
      this.extractionService.extractStateless({
        file,
        inlineSchema: handler.dataSchema,
        presentationSchema: handler.presentationSchema,
        instructions: handler.instructions,
      }),
    );

    if (response.outcome === 'REJECTED' || response.outcome === 'TECHNICAL_FAILURE') {
      throw new Error('SMART_IMPORT_EXTRACTION_FAILED');
    }
    if (response.outcome !== 'COMPLETED' && response.outcome !== 'REVIEW_REQUIRED') {
      throw new Error('SMART_IMPORT_EXTRACTION_INCOMPLETE');
    }

    const data = extractObject(response.data);
    const rows = extractArrayRows(data, handler.arrayPath);
    if (rows.length === 0) {
      throw new Error('SMART_IMPORT_NO_ROWS');
    }

    const validation: ExtractionValidation | undefined = response.validation
      ? {
          state: response.validation.state,
          issues: response.validation.issues,
          importPolicy: response.validation.importPolicy === 'STRICT' ? 'STRICT' : 'PARTIAL',
        }
      : undefined;
    const invalidIndexes = rowsWithIssues(validation);
    const requiredFields = requiredFieldsFromArraySchema(schema, handler.arrayPath);
    const existingKeys = handler.loadExistingKeys ? await handler.loadExistingKeys() : new Set<string>();

    const result: SmartImportResult = {
      imported: 0,
      skippedDuplicates: 0,
      skippedInvalid: 0,
      corrected: 0,
      failed: 0,
    };

    const rowsToCorrect: CorrectionRow[] = [];

    for (let i = 0; i < rows.length; i++) {
      const row = rows[i];
      const backendIssues = issuesForRow(validation, i);
      const localCheck = validateRowRequired(row, requiredFields, i);
      const hasIssues = invalidIndexes.has(i) || !localCheck.valid;

      if (hasIssues) {
        rowsToCorrect.push({
          rowIndex: i,
          row: { ...row },
          issues: backendIssues.length > 0 ? backendIssues : localCheck.issues,
        });
        continue;
      }

      await this.importRow(handler, row, existingKeys, result, 'imported');
    }

    if (rowsToCorrect.length > 0) {
      const correctedRows = await this.openCompletionDialog(schema, handler.arrayPath, rowsToCorrect);
      for (const row of correctedRows) {
        const check = validateRowRequired(row, requiredFields, -1);
        if (!check.valid) {
          result.skippedInvalid++;
          continue;
        }
        await this.importRow(handler, row, existingKeys, result, 'corrected');
      }
    }

    return result;
  }

  private async openCompletionDialog(
    schema: SmartImportSchemaView,
    arrayPath: string,
    rows: CorrectionRow[],
  ): Promise<Record<string, unknown>[]> {
    const ref = this.dialog.open<
      SmartImportCompletionDialogComponent,
      { schema: SmartImportSchemaView; arrayPath: string; rows: CorrectionRow[] },
      SmartImportCompletionDialogResult | undefined
    >(SmartImportCompletionDialogComponent, {
      width: '960px',
      maxWidth: '96vw',
      disableClose: true,
      data: { schema, arrayPath, rows },
    });

    const outcome = await firstValueFrom(ref.afterClosed());
    return outcome?.rows ?? [];
  }

  private async importRow(
    handler: ImportHandler<unknown>,
    row: Record<string, unknown>,
    existingKeys: Set<string>,
    result: SmartImportResult,
    bucket: 'imported' | 'corrected',
  ): Promise<void> {
    const key = handler.dedupeKey(row);
    if (key) {
      const normalized = normalizeText(key);
      if (existingKeys.has(normalized)) {
        result.skippedDuplicates++;
        return;
      }
    }

    try {
      const payload = handler.mapRowToPayload(row);
      await handler.create(payload);
      if (key) {
        existingKeys.add(normalizeText(key));
      }
      if (bucket === 'corrected') {
        result.corrected++;
      } else {
        result.imported++;
      }
    } catch {
      result.failed++;
    }
  }
}
