import {
  AppShellConfig,
  DEFAULT_APP_SHELL_CONFIG,
} from '@platform/core/shell/platform-app-shell.types';
import {
  ACTIVE_APPLICATION_ID,
  APPLICATION_DISPLAY_NAMES,
  KNOWN_APPLICATION_IDS,
} from './routes';

function createShellConfig(applicationId: string, applicationName: string): AppShellConfig {
  const isErp = applicationId === 'erp';

  return {
    applicationId,
    applicationName,
    icon: 'layout-grid',
    shellOptions: {
      widgets: {
        ...DEFAULT_APP_SHELL_CONFIG.shellOptions.widgets,
        ...(isErp ? { conversation: true } : {}),
      },
      sidebar: { ...DEFAULT_APP_SHELL_CONFIG.shellOptions.sidebar },
      topbar: { ...DEFAULT_APP_SHELL_CONFIG.shellOptions.topbar },
      conversation: {
        ...DEFAULT_APP_SHELL_CONFIG.shellOptions.conversation,
        ...(isErp ? { enabled: true } : {}),
      },
    },
    modules: {
      administration: {
        ...DEFAULT_APP_SHELL_CONFIG.modules.administration,
        sections: {
          ...DEFAULT_APP_SHELL_CONFIG.modules.administration.sections,
          roles: {
            ...(DEFAULT_APP_SHELL_CONFIG.modules.administration.sections?.roles || { enabled: true }),
            customRoles: true,
          },
        },
      },
      userSettings: {
        ...DEFAULT_APP_SHELL_CONFIG.modules.userSettings,
        sections: { ...DEFAULT_APP_SHELL_CONFIG.modules.userSettings.sections },
      },
      appSettings: {
        ...DEFAULT_APP_SHELL_CONFIG.modules.appSettings,
        sections: { ...DEFAULT_APP_SHELL_CONFIG.modules.appSettings.sections },
      },
    },
  };
}

export const APP_SHELL_CONFIGS: Record<string, AppShellConfig> = Object.fromEntries(
  KNOWN_APPLICATION_IDS.map((id) => [id, createShellConfig(id, APPLICATION_DISPLAY_NAMES[id] ?? id)])
);

const defaultConfig = APP_SHELL_CONFIGS['core'] ?? Object.values(APP_SHELL_CONFIGS)[0];
export const APP_SHELL_CONFIG: AppShellConfig =
  APP_SHELL_CONFIGS[ACTIVE_APPLICATION_ID] ?? defaultConfig;
