import { Injectable, inject } from '@angular/core';
import { TranslateService } from '@ngx-translate/core';

import { GridFacade } from '@platform/lib/anatomy';

import {
  ConsultationAchatApiService,
  type ConsultationAchat,
  type ConsultationAchatCreate,
  type ConsultationDevisImport,
} from './consultation-achat-api.service';

function destinatairesLabel(item: ConsultationAchat): string {
  const names = (item.destinataires ?? [])
    .map((d) => (d.fournisseurNom || '').trim())
    .filter(Boolean);
  return names.length ? `${names.join(', ')} (${names.length})` : '';
}

@Injectable({ providedIn: 'root' })
export class ConsultationFacade extends GridFacade<
  ConsultationAchat,
  ConsultationAchatCreate,
  Partial<ConsultationAchatCreate>
> {
  protected override api = inject(ConsultationAchatApiService);
  private readonly translate = inject(TranslateService);

  override async getItem(id: string): Promise<ConsultationAchat> {
    return this.enrich(await this.api.getById(id));
  }

  override async loadItems(query?: Parameters<GridFacade<ConsultationAchat>['loadItems']>[0]) {
    const response = await super.loadItems(query);
    const items = response.items.map((row) => this.enrich(row));
    this._items.set(items);
    return { ...response, items };
  }

  async importDevis(id: string, body: ConsultationDevisImport): Promise<ConsultationAchat> {
    return this.enrich(await this.api.importDevis(id, body));
  }

  enrich(item: ConsultationAchat): ConsultationAchat {
    const statut = (item.statut || '').toUpperCase();
    const statutKey =
      statut === 'COMPLETE'
        ? 'achats.consultation.statut.complete'
        : statut === 'PARTIELLE'
          ? 'achats.consultation.statut.partielle'
          : statut === 'OUVERTE'
            ? 'achats.consultation.statut.ouverte'
            : 'achats.consultation.statut.preparation';
    const statutLabel = this.translate.instant(statutKey);
    const lienEtude = item.dossierEtudeId
      ? this.translate.instant('achats.consultation.lien.liee')
      : this.translate.instant('achats.consultation.lien.hors');
    return { ...item, statutLabel, lienEtude, destinatairesLabel: destinatairesLabel(item) };
  }
}
