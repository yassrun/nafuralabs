import { Injectable, inject } from '@angular/core';
import { firstValueFrom } from 'rxjs';

import { TenantContextService } from '@platform/core/tenant/tenant.context';
import { DocTypeService } from '@platform/features/documents/doc-extractor/services/doc-type.service';
import { ExtractionService } from '@platform/features/documents/doc-extractor/services/extraction.service';

import type { DocScanLookupContext, LookupMap, ScanAndMapArgs } from '../models/doc-scan.types';
import {
  extractLines,
  extractObject,
  findByAliases,
  findStringByAliases,
  normalizeDate,
  normalizeText,
  toNumber,
} from '../utils/extraction-json.utils';

@Injectable({ providedIn: 'root' })
export class ErpDocScanService {
  private readonly tenantContext = inject(TenantContextService);
  private readonly docTypeService = inject(DocTypeService);
  private readonly extractionService = inject(ExtractionService);

  async extractJson(args: { file: File; domainKey: string; docTypeKey: string }): Promise<Record<string, unknown>> {
    const tenantId = this.tenantContext.tenantId();
    if (!tenantId) {
      throw new Error('ERP_DOC_SCAN_TENANT_MISSING');
    }

    const definition = await firstValueFrom(
      this.docTypeService.getActiveDefinition(args.domainKey, args.docTypeKey, tenantId),
    );

    const response = await firstValueFrom(
      this.extractionService.extract({
        file: args.file,
        docTypeDefinitionId: definition.id,
        persist: false,
      }),
    );

    if (response.status === 'FAILED') {
      throw new Error('ERP_DOC_SCAN_FAILED');
    }

    return extractObject(response.extractedJson);
  }

  async scanAndMap<T>(args: ScanAndMapArgs<T>): Promise<Partial<T>> {
    const extracted = await this.extractJson({
      file: args.file,
      domainKey: args.domainKey,
      docTypeKey: args.docTypeKey,
    });
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
