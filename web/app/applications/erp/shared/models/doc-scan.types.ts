export interface LookupEntry {
  key: string;
  value: string;
  data?: Record<string, unknown>;
}

export type LookupMap = Record<string, LookupEntry[]>;

export interface DocScanLookupContext {
  lookups: LookupMap;
  resolveLookupId: (lookupKey: string, label?: string) => string | undefined;
  findByAliases: (root: unknown, aliases: string[]) => unknown;
  findStringByAliases: (root: unknown, aliases: string[]) => string | undefined;
  normalizeDate: (value?: string) => string | undefined;
  normalizeText: (value: string) => string;
  toNumber: (value: unknown) => number;
  extractLines: (root: unknown, aliases?: string[]) => Record<string, unknown>[];
}

export interface ScanAndMapArgs<T> {
  file: File;
  domainKey: string;
  docTypeKey: string;
  mapper: (data: Record<string, unknown>, ctx: DocScanLookupContext) => Partial<T> | Promise<Partial<T>>;
  lookups: () => LookupMap;
}
