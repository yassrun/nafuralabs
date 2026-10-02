import type { ApplicationConfig } from '../core/application/application-config';
import type { AppShellFeatureConfig } from './app-shell/app-shell.config';
import type { AppShellNavigationItem, AppShellNavigationSection } from './app-shell/app-shell.types';
import type { ApplicationManifest, BusinessContextManifest, BusinessContextNavigationItem } from './manifest';

/** `app.demo-erp` → `demo-erp`, the id `registerApplicationConfig` has always used. */
export function applicationIdOf(manifest: ApplicationManifest): string {
  return manifest.metadata.id.replace(/^app\./, '');
}

export function projectApplicationConfig(manifest: ApplicationManifest): ApplicationConfig {
  const runtime = manifest.spec.runtime;
  if (!runtime) {
    throw new Error(`Application "${manifest.metadata.id}" has no spec.runtime.`);
  }
  return {
    applicationId: applicationIdOf(manifest),
    defaultRoute: runtime.defaultRoute,
    requiresTenant: runtime.requiresTenant,
  };
}

function orderedContexts(
  manifest: ApplicationManifest,
  contexts: readonly BusinessContextManifest[],
): BusinessContextManifest[] {
  const byId = new Map(contexts.map((context) => [context.metadata.id, context]));
  return (manifest.spec.businessContexts ?? []).map((id) => {
    const context = byId.get(id);
    if (!context) {
      throw new Error(`Application "${manifest.metadata.id}" references unknown business context "${id}".`);
    }
    return context;
  });
}

function contextLabel(context: BusinessContextManifest): string {
  return context.spec.label ?? context.metadata.id;
}

function navigationItems(items: readonly BusinessContextNavigationItem[] = []): AppShellNavigationItem[] {
  return items.map(({ id, label, route, icon, permission, exactMatch, children }) => ({
    id,
    label,
    ...(route !== undefined && { route }),
    ...(icon !== undefined && { icon }),
    ...(permission !== undefined && { permission }),
    ...(exactMatch !== undefined && { exactMatch }),
    ...(children?.length && { children: navigationItems(children) }),
  }));
}

/** In the sidebar a business context is one group: its label and icon, its navigation tree inside. */
function contextNavigation(context: BusinessContextManifest): AppShellNavigationSection {
  return {
    id: context.metadata.id,
    items: [
      {
        id: context.metadata.id,
        label: contextLabel(context),
        icon: context.spec.icon,
        domain: businessContextDomain(context.metadata.id),
        children: navigationItems(context.spec.navigation),
      },
    ],
  };
}

/** `bc.achats` → `achats`: the permission namespace, and the domain an organization switches on or off. */
export function businessContextDomain(id: string): string {
  return id.replace(/^bc\./, '');
}

/** The sidebar reads: `workspaceNavigation`, one group per business context, then `platformNavigation`. */
export function projectAppShellConfig(
  manifest: ApplicationManifest,
  contexts: readonly BusinessContextManifest[],
  platformNavigation: readonly AppShellNavigationSection[] = [],
  workspaceNavigation: readonly AppShellNavigationSection[] = [],
): AppShellFeatureConfig {
  const shell = manifest.spec.shell ?? {};
  const ordered = orderedContexts(manifest, contexts);

  return {
    product: manifest.spec.product ?? { name: manifest.metadata.id },
    topBar: shell.topBar,
    sidebar: {
      enabled: shell.sidebar?.enabled,
      navigation: [...workspaceNavigation, ...ordered.map(contextNavigation), ...platformNavigation],
    },
    userMenu: shell.userMenu,
    tenantMenu: shell.tenantMenu,
    notifications: shell.notifications,
    ai: shell.ai,
  };
}
