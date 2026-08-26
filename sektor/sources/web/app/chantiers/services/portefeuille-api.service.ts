import { Injectable } from '@angular/core';
import { FeatureApiService } from '@platform/lib/anatomy';

/** Ligne de portefeuille — mêmes faits que le cockpit (AC-18). */
export interface PortefeuilleRow {
  id: string;
  code: string;
  nom: string;
  client?: string | null;
  status: string;
  responsable?: string | null;
  avancementPercent?: number | null;
  joursRestantsOuRetard?: number | null;
  enRetard: boolean;
  montantVenteActifHt?: number | null;
  budgetReviseHt?: number | null;
  margeProjeteeHt?: number | null;
  margeProjeteePct?: number | null;
  alerteCode?: string | null;
  alerteSeverite?: string | null;
  prochaineAction?: { priorite: number; libelle: string; route: string; permission?: string | null } | null;
}

export interface PortefeuillePage {
  items: PortefeuilleRow[];
  total: number;
  page: number;
  size: number;
  financeAutorisee: boolean;
}

export interface PortefeuilleQuery {
  recherche?: string;
  status?: string;
  severiteAlerte?: string;
  responsable?: string;
  enRetard?: boolean;
  margeNegative?: boolean;
  tri?: string;
  sens?: string;
  page?: number;
  size?: number;
}

@Injectable({ providedIn: 'root' })
export class PortefeuilleApiService extends FeatureApiService<PortefeuilleRow, never, never> {
  protected override basePath = '/api/v1/chantiers/portefeuille';

  /** Filtres/tris serveur, pagination stable — l'état de la page est conservé par l'URL. */
  async lister(q: PortefeuilleQuery): Promise<PortefeuillePage> {
    const params = new URLSearchParams();
    if (q.recherche) params.set('recherche', q.recherche);
    if (q.status) params.set('status', q.status);
    if (q.severiteAlerte) params.set('severiteAlerte', q.severiteAlerte);
    if (q.responsable) params.set('responsable', q.responsable);
    if (q.enRetard != null) params.set('enRetard', String(q.enRetard));
    if (q.margeNegative != null) params.set('margeNegative', String(q.margeNegative));
    if (q.tri) params.set('tri', q.tri);
    if (q.sens) params.set('sens', q.sens);
    params.set('page', String(q.page ?? 0));
    params.set('size', String(q.size ?? 20));
    const query = params.toString();
    return this.get<PortefeuillePage>(`${this.basePath}${query ? '?' + query : ''}`);
  }
}
