import { Injectable } from '@angular/core';
import { HttpParams } from '@angular/common/http';
import { firstValueFrom } from 'rxjs';

import { FeatureApiService } from '@lib/anatomy';
import type {
  Devis,
  DevisCreate,
  DevisUpdate,
  DevisVersion,
} from '@app/etudes/models';

@Injectable({ providedIn: 'root' })
export class DevisApiService extends FeatureApiService<Devis, DevisCreate, DevisUpdate> {
  protected override basePath = '/api/v1/etudes/devis';
  protected override searchFields = ['numero', 'objet', 'clientName'];

  async createFromDpgf(dpgfId: string, clientId: string): Promise<Devis> {
    const params = new HttpParams().set('dpgfId', dpgfId).set('clientId', clientId);
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

  async negotiate(id: string): Promise<Devis> {
    return this.executeTransition<Devis>(id, 'negotiate');
  }

  async approve(id: string): Promise<Devis> {
    return this.executeTransition<Devis>(id, 'approve');
  }

  async lose(id: string, motif: string): Promise<Devis> {
    return this.post<Devis>(`${this.basePath}/${id}/lose`, { motif, note: motif });
  }

  async cancel(id: string): Promise<Devis> {
    return this.executeTransition<Devis>(id, 'cancel');
  }

  /** @deprecated use approve */
  async marquerGagne(id: string): Promise<Devis> {
    return this.approve(id);
  }
}
