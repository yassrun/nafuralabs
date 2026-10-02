export interface AppShellNavigationItem {
  readonly id: string;
  readonly label: string;
  /** A link; an entry with `children` is a group and may omit it. */
  readonly route?: string;
  readonly icon?: string;
  readonly badge?: string | number;
  /** Hidden unless the user holds it (see APP_SHELL_ACCESS). */
  readonly permission?: string;
  /** Active only on this exact route (default: prefix). */
  readonly exactMatch?: boolean;
  /** Domain (BC permission namespace) owning the entry: hidden while the organization disables it. */
  readonly domain?: string;
  readonly children?: readonly AppShellNavigationItem[];
}

export interface AppShellNavigationSection {
  readonly id: string;
  readonly label?: string;
  readonly items: readonly AppShellNavigationItem[];
}
