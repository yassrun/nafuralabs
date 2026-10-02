import type { SidebarNode, ZoneConfig } from '../../core/navigation/sidebar.types';
import type { AppShellNavigationItem, AppShellNavigationSection } from './app-shell.types';

/** Same rules as the backend (UserContext.hasPermission): exact, `*`, or `prefix.*`. */
export function grants(permissions: ReadonlySet<string>, permission: string): boolean {
  if (permissions.has('*') || permissions.has(permission)) return true;
  for (const pattern of permissions) {
    if (pattern.endsWith('.*') && permission.startsWith(pattern.slice(0, -1))) return true;
  }
  return false;
}

/** First segment of a permission: the domain the organization can switch off (`demo.notes.note.read` → `demo`). */
export function domainOf(permission: string): string {
  return permission.split('.')[0];
}

export interface NavigationAccess {
  /** `null` while loading: guarded entries stay hidden. */
  readonly permissions: ReadonlySet<string> | null;
  readonly disabledDomains?: ReadonlySet<string>;
}

function allowed(item: AppShellNavigationItem, access: NavigationAccess): boolean {
  const disabled = access.disabledDomains ?? new Set<string>();
  if (item.domain && disabled.has(item.domain)) return false;
  if (!item.permission) return true;
  // Mirrors PermissionEnforcementFilter: a disabled domain refuses its permissions to everyone.
  return access.permissions !== null && !disabled.has(domainOf(item.permission)) && grants(access.permissions, item.permission);
}

function visibleItems(items: readonly AppShellNavigationItem[], access: NavigationAccess): AppShellNavigationItem[] {
  return items.flatMap((item) => {
    if (!allowed(item, access)) return [];
    if (!item.children?.length) return item.route ? [item] : [];
    const children = visibleItems(item.children, access);
    return children.length || item.route ? [{ ...item, children }] : [];
  });
}

/**
 * Keeps the entries the user may open: an entry without `permission` is visible, a guarded entry
 * needs its permission and an enabled domain, and a group or section left empty disappears.
 */
export function visibleNavigation(
  sections: readonly AppShellNavigationSection[],
  access: NavigationAccess,
): AppShellNavigationSection[] {
  return sections
    .map((section) => ({ ...section, items: visibleItems(section.items, access) }))
    .filter((section) => section.items.length > 0);
}

/** Sections become sidebar zones (in order), their entries the zone's domains. */
export function toSidebar(sections: readonly AppShellNavigationSection[]): { nodes: SidebarNode[]; zones: ZoneConfig[] } {
  const node = (item: AppShellNavigationItem, zone: string, order: number): SidebarNode => ({
    id: item.id,
    label: item.label,
    icon: item.icon,
    route: item.route,
    exactMatch: item.exactMatch,
    zone,
    order,
    badge: item.badge === undefined || item.badge === '' ? undefined : { value: item.badge, variant: 'info', hideWhenZero: true },
    children: item.children?.map((child, index) => node(child, zone, index)),
  });
  return {
    zones: sections.map((section, index) => ({ id: section.id, label: section.label ?? '', order: index })),
    nodes: sections.flatMap((section) => section.items.map((item, index) => node(item, section.id, index))),
  };
}
