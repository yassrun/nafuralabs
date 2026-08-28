/** Affichage portefeuille — au plus une décimale, calcul interne inchangé (AC-13). */
export function formatPercentDisplay(value: number | null | undefined): string {
  if (value == null || !Number.isFinite(value)) return '—';
  return `${value.toLocaleString('fr-FR', { minimumFractionDigits: 0, maximumFractionDigits: 1 })} %`;
}
