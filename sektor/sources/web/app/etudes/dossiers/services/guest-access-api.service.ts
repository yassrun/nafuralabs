import { Injectable } from '@angular/core';
import { HttpParams } from '@angular/common/http';
import { firstValueFrom } from 'rxjs';

import { FeatureApiService } from '@platform/lib/anatomy';

import type { ComposantDPU, NoeudDPGF, PrixDPU } from '@app/etudes/models';

export type GuestPurpose = 'CLIENT_VIEW' | 'FOURNISSEUR_UPLOAD';

export interface GuestComposant {
  id?: string | null;
  type?: string | null;
  designation?: string | null;
  unite?: string | null;
  quantite?: number | null;
  prixUnitaire?: number | null;
  total?: number | null;
}

export interface GuestDpu {
  id?: string | null;
  deboursSec?: number | null;
  fraisGenerauxPercent?: number | null;
  margeBeneficiairePercent?: number | null;
  prixVenteHt?: number | null;
  tvaTaux?: number | null;
  composants?: GuestComposant[];
}

export interface GuestNoeud extends NoeudDPGF {
  dpu?: GuestDpu | null;
  descriptifCps?: string | null;
  composants?: GuestComposant[];
  enfants?: GuestNoeud[];
}

export interface GuestSnapshot {
  purpose: GuestPurpose | string;
  email: string;
  numero: string;
  objet: string;
  clientNom?: string | null;
  tenantNom?: string | null;
  dossierId?: string | null;
  dpgfId?: string | null;
  totalHt?: number | null;
  expiresAt?: string | null;
  arbre?: GuestNoeud[];
}

export interface GuestComment {
  id: string;
  author: string;
  body: string;
  createdAt?: string | null;
}

export interface GuestLinkCreated {
  token: string;
  email: string;
  purpose: GuestPurpose | string;
  expiresAt: string;
}

export interface GuestLinkCreate {
  email: string;
  purpose: GuestPurpose;
  daysValid?: number;
}

export function guestArbreToNoeuds(nodes: GuestNoeud[] | undefined): NoeudDPGF[] {
  return (nodes ?? []).map((n) => ({
    ...n,
    id: n.id ?? '',
    type: ((n.type ?? 'LOT').toUpperCase() as NoeudDPGF['type']),
    code: n.code ?? '',
    libelle: n.libelle ?? '',
    enfants: guestArbreToNoeuds(n.enfants),
  }));
}

export function guestDpuToPrix(dpu: GuestDpu | null | undefined, noeudId?: string): PrixDPU | null {
  if (!dpu) return null;
  const composants: ComposantDPU[] = (dpu.composants ?? []).map((c, i) => ({
    id: c.id ?? `g-${i}`,
    type: (c.type as ComposantDPU['type']) ?? 'MATIERE',
    referenceType: 'LIBRE',
    libelle: c.designation ?? '',
    quantite: Number(c.quantite ?? 0),
    unite: c.unite ?? '',
    prixUnitaire: Number(c.prixUnitaire ?? 0),
    total: Number(c.total ?? 0),
  }));
  return {
    id: dpu.id ?? undefined,
    dpgfNoeudId: noeudId,
    composants,
    deboursSec: Number(dpu.deboursSec ?? 0),
    fraisGenerauxPercent: Number(dpu.fraisGenerauxPercent ?? 0),
    margeBeneficiairePercent: Number(dpu.margeBeneficiairePercent ?? 0),
    prixVenteHT: Number(dpu.prixVenteHt ?? 0),
    prixVenteTTC: 0,
    tvaTaux: Number(dpu.tvaTaux ?? 20),
  };
}

@Injectable({ providedIn: 'root' })
export class GuestAccessApiService extends FeatureApiService<GuestSnapshot> {
  protected override basePath = '/api/public/guest-links';

  resolve(token: string): Promise<GuestSnapshot> {
    return this.get<GuestSnapshot>(`${this.basePath}/${encodeURIComponent(token)}`);
  }

  async deposerDevis(token: string, file: File): Promise<void> {
    const form = new FormData();
    form.append('file', file);
    await firstValueFrom(
      this.http.post(this.resolveUrl(`${this.basePath}/${encodeURIComponent(token)}/devis`), form),
    );
  }

  listComments(token: string, noeudId: string): Promise<GuestComment[]> {
    const params = new HttpParams().set('noeudId', noeudId);
    return this.get<GuestComment[]>(`${this.basePath}/${encodeURIComponent(token)}/comments`, params);
  }

  addComment(token: string, noeudId: string, text: string): Promise<GuestComment> {
    return this.post<GuestComment>(`${this.basePath}/${encodeURIComponent(token)}/comments`, {
      noeudId,
      text,
    });
  }
}
