import type { Currency, CurrencyCreate, CurrencyUpdate } from '../../pages/finance/configuration/currencies/models';
import type { ExchangeRate, ExchangeRateCreate, ExchangeRateUpdate } from '../../pages/finance/configuration/exchange-rates/models';
import type { Devise, DeviseCreate, DeviseUpdate, TauxChange, TauxChangeCreate, TauxChangeSource, TauxChangeUpdate } from '../models';

/** API row shape from `/api/v1/currencies` (includes BTP reference flag). */
export interface ApiCurrencyRow extends Currency {
  isReference?: boolean;
}

export function currencyToDevise(row: ApiCurrencyRow): Devise {
  return {
    id: row.id,
    code: row.code,
    symbole: row.symbol ?? row.code,
    libelle: row.name,
    isDeviseDeReference: row.isReference === true,
    precisionDecimales: row.decimalPlaces,
    isActive: row.isActive ?? true,
  };
}

export function deviseToCurrencyCreate(data: DeviseCreate): CurrencyCreate {
  return {
    code: data.code,
    name: data.libelle,
    symbol: data.symbole,
    decimalPlaces: data.precisionDecimales,
    isActive: data.isActive,
    isReference: data.isDeviseDeReference,
  } as CurrencyCreate & { isReference?: boolean };
}

export function deviseToCurrencyUpdate(data: DeviseUpdate): CurrencyUpdate & { isReference?: boolean } {
  const patch: CurrencyUpdate & { isReference?: boolean } = {};
  if (data.code !== undefined) patch.code = data.code;
  if (data.libelle !== undefined) patch.name = data.libelle;
  if (data.symbole !== undefined) patch.symbol = data.symbole;
  if (data.precisionDecimales !== undefined) patch.decimalPlaces = data.precisionDecimales;
  if (data.isActive !== undefined) patch.isActive = data.isActive;
  if (data.isDeviseDeReference !== undefined) patch.isReference = data.isDeviseDeReference;
  return patch;
}

export function buildCurrencyCodeMap(rows: ApiCurrencyRow[]): Map<string, string> {
  const map = new Map<string, string>();
  for (const row of rows) {
    map.set(row.id, row.code);
  }
  return map;
}

export function exchangeRateToTauxChange(
  row: ExchangeRate,
  codeById: Map<string, string>,
): TauxChange {
  return {
    id: row.id,
    deviseDeId: row.fromCurrencyId,
    deviseDeCode: codeById.get(row.fromCurrencyId),
    deviseVersId: row.toCurrencyId,
    deviseVersCode: codeById.get(row.toCurrencyId),
    dateValidite: row.effectiveDate,
    taux: Number(row.rate),
    source: (row.source as TauxChangeSource | undefined) ?? 'MANUEL',
    isActive: true,
  };
}

export function tauxChangeToExchangeRateCreate(
  data: TauxChangeCreate,
): ExchangeRateCreate {
  return {
    fromCurrencyId: data.deviseDeId,
    toCurrencyId: data.deviseVersId,
    rate: data.taux,
    effectiveDate: data.dateValidite,
    source: data.source,
  };
}

export function tauxChangeToExchangeRateUpdate(
  data: TauxChangeUpdate,
): ExchangeRateUpdate {
  const patch: ExchangeRateUpdate = {};
  if (data.deviseDeId !== undefined) patch.fromCurrencyId = data.deviseDeId;
  if (data.deviseVersId !== undefined) patch.toCurrencyId = data.deviseVersId;
  if (data.taux !== undefined) patch.rate = data.taux;
  if (data.dateValidite !== undefined) patch.effectiveDate = data.dateValidite;
  if (data.source !== undefined) patch.source = data.source;
  return patch;
}
