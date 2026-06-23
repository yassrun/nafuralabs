import { Injectable, inject } from '@angular/core';

import type { Ecriture, EcritureCreate, LigneEcriture, MouvementTresorerie } from '../models';
import { JournalApiService } from './journal-api.service';
import { JournalEntryApiService } from './journal-entry-api.service';

const ACCOUNT_BANK = '5141';
const ACCOUNT_MISC_EXPENSE = '6147';
const ACCOUNT_MISC_INCOME = '7181';

export interface ReleveJournalEntryInput {
  date: string;
  libelle: string;
  reference?: string;
  recette: number;
  depense: number;
  compteFinancierId: string;
  compteFinancierLibelle?: string;
  glAccountCode?: string;
}

/**
 * Creates and posts a bank journal entry from an orphan bank statement line (rapprochement).
 */
@Injectable({ providedIn: 'root' })
export class TreasuryJournalEntryService {
  private readonly journalsApi = inject(JournalApiService);
  private readonly entriesApi = inject(JournalEntryApiService);

  async createFromReleveLine(input: ReleveJournalEntryInput): Promise<MouvementTresorerie> {
    const journals = await this.journalsApi.listAll();
    const bankJournal =
      journals.find((j) => j.type === 'BANQUE' && j.isActive) ??
      journals.find((j) => j.code === 'BQ');
    if (!bankJournal) {
      throw new Error('Aucun journal banque actif (BQ) configuré.');
    }

    const entryDate = input.date;
    const d = new Date(`${entryDate}T00:00:00`);
    const amount = Math.round((input.recette > 0 ? input.recette : input.depense) * 100) / 100;
    const bankAccount = input.glAccountCode?.trim() || ACCOUNT_BANK;
    const isExpense =
      input.depense > 0 &&
      (input.libelle.toLowerCase().includes('frais') ||
        input.libelle.toLowerCase().includes('commission') ||
        input.recette <= 0);

    const counterAccount = isExpense
      ? input.recette > 0
        ? ACCOUNT_MISC_INCOME
        : ACCOUNT_MISC_EXPENSE
      : input.recette > 0
        ? ACCOUNT_MISC_INCOME
        : ACCOUNT_MISC_EXPENSE;

    const lignes: LigneEcriture[] = isExpense
      ? [
          ligne(counterAccount, amount, 0, input.libelle),
          ligne(bankAccount, 0, amount, input.libelle),
        ]
      : [
          ligne(bankAccount, amount, 0, input.libelle),
          ligne(counterAccount, 0, amount, input.libelle),
        ];

    const draft: EcritureCreate = {
      journalCode: bankJournal.code,
      dateEcriture: entryDate,
      exercice: d.getFullYear(),
      periode: d.getMonth() + 1,
      reference: input.reference,
      libelle: input.libelle,
      status: 'BROUILLON',
      origine: 'AUTO_REGLEMENT',
      lignes,
    };

    const created = await this.entriesApi.createWithJournal(bankJournal.id, draft);
    const posted = await this.entriesApi.postEntry(created.id);
    return ecritureToMouvement(posted, input.compteFinancierId, input.compteFinancierLibelle);
  }
}

function ligne(
  compteCode: string,
  debit: number,
  credit: number,
  libelle: string,
): LigneEcriture {
  return {
    id: crypto.randomUUID(),
    ecritureId: '',
    ordre: 0,
    compteCode,
    debit,
    credit,
    libelle,
  };
}

function ecritureToMouvement(
  entry: Ecriture,
  compteFinancierId: string,
  compteFinancierLibelle?: string,
): MouvementTresorerie {
  const bankLine =
    entry.lignes.find((l) => l.compteCode.startsWith('514')) ?? entry.lignes[0];
  const recette = bankLine && bankLine.debit > 0 ? bankLine.debit : 0;
  const depense = bankLine && bankLine.credit > 0 ? bankLine.credit : 0;
  const lineId = bankLine?.id ?? entry.id;
  return {
    id: `${entry.id}::${lineId}`,
    numero: entry.numero,
    compteFinancierId,
    compteFinancierLibelle,
    date: entry.dateEcriture,
    type: depense > 0 ? 'AUTRE_DEPENSE' : 'AUTRE_RECETTE',
    modePaiement: 'VIREMENT',
    reference: entry.reference,
    recette,
    depense,
    libelle: entry.libelle,
    ecritureId: entry.id,
    createdAt: entry.dateEcriture,
  };
}
