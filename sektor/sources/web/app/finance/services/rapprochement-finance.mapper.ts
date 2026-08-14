import type {
  CompteFinancier,
  MouvementTresorerie,
  Rapprochement,
  RapprochementCreate,
  RapprochementLigneReleve,
  RapprochementStatus,
  RapprochementUpdate,
} from '../models';

export interface ApiBankAccount {
  id: string;
  code: string;
  name: string;
  accountType: string;
  bankName?: string;
  rib?: string;
  branch?: string;
  currencyCode: string;
  glAccountCode?: string;
  openingBalance: number;
  currentBalance?: number;
  isActive: boolean;
  notes?: string;
}

export interface ApiBankStatementLine {
  id: string;
  bankStatementId?: string;
  lineDate: string;
  label: string;
  reference?: string;
  receiptAmount: number;
  paymentAmount: number;
  matchedJournalEntryId?: string;
  matchedJournalEntryLineId?: string;
  matchedMouvementRef?: string;
  matchStatus: string;
}

export interface ApiBankStatement {
  id: string;
  statementNumber: string;
  bankAccountId: string;
  bankAccountName?: string;
  periodStart: string;
  periodEnd: string;
  openingBalanceAccounting: number;
  closingBalanceAccounting: number;
  closingBalanceStatement: number;
  variance: number;
  status: string;
  importedFileName?: string;
  notes?: string;
  createdAt?: string;
  lines?: ApiBankStatementLine[];
  matchedMouvementRefs?: string[];
}

export interface ApiMovementCandidate {
  id: string;
  numero: string;
  date: string;
  libelle: string;
  reference?: string;
  recette: number;
  depense: number;
  journalEntryId: string;
  journalEntryLineId: string;
}

export function bankAccountToCompte(row: ApiBankAccount): CompteFinancier {
  return {
    id: row.id,
    code: row.code,
    libelle: row.name,
    type: row.accountType === 'CAISSE' ? 'CAISSE' : 'BANQUE',
    banque: row.bankName,
    rib: row.rib,
    agence: row.branch,
    devise: row.currencyCode,
    compteCgncCode: row.glAccountCode ?? '5141',
    soldeInitial: Number(row.openingBalance),
    soldeActuel: Number(row.currentBalance ?? row.openingBalance),
    isActive: row.isActive,
    notes: row.notes,
  };
}

export function statementLineToUi(
  row: ApiBankStatementLine,
  rapprochementId: string,
): RapprochementLigneReleve {
  return {
    id: row.id,
    rapprochementId,
    date: row.lineDate,
    libelle: row.label,
    reference: row.reference,
    recette: Number(row.receiptAmount),
    depense: Number(row.paymentAmount),
    matchedMouvementId: row.matchedMouvementRef,
  };
}

export function statementToRapprochement(row: ApiBankStatement): Rapprochement {
  const lignes = (row.lines ?? []).map((l) => statementLineToUi(l, row.id));
  return {
    id: row.id,
    numero: row.statementNumber,
    compteFinancierId: row.bankAccountId,
    compteFinancierLibelle: row.bankAccountName,
    dateDebut: row.periodStart,
    dateFin: row.periodEnd,
    soldeDebutComptable: Number(row.openingBalanceAccounting),
    soldeFinComptable: Number(row.closingBalanceAccounting),
    soldeFinReleve: Number(row.closingBalanceStatement),
    ecart: Number(row.variance),
    status: row.status as RapprochementStatus,
    notes: row.notes,
    lignesReleve: lignes,
    mouvementsRapprochesIds: row.matchedMouvementRefs ?? [],
  };
}

export function movementCandidateToUi(row: ApiMovementCandidate): MouvementTresorerie {
  return {
    id: row.id,
    numero: row.numero,
    compteFinancierId: '',
    date: row.date,
    type: 'AUTRE_RECETTE',
    modePaiement: 'VIREMENT',
    reference: row.reference,
    recette: Number(row.recette),
    depense: Number(row.depense),
    libelle: row.libelle,
    ecritureId: row.journalEntryId,
    createdAt: row.date,
  };
}

export function rapprochementToSavePayload(
  input: RapprochementCreate | RapprochementUpdate,
  pairs: { mouvementId: string; releveLigneId: string }[],
): Record<string, unknown> {
  const pairByLine = new Map(pairs.map((p) => [p.releveLigneId, p.mouvementId]));
  const lignes = input.lignesReleve ?? [];
  return {
    bankAccountId: input.compteFinancierId,
    periodStart: input.dateDebut,
    periodEnd: input.dateFin,
    openingBalanceAccounting: input.soldeDebutComptable,
    closingBalanceAccounting: input.soldeFinComptable,
    closingBalanceStatement: input.soldeFinReleve,
    variance: input.ecart,
    status: input.status,
    notes: input.notes,
    lines: lignes.map((l) => {
      const mvtRef = pairByLine.get(l.id) ?? l.matchedMouvementId;
      return {
        id: isUuid(l.id) ? l.id : undefined,
        lineDate: l.date,
        label: l.libelle,
        reference: l.reference,
        receiptAmount: l.recette,
        paymentAmount: l.depense,
        mouvementRef: mvtRef,
      };
    }),
  };
}

function isUuid(value: string): boolean {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(
    value,
  );
}
