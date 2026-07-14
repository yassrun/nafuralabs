import { Injectable, inject } from '@angular/core';
import { firstValueFrom } from 'rxjs';

import { TenantContextService } from '@platform/core/tenant/tenant.context';
import { ExtractionService } from '@platform/features/documents/doc-extractor/services/extraction.service';
import type { DocTypeDefinition } from '@platform/features/documents/doc-extractor/models/doc-type-definition.model';

import type {
  DocScanLookupContext,
  DocScanReviewPayload,
  DocScanSchemaArgs,
  LookupMap,
  ScanAndMapArgs,
} from '../models/doc-scan.types';
import {
  extractLines,
  extractObject,
  findByAliases,
  findStringByAliases,
  normalizeDate,
  normalizeText,
  toNumber,
} from '../utils/extraction-json.utils';

function toReviewDefinition(args: DocScanSchemaArgs): DocTypeDefinition {
  return {
    id: `local-${args.schemaName ?? 'scan'}`,
    domainKey: 'local',
    docTypeKey: 'local',
    version: 1,
    name: args.schemaName ?? 'Document scan',
    description: args.schemaDescription,
    status: 'PUBLISHED',
    origin: 'TENANT',
    jsonSchema: args.dataSchema,
    uiSchema: args.presentationSchema ?? { sections: [] },
    promptTemplate: args.instructions,
  };
}

@Injectable({ providedIn: 'root' })
export class ErpDocScanService {
  private readonly tenantContext = inject(TenantContextService);
  private readonly extractionService = inject(ExtractionService);

  async extractJson(args: DocScanSchemaArgs & { file: File }): Promise<Record<string, unknown>> {
    return (await this.extractForReview(args)).data;
  }

  async extractForReview(args: DocScanSchemaArgs & { file: File }): Promise<DocScanReviewPayload> {
    const tenantId = this.tenantContext.tenantId();
    if (!tenantId) {
      throw new Error('ERP_DOC_SCAN_TENANT_MISSING');
    }
    if (!args.dataSchema) {
      throw new Error('ERP_DOC_SCAN_SCHEMA_REQUIRED');
    }

    const response = await firstValueFrom(
      this.extractionService.extractStateless({
        file: args.file,
        inlineSchema: args.dataSchema,
        presentationSchema: args.presentationSchema,
        instructions: args.instructions,
      }),
    );

    if (response.outcome === 'REJECTED' || response.outcome === 'TECHNICAL_FAILURE') {
      throw new Error(response.issues[0]?.code ?? 'ERP_DOC_SCAN_FAILED');
    }
    if (response.outcome !== 'COMPLETED' && response.outcome !== 'REVIEW_REQUIRED') {
      throw new Error('ERP_DOC_SCAN_FAILED');
    }

    const validation = response.validation
      ? {
          state: response.validation.state,
          issues: response.validation.issues,
          importPolicy: (response.validation.importPolicy === 'STRICT' ? 'STRICT' : 'PARTIAL') as
            | 'STRICT'
            | 'PARTIAL',
        }
      : undefined;

    return {
      data: extractObject(response.data),
      definition: toReviewDefinition(args),
      validation,
      requestId: response.requestId,
    };
  }

  async scanAndMap<T>(args: ScanAndMapArgs<T>): Promise<Partial<T>> {
    const extractedResult = await this.extractForReview(args);
    const extracted = args.review
      ? await args.review(extractedResult)
      : extractedResult.data;
    if (!extracted) {
      throw new Error('ERP_DOC_SCAN_REVIEW_CANCELLED');
    }
    const lookups = args.lookups();
    const context = this.buildLookupContext(lookups);

    return args.mapper(extracted, context);
  }

  private buildLookupContext(lookups: LookupMap): DocScanLookupContext {
    return {
      lookups,
      resolveLookupId: (lookupKey: string, label?: string) => {
        if (!label) {
          return undefined;
        }

        const entries = lookups[lookupKey] ?? [];
        const normalized = normalizeText(label);

        return entries.find((entry) => {
          const entryLabel = normalizeText(entry.value);
          return entryLabel.includes(normalized) || normalized.includes(entryLabel);
        })?.key;
      },
      findByAliases,
      findStringByAliases,
      normalizeDate,
      normalizeText,
      toNumber,
      extractLines,
    };
  }
}
