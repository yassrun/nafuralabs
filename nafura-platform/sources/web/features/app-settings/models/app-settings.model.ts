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
  secondaryColor: string | null;
  accentColor: string | null;
  tenantDisplayName: string | null;
}

export interface BrandColorExtractionResult {
  candidates: string[];
  suggested: {
    primary: string;
    secondary: string;
    accent: string;
  };
}
