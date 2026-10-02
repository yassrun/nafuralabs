import type { SidebarBadge, SidebarIcon, SidebarNode, SidebarZoneGroup, ZoneConfig } from './sidebar.types';

/** Pure rules of the platform sidebar (nf-sidebar-nav), shared by every shell. */

const LUCIDE_ICON_ALIASES: Record<string, string> = {
  'alert-triangle': 'triangle-alert',
  'bar-chart': 'chart-bar',
  'bar-chart-2': 'chart-bar',
  'bar-chart-3': 'chart-column',
  'check-circle': 'circle-check',
  'check-circle-2': 'circle-check',
  'check-square': 'circle-check',
  'x-circle': 'circle-x',
  // `file-signature` does not exist in lucide-angular@0.563; fall back to file-pen.
  'file-signature': 'file-pen',
  // Material-style nav ids from erp-sidebar.config (materiel section)
  'calendar-range': 'calendar-clock',
  schedule: 'clock',
  'verified-user': 'shield-check',
  'scale-balanced': 'scale',
  sliders: 'sliders-horizontal',
  today: 'calendar',
  table: 'table-2',
};

export function resolveNavIcon(icon: SidebarIcon | undefined): string {
  if (typeof icon !== 'string') return '';
  const normalized = icon.trim().toLowerCase().replace(/_/g, '-');
  if (!normalized) return '';
  return LUCIDE_ICON_ALIASES[normalized] || normalized;
}

export function nodeChildren(node: SidebarNode): SidebarNode[] {
  return Array.isArray(node.children) ? node.children : [];
}

/** Drops hidden nodes and groups left without children nor route. */
export function filterVisibleNodes(nodes: readonly SidebarNode[] | undefined): SidebarNode[] {
  const result: SidebarNode[] = [];
  for (const node of nodes ?? []) {
    if (node.visible === false) continue;
    const children = filterVisibleNodes(node.children);
    if (children.length === 0 && !node.route) continue;
    result.push(children.length > 0 ? { ...node, children } : { ...node, children: undefined });
  }
  return result;
}

/** Top-level nodes grouped by zone, zones and nodes ordered; unknown zones go last. */
export function groupByZone(nodes: readonly SidebarNode[], zones: readonly ZoneConfig[]): SidebarZoneGroup[] {
  const known = new Map(zones.map((zone) => [zone.id, zone]));
  const groups = new Map<string, SidebarNode[]>();
  for (const node of nodes) {
    const zone = node.zone || 'default';
    groups.set(zone, [...(groups.get(zone) ?? []), node]);
  }
  return [...groups.entries()]
    .map(([zone, list]) => ({
      zone,
      label: known.get(zone)?.label || '',
      order: known.get(zone)?.order ?? 9999,
      nodes: [...list].sort((a, b) => (a.order ?? 0) - (b.order ?? 0)),
    }))
    .sort((a, b) => a.order - b.order);
}

export function normalizeUrl(value: string): string {
  if (!value) return '';
  let normalized = value.trim().split(/[?#]/)[0];
  if (!normalized.startsWith('/')) normalized = `/${normalized}`;
  return normalized.replace(/\/+$/, '');
}

function matches(route: string | undefined, url: string): boolean {
  const normalized = route ? normalizeUrl(route) : '';
  return !!normalized && (url === normalized || url.startsWith(normalized + '/'));
}

/** Top-level node holding the route the user is on. */
export function findActiveDomainId(nodes: readonly SidebarNode[], url: string): string | null {
  const current = normalizeUrl(url);
  const contains = (node: SidebarNode): boolean => matches(node.route, current) || nodeChildren(node).some(contains);
  return nodes.find(contains)?.id ?? null;
}

/** Label of the deepest node matching the URL (longest route wins). */
export function findActiveLabel(nodes: readonly SidebarNode[], url: string): string | null {
  const current = normalizeUrl(url);
  let label: string | null = null;
  let best = -1;
  const visit = (node: SidebarNode): void => {
    if (matches(node.route, current) && normalizeUrl(node.route!).length > best) {
      best = normalizeUrl(node.route!).length;
      label = node.label;
    }
    nodeChildren(node).forEach(visit);
  };
  nodes.forEach(visit);
  return label;
}

/** Badge to show, if any: providers are called (signals inside stay reactive), zero is hidden on request. */
export function badgeOf(node: SidebarNode): SidebarBadge | null {
  const badge = typeof node.badge === 'function' ? node.badge() : node.badge;
  if (!badge) return null;
  if (badge.hideWhenZero && Number(badge.value) === 0) return null;
  return badge;
}

/** Translation keys look like `erp.nav.achats`; display text (spaces, accents) is shown as written. */
export function displayLabel(label: string | undefined, translate: (key: string) => string): string {
  if (!label) return '';
  const translated = translate(label);
  if (translated && translated !== label) return translated;
  if (!/^[A-Za-z0-9_.-]+$/.test(label)) return label;
  const parts = label.split('.');
  let key = parts[parts.length - 1] || label;
  if (parts.length >= 2 && key.toLowerCase() === 'title') key = parts[0] || key;
  return key
    .replace(/[-_]/g, ' ')
    .replace(/([a-z])([A-Z])/g, '$1 $2')
    .trim()
    .replace(/\b\w/g, (char) => char.toUpperCase());
}
