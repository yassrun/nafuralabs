import { SidebarNode } from '../navigation/sidebar.types';

export interface PlatformAppShellWidgetOptions {
  languageSwitch?: boolean;
  notifications?: boolean;
  userMenu?: boolean;
  conversation?: boolean;
  search?: boolean;
}

export interface PlatformAppShellSidebarOptions {
  collapsible?: boolean;
  initiallyCollapsed?: boolean;
}

export interface PlatformAppShellTopbarOptions {
  showPageTitle?: boolean;
}

export interface PlatformAppShellConversationOptions {
  enabled?: boolean;
  initiallyOpen?: boolean;
  title?: string;
}

export interface PlatformAppShellSearchOptions {
  enabled?: boolean;
  placeholder?: string;
}

export interface PlatformAppShellOptions {
  widgets?: PlatformAppShellWidgetOptions;
  sidebar?: PlatformAppShellSidebarOptions;
  topbar?: PlatformAppShellTopbarOptions;
  conversation?: PlatformAppShellConversationOptions;
  search?: PlatformAppShellSearchOptions;
}

export interface PlatformAppShellConfig {
  applicationId: string;
  applicationName: string;
  navigation: SidebarNode[];
  shellOptions?: PlatformAppShellOptions;
}

export const DEFAULT_PLATFORM_APP_SHELL_OPTIONS: Required<PlatformAppShellOptions> = {
  widgets: {
    languageSwitch: true,
    notifications: true,
    userMenu: true,
    conversation: true,
    search: true,
  },
  sidebar: {
    collapsible: true,
    initiallyCollapsed: false,
  },
  topbar: {
    showPageTitle: true,
  },
  conversation: {
    enabled: true,
    initiallyOpen: false,
    title: 'core.conversation.title',
  },
  search: {
    enabled: true,
    placeholder: 'core.search.placeholder',
  },
};

// ─── Module section configs ───────────────────────────────────────────────────

export interface AdministrationSectionConfig {
  members?: { enabled: boolean };
  roles?: { enabled: boolean; customRoles?: boolean };
  domainActivation?: { enabled: boolean };
  audit?: { enabled: boolean };
  templates?: { enabled: boolean };
  emailTemplates?: { enabled: boolean };
  workflows?: { enabled: boolean };
  scheduledJobs?: { enabled: boolean };
  webhooks?: { enabled: boolean };
  apiKeys?: { enabled: boolean };
  numberingSequences?: { enabled: boolean };
  subscriptions?: { enabled: boolean };
}

export interface UserSettingsSectionConfig {
  profile?: { enabled: boolean };
  preferences?: { enabled: boolean };
  security?: { enabled: boolean };
  notifications?: { enabled: boolean };
}

export interface AppSettingsSectionConfig {
  general?: { enabled: boolean };
  localization?: { enabled: boolean };
  branding?: { enabled: boolean };
}

// ─── Module configs ───────────────────────────────────────────────────────────

export interface AdministrationModuleConfig {
  enabled: boolean;
  /** Sidebar position (default: bottom — rendered in administration zone) */
  position?: 'bottom';
  sections?: AdministrationSectionConfig;
}

export interface UserSettingsModuleConfig {
  enabled: boolean;
  sections?: UserSettingsSectionConfig;
}

export interface AppSettingsModuleConfig {
  enabled: boolean;
  sections?: AppSettingsSectionConfig;
}

// ─── Full app shell config ────────────────────────────────────────────────────

export interface AppShellConfig {
  applicationId: string;
  applicationName: string;
  icon?: string;
  /** Shell behavior options (sidebar, topbar, widgets, conversation) */
  shellOptions: PlatformAppShellOptions;
  /** Platform module toggles — not generated from domain manifests */
  modules: {
    administration: AdministrationModuleConfig;
    userSettings: UserSettingsModuleConfig;
    appSettings: AppSettingsModuleConfig;
  };
}

// ─── Standard defaults ────────────────────────────────────────────────────────
// All features activated. App manifest overrides these via the generated config.

export const DEFAULT_APP_SHELL_CONFIG: Omit<AppShellConfig, 'applicationId' | 'applicationName'> = {
  shellOptions: {
    widgets: {
      languageSwitch: true,
      notifications: true,
      userMenu: true,
      conversation: false,
    },
    sidebar: { collapsible: true, initiallyCollapsed: false },
    topbar: { showPageTitle: true },
    conversation: { enabled: false },
  },
  modules: {
    administration: {
      enabled: true,
      position: 'bottom',
      sections: {
        members: { enabled: true },
        roles: { enabled: true, customRoles: true },
        domainActivation: { enabled: true },
        audit: { enabled: true },
        templates: { enabled: true },
        emailTemplates: { enabled: true },
        workflows: { enabled: true },
        scheduledJobs: { enabled: true },
        webhooks: { enabled: true },
        apiKeys: { enabled: true },
        numberingSequences: { enabled: true },
        subscriptions: { enabled: true },
      },
    },
    userSettings: {
      enabled: true,
      sections: {
        profile: { enabled: true },
        preferences: { enabled: true },
        security: { enabled: true },
        notifications: { enabled: true },
      },
    },
    appSettings: {
      enabled: true,
      sections: {
        general: { enabled: true },
        localization: { enabled: true },
        branding: { enabled: true },
      },
    },
  },
};
