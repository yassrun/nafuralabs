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