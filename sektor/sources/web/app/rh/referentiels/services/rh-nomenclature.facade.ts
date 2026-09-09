import { Injectable, inject } from '@angular/core';

import { GridFacade } from '@platform/lib/anatomy';
import type { RhNomenclature, RhNomenclatureCreate, RhNomenclatureUpdate } from '@app/rh/models';
import { ErpAuditService } from '@app/socle/shell/erp-audit.service';

import { RhDepartementApiService, RhPosteApiService } from './rh-nomenclature-api.service';

@Injectable({ providedIn: 'root' })
export class RhPosteFacade extends GridFacade<RhNomenclature, RhNomenclatureCreate, RhNomenclatureUpdate> {
  protected override api = inject(RhPosteApiService);
  private readonly audit = inject(ErpAuditService);

  protected override onCreateSuccess(item: RhNomenclature): void {
    this.audit.log('CREATE', 'RH_POSTE', item.id, item.code, item.libelle);
  }

  protected override onUpdateSuccess(item: RhNomenclature): void {
    this.audit.log('UPDATE', 'RH_POSTE', item.id, item.code);
  }

  protected override onDeleteSuccess(): void {
    this.audit.log('DELETE', 'RH_POSTE', '—', 'Poste RH supprimé');
  }
}

@Injectable({ providedIn: 'root' })
export class RhDepartementFacade extends GridFacade<
  RhNomenclature,
  RhNomenclatureCreate,
  RhNomenclatureUpdate
> {
  protected override api = inject(RhDepartementApiService);
  private readonly audit = inject(ErpAuditService);

  protected override onCreateSuccess(item: RhNomenclature): void {
    this.audit.log('CREATE', 'RH_DEPARTEMENT', item.id, item.code, item.libelle);
  }

  protected override onUpdateSuccess(item: RhNomenclature): void {
    this.audit.log('UPDATE', 'RH_DEPARTEMENT', item.id, item.code);
  }

  protected override onDeleteSuccess(): void {
    this.audit.log('DELETE', 'RH_DEPARTEMENT', '—', 'Département RH supprimé');
  }
}
