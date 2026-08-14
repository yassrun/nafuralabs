import { JsonSchemaRoot } from '../models/json-schema.model';
import { UiGridColumn, UiSchema } from '../models/ui-schema.model';
import { PathResolver } from './path-resolver';

export interface ResolvedColumn<T> {
  id: string;
  label: string;
  widthPx?: number;
  getValue: (row: T) => unknown;
}

export class ColumnResolver {
  static resolveGridColumns<T extends { dataJson?: Record<string, unknown> }>(
    args: { uiSchema?: UiSchema; jsonSchema: JsonSchemaRoot; maxFallbackColumns?: number }
  ): ResolvedColumn<T>[] {
    const cols = (args.uiSchema?.gridColumns?.length ? args.uiSchema.gridColumns : undefined)
      ?? ColumnResolver.deriveGridColumnsFromSchema(args.jsonSchema, args.maxFallbackColumns ?? 6);

    return cols.map(c => ({
      id: ColumnResolver.toColumnId(c.path),
      label: c.label,
      widthPx: c.widthPx,
      getValue: (row: T) => PathResolver.get(row.dataJson ?? {}, c.path, ''),
    }));
  }

  static deriveGridColumnsFromSchema(schema: JsonSchemaRoot, maxColumns: number): UiGridColumn[] {
    const props = schema.properties ?? {};
    const columns: UiGridColumn[] = [];

    const pushIfPrimitive = (path: string, s: any) => {
      const type = Array.isArray(s?.type) ? s.type[0] : s?.type;
      const isPrimitive =
        type === 'string' || type === 'number' || type === 'integer' || type === 'boolean';
      if (!isPrimitive) return;
      columns.push({
        path,
        label: (s?.title as string | undefined) ?? ColumnResolver.humanize(path),
      });
    };

    for (const [k, s] of Object.entries(props)) {
      if (columns.length >= maxColumns) break;
      const type = Array.isArray((s as any)?.type) ? (s as any).type[0] : (s as any)?.type;

      if (type === 'object' && (s as any)?.properties) {
        // Depth 2 fallback: include primitive leafs only.
        for (const [k2, s2] of Object.entries((s as any).properties ?? {})) {
          if (columns.length >= maxColumns) break;
          pushIfPrimitive(`${k}.${k2}`, s2);
        }
      } else {
        pushIfPrimitive(k, s);
      }
    }

    return columns;
  }

  static toColumnId(path: string): string {
    // MatColumnDef ids must be stable and safe.
    return path.replaceAll('.', '__').replaceAll('[', '__').replaceAll(']', '');
  }

  static formatCellValue(value: unknown): string {
    if (value === null || value === undefined) return '';
    if (value instanceof Date) return value.toISOString().slice(0, 10);
    if (typeof value === 'boolean') return value ? 'Yes' : 'No';
    if (typeof value === 'number') return String(value);
    if (typeof value === 'string') return value;
    try {
      return JSON.stringify(value);
    } catch {
      return String(value);
    }
  }

  private static humanize(path: string): string {
    const last = path.split('.').at(-1) ?? path;
    return last
      .replaceAll(/([a-z])([A-Z])/g, '$1 $2')
      .replaceAll('_', ' ')
      .replaceAll('-', ' ')
      .replaceAll(/\s+/g, ' ')
      .trim()
      .replace(/^./, c => c.toUpperCase());
  }
}

