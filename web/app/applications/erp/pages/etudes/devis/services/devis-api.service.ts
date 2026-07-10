import { Injectable } from '@angular/core';
import { HttpParams } from '@angular/common/http';
import { firstValueFrom } from 'rxjs';

import { FeatureApiService } from '@lib/anatomy';
import type {
  Devis,
  DevisCreate,
  DevisUpdate,
  DevisVersion,
} from '@applications/erp/etudes/models';

@Injectable({ providedIn: 'root' })
export class DevisApiService extends FeatureApiService<Devis, DevisCreate, DevisUpdate> {
  protected override basePath = '/api/v1/etudes/devis';
  protected override searchFields = ['numero', 'objet', 'clientName'];

  async createFromDpgf(dpgfId: string): Promise<Devis> {
    const params = new HttpParams().set('dpgfId', dpgfId);
    return firstValueFrom(
      this.http.post<Devis>(this.resolveUrl(`${this.basePath}/from-dpgf`), {}, { params }),
    );
  }

  async listVersions(id: string): Promise<DevisVersion[]> {
    return this.get<DevisVersion[]>(`${this.basePath}/${id}/versions`);
  }

  async createVersion(id: string, modifications?: string): Promise<Devis> {
    return this.post<Devis>(`${this.basePath}/${id}/versions`, { modifications });
  }

  async submit(id: string): Promise<Devis> {
    return this.executeTransition<Devis>(id, 'submit');
  }

  async marquerGagne(id: string): Promise<Devis> {
    return this.executeTransition<Devis>(id, 'marquer-gagne');
  }
}
