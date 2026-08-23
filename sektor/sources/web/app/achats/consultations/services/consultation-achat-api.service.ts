import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { firstValueFrom } from 'rxjs';

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
  fichierNom?: string | null;
  createdAt?: string;
  lignes: ConsultationDevisLigne[];
}

export interface ConsultationAchat {
  id: string;
  numero: string;
  fournisseurId: string;
  fournisseurNom: string;
  clesStables: string[];
  dossierEtudeId: string | null;
  statut: string;
  devisRecus: number;
  devis?: ConsultationDevis[];
  createdAt?: string;
}

export interface ConsultationDevisLigneInput {
  identite?: string;
  libelle?: string;
  quantite?: number;
  unite?: string;
  prixUnitaire?: number;
}

export interface ConsultationDevisImport {
  fichierNom?: string;
  lignes: ConsultationDevisLigneInput[];
}

export interface ConsultationAchatCreate {
  fournisseurId: string;
  clesStables: string[];
  dossierEtudeId?: string | null;
}

export interface ConsultationAchatPanier {
  clesStables: string[];
  dossierEtudeId?: string | null;
}

@Injectable({ providedIn: 'root' })
export class ConsultationAchatApiService {
  private readonly http = inject(HttpClient);
  private readonly basePath = '/api/v1/consultations-achat';

  list(lien: ConsultationLienFilter = 'all'): Promise<ConsultationAchat[]> {
    let params = new HttpParams();
    if (lien !== 'all') {
      params = params.set('lien', lien);
    }
    return firstValueFrom(this.http.get<ConsultationAchat[]>(this.basePath, { params }));
  }

  create(body: ConsultationAchatCreate): Promise<ConsultationAchat> {
    return firstValueFrom(this.http.post<ConsultationAchat>(this.basePath, body));
  }

  getById(id: string): Promise<ConsultationAchat> {
    return firstValueFrom(this.http.get<ConsultationAchat>(`${this.basePath}/${id}`));
  }

  importDevis(id: string, body: ConsultationDevisImport): Promise<ConsultationAchat> {
    return firstValueFrom(
      this.http.post<ConsultationAchat>(`${this.basePath}/${id}/devis`, body),
    );
  }

  addToPanier(id: string, body: ConsultationAchatPanier): Promise<ConsultationAchat> {
    return firstValueFrom(
      this.http.patch<ConsultationAchat>(`${this.basePath}/${id}/panier`, body),
    );
  }
}
