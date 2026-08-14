import { Injectable } from '@angular/core';

import { FeatureApiService } from '@platform/lib/anatomy';

export interface ChantierAffectation {
  id: string;
  chantierId: string;
  employeId: string;
  employeNom?: string;
  employeMatricule?: string;
  userId?: string;
  roleCode: string;
  roleLabel?: string;
  dateDebut: string;
  dateFin?: string | null;
  isActive: boolean;
}

export interface ChantierAffectationCreate {
  employeId: string;
  roleCode: string;
  dateDebut: string;
  dateFin?: string | null;
}

export interface ChantierAffectationUpdate {
  roleCode?: string;
  dateDebut?: string;
  dateFin?: string | null;
  isActive?: boolean;
}

@Injectable({ providedIn: 'root' })
export class ChantierAffectationApiService extends FeatureApiService<
  ChantierAffectation,
  ChantierAffectationCreate,
  ChantierAffectationUpdate
> {
  protected override basePath = '/api/v1/chantiers';

  async listByChantier(chantierId: string): Promise<ChantierAffectation[]> {
    return this.get<ChantierAffectation[]>(`${this.basePath}/${chantierId}/affectations`);
  }

  async affectableRoles(chantierId: string): Promise<string[]> {
    return this.get<string[]>(`${this.basePath}/${chantierId}/affectations/roles`);
  }

  async createAffectation(
    chantierId: string,
    body: ChantierAffectationCreate,
  ): Promise<ChantierAffectation> {
    return this.post<ChantierAffectation>(`${this.basePath}/${chantierId}/affectations`, body);
  }

  async updateAffectation(
    chantierId: string,
    affectationId: string,
    body: ChantierAffectationUpdate,
  ): Promise<ChantierAffectation> {
    return this.put<ChantierAffectation>(
      `${this.basePath}/${chantierId}/affectations/${affectationId}`,
      body,
    );
  }

  async deactivate(chantierId: string, affectationId: string): Promise<void> {
    await this.deleteRequest(`${this.basePath}/${chantierId}/affectations/${affectationId}`);
  }
}
