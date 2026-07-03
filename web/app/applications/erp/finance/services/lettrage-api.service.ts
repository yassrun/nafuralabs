import { Injectable } from '@angular/core';
import { HttpParams } from '@angular/common/http';
import { firstValueFrom } from 'rxjs';

import { FeatureApiService } from '@lib/anatomy';

import type { Lettrage, LettrageCandidateLigne, LettrageLigneKey } from '../models';

export interface ApiLettrageCandidate {
  ligneKey: string;
  ecritureId: string;
  ligneId: string;
  date: string;
  piece: string;
  libelle: string;
  debit: number;
  credit: number;
}

export interface ApiLettrage {
  id: string;
  codeLettrage: string;
  comptePcg: string;
  ligneKeys: string[];
  status: string;
  totalDebit: number;
  totalCredit: number;
  difference: number;
  createdAt: string;
}

export interface ApiLettrageAutoMatch {
  ligneKeys: string[];
}

function candidateToUi(row: ApiLettrageCandidate): LettrageCandidateLigne {
  return {
    ligneKey: row.ligneKey as LettrageLigneKey,
    ecritureId: row.ecritureId,
    ligneId: row.ligneId,
    date: row.date,
    piece: row.piece,
    libelle: row.libelle,
    debit: Number(row.debit),
    credit: Number(row.credit),
  };
}

function lettrageToUi(row: ApiLettrage): Lettrage {
  return {
    id: row.id,
    codeLettrage: row.codeLettrage,
    comptePcg: row.comptePcg,
    ligneKeys: row.ligneKeys as LettrageLigneKey[],
    status: row.status as Lettrage['status'],
    totalDebit: Number(row.totalDebit),
    totalCredit: Number(row.totalCredit),
    difference: Number(row.difference),
    createdAt: row.createdAt,
  };
}

@Injectable({ providedIn: 'root' })
export class LettrageApiService extends FeatureApiService<Lettrage, never, never> {
  protected override basePath = '/api/v1/lettrage';

  async listHistorique(): Promise<Lettrage[]> {
    const rows = await this.get<ApiLettrage[]>(this.basePath);
    return (rows ?? []).map(lettrageToUi);
  }

  async listNonLettrees(account: '3421' | '4411', partnerId?: string): Promise<LettrageCandidateLigne[]> {
    let params = new HttpParams().set('account', account);
    if (partnerId) params = params.set('partnerId', partnerId);
    const rows = await this.get<ApiLettrageCandidate[]>(`${this.basePath}/non-lettrees`, params);
    return (rows ?? []).map(candidateToUi);
  }

  async createLettrage(input: {
    ligneKeys: LettrageLigneKey[];
    comptePcg: string;
    tolerance?: number;
    allowPartiel?: boolean;
  }): Promise<Lettrage> {
    const row = await this.post<ApiLettrage>(this.basePath, {
      ligneKeys: input.ligneKeys,
      accountRadical: input.comptePcg,
      tolerance: input.tolerance,
      allowPartial: input.allowPartiel,
    });
    return lettrageToUi(row);
  }

  async autoMatch(account: '3421' | '4411', partnerId?: string): Promise<LettrageLigneKey[]> {
    const row = await this.post<ApiLettrageAutoMatch>(`${this.basePath}/auto-match`, {
      accountRadical: account,
      partnerId,
    });
    return (row.ligneKeys ?? []) as LettrageLigneKey[];
  }

  async deleteByCode(code: string): Promise<void> {
    await this.deleteRequest(`${this.basePath}/${encodeURIComponent(code)}`);
  }

  async downloadCsv(code: string): Promise<string> {
    return firstValueFrom(
      this.http.get(this.resolveUrl(`${this.basePath}/${encodeURIComponent(code)}/export.csv`), {
        responseType: 'text',
      }),
    );
  }
}
