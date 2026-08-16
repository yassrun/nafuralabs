import { TestBed } from '@angular/core/testing';

import { TenantContextService } from '@platform/core/tenant/tenant.context';
import { ExtractionService } from '../../services/extraction.service';
import type {
  ExtractionDefinition,
  SmartImportSession,
} from '../models/smart-import.model';
import { SmartImportOrchestratorService } from './smart-import-orchestrator.service';

describe('SmartImportOrchestratorService', () => {
  let service: SmartImportOrchestratorService;

  const definition: ExtractionDefinition = {
    key: 'test',
    name: 'Test',
    arrayPath: 'rows',
    dataSchema: {
      type: 'object',
      required: ['rows'],
      properties: {
        rows: {
          type: 'array',
          items: {
            type: 'object',
            required: ['name'],
            properties: { name: { type: 'string' } },
          },
        },
      },
    },
    presentationSchema: {
      sections: [],
      arrays: [{ path: 'rows', title: 'Rows', columns: [] }],
    },
  };

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        SmartImportOrchestratorService,
        { provide: TenantContextService, useValue: { tenantId: () => 'tenant-1' } },
        { provide: ExtractionService, useValue: {} },
      ],
    });
    service = TestBed.inject(SmartImportOrchestratorService);
  });

  it('returns reviewed JSON containing accepted rows only', () => {
    const session: SmartImportSession = {
      definition,
      schema: {
        name: definition.name,
        jsonSchema: definition.dataSchema,
        uiSchema: definition.presentationSchema,
      },
      arrayPath: 'rows',
      config: {
        importPolicy: 'PARTIAL',
        acceptedExtensions: ['.pdf'],
        acceptedMimeTypes: ['application/pdf'],
        maxFileSizeBytes: 1024,
      },
      rows: [
        {
          sourceIndex: 0,
          data: { name: 'accepted' },
          originalData: { name: 'before' },
          label: 'accepted',
          status: 'READY',
          issues: [],
          corrected: true,
        },
        {
          sourceIndex: 1,
          data: { name: 'ignored' },
          originalData: { name: 'ignored' },
          label: 'ignored',
          status: 'IGNORED',
          issues: [],
          corrected: false,
        },
      ],
      phase: 'REVIEWING',
      rootData: { documentNumber: 'BL-1', rows: [] },
    };

    const result = service.finalize(session);

    expect(result.data).toEqual({ documentNumber: 'BL-1', rows: [{ name: 'accepted' }] });
    expect(result.acceptedRows).toEqual([{ name: 'accepted' }]);
    expect(result.ignoredRows).toEqual([{ name: 'ignored' }]);
    expect(result.corrected).toBe(1);
  });
});
