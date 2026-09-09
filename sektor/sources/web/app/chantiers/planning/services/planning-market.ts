import type { BudgetNoeud } from '../../budget/models/budget.model';
import type { ActiviteChantier } from '../../services/activite-api.service';

export interface MarketPlanningRow {
  id: string; label: string; depth: number; parentIds: string[]; expandable: boolean;
  start: string | null; finish: string | null; activityCount: number;
  plannedPosts: number; totalPosts: number; progress: number | null;
  activities: ActiviteChantier[];
}

/** Dates derive from unique linked activities, never from commercial amounts. */
export function marketPlanning(nodes: BudgetNoeud[], activities: ActiviteChantier[]): MarketPlanningRow[] {
  const rows: MarketPlanningRow[] = [];
  const links = (activity: ActiviteChantier) => (activity.rattachements ?? []).map(r => r.posteId || r.lotId).filter(Boolean);
  function visit(node: BudgetNoeud, parents: string[]): { ids: Set<string>; posts: Set<string> } {
    const sold = node.nature === 'VENDU';
    const ids = new Set<string>(sold ? [node.id] : []);
    const posts = new Set<string>(sold && node.type === 'POSTE' ? [node.id] : []);
    const index = rows.length;
    if (sold) rows.push({} as MarketPlanningRow);
    for (const child of node.enfants ?? []) {
      const nested = visit(child, sold ? [...parents, node.id] : parents);
      nested.ids.forEach(id => ids.add(id)); nested.posts.forEach(id => posts.add(id));
    }
    if (sold) {
      const linked = activities.filter(a => a.forme !== 'PHASE' && links(a).some(id => ids.has(id!)));
      const starts = linked.map(a => a.dateDebut).filter(Boolean).sort();
      const ends = linked.map(a => a.dateFin).filter(Boolean).sort();
      const planned = new Set(linked.flatMap(links).filter(id => posts.has(id!)));
      rows[index] = { id: node.id, label: [node.code, node.designation].filter(Boolean).join(' · '),
        depth: parents.length, parentIds: parents, expandable: rows.length > index + 1,
        start: starts[0] ?? null, finish: ends.at(-1) ?? null, activityCount: linked.length,
        plannedPosts: planned.size, totalPosts: posts.size,
        progress: node.totaux?.avancementPercent ?? null, activities: linked };
    }
    return { ids, posts };
  }
  nodes.forEach(node => visit(node, []));
  return rows;
}
