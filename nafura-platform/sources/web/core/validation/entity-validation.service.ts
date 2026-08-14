/**
 * Entity Validation Service
 *
 * Reads shared validation JSON files (generated from .entity.json) and creates
 * Angular reactive form validators that match backend Jakarta Validation exactly.
 *
 * Usage:
 *   const validators = await this.validationService.getFieldValidators('item', 'code');
 *   // Returns: [Validators.required, Validators.maxLength(50), Validators.pattern('^[A-Z0-9-]+$')]
 *
 *   const formGroup = await this.validationService.buildFormGroup('item', defaultValues);
 *   // Returns: FormGroup with all validators pre-configured
 */

import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import {
  FormBuilder,
  FormGroup,
  Validators,
  ValidatorFn,
  AbstractControl,
  ValidationErrors,
} from '@angular/forms';
import { firstValueFrom } from 'rxjs';

// ─── Validation Rule Types ────────────────────────────────────────────────────

export interface FieldValidationRules {
  required?: boolean;
  minLength?: number;
  maxLength?: number;
  min?: number;
  max?: number;
  pattern?: string;
  unique?: boolean;
}

export interface EntityValidationSchema {
  entity: string;
  fields: Record<string, FieldValidationRules>;
}

// ─── Service ──────────────────────────────────────────────────────────────────

@Injectable({ providedIn: 'root' })
export class EntityValidationService {
  private readonly http = inject(HttpClient);
  private readonly fb = inject(FormBuilder);
  private readonly cache = new Map<string, EntityValidationSchema>();

  /**
   * Load the validation schema for an entity.
   * Schemas are located at /assets/validation/<entity-kebab>.validation.json
   */
  async loadSchema(entityName: string): Promise<EntityValidationSchema> {
    const key = entityName.toLowerCase();
    if (this.cache.has(key)) {
      return this.cache.get(key)!;
    }

    const kebab = entityName.replace(/([a-z])([A-Z])/g, '$1-$2').toLowerCase();
    const url = `/assets/validation/${kebab}.validation.json`;

    try {
      const schema = await firstValueFrom(
        this.http.get<EntityValidationSchema>(url)
      );
      this.cache.set(key, schema);
      return schema;
    } catch {
      console.warn(`[EntityValidationService] No validation schema found for "${entityName}" at ${url}`);
      return { entity: entityName, fields: {} };
    }
  }

  /**
   * Get Angular validators for a specific field.
   */
  async getFieldValidators(entityName: string, fieldName: string): Promise<ValidatorFn[]> {
    const schema = await this.loadSchema(entityName);
    const rules = schema.fields[fieldName];
    if (!rules) return [];
    return this.rulesToValidators(rules);
  }

  /**
   * Build a FormGroup with all validators pre-configured from the schema.
   * @param entityName - Entity name (e.g., 'item', 'partner')
   * @param defaults - Default values for each field
   * @param fieldNames - Optional: only include these fields (default: all fields from schema)
   */
  async buildFormGroup(
    entityName: string,
    defaults: Record<string, unknown> = {},
    fieldNames?: string[]
  ): Promise<FormGroup> {
    const schema = await this.loadSchema(entityName);
    const controls: Record<string, [unknown, ValidatorFn[]]> = {};

    const fields = fieldNames || Object.keys(schema.fields);
    for (const field of fields) {
      const rules = schema.fields[field] || {};
      const validators = this.rulesToValidators(rules);
      controls[field] = [defaults[field] ?? null, validators];
    }

    return this.fb.group(controls);
  }

  /**
   * Get human-readable error message for a validation error key.
   */
  getErrorMessage(errorKey: string, errorValue: unknown, fieldLabel?: string): string {
    const label = fieldLabel || 'This field';
    switch (errorKey) {
      case 'required':
        return `${label} is required`;
      case 'minlength':
        return `${label} must be at least ${(errorValue as { requiredLength: number }).requiredLength} characters`;
      case 'maxlength':
        return `${label} must be at most ${(errorValue as { requiredLength: number }).requiredLength} characters`;
      case 'min':
        return `${label} must be at least ${(errorValue as { min: number }).min}`;
      case 'max':
        return `${label} must be at most ${(errorValue as { max: number }).max}`;
      case 'pattern':
        return `${label} format is invalid`;
      default:
        return `${label} is invalid`;
    }
  }

  /**
   * Get the first error message for a form control.
   */
  getFirstError(control: AbstractControl, fieldLabel?: string): string | null {
    if (!control.errors) return null;
    const [key, value] = Object.entries(control.errors)[0];
    return this.getErrorMessage(key, value, fieldLabel);
  }

  // ─── Private ────────────────────────────────────────────────────────────────

  private rulesToValidators(rules: FieldValidationRules): ValidatorFn[] {
    const validators: ValidatorFn[] = [];

    if (rules.required)                  validators.push(Validators.required);
    if (rules.minLength != null)         validators.push(Validators.minLength(rules.minLength));
    if (rules.maxLength != null)         validators.push(Validators.maxLength(rules.maxLength));
    if (rules.min != null)               validators.push(Validators.min(rules.min));
    if (rules.max != null)               validators.push(Validators.max(rules.max));
    if (rules.pattern)                   validators.push(Validators.pattern(rules.pattern));

    return validators;
  }
}
