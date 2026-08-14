export interface AppGeneralSettings {
  tenantName: string;
  contactEmail: string | null;
  supportEmail: string | null;
  timezone: string;
}

export interface AppLocalizationSettings {
  defaultLocale: string;
  supportedLocales: string[];
  defaultCurrency: string | null;
  dateFormat: string | null;
  numberFormat: string | null;
}

export interface AppBrandingSettings {
  logoUrl: string | null;
  faviconUrl: string | null;
  primaryColor: string | null;
  tenantDisplayName: string | null;
}
