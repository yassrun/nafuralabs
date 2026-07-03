import { AbstractControl, FormArray, FormControl, FormGroup, ValidationErrors, ValidatorFn, Validators } from '@angular/forms';

import { JsonSchema, JsonSchemaArray, JsonSchemaObject, JsonSchemaRoot } from '../models/json-schema.model';
import { PathResolver } from './path-resolver';

export type AnyFormGroup = FormGroup<Record<string, AbstractControl>>;

export interface BuildFormResult {
  form: AnyFormGroup;
}

/**
 * Builds an Angular Reactive FormGroup from JSON Schema.
 *
 * Supported:
 * - primitives: string/number/integer/boolean
 * - enum -> select
 * - string format 'date' -> Date object in form, serialized to YYYY-MM-DD
 * - objects up to depth 2
 * - arrays of objects -> FormArray<FormGroup>
 */
export class JsonSchemaFormBuilder {
  static buildForm(schema: JsonSchemaRoot, opts?: { maxObjectDepth?: number }): BuildFormResult {
    const maxDepth = opts?.maxObjectDepth ?? 2;
    const form = JsonSchemaFormBuilder.buildObjectGroup(schema, 0, maxDepth);
    return { form };
  }

  /**
   * Build a standalone FormGroup for a JSON Schema object (useful for array rows).
   */
  static buildGroupForObjectSchema(schema: JsonSchemaObject, opts?: { maxObjectDepth?: number }): AnyFormGroup {
    const maxDepth = opts?.maxObjectDepth ?? 2;
    return JsonSchemaFormBuilder.buildObjectGroup(schema, 0, maxDepth);
  }

  static patchFormFromData(args: {
    form: AnyFormGroup;
    schema: JsonSchemaRoot;
    dataJson: Record<string, unknown> | null | undefined;
  }): void {
    const data = args.dataJson ?? {};
    JsonSchemaFormBuilder.patchObject(args.form, args.schema, data, 0, 2);
  }

  /**
   * Convert current form value into backend `dataJson` with correct types.
   * - dates serialized as YYYY-MM-DD
   * - numbers parsed
   * - integers parsed + validated
   */
  static serializeToDataJson(args: {
    form: AnyFormGroup;
    schema: JsonSchemaRoot;
  }): Record<string, unknown> {
    return JsonSchemaFormBuilder.serializeObject(args.form, args.schema);
  }

  static getSchemaAtPath(schema: JsonSchemaRoot, path: string): JsonSchema | null {
    if (!path) return schema;
    const tokens = PathResolver.tokenize(path);

    let cur: JsonSchema | null = schema;
    for (const t of tokens) {
      if (!cur) return null;
      const type = JsonSchemaFormBuilder.primaryType(cur);

      if (type === 'object') {
        if (typeof t !== 'string') return null;
        const props: Record<string, JsonSchema> = (cur as JsonSchemaObject).properties ?? {};
        cur = (props[t] as JsonSchema | undefined) ?? null;
        continue;
      }

      if (type === 'array') {
        // Only support "array" -> index -> property navigation.
        cur = (cur as JsonSchemaArray).items ?? null;
        continue;
      }

      return null;
    }
    return cur;
  }

  /**
   * Validate all controls and return whether the form is valid.
   * Also ensures async parsing errors (number/date) are surfaced before submit.
   */
  static markAllAndValidate(form: AnyFormGroup): boolean {
    form.markAllAsTouched();
    form.updateValueAndValidity({ emitEvent: false });
    return form.valid;
  }

  // ─────────────────────────────────────────────────────────────────────────────
  // Internal builders
  // ─────────────────────────────────────────────────────────────────────────────

  private static buildObjectGroup(schema: JsonSchemaObject, depth: number, maxDepth: number): AnyFormGroup {
    const controls: Record<string, AbstractControl> = {};
    const required = new Set(schema.required ?? []);
    const props = schema.properties ?? {};

    for (const [key, propSchema] of Object.entries(props)) {
      controls[key] = JsonSchemaFormBuilder.buildControl(propSchema, required.has(key), depth, maxDepth);
    }

    return new FormGroup(controls);
  }

  private static buildControl(schema: JsonSchema, required: boolean, depth: number, maxDepth: number): AbstractControl {
    const type = JsonSchemaFormBuilder.primaryType(schema);
    const readOnly = !!(schema as any)?.readOnly;

    if (type === 'object') {
      if (depth >= maxDepth) {
        // Depth guard: keep it editable as raw JSON string.
        const ctrl = new FormControl<string>({ value: '', disabled: readOnly }, required ? Validators.required : []);
        return ctrl;
      }
      const group = JsonSchemaFormBuilder.buildObjectGroup(schema as JsonSchemaObject, depth + 1, maxDepth);
      if (readOnly) group.disable({ emitEvent: false });
      return group;
    }

    if (type === 'array') {
      // Only arrays of objects for MVP
      const arrSchema = schema as JsonSchemaArray;
      const fa = new FormArray<AbstractControl>([], required ? [Validators.required] : []);
      if (readOnly) fa.disable({ emitEvent: false });
      return fa;
    }

    if (type === 'boolean') {
      // booleans should not use Validators.required (false is valid)
      return new FormControl<boolean>({ value: false, disabled: readOnly });
    }

    if (type === 'integer') {
      return new FormControl<number | string | null>(
        { value: null, disabled: readOnly },
        JsonSchemaFormBuilder.composeValidators([
          required ? Validators.required : null,
          JsonSchemaFormBuilder.integerValidator(),
          JsonSchemaFormBuilder.minMaxValidator(schema),
        ])
      );
    }

    if (type === 'number') {
      return new FormControl<number | string | null>(
        { value: null, disabled: readOnly },
        JsonSchemaFormBuilder.composeValidators([
          required ? Validators.required : null,
          JsonSchemaFormBuilder.numberValidator(),
          JsonSchemaFormBuilder.minMaxValidator(schema),
        ])
      );
    }

    // string (including enum + date)
    if ((schema as any)?.format === 'date') {
      return new FormControl<Date | string | null>(
        { value: null, disabled: readOnly },
        JsonSchemaFormBuilder.composeValidators([
          required ? Validators.required : null,
          JsonSchemaFormBuilder.dateValidator(),
        ])
      );
    }

    return new FormControl<string | null>(
      { value: null, disabled: readOnly },
      JsonSchemaFormBuilder.composeValidators([
        required ? Validators.required : null,
        JsonSchemaFormBuilder.stringLengthValidator(schema),
      ])
    );
  }

  private static composeValidators(validators: Array<ValidatorFn | null>): ValidatorFn[] {
    return validators.filter((v): v is ValidatorFn => !!v);
  }

  private static primaryType(schema: JsonSchema): string | undefined {
    const t = (schema as any)?.type;
    return Array.isArray(t) ? t[0] : t;
  }

  private static stringLengthValidator(schema: JsonSchema): ValidatorFn | null {
    const min = (schema as any)?.minLength;
    const max = (schema as any)?.maxLength;
    if (typeof min !== 'number' && typeof max !== 'number') return null;
    return (c: AbstractControl): ValidationErrors | null => {
      const v = c.value;
      if (v === null || v === undefined || v === '') return null;
      if (typeof v !== 'string') return { typeMismatch: { expected: 'string' } };
      if (typeof min === 'number' && v.length < min) return { minlength: { requiredLength: min, actualLength: v.length } };
      if (typeof max === 'number' && v.length > max) return { maxlength: { requiredLength: max, actualLength: v.length } };
      return null;
    };
  }

  private static minMaxValidator(schema: JsonSchema): ValidatorFn | null {
    const min = (schema as any)?.minimum;
    const max = (schema as any)?.maximum;
    if (typeof min !== 'number' && typeof max !== 'number') return null;

    return (c: AbstractControl): ValidationErrors | null => {
      const num = JsonSchemaFormBuilder.coerceNumber(c.value);
      if (num === null) return null;
      if (typeof min === 'number' && num < min) return { min: { min, actual: num } };
      if (typeof max === 'number' && num > max) return { max: { max, actual: num } };
      return null;
    };
  }

  private static numberValidator(): ValidatorFn {
    return (c: AbstractControl): ValidationErrors | null => {
      const v = c.value;
      if (v === null || v === undefined || v === '') return null;
      const n = JsonSchemaFormBuilder.coerceNumber(v);
      return n === null ? { number: true } : null;
    };
  }

  private static integerValidator(): ValidatorFn {
    return (c: AbstractControl): ValidationErrors | null => {
      const v = c.value;
      if (v === null || v === undefined || v === '') return null;
      const n = JsonSchemaFormBuilder.coerceNumber(v);
      if (n === null) return { integer: true };
      if (!Number.isInteger(n)) return { integer: true };
      return null;
    };
  }

  private static dateValidator(): ValidatorFn {
    return (c: AbstractControl): ValidationErrors | null => {
      const v = c.value;
      if (v === null || v === undefined || v === '') return null;
      const d = JsonSchemaFormBuilder.coerceDate(v);
      return d ? null : { date: true };
    };
  }

  private static coerceNumber(v: unknown): number | null {
    if (typeof v === 'number') return Number.isFinite(v) ? v : null;
    if (typeof v === 'string') {
      const trimmed = v.trim();
      if (!trimmed) return null;
      const n = Number(trimmed);
      return Number.isFinite(n) ? n : null;
    }
    return null;
  }

  private static coerceDate(v: unknown): Date | null {
    if (v instanceof Date) return isNaN(v.getTime()) ? null : v;
    if (typeof v === 'string') {
      const s = v.trim();
      if (!s) return null;
      // Accept YYYY-MM-DD or ISO datetime; Date(...) handles both.
      const d = new Date(s);
      return isNaN(d.getTime()) ? null : d;
    }
    return null;
  }

  // ─────────────────────────────────────────────────────────────────────────────
  // Patch / serialize
  // ─────────────────────────────────────────────────────────────────────────────

  private static patchObject(group: AnyFormGroup, schema: JsonSchemaObject, data: any, depth: number, maxDepth: number): void {
    const props = schema.properties ?? {};
    for (const [key, propSchema] of Object.entries(props)) {
      const ctrl = group.get(key);
      if (!ctrl) continue;

      const type = JsonSchemaFormBuilder.primaryType(propSchema);
      const raw = data?.[key];
      const unwrapped = (raw && typeof raw === 'object' && 'value' in raw) ? (raw as any).value : raw;

      if (type === 'object') {
        if (ctrl instanceof FormGroup && unwrapped && typeof unwrapped === 'object') {
          JsonSchemaFormBuilder.patchObject(ctrl as AnyFormGroup, propSchema as JsonSchemaObject, unwrapped, depth + 1, maxDepth);
        } else if (ctrl instanceof FormControl) {
          ctrl.setValue(unwrapped ?? null, { emitEvent: false });
        }
        continue;
      }

      if (type === 'array') {
        const arrCtrl = ctrl as FormArray;
        arrCtrl.clear({ emitEvent: false });
        const arr = Array.isArray(unwrapped) ? unwrapped : [];
        const itemSchema = (propSchema as JsonSchemaArray).items;
        for (const item of arr) {
          if (itemSchema && JsonSchemaFormBuilder.primaryType(itemSchema) === 'object') {
            const row = JsonSchemaFormBuilder.buildObjectGroup(itemSchema as JsonSchemaObject, depth + 1, maxDepth);
            JsonSchemaFormBuilder.patchObject(row, itemSchema as JsonSchemaObject, item ?? {}, depth + 1, maxDepth);
            arrCtrl.push(row, { emitEvent: false });
          }
        }
        continue;
      }

      if ((propSchema as any)?.format === 'date') {
        (ctrl as FormControl).setValue(unwrapped ? JsonSchemaFormBuilder.coerceDate(unwrapped) : null, { emitEvent: false });
        continue;
      }

      (ctrl as FormControl).setValue(unwrapped ?? null, { emitEvent: false });
    }
  }

  private static serializeObject(group: AnyFormGroup, schema: JsonSchemaObject): Record<string, unknown> {
    const result: Record<string, unknown> = {};
    const props = schema.properties ?? {};

    for (const [key, propSchema] of Object.entries(props)) {
      const ctrl = group.get(key);
      if (!ctrl) continue;

      const type = JsonSchemaFormBuilder.primaryType(propSchema);

      if (type === 'object') {
        if (ctrl instanceof FormGroup) {
          result[key] = JsonSchemaFormBuilder.serializeObject(ctrl as AnyFormGroup, propSchema as JsonSchemaObject);
        } else {
          result[key] = ctrl.value ?? null;
        }
        continue;
      }

      if (type === 'array') {
        const arr: unknown[] = [];
        const arrCtrl = ctrl as FormArray;
        const itemSchema = (propSchema as JsonSchemaArray).items;
        for (const rowCtrl of arrCtrl.controls) {
          if (rowCtrl instanceof FormGroup && itemSchema && JsonSchemaFormBuilder.primaryType(itemSchema) === 'object') {
            arr.push(JsonSchemaFormBuilder.serializeObject(rowCtrl as AnyFormGroup, itemSchema as JsonSchemaObject));
          } else {
            arr.push(rowCtrl.value);
          }
        }
        result[key] = arr;
        continue;
      }

      if ((propSchema as any)?.format === 'date') {
        const d = JsonSchemaFormBuilder.coerceDate(ctrl.value);
        result[key] = d ? JsonSchemaFormBuilder.formatDateYYYYMMDD(d) : (ctrl.value ?? null);
        continue;
      }

      if (type === 'integer') {
        const n = JsonSchemaFormBuilder.coerceNumber(ctrl.value);
        result[key] = n === null ? (ctrl.value ?? null) : Math.trunc(n);
        continue;
      }

      if (type === 'number') {
        const n = JsonSchemaFormBuilder.coerceNumber(ctrl.value);
        result[key] = n === null ? (ctrl.value ?? null) : n;
        continue;
      }

      // boolean or string
      result[key] = ctrl.value ?? null;
    }

    return result;
  }

  private static formatDateYYYYMMDD(d: Date): string {
    const yyyy = d.getFullYear();
    const mm = String(d.getMonth() + 1).padStart(2, '0');
    const dd = String(d.getDate()).padStart(2, '0');
    return `${yyyy}-${mm}-${dd}`;
  }
}

