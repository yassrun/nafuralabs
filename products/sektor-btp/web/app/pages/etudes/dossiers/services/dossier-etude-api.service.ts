import { Injectable } from '@angular/core';

import { FeatureApiService } from '@lib/anatomy';
import type {
  DossierEtude,
  DossierEtudeCreate,
  DossierEtudeUpdate,
  ResultatGate,
} from '@app/etudes/models';

@Injectable({ providedIn: 'root' })
export class DossierEtudeApiService extends FeatureApiService<
  DossierEtude,
  DossierEtudeCreate,
  DossierEtudeUpdate
> {
  protected override basePath = '/api/v1/etudes/dossiers';
  protected override searchFields = ['numero', 'objet', 'clientNom'];

  /**
   * État des cinq gates, sans transition.
   *
   * Le front ne rejoue jamais les règles : il les lit ici. C'est ce qui empêche la logique de
   * gate de diverger entre les deux côtés, comme c'était le cas dans le module supprimé.
   */
  gates(id: string): Promise<ResultatGate[]> {
    return this.get<ResultatGate[]>(`${this.basePath}/${id}/gates`);
  }

  allerAEtape(id: string, etape: number): Promise<DossierEtude> {
    return this.put<DossierEtude>(`${this.basePath}/${id}/etape`, { etape });
  }

  soumettre(id: string): Promise<DossierEtude> {
    return this.executeTransition(id, 'soumettre');
  }

  valider(id: string): Promise<DossierEtude> {
    return this.executeTransition(id, 'valider');
  }

  refuser(id: string, motif: string): Promise<DossierEtude> {
    return this.executeTransition(id, 'refuser', { motif });
  }

  annuler(id: string): Promise<DossierEtude> {
    return this.executeTransition(id, 'annuler');
  }
}
