import type { LookupItem } from '@platform/lib/anatomy/types';

function readPartnerField(
  data: Record<string, unknown> | undefined,
  ...keys: string[]
): string {
  if (!data) {
    return '';
  }
  for (const key of keys) {
    const value = data[key];
    if (typeof value === 'string' && value.trim()) {
      return value.trim();
    }
  }
  return '';
}

/** Raison sociale only — never the partner code. */
export function partnerRaisonSociale(item: LookupItem): string {
  const data = item.data;
  const code = readPartnerField(data, 'code');
  let raison = readPartnerField(data, 'raisonSociale', 'raison_sociale', 'name', 'nom');
  if (!raison) {
    const fallback = String(item.value ?? '').trim();
    if (fallback && fallback !== code) {
      raison = fallback;
    }
  }
  if (code && raison.startsWith(`${code} — `)) {
    raison = raison.slice(code.length + 3).trim();
  }
  if (!raison || raison === code) {
    return '';
  }
  return raison;
}

/**
 * Hit / valeur posée : désignation en premier, code en secondaire (AC-4).
 * Interdit : code seul, ou `CODE — …` qui masque la raison sociale.
 */
export function partnerLookupLabel(item: LookupItem): string {
  const code = readPartnerField(item.data, 'code');
  const raison = partnerRaisonSociale(item);
  if (raison && code) {
    return `${raison} (${code})`;
  }
  return raison || code || String(item.key ?? '');
}

/** Snapshot nom (client / contact) depuis un libellé de lookup. */
export function partnerRaisonSocialeFromLabel(label: string | null | undefined): string {
  const raw = (label ?? '').trim().replace(/ \(à resélectionner\)$/, '');
  if (!raw) {
    return '';
  }
  if (raw.includes(' — ')) {
    return raw.split(' — ').slice(1).join(' — ').trim();
  }
  return raw.replace(/\s*\([A-Z0-9]{1,8}[-_/][A-Za-z0-9._-]{1,24}\)\s*$/i, '').trim() || raw;
}
