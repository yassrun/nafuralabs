import { TestBed } from '@angular/core/testing';

import {
  ChantierLotApiService,
  type ChantierLotTreeResponse,
} from '@app/features/chantiers/pages/services/chantier-lot-api.service';
import {
  LOT_CHANTIER_IMPORT_DEFINITION,
  LotChantierImportService,
} from './lot-chantier-import.handler';

describe('LotChantierImportService', () => {
  let importer: LotChantierImportService;
  let lotApi: jasmine.SpyObj<ChantierLotApiService>;

  beforeEach(() => {
    lotApi = jasmine.createSpyObj<ChantierLotApiService>('ChantierLotApiService', [
      'listByChantier',
      'createTree',
    ]);
    lotApi.listByChantier.and.resolveTo([]);
    lotApi.createTree.and.callFake(
      async (_chantierId, request): Promise<ChantierLotTreeResponse> => ({
        lots: [{
          id: 'root-1',
          chantierId: 'ch-001',
          code: '01',
          designation: request.lots[0]?.designation ?? '',
          avancementPercent: 0,
          ordre: 1,
          depth: 0,
          children: [],
          postes: [],
        }],
      }),
    );

    TestBed.configureTestingModule({
      providers: [
        LotChantierImportService,
        { provide: ChantierLotApiService, useValue: lotApi },
      ],
    });
    importer = TestBed.inject(LotChantierImportService);
  });

  it('maps reviewed JSON to the one-shot tree API', async () => {
    const result = await importer.import('ch-001', {
      lots: [{
        designation: 'Revêtement sol',
        postes: [{
          designation: 'Carreaux RDC',
          unite: 'm²',
          quantite: 100,
          prixUnitaireHt: 1000,
        }],
        children: [{
          designation: 'Revêtement sous-sol',
          postes: [{ designation: 'Carreaux sous-sol', quantite: 92, prixUnitaireHt: 650 }],
        }],
      }],
    });

    expect(result.created).toBe(1);
    const treeArg = lotApi.createTree.calls.argsFor(0)[1];
    expect(treeArg.lots[0]).toEqual(jasmine.objectContaining({
      designation: 'Revêtement sol',
      postes: [jasmine.objectContaining({ designation: 'Carreaux RDC', montantHt: 100000 })],
      children: [jasmine.objectContaining({ designation: 'Revêtement sous-sol' })],
    }));
    expect(JSON.stringify(treeArg)).not.toContain('"code"');
  });

  it('keeps the screen context explicit and skips existing roots', async () => {
    lotApi.listByChantier.and.resolveTo([{
      id: 'root-1',
      chantierId: 'ch-001',
      code: '01',
      designation: 'Revêtement sol',
      avancementPercent: 0,
      ordre: 1,
    }]);

    const result = await importer.import('ch-001', {
      lots: [{ designation: 'REVÊTEMENT SOL' }],
    });

    expect(result.skippedDuplicates).toBe(1);
    expect(lotApi.createTree).not.toHaveBeenCalled();
    expect(LOT_CHANTIER_IMPORT_DEFINITION.dedupeKey?.({
      designation: 'REVÊTEMENT SOL',
    })).toBe('revetement sol');
  });
});
