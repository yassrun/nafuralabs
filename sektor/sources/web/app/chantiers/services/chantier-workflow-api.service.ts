import { Injectable } from '@angular/core';
import { FeatureApiService } from '@platform/lib/anatomy';
import { ApiChantier } from './chantier.mapper';
import type { NatureLigne } from '@app/chantiers/models';

export interface WorkflowEvent { action: string; from: string; to: string; reference?: string; date?: string; documentId?: string; motif?: string; actor: string; recordedAt: string; }
export interface WorkflowReserve { id: string; label: string; responsable: string; echeance: string; status: string; preuve?: string; }
export interface WorkflowGarantie { id: string; label: string; kind: string; responsable: string; montant?: number; debut: string; echeance: string; status: string; documentId?: string; conditions: string; }
/** Vérification explicite du BDP chiffré retenue côté serveur. */
export interface WorkflowBdpValidation { empreinte: string; acteur: string; at: string; }
export interface ChantierWorkflow {
  chantier: ApiChantier;
  revision: number;
  blockers: string[];
  /** Pourquoi le BDP chiffré n'est pas encore validable (vide quand il l'est). */
  bdpManques: string[];
  availableActions: string[];
  canEdit: boolean;
  data: { dateDebutPrevue?: string; bdp?: WorkflowBdpValidation | null; history: WorkflowEvent[]; reserves: WorkflowReserve[]; garanties: WorkflowGarantie[] };
}
/** Une ligne du BDP chiffré, telle que le serveur la retient. */
export interface ChantierBdpLigne { id: string; lotId: string; code?: string; designation: string; unite?: string; nature: NatureLigne; quantite?: number; prixUnitaireHt?: number; montantHt?: number; }
export interface ChantierBdp { lignes: ChantierBdpLigne[]; manques: string[]; }
export interface WorkflowCommand { revision: number; action: string; [key: string]: unknown; }
@Injectable({ providedIn: 'root' })
export class ChantierWorkflowApiService extends FeatureApiService<ChantierWorkflow, never, never> {
  protected override basePath = '/api/v1/chantiers';
  load(id: string): Promise<ChantierWorkflow> { return this.get(`${this.basePath}/${id}/workflow`); }
  command(id: string, body: WorkflowCommand): Promise<ChantierWorkflow> { return this.post(`${this.basePath}/${id}/workflow`, body); }
  /** BDP chiffré du chantier : lignes vendues, montants et manques. */
  lireBdp(id: string): Promise<ChantierBdp> { return this.get(`${this.basePath}/${id}/bdp`); }
}
