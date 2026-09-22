export interface AppShellNavigationItem {
  readonly id: string;
  readonly label: string;
  readonly route: string;
  readonly icon?: string;
  readonly badge?: string | number;
}

export interface AppShellNavigationSection {
  readonly id: string;
  readonly label?: string;
  readonly items: readonly AppShellNavigationItem[];
}

/** One business-context slot on the left rail. `enabled` is a Nafura app setting. */
export interface AppShellContextSlot {
  readonly id: string;
  readonly label: string;
  readonly route: string;
  readonly icon?: string;
  readonly enabled: boolean;
  readonly navigation?: readonly AppShellNavigationSection[];
}

export interface AppShellContextAdmin {
  readonly id?: string;
  readonly label: string;
  readonly route: string;
  readonly icon?: string;
}

/** Left rail: active business contexts + Admin. Inactive slots are not rendered. */
export interface AppShellContextRailConfig {
  readonly enabled?: boolean;
  /** Lab stand-in until the Nafura API persists activation. */
  readonly storageKey?: string;
  readonly admin?: AppShellContextAdmin;
  readonly slots?: readonly AppShellContextSlot[];
}