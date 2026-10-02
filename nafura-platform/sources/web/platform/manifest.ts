import type {
  AppShellAiConfig,
  AppShellNotificationsConfig,
  AppShellProductConfig,
  AppShellTenantMenuConfig,
  AppShellTopBarConfig,
  AppShellUserMenuConfig,
} from './app-shell/app-shell.config';

export type NafuraManifestKind = 'foundation' | 'capability' | 'business-context' | 'application';
export type NafuraLifecycle = 'experimental' | 'production' | 'deprecated';
export type NafuraVersion = `${number}.${number}.${number}`;
export type NafuraCompatibleVersion = `^${number}.${number}.${number}`;

export interface CapabilityContract {
  id: string;
  version: NafuraVersion;
}

export interface CapabilityRequirement {
  id: string;
  version: NafuraCompatibleVersion;
  optional?: boolean;
}

export interface PermissionDeclaration {
  id: string;
}

export interface NafuraManifestMetadata {
  id: string;
  version: NafuraVersion;
  owner: string;
  lifecycle: NafuraLifecycle;
  labels?: Record<string, string>;
}

export interface NafuraCommonSpec {
  provides?: CapabilityContract[];
  requires?: CapabilityRequirement[];
  permissions?: PermissionDeclaration[];
  i18n?: {
    namespace: string;
    locales: string[];
  };
}

export interface ApplicationRuntimeSpec {
  requiresTenant: boolean;
  defaultRoute: string;
  auth?: {
    mode: 'keycloak' | 'lab';
    sessionUrl?: string;
    usersUrl?: string;
  };
}

/** Mirrors `AppShellFeatureConfig` minus what the platform derives from business contexts. */
export interface ApplicationShellSpec {
  topBar?: AppShellTopBarConfig;
  sidebar?: { enabled?: boolean };
  userMenu?: AppShellUserMenuConfig;
  tenantMenu?: AppShellTenantMenuConfig;
  notifications?: AppShellNotificationsConfig;
  ai?: AppShellAiConfig;
}

export interface ApplicationSpec extends NafuraCommonSpec {
  product?: AppShellProductConfig;
  runtime?: ApplicationRuntimeSpec;
  shell?: ApplicationShellSpec;
  businessContexts?: string[];
  /** The host embeds every platform capability; a product only lists what it removes. */
  capabilities?: { disabled?: string[] };
  /** Cross-BC roles: composed from business-context roles (`bc.x:ROLE`) and declared permissions only. */
  roles?: ApplicationRoleDeclaration[];
}

export interface ApplicationRoleDeclaration {
  code: string;
  label: string;
  includes?: string[];
  permissions?: string[];
}

/** A link (`route`) or a group (`children`); the BC itself is the sidebar entry holding these. */
export interface BusinessContextNavigationItem {
  id: string;
  label: string;
  route?: string;
  icon?: string;
  /** Hidden unless the user holds it; must be declared by the business context. */
  permission?: string;
  /** Active only on this exact route (default: prefix). */
  exactMatch?: boolean;
  children?: BusinessContextNavigationItem[];
}

export interface DefaultRoleDeclaration {
  code: string;
  label?: string;
  permissions: string[];
}

export interface BusinessContextSpec extends NafuraCommonSpec {
  /** Name shown to users: sidebar group, Modules screen. */
  label: string;
  icon?: string;
  routesPrefix?: string;
  defaultRoles?: DefaultRoleDeclaration[];
  navigation?: BusinessContextNavigationItem[];
}

interface ManifestOf<K extends NafuraManifestKind, S extends NafuraCommonSpec> {
  apiVersion: 'nafura.io/v1';
  kind: K;
  metadata: NafuraManifestMetadata;
  spec: S;
}

export type ApplicationManifest = ManifestOf<'application', ApplicationSpec>;
export type BusinessContextManifest = ManifestOf<'business-context', BusinessContextSpec>;

export type NafuraManifest =
  | ManifestOf<'foundation' | 'capability', NafuraCommonSpec>
  | ApplicationManifest
  | BusinessContextManifest;