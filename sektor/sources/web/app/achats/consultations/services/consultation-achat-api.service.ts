import { Injectable } from '@angular/core';

import { FeatureApiService } from '@platform/lib/anatomy';
import type { ListQuery, ListResponse } from '@platform/lib/anatomy/types';

export type ConsultationLienFilter = 'all' | 'hors' | 'liee';

export interface ConsultationDevisLigne {
  id?: string;
  identite?: string;
  libelle?: string;
  quantite?: number;
  unite?: string;
  prixUnitaire?: number;
}

export interface ConsultationDevis {
  id: string;
  destinataireId?: string;
  fichierNom?: string | null;
  createdAt?: string;
  lignes: ConsultationDevisLigne[];
}

export interface ConsultationDestinataire {
  id: string;
  fournisseurId: string;
  fournisseurNom: string;
  contactId: string;
  contactEmail: string;
  statut: string;
}

export interface ConsultationEnvoi {
  id: string;
  destinataireId: string;
  destinataireNom: string;
  email: string;
  sentAt: string;
}

export interface PartnerContactRow {
  id: string;
  partnerId: string;
  nom: string;
  email?: string | null;
}

export interface ConsultationAchat {
  id: string;
  numero: string;
  /** Plus une vérité unique (AC-3). Overlay 139 peut encore lire un champ vide. */
  fournisseurId?: string;
  fournisseurNom?: string;
  clesStables: string[];
  dossierEtudeId: string | null;
  statut: string;
  devisRecus: number;
  devis?: ConsultationDevis[];
  destinataires?: ConsultationDestinataire[];
  envois?: ConsultationEnvoi[];
  createdAt?: string;
  /** UI-only (detail / listing anatomy) */
  statutLabel?: string;
  lienEtude?: string;
  destinatairesLabel?: string;
}

export interface ConsultationDevisLigneInput {
  identite?: string;
  libelle?: string;
  quantite?: number;
  unite?: string;
  prixUnitaire?: number;
}

export interface ConsultationDevisImport {
  destinataireId: string;
  fichierNom?: string;
  lignes: ConsultationDevisLigneInput[];
}

export interface ConsultationAchatCreate {
  clesStables: string[];
  dossierEtudeId?: string | null;
  /** Ignoré côté API (AC-3). Overlay 139 peut encore le poster. */
  fournisseurId?: string;
}

export interface ConsultationDestinataireCreate {
  fournisseurId: string;
  contactId?: string;
}

export interface ConsultationAchatPanier {
  clesStables: string[];
  dossierEtudeId?: string | null;
}

interface ConsultationQuery extends ListQuery {
  lien?: ConsultationLienFilter | string;
  quick?: ConsultationLienFilter | string;
}

@Injectable({ providedIn: 'root' })
export class ConsultationAchatApiService extends FeatureApiService<
  ConsultationAchat,
  ConsultationAchatCreate,
  Partial<ConsultationAchatCreate>
> {
  protected override basePath = '/api/v1/consultations-achat';
  protected override searchFields = ['numero', 'destinatairesLabel'];

  override async getAll(query?: ListQuery): Promise<ListResponse<ConsultationAchat>> {
    const q = (query ?? {}) as ConsultationQuery;
    const lienRaw = String(q.lien ?? q.quick ?? 'all');
    const lien: ConsultationLienFilter =
      lienRaw === 'hors' || lienRaw === 'liee' ? lienRaw : 'all';

    let params = this.buildQueryParams({
      ...q,
      search: q['search'] as string | undefined,
    });
    // Drop chip/filter aliases that the backend does not understand.
    params = params.delete('lien').delete('quick');
    if (lien !== 'all') {
      params = params.set('lien', lien);
    }

    const rows = await this.get<ConsultationAchat[]>(this.basePath, params);
    const items = rows ?? [];
    return { items, total: items.length };
  }

  /** Compat overlay étude / create — filtre lien direct. */
  list(lien: ConsultationLienFilter = 'all'): Promise<ConsultationAchat[]> {
    return this.getAll({ lien } as ListQuery).then((r) => r.items);
  }

  importDevis(id: string, body: ConsultationDevisImport): Promise<ConsultationAchat> {
    return this.post<ConsultationAchat>(`${this.basePath}/${id}/devis`, body);
  }

  addToPanier(id: string, body: ConsultationAchatPanier): Promise<ConsultationAchat> {
    return this.patchRequest<ConsultationAchat>(`${this.basePath}/${id}/panier`, body);
  }

  addDestinataire(id: string, body: ConsultationDestinataireCreate): Promise<ConsultationAchat> {
    return this.post<ConsultationAchat>(`${this.basePath}/${id}/destinataires`, body);
  }

  envoyer(id: string): Promise<ConsultationAchat> {
    return this.post<ConsultationAchat>(`${this.basePath}/${id}/envoyer`, {});
  }

  listPartnerContacts(partnerId: string): Promise<PartnerContactRow[]> {
    return this.get<PartnerContactRow[]>(`/api/v1/partners/${partnerId}/contacts`);
  }
}
