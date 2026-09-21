import type { BadgeVariant } from '@platform/lib/anatomy/types';
import type { DossierEtude } from '@app/etudes/models';
import { normalizeStatutDossier } from './dossier-status.util';

const CLOS_POUR_DELAI = new Set([
  'FINAL_APPROVED',
  'ARCHIVED',
  'REJECTED',
]);

export type KindDelaiListing = 'EN_RETARD' | 'J7' | 'OK' | 'SANS_DATE' | 'CLOS';

function parseDate(value: string | null | undefined): Date | null {
  if (!value) return null;
  const day = value.slice(0, 10);
  if (!/^\d{4}-\d{2}-\d{2}$/.test(day)) return null;
  const [y, m, d] = day.split('-').map(Number);
  return new Date(y, m - 1, d);
}

function startOfDay(d: Date): Date {
  return new Date(d.getFullYear(), d.getMonth(), d.getDate());
}

function daysUntil(limite: Date, today: Date): number {
  const ms = startOfDay(limite).getTime() - startOfDay(today).getTime();
  return Math.round(ms / 86_400_000);
}

export function estOuvertPourDelai(status: string | null | undefined): boolean {
  const n = normalizeStatutDossier(status);
  return !!n && !CLOS_POUR_DELAI.has(n);
}

export function kindDelaiListing(
  item: Pick<DossierEtude, 'aoDateLimiteDepot' | 'status'>,
  today = new Date(),
): KindDelaiListing {
  const limite = parseDate(item.aoDateLimiteDepot ?? null);
  if (!limite) return 'SANS_DATE';
  if (!estOuvertPourDelai(item.status)) return 'CLOS';
  const n = daysUntil(limite, today);
  if (n < 0) return 'EN_RETARD';
  if (n <= 7) return 'J7';
  return 'OK';
}

export function joursAvantDepot(
  item: Pick<DossierEtude, 'aoDateLimiteDepot'>,
  today = new Date(),
): number | null {
  const limite = parseDate(item.aoDateLimiteDepot ?? null);
  if (!limite) return null;
  return daysUntil(limite, today);
}

export function labelDepotRestantHeader(
  item: Pick<DossierEtude, 'aoDateLimiteDepot' | 'status'>,
  today = new Date(),
): string {
  const kind = kindDelaiListing(item, today);
  const n = joursAvantDepot(item, today);
  if (kind === 'SANS_DATE' || n == null) return '—';
  if (kind === 'CLOS') return 'Clos';
  if (n === 0) return "Aujourd'hui";
  if (n > 0) return n === 1 ? '1 j restant' : `${n} j restants`;
  const late = Math.abs(n);
  return late === 1 ? '1 j de retard' : `${late} j de retard`;
}

export function labelDelaiListing(
  _value: unknown,
  item: unknown,
  today = new Date(),
): string {
  const row = item as Pick<DossierEtude, 'aoDateLimiteDepot' | 'status'>;
  const kind = kindDelaiListing(row, today);
  if (kind === 'EN_RETARD') return 'En retard';
  if (kind === 'J7') {
    const limite = parseDate(row.aoDateLimiteDepot ?? null);
    const n = limite ? daysUntil(limite, today) : 0;
    return n === 0 ? "Aujourd'hui" : `J-${n}`;
  }
  return '—';
}

export function variantDelaiListing(_value: unknown, item: unknown): BadgeVariant {
  const kind = kindDelaiListing(item as Pick<DossierEtude, 'aoDateLimiteDepot' | 'status'>);
  if (kind === 'EN_RETARD') return 'danger';
  if (kind === 'J7') return 'warning';
  return 'default';
}
