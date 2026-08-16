/**
 * Document Validation Service
 * 
 * Handles validation logic for document data.
 * Determines validation state and completeness state.
 */

import { Injectable, inject } from '@angular/core';
import { ValidationState, CompletenessState, DocumentWorkflowState, DocumentWorkflowStatus } from '../models/document-workflow.model';
import { JsonSchema, JsonSchemaArray, JsonSchemaObject } from '../models/json-schema.model';
import { UiSchema } from '../models/ui-schema.model';

export interface ValidationError {
  field: string;
  message: string;
  code: string;
}

export interface ValidationResult {
  isValid: boolean;
  errors: ValidationError[];
  errorCount: number;
  validationState: ValidationState;
  completenessState: CompletenessState;
}

/**
 * Document Validation Service
 */
@Injectable({ providedIn: 'root' })
export class DocumentValidationService {
  /**
   * Validate document data against schema.
   * 
   * @param data Document data to validate
   * @param jsonSchema JSON schema defining required/optional fields
   * @param uiSchema UI schema with validation rules
   * @returns Validation result with states and errors
   */
  validateDocument(
    data: Record<string, any>,
    jsonSchema: JsonSchema,
    uiSchema: UiSchema
  ): ValidationResult {
    const errors: ValidationError[] = [];
    
    // Ensure schema is an object schema (has properties and required)
    if (!this.isObjectSchema(jsonSchema)) {
      return {
        isValid: false,
        errors: [{ field: '', message: 'Schema must be an object schema', code: 'INVALID_SCHEMA_TYPE' }],
        errorCount: 1,
        validationState: ValidationState.INVALID,
        completenessState: CompletenessState.PARTIAL,
      };
    }
    
    // After type guard, TypeScript knows jsonSchema is JsonSchemaObject
    const objectSchema: JsonSchemaObject = jsonSchema;
    
    // Extract required fields from schema
    const requiredFields = objectSchema.required || [];
    const properties = objectSchema.properties || {};
    
    // Validate required fields
    for (const field of requiredFields) {
      const fieldValue = this.getFieldValue(data, field);
      const fieldSchema = properties[field];
      
      if (this.isEmpty(fieldValue)) {
        // Get field label from UI schema if available, otherwise use field path
        const fieldLabel = this.getFieldLabel(field, uiSchema) || field;
        errors.push({
          field,
          message: `${fieldLabel} is required`,
          code: 'REQUIRED_FIELD_MISSING',
        });
      } else if (fieldSchema && !this.isValidFieldValue(fieldValue, fieldSchema)) {
        const fieldLabel = this.getFieldLabel(field, uiSchema) || field;
        errors.push({
          field,
          message: `${fieldLabel} has invalid format`,
          code: 'INVALID_FIELD_FORMAT',
        });
      }
    }
    
    // Validate optional fields (format only, not presence)
    for (const [field, fieldSchema] of Object.entries(properties)) {
      if (!requiredFields.includes(field)) {
        const fieldValue = this.getFieldValue(data, field);
        if (!this.isEmpty(fieldValue) && !this.isValidFieldValue(fieldValue, fieldSchema)) {
          const fieldLabel = this.getFieldLabel(field, uiSchema) || field;
          errors.push({
            field,
            message: `${fieldLabel} has invalid format`,
            code: 'INVALID_FIELD_FORMAT',
          });
        }
      }
    }
    
    // Validate array items (check required fields in each array item)
    for (const [field, fieldSchema] of Object.entries(properties)) {
      if (this.isArraySchema(fieldSchema)) {
        const arrayValue = this.getFieldValue(data, field);
        if (Array.isArray(arrayValue) && fieldSchema.items) {
          const itemSchema = fieldSchema.items;
          if (this.isObjectSchema(itemSchema)) {
            const itemRequiredFields = itemSchema.required || [];
            const itemProperties = itemSchema.properties || {};
            
            arrayValue.forEach((item, index) => {
              if (item && typeof item === 'object') {
                // Validate required fields in each array item
                for (const itemField of itemRequiredFields) {
                  const itemFieldValue = item[itemField];
                  if (this.isEmpty(itemFieldValue)) {
                    const itemFieldLabel = this.getArrayFieldLabel(field, itemField, uiSchema) || itemField;
                    errors.push({
                      field: `${field}[${index}].${itemField}`,
                      message: `${itemFieldLabel} is required`,
                      code: 'REQUIRED_FIELD_MISSING',
                    });
                  } else {
                    const itemFieldSchema = itemProperties[itemField];
                    if (itemFieldSchema && !this.isValidFieldValue(itemFieldValue, itemFieldSchema)) {
                      const itemFieldLabel = this.getArrayFieldLabel(field, itemField, uiSchema) || itemField;
                      errors.push({
                        field: `${field}[${index}].${itemField}`,
                        message: `${itemFieldLabel} has invalid format`,
                        code: 'INVALID_FIELD_FORMAT',
                      });
                    }
                  }
                }
              }
            });
          }
        }
      }
    }
    
    // Apply custom validation rules from UI schema
    const customErrors = this.validateCustomRules(data, uiSchema);
    errors.push(...customErrors);
    
    // Determine validation state
    const validationState = errors.length > 0 
      ? ValidationState.INVALID 
      : ValidationState.VALID;
    
    // Determine completeness state
    const completenessState = this.determineCompleteness(data, properties, requiredFields);
    
    return {
      isValid: validationState === ValidationState.VALID,
      errors,
      errorCount: errors.length,
      validationState,
      completenessState,
    };
  }
  
  /**
   * Build workflow state from validation result and current status.
   */
  buildWorkflowState(
    validationResult: ValidationResult,
    currentStatus: DocumentWorkflowStatus = DocumentWorkflowStatus.DRAFT
  ): DocumentWorkflowState {
    return {
      status: currentStatus,
      validationState: validationResult.validationState,
      completenessState: validationResult.completenessState,
      errorCount: validationResult.errorCount > 0 ? validationResult.errorCount : undefined,
    };
  }
  
  /**
   * Check if document can be validated (transition to VALIDATED).
   */
  canValidate(workflowState: DocumentWorkflowState): boolean {
    return (
      workflowState.status === DocumentWorkflowStatus.DRAFT &&
      workflowState.validationState === ValidationState.VALID
    );
  }
  
  /**
   * Type guard to check if schema is an object schema.
   */
  private isObjectSchema(schema: JsonSchema): schema is JsonSchemaObject {
    return schema.type === 'object' || (schema.type === undefined && 'properties' in schema);
  }
  
  /**
   * Type guard to check if schema is an array schema.
   */
  private isArraySchema(schema: JsonSchema): schema is JsonSchemaArray {
    return schema.type === 'array';
  }
  
  /**
   * Get field value from nested data object.
   */
  private getFieldValue(data: Record<string, any>, fieldPath: string): any {
    const parts = fieldPath.split('.');
    let value = data;
    for (const part of parts) {
      if (value == null || typeof value !== 'object') {
        return undefined;
      }
      value = value[part];
    }
    return value;
  }
  
  /**
   * Check if value is empty.
   */
  private isEmpty(value: any): boolean {
    if (value == null) return true;
    if (typeof value === 'string') return value.trim().length === 0;
    if (Array.isArray(value)) return value.length === 0;
    // Date objects are valid objects but should not be considered empty
    if (value instanceof Date) return isNaN(value.getTime());
    if (typeof value === 'object') return Object.keys(value).length === 0;
    return false;
  }
  
  /**
   * Validate field value against schema type/format.
   */
  private isValidFieldValue(value: any, fieldSchema: any): boolean {
    if (!fieldSchema.type) return true;
    
    switch (fieldSchema.type) {
      case 'string':
        // Date-format fields store Date objects in the form, which is valid
        if (fieldSchema.format === 'date') {
          return typeof value === 'string' || (value instanceof Date && !isNaN(value.getTime()));
        }
        return typeof value === 'string';
      case 'number':
      case 'integer':
        return typeof value === 'number' && !isNaN(value);
      case 'boolean':
        return typeof value === 'boolean';
      case 'array':
        return Array.isArray(value);
      case 'object':
        return typeof value === 'object' && !Array.isArray(value);
      default:
        return true;
    }
  }
  
  /**
   * Validate custom rules from UI schema.
   */
  private validateCustomRules(
    data: Record<string, any>,
    uiSchema: UiSchema
  ): ValidationError[] {
    const errors: ValidationError[] = [];
    
    // TODO: Implement custom validation rules from UI schema
    // This could include:
    // - Format validators (email, phone, date ranges)
    // - Cross-field validators
    // - Business rule validators
    
    return errors;
  }
  
  /**
   * Get field label from UI schema.
   */
  private getFieldLabel(fieldPath: string, uiSchema: UiSchema): string | null {
    // Check in sections first
    if (uiSchema.sections) {
      for (const section of uiSchema.sections) {
        if (section.fields) {
          for (const field of section.fields) {
            if (field.path === fieldPath) {
              return field.label;
            }
          }
        }
      }
    }
    
    // Check in arrays (for array item fields)
    if (uiSchema.arrays) {
      for (const arrayConfig of uiSchema.arrays) {
        if (arrayConfig.columns) {
          for (const column of arrayConfig.columns) {
            // For array fields, the path is relative to the array item
            // So we check if the fieldPath ends with the column path
            if (fieldPath.endsWith(column.path) || fieldPath === column.path) {
              return column.label;
            }
          }
        }
      }
    }
    
    return null;
  }
  
  /**
   * Get field label for an array item field from UI schema.
   */
  private getArrayFieldLabel(arrayPath: string, itemFieldPath: string, uiSchema: UiSchema): string | null {
    // Find the array config that matches the array path
    if (uiSchema.arrays) {
      for (const arrayConfig of uiSchema.arrays) {
        if (arrayConfig.path === arrayPath && arrayConfig.columns) {
          for (const column of arrayConfig.columns) {
            if (column.path === itemFieldPath) {
              return column.label;
            }
          }
        }
      }
    }
    
    return null;
  }
  
  /**
   * Determine completeness state.
   */
  private determineCompleteness(
    data: Record<string, any>,
    properties: Record<string, any>,
    requiredFields: string[]
  ): CompletenessState {
    // Check if all optional fields are also filled
    const optionalFields = Object.keys(properties).filter(
      field => !requiredFields.includes(field)
    );
    
    const allOptionalFilled = optionalFields.every(field => {
      const value = this.getFieldValue(data, field);
      return !this.isEmpty(value);
    });
    
    return allOptionalFilled 
      ? CompletenessState.COMPLETE 
      : CompletenessState.PARTIAL;
  }
}
