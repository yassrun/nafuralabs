export interface ConsultationPanierLigne {
  cleStable: string;
  code: string;
  libelle: string;
}

export function humanizeCleStable(cle: string): string {
  const s = cle.replace(/[-_]+/g, ' ').trim();
  if (!s) {
    return cle;
  }
  return s.charAt(0).toUpperCase() + s.slice(1);
}

export function toPanierLigne(
  cle: string,
  item: { code?: string | null; name?: string | null } | null,
): ConsultationPanierLigne {
  const identity = cle.trim();
  const code = (item?.code || '').trim() || identity;
  const name = (item?.name || '').trim();
  const libelle =
    name && name !== identity && name !== code ? name : humanizeCleStable(identity);
  return { cleStable: identity, code, libelle };
}
