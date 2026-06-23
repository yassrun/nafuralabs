/**
 * BuilderStateStore
 * 
 * Manages the builder state with:
 * - Reactive signals
 * - Dirty tracking
 * - Validation
 * - Undo support (future)
 */

import { Injectable, computed, signal } from '@angular/core';
import { 
  BuilderState, 
  BuilderField, 
  BuilderSection, 
  BuilderGridColumn, 
  BuilderArrayConfig,
  createEmptyBuilderState,
  createDefaultField,
  createDefaultSection
} from '../models/builder-state.model';
import { validateBuilderState, ValidationResult } from './doc-type-builder-engine';

@Injectable()
export class BuilderStateStore {
  // Core state
  private readonly _state = signal<BuilderState>(createEmptyBuilderState());
  private readonly _originalState = signal<BuilderState | null>(null);
  private readonly _validationResult = signal<ValidationResult>({ isValid: true, errors: [] });

  // Public readonly signals
  readonly state = this._state.asReadonly();
  readonly fields = computed(() => this._state()?.fields ?? []);
  readonly sections = computed(() => this._state()?.sections ?? []);
  readonly gridColumns = computed(() => this._state()?.gridColumns ?? []);
  readonly arrays = computed(() => this._state()?.arrays ?? []);

  // Dirty tracking
  readonly isDirty = computed(() => {
    const original = this._originalState();
    if (!original) return false;
    return JSON.stringify(this._state()) !== JSON.stringify(original);
  });

  // Validation
  readonly isValid = computed(() => this._validationResult().isValid);
  readonly errors = computed(() => this._validationResult().errors);

  /**
   * Initialize the store with a builder state.
   */
  initialize(state: BuilderState | null | undefined): void {
    // Normalize state to ensure all arrays exist
    const normalized = this.normalizeState(state);
    const cloned = this.cloneState(normalized);
    this._state.set(cloned);
    this._originalState.set(this.cloneState(normalized));
    this.validate();
  }

  /**
   * Normalize state to ensure all required arrays exist.
   */
  private normalizeState(state: BuilderState | null | undefined): BuilderState {
    return {
      fields: state?.fields || [],
      sections: state?.sections || [],
      gridColumns: state?.gridColumns || [],
      arrays: state?.arrays || [],
    };
  }

  /**
   * Mark current state as clean (after save).
   */
  markClean(): void {
    this._originalState.set(this.cloneState(this._state()));
  }

  /**
   * Reset to original state.
   */
  reset(): void {
    const original = this._originalState();
    if (original) {
      this._state.set(this.cloneState(original));
      this.validate();
    }
  }

  // ===== Field Operations =====

  /**
   * Add a new field.
   */
  addField(field: BuilderField): void {
    this._state.update(state => ({
      ...state,
      fields: [...state.fields, field],
    }));
    this.validate();
  }

  /**
   * Update a field by key.
   */
  updateField(key: string, updates: Partial<BuilderField>): void {
    this._state.update(state => ({
      ...state,
      fields: state.fields.map(f => 
        f.key === key ? { ...f, ...updates } : f
      ),
    }));
    this.validate();
  }

  /**
   * Remove a field by key.
   */
  removeField(key: string): void {
    this._state.update(state => ({
      ...state,
      fields: state.fields.filter(f => f.key !== key),
      // Also remove from sections
      sections: state.sections.map(s => ({
        ...s,
        controls: s.controls.filter(c => !c.fieldPath.startsWith(key)),
      })),
      // Also remove from grid columns
      gridColumns: state.gridColumns.filter(c => !c.fieldPath.startsWith(key)),
    }));
    this.validate();
  }

  /**
   * Add a nested field to an object field.
   */
  addNestedField(parentKey: string, field: BuilderField): void {
    this._state.update(state => ({
      ...state,
      fields: state.fields.map(f => {
        if (f.key === parentKey && f.type === 'object') {
          return {
            ...f,
            nestedFields: [...(f.nestedFields || []), field],
          };
        }
        return f;
      }),
    }));
    this.validate();
  }

  /**
   * Add an array item field.
   */
  addArrayItemField(arrayKey: string, field: BuilderField): void {
    this._state.update(state => ({
      ...state,
      fields: state.fields.map(f => {
        if (f.key === arrayKey && f.type === 'array') {
          return {
            ...f,
            arrayItemFields: [...(f.arrayItemFields || []), field],
          };
        }
        return f;
      }),
    }));
    this.validate();
  }

  // ===== Section Operations =====

  /**
   * Add a new section.
   */
  addSection(section: BuilderSection): void {
    this._state.update(state => ({
      ...state,
      sections: [...state.sections, section],
    }));
    this.validate();
  }

  /**
   * Update a section by ID.
   */
  updateSection(id: string, updates: Partial<BuilderSection>): void {
    this._state.update(state => ({
      ...state,
      sections: state.sections.map(s => 
        s.id === id ? { ...s, ...updates } : s
      ),
    }));
    this.validate();
  }

  /**
   * Remove a section by ID.
   */
  removeSection(id: string): void {
    this._state.update(state => ({
      ...state,
      sections: state.sections.filter(s => s.id !== id),
    }));
    this.validate();
  }

  /**
   * Add a control to a section.
   */
  addControl(sectionId: string, fieldPath: string, label?: string): void {
    this._state.update(state => ({
      ...state,
      sections: state.sections.map(s => {
        if (s.id === sectionId) {
          return {
            ...s,
            controls: [...s.controls, { fieldPath, label }],
          };
        }
        return s;
      }),
    }));
    this.validate();
  }

  /**
   * Remove a control from a section.
   */
  removeControl(sectionId: string, fieldPath: string): void {
    this._state.update(state => ({
      ...state,
      sections: state.sections.map(s => {
        if (s.id === sectionId) {
          return {
            ...s,
            controls: s.controls.filter(c => c.fieldPath !== fieldPath),
          };
        }
        return s;
      }),
    }));
    this.validate();
  }

  /**
   * Move a control within a section.
   */
  moveControl(sectionId: string, fromIndex: number, toIndex: number): void {
    this._state.update(state => ({
      ...state,
      sections: state.sections.map(s => {
        if (s.id === sectionId) {
          const controls = [...s.controls];
          const [removed] = controls.splice(fromIndex, 1);
          controls.splice(toIndex, 0, removed);
          return { ...s, controls };
        }
        return s;
      }),
    }));
  }

  // ===== Grid Column Operations =====

  /**
   * Add a grid column.
   */
  addGridColumn(column: BuilderGridColumn): void {
    this._state.update(state => ({
      ...state,
      gridColumns: [...state.gridColumns, column],
    }));
    this.validate();
  }

  /**
   * Remove a grid column.
   */
  removeGridColumn(fieldPath: string): void {
    this._state.update(state => ({
      ...state,
      gridColumns: state.gridColumns.filter(c => c.fieldPath !== fieldPath),
    }));
    this.validate();
  }

  /**
   * Update grid columns order.
   */
  setGridColumns(columns: BuilderGridColumn[]): void {
    this._state.update(state => ({
      ...state,
      gridColumns: columns,
    }));
    this.validate();
  }

  // ===== Array Config Operations =====

  /**
   * Add an array config.
   */
  addArrayConfig(config: BuilderArrayConfig): void {
    this._state.update(state => ({
      ...state,
      arrays: [...state.arrays, config],
    }));
    this.validate();
  }

  /**
   * Update an array config.
   */
  updateArrayConfig(path: string, updates: Partial<BuilderArrayConfig>): void {
    this._state.update(state => ({
      ...state,
      arrays: state.arrays.map(a => 
        a.path === path ? { ...a, ...updates } : a
      ),
    }));
    this.validate();
  }

  /**
   * Remove an array config.
   */
  removeArrayConfig(path: string): void {
    this._state.update(state => ({
      ...state,
      arrays: state.arrays.filter(a => a.path !== path),
    }));
    this.validate();
  }

  // ===== Batch Operations =====

  /**
   * Update entire state (for import/paste).
   */
  setState(state: BuilderState): void {
    this._state.set(this.cloneState(state));
    this.validate();
  }

  // ===== Private Helpers =====

  private validate(): void {
    const result = validateBuilderState(this._state());
    this._validationResult.set(result);
  }

  private cloneState(state: BuilderState): BuilderState {
    return JSON.parse(JSON.stringify(state));
  }
}
