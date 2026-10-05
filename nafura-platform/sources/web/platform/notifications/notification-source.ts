/** Human label for a notification event id (`source` on the inbox row). */
const KNOWN: Readonly<Record<string, string>> = {
  'platform.approval.requested': 'Approbation à donner',
  'platform.approval.decided': 'Décision d’approbation',
  'platform.mention': 'Mention',
  'platform.assignment': 'Affectation',
  'platform.legacy.transition': 'Changement de statut',
  'demo.purchasing.request.approved': 'Demande d’achat approuvée',
  'demo.purchasing.request.rejected': 'Demande d’achat rejetée',
  'demo.purchasing.request.ordered': 'Demande d’achat commandée',
};

export function notificationSourceLabel(source?: string | null): string {
  if (!source) return '';
  const known = KNOWN[source];
  if (known) return known;
  const leaf = source.includes('.') ? source.slice(source.lastIndexOf('.') + 1) : source;
  return leaf.replace(/[-_]/g, ' ').replace(/\b\w/g, (char) => char.toUpperCase());
}
