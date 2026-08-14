import type {
  BalanceLigne,
  BalanceTotaux,
  Compte,
  CompteCreate,
  CompteUpdate,
  Ecriture,
  EcritureCreate,
  EcritureListItem,
  EcritureStatus,
  EcritureUpdate,
  Journal,
  JournalCreate,
  JournalSummary,
  JournalUpdate,
  LigneEcriture,
} from '../models';

export interface ApiChartOfAccount {
  id: string;
  code: string;
  name: string;
  accountClass: number;
  accountType: string;
  parentAccountCode?: string;
  isCollectif?: boolean;
  isLettrable?: boolean;
  isAuxiliaire?: boolean;
  axeAnalytiqueObligatoire?: boolean;
  isActive?: boolean;
}

export interface ApiAccountingJournal {
  id: string;
  code: string;
  name: string;
  journalType: string;
  defaultCounterpartCode?: string;
  isActive?: boolean;
}

export interface ApiJournalEntryLine {
  id?: string;
  lineNumber?: number;
  accountCode: string;
  accountLabel?: string;
  debit: number;
  credit: number;
  label?: string;
  analyticalAxis?: string;
  thirdPartyName?: string;
  dueDate?: string;
}

export interface ApiJournalEntry {
  id: string;
  entryNumber: string;
  journalId: string;
  journalCode: string;
  entryDate: string;
  fiscalYear: number;
  period: number;
  reference?: string;
  label: string;
  status: string;
  origin?: string;
  originId?: string;
  totalDebit: number;
  totalCredit: number;
  validatedAt?: string;
  notes?: string;
  lines?: ApiJournalEntryLine[];
}

export interface ApiJournalSummary {
  journalCode: string;
  journalName: string;
  journalType: string;
  totalDebit: number;
  totalCredit: number;
  balance: number;
  entryCount: number;
}

export interface ApiBalanceLine {
  accountCode: string;
  accountName: string;
  accountClass: number;
  accountType: string;
  openingDebit: number;
  openingCredit: number;
  periodDebit: number;
  periodCredit: number;
  closingDebit: number;
  closingCredit: number;
}

export interface ApiBalanceResponse {
  lines: ApiBalanceLine[];
  openingDebit: number;
  openingCredit: number;
  periodDebit: number;
  periodCredit: number;
  closingDebit: number;
  closingCredit: number;
}

export function accountToCompte(row: ApiChartOfAccount): Compte {
  return {
    id: row.id,
    code: row.code,
    libelle: row.name,
    classe: row.accountClass as Compte['classe'],
    type: row.accountType as Compte['type'],
    parentCompteCode: row.parentAccountCode,
    isCollectif: row.isCollectif ?? false,
    isLettrable: row.isLettrable ?? false,
    isAuxiliaire: row.isAuxiliaire ?? false,
    axeAnalytiqueObligatoire: row.axeAnalytiqueObligatoire ?? false,
    isActive: row.isActive ?? true,
  };
}

export function compteToAccountCreate(data: CompteCreate): Record<string, unknown> {
  return {
    code: data.code,
    name: data.libelle,
    accountClass: data.classe,
    accountType: data.type,
    parentAccountCode: data.parentCompteCode,
    isCollectif: data.isCollectif,
    isLettrable: data.isLettrable,
    isAuxiliaire: data.isAuxiliaire,
    axeAnalytiqueObligatoire: data.axeAnalytiqueObligatoire,
    isActive: data.isActive,
  };
}

export function compteToAccountUpdate(data: CompteUpdate): Record<string, unknown> {
  const patch: Record<string, unknown> = {};
  if (data.libelle !== undefined) patch['name'] = data.libelle;
  if (data.classe !== undefined) patch['accountClass'] = data.classe;
  if (data.type !== undefined) patch['accountType'] = data.type;
  if (data.parentCompteCode !== undefined) patch['parentAccountCode'] = data.parentCompteCode;
  if (data.isCollectif !== undefined) patch['isCollectif'] = data.isCollectif;
  if (data.isLettrable !== undefined) patch['isLettrable'] = data.isLettrable;
  if (data.isAuxiliaire !== undefined) patch['isAuxiliaire'] = data.isAuxiliaire;
  if (data.axeAnalytiqueObligatoire !== undefined) {
    patch['axeAnalytiqueObligatoire'] = data.axeAnalytiqueObligatoire;
  }
  if (data.isActive !== undefined) patch['isActive'] = data.isActive;
  return patch;
}

export function journalToApi(row: ApiAccountingJournal): Journal {
  return {
    id: row.id,
    code: row.code,
    libelle: row.name,
    type: row.journalType as Journal['type'],
    contrePartieDefautCode: row.defaultCounterpartCode,
    isActive: row.isActive ?? true,
  };
}

export function journalCreateToApi(data: JournalCreate): Record<string, unknown> {
  return {
    code: data.code,
    name: data.libelle,
    journalType: data.type,
    defaultCounterpartCode: data.contrePartieDefautCode,
    isActive: data.isActive,
  };
}

export function journalUpdateToApi(data: JournalUpdate): Record<string, unknown> {
  const patch: Record<string, unknown> = {};
  if (data.libelle !== undefined) patch['name'] = data.libelle;
  if (data.type !== undefined) patch['journalType'] = data.type;
  if (data.contrePartieDefautCode !== undefined) {
    patch['defaultCounterpartCode'] = data.contrePartieDefautCode;
  }
  if (data.isActive !== undefined) patch['isActive'] = data.isActive;
  return patch;
}

export function entryToEcriture(row: ApiJournalEntry): Ecriture {
  return {
    id: row.id,
    numero: row.entryNumber,
    journalCode: row.journalCode,
    dateEcriture: row.entryDate,
    exercice: row.fiscalYear,
    periode: row.period,
    reference: row.reference,
    libelle: row.label,
    status: row.status as EcritureStatus,
    origine: row.origin as Ecriture['origine'],
    origineId: row.originId,
    totalDebit: Number(row.totalDebit),
    totalCredit: Number(row.totalCredit),
    validationDate: row.validatedAt?.slice(0, 10),
    notes: row.notes,
    lignes: (row.lines ?? []).map((line) => lineToLigneEcriture(row.id, line)),
  };
}

export function entryToListItem(row: ApiJournalEntry): EcritureListItem {
  const ec = entryToEcriture(row);
  const { lignes, ...rest } = ec;
  return { ...rest, nbLignes: lignes?.length ?? 0 };
}

function lineToLigneEcriture(ecritureId: string, line: ApiJournalEntryLine): LigneEcriture {
  return {
    id: line.id ?? `${ecritureId}-l${line.lineNumber ?? 0}`,
    ecritureId,
    ordre: line.lineNumber ?? 0,
    compteCode: line.accountCode,
    compteLibelle: line.accountLabel,
    debit: Number(line.debit),
    credit: Number(line.credit),
    libelle: line.label ?? '',
    axeAnalytique: line.analyticalAxis,
    tiersName: line.thirdPartyName,
    echeance: line.dueDate,
  };
}

export function ecritureCreateToApi(data: EcritureCreate, journalId: string): Record<string, unknown> {
  return {
    journalId,
    journalCode: data.journalCode,
    entryDate: data.dateEcriture,
    fiscalYear: data.exercice,
    period: data.periode,
    reference: data.reference,
    label: data.libelle,
    status: data.status,
    origin: data.origine,
    originId: data.origineId,
    notes: data.notes,
    lines: (data.lignes ?? []).map((l, index) => ligneToApi(l, index + 1)),
  };
}

export function ecritureUpdateToApi(data: EcritureUpdate): Record<string, unknown> {
  const patch: Record<string, unknown> = {};
  if (data.journalCode !== undefined) patch['journalCode'] = data.journalCode;
  if (data.dateEcriture !== undefined) patch['entryDate'] = data.dateEcriture;
  if (data.exercice !== undefined) patch['fiscalYear'] = data.exercice;
  if (data.periode !== undefined) patch['period'] = data.periode;
  if (data.reference !== undefined) patch['reference'] = data.reference;
  if (data.libelle !== undefined) patch['label'] = data.libelle;
  if (data.notes !== undefined) patch['notes'] = data.notes;
  if (data.lignes !== undefined) {
    patch['lines'] = data.lignes.map((l, index) => ligneToApi(l, index + 1));
  }
  return patch;
}

function ligneToApi(line: LigneEcriture, ordre: number): Record<string, unknown> {
  return {
    lineNumber: line.ordre ?? ordre,
    accountCode: line.compteCode,
    accountLabel: line.compteLibelle,
    debit: line.debit,
    credit: line.credit,
    label: line.libelle,
    analyticalAxis: line.axeAnalytique,
    thirdPartyName: line.tiersName,
    dueDate: line.echeance,
  };
}

export function summaryToJournalSummary(row: ApiJournalSummary): JournalSummary {
  return {
    journalCode: row.journalCode,
    journalLibelle: row.journalName,
    type: row.journalType as JournalSummary['type'],
    totalDebit: Number(row.totalDebit),
    totalCredit: Number(row.totalCredit),
    solde: Number(row.balance),
    nbEcritures: Number(row.entryCount),
  };
}

export function balanceToUi(response: ApiBalanceResponse): {
  lignes: BalanceLigne[];
  totaux: BalanceTotaux;
} {
  const lignes: BalanceLigne[] = response.lines.map((row) => ({
    compteCode: row.accountCode,
    compteLibelle: row.accountName,
    classe: row.accountClass as BalanceLigne['classe'],
    type: row.accountType as BalanceLigne['type'],
    reportsDebit: Number(row.openingDebit),
    reportsCredit: Number(row.openingCredit),
    mouvementsDebit: Number(row.periodDebit),
    mouvementsCredit: Number(row.periodCredit),
    soldeDebit: Number(row.closingDebit),
    soldeCredit: Number(row.closingCredit),
  }));
  return {
    lignes,
    totaux: {
      reportsDebit: Number(response.openingDebit),
      reportsCredit: Number(response.openingCredit),
      mouvementsDebit: Number(response.periodDebit),
      mouvementsCredit: Number(response.periodCredit),
      soldeDebit: Number(response.closingDebit),
      soldeCredit: Number(response.closingCredit),
    },
  };
}
