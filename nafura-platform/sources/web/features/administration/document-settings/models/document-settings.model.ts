/**
 * Document customisation — structured settings, never markup.
 *
 * Mirrors the backend `DocumentSettingsPayload`. Free text fields hold plain text with
 * `{{token}}` placeholders inserted from a closed list; the server escapes them and generates
 * the header and footer. Nothing here reaches the template engine.
 */

export type HeaderLayout = 'LOGO_LEFT' | 'LOGO_CENTER' | 'LOGO_RIGHT';

/** Identity fields the header may display, alongside the company name. */
export const HEADER_FIELDS = [
  'formeJuridique',
  'capital',
  'adresse',
  'ville',
  'telephone',
  'email',
  'siteWeb',
  'ice',
  'identifiantFiscal',
  'rc',
  'patente',
  'cnss',
] as const;

export type HeaderField = (typeof HEADER_FIELDS)[number];

/** Line table columns, in render order. */
export const LINE_COLUMNS = [
  'code',
  'designation',
  'unite',
  'quantite',
  'prixUnitaire',
  'montantHt',
] as const;

export type LineColumn = (typeof LINE_COLUMNS)[number];

export interface DocumentSettingsHeader {
  layout: HeaderLayout;
  showLogo: boolean;
  fields: HeaderField[];
}

export interface DocumentSettingsFooter {
  /** Plain text with {{token}} placeholders. */
  text: string;
  showPageNumber: boolean;
  showLegalIdentifiers: boolean;
}

export interface DocumentSettingsAppearance {
  accentColor: string;
  fontFamily: string;
  baseFontSizePt: number;
}

export interface DocumentSettingsLines {
  columns: LineColumn[];
  showRemise: boolean;
  showTva: boolean;
}

export interface DocumentSettingsPage {
  paperSize: string;
  orientation: string;
  marginTop: number;
  marginRight: number;
  marginBottom: number;
  marginLeft: number;
}

export interface DocumentSettings {
  header: DocumentSettingsHeader;
  footer: DocumentSettingsFooter;
  appearance: DocumentSettingsAppearance;
  lines: DocumentSettingsLines;
  page: DocumentSettingsPage;
}
