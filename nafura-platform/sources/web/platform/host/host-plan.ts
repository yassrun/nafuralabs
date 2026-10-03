import type { ApplicationManifest, BusinessContextManifest } from '../manifest';

/** One entry of `nafura-platform/capabilities.json`, the catalog shared with Gradle and the host tests. */
export interface CapabilityDefinition {
  readonly id: string;
  readonly core?: boolean;
  readonly modules: readonly string[];
  readonly requires?: readonly string[];
}

export interface CapabilityCatalog {
  readonly capabilities: readonly CapabilityDefinition[];
}

export interface HostPlan {
  readonly application: ApplicationManifest;
  readonly businessContexts: readonly BusinessContextManifest[];
  /** Enabled capability ids, catalog order. */
  readonly capabilities: readonly string[];
}

/** A JSON import widens literals (`kind` becomes `string`): check before trusting the shape. */
export function readApplicationManifest(value: unknown): ApplicationManifest {
  const manifest = value as Partial<ApplicationManifest> | null;
  if (manifest?.apiVersion !== 'nafura.io/v1' || manifest.kind !== 'application') {
    throw new Error('app.nafura.json must be a nafura.io/v1 manifest of kind "application".');
  }
  if (!manifest.spec?.runtime) {
    throw new Error(`Application "${manifest.metadata?.id}" has no spec.runtime.`);
  }
  if (manifest.spec.runtime.tenancy === 'multi') {
    throw new Error(`Application "${manifest.metadata?.id}": host v1 serves one organization per deployment (spec.runtime.tenancy "single").`);
  }
  return manifest as ApplicationManifest;
}

/**
 * Every catalog capability is embedded unless `spec.capabilities.disabled` lists it (D-5).
 * Type-only imports keep this file loadable by `node --experimental-strip-types`.
 */
export function planHost(
  application: ApplicationManifest,
  businessContexts: readonly BusinessContextManifest[],
  catalog: CapabilityCatalog,
): HostPlan {
  const appId = application.metadata.id;
  const byId = new Map(catalog.capabilities.map((capability) => [capability.id, capability]));
  const disabled = new Set(application.spec.capabilities?.disabled ?? []);

  for (const id of disabled) {
    const capability = byId.get(id);
    if (!capability) {
      throw new Error(`Application "${appId}" disables unknown capability "${id}".`);
    }
    if (capability.core) {
      throw new Error(`Application "${appId}" cannot disable core capability "${id}".`);
    }
  }

  const enabled = catalog.capabilities.filter((capability) => !disabled.has(capability.id));
  for (const capability of enabled) {
    for (const required of capability.requires ?? []) {
      if (disabled.has(required)) {
        throw new Error(`Application "${appId}" disables "${required}", required by capability "${capability.id}".`);
      }
    }
  }
  for (const context of businessContexts) {
    for (const requirement of context.spec.requires ?? []) {
      if (disabled.has(requirement.id) && !requirement.optional) {
        throw new Error(
          `Application "${appId}" disables "${requirement.id}", required by business context "${context.metadata.id}".`,
        );
      }
    }
  }

  return { application, businessContexts, capabilities: enabled.map((capability) => capability.id) };
}
