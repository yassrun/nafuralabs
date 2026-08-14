import { CommonModule } from '@angular/common';
import { Component, computed, input, output, signal } from '@angular/core';
import { TranslateModule } from '@ngx-translate/core';
import type { TemplateVariable, TemplateVariableGroup } from '../models';

const GROUP_ORDER: TemplateVariableGroup[] = ['entity', 'tenant', 'system'];

interface VariableGroupView {
  key: TemplateVariableGroup;
  labelKey: string;
  items: TemplateVariable[];
}

/**
 * Builds the HTML to insert for a variable. Always a complete element so the result stays
 * valid wherever the caret is; the value kind decides the shape.
 */
export function buildVariableSnippet(v: TemplateVariable): string {
  const expr = `\${${v.path}}`;
  const type = (v.type ?? '').toLowerCase();
  if (type === 'image' || v.path.toLowerCase().includes('logo')) {
    return `<img th:src="${expr}" alt=""/>`;
  }
  if (type === 'date') {
    return `<span th:text="\${#temporals.format(${v.path}, 'dd/MM/yyyy')}">${
      v.example ?? '01/01/2026'
    }</span>`;
  }
  if (type === 'datetime') {
    return `<span th:text="\${#temporals.format(${v.path}, 'dd/MM/yyyy HH:mm')}">${
      v.example ?? '01/01/2026 09:00'
    }</span>`;
  }
  return `<span th:text="${expr}">${v.example ?? v.label ?? v.path}</span>`;
}

@Component({
  selector: 'app-template-variables-sidebar',
  standalone: true,
  imports: [CommonModule, TranslateModule],
  template: `
    <div class="variables-sidebar">
      <h4 class="variables-sidebar__title">{{ 'administration.templates.editor.variables' | translate }}</h4>
      @if (variables().length === 0) {
        <p class="variables-sidebar__empty">{{ 'administration.templates.editor.variablesEmpty' | translate }}</p>
      } @else {
        @for (group of groupedVariables(); track group.key) {
          <div class="variables-sidebar__group">
            <button
              type="button"
              class="variables-sidebar__group-header"
              [attr.aria-expanded]="expanded()[group.key] !== false"
              (click)="toggleGroup(group.key)">
              {{ group.labelKey | translate }}
            </button>
            @if (expanded()[group.key] !== false) {
              <ul class="variables-sidebar__list">
                @for (v of group.items; track v.path) {
                  <li>
                    <button
                      type="button"
                      class="variables-sidebar__var"
                      (click)="insertVariable(v)">
                      <span class="variables-sidebar__var-path">{{ v.label || v.path }}</span>
                      <span class="variables-sidebar__var-sample">{{ v.path }}</span>
                      @if (v.example) {
                        <span class="variables-sidebar__var-sample">{{ v.example }}</span>
                      }
                    </button>
                  </li>
                }
              </ul>
            }
          </div>
        }
      }
    </div>
  `,
  styles: [
    `
      .variables-sidebar {
        padding: 8px;
        border: 1px solid var(--nf-border-default, #e0e0e0);
        border-radius: 6px;
        background: var(--nf-surface-subtle, #f5f5f5);
        max-height: 320px;
        overflow-y: auto;
      }
      .variables-sidebar__title {
        margin: 0 0 8px 0;
        font-size: 0.875rem;
        font-weight: 600;
      }
      .variables-sidebar__empty {
        margin: 0;
        font-size: 0.8rem;
        color: var(--nf-text-muted, #666);
      }
      .variables-sidebar__group {
        margin-bottom: 8px;
      }
      .variables-sidebar__group-header {
        width: 100%;
        padding: 6px 8px;
        text-align: left;
        border: none;
        border-radius: 4px;
        background: transparent;
        font-weight: 600;
        font-size: 0.8rem;
        cursor: pointer;
      }
      .variables-sidebar__group-header:hover {
        background: rgba(0, 0, 0, 0.06);
      }
      .variables-sidebar__list {
        list-style: none;
        margin: 0;
        padding: 0 0 0 12px;
      }
      .variables-sidebar__var {
        display: block;
        width: 100%;
        padding: 4px 8px;
        text-align: left;
        border: none;
        border-radius: 4px;
        background: transparent;
        font-family: monospace;
        font-size: 0.75rem;
        cursor: pointer;
      }
      .variables-sidebar__var:hover {
        background: rgba(0, 0, 0, 0.06);
      }
      .variables-sidebar__var-path {
        display: block;
        color: var(--nf-text-primary, #333);
      }
      .variables-sidebar__var-sample {
        display: block;
        color: var(--nf-text-muted, #666);
        font-size: 0.7rem;
        margin-top: 2px;
        overflow-wrap: anywhere;
      }
    `,
  ],
})
export class TemplateVariablesSidebarComponent {
  readonly variables = input<TemplateVariable[]>([]);
  /** Emits snippet to insert at cursor (e.g. th:text="${entity.code}"). */
  readonly insertSnippet = output<string>();

  /** Keyed by group key ('entity'…), never by display label. */
  private expandedState: Record<TemplateVariableGroup, boolean> = {
    entity: true,
    tenant: true,
    system: true,
  };
  readonly expanded = signal<Record<string, boolean>>({ ...this.expandedState });

  readonly groupedVariables = computed<VariableGroupView[]>(() => {
    const groups: Record<TemplateVariableGroup, TemplateVariable[]> = {
      entity: [],
      tenant: [],
      system: [],
    };
    for (const v of this.variables()) {
      groups[v.group]?.push(v);
    }
    return GROUP_ORDER.filter((key) => groups[key].length > 0).map((key) => ({
      key,
      labelKey: `administration.templates.editor.variableGroups.${key}`,
      items: groups[key],
    }));
  });

  toggleGroup(key: TemplateVariableGroup): void {
    this.expandedState[key] = !this.expandedState[key];
    this.expanded.set({ ...this.expandedState });
  }


  /**
   * Emits a self-contained HTML element, never a bare Thymeleaf attribute: an attribute
   * dropped at the caret lands outside any tag and produces invalid markup.
   */
  insertVariable(v: TemplateVariable): void {
    this.insertSnippet.emit(buildVariableSnippet(v));
  }
}
