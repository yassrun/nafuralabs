import { CommonModule } from '@angular/common';
import { Component, input, output, signal } from '@angular/core';
import { TranslateModule } from '@ngx-translate/core';
import type { TemplateVariable } from '../models';

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
        @for (group of groupedVariables(); track group.name) {
          <div class="variables-sidebar__group">
            <button
              type="button"
              class="variables-sidebar__group-header"
              (click)="toggleGroup(group.name)">
              {{ group.name }}
            </button>
            @if (expanded()[group.name] !== false) {
              <ul class="variables-sidebar__list">
                @for (v of group.items; track v.path) {
                  <li>
                    <button
                      type="button"
                      class="variables-sidebar__var"
                      (click)="insertVariable(v)">
                      <span class="variables-sidebar__var-path">{{ v.path }}</span>
                      @if (v.sampleValue !== undefined) {
                        <span class="variables-sidebar__var-sample">{{ v.sampleValue }}</span>
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
      }
    `,
  ],
})
export class TemplateVariablesSidebarComponent {
  readonly variables = input<TemplateVariable[]>([]);
  /** Emits snippet to insert at cursor (e.g. th:text="${entity.code}"). */
  readonly insertSnippet = output<string>();

  private expandedState: Record<string, boolean> = { entity: true, tenant: true, system: true };
  readonly expanded = signal<Record<string, boolean>>({ ...this.expandedState });

  groupedVariables = (): { name: string; items: TemplateVariable[] }[] => {
    const vars = this.variables();
    const groups: Record<string, TemplateVariable[]> = {
      entity: [],
      tenant: [],
      system: [],
    };
    for (const v of vars) {
      if (groups[v.group]) groups[v.group].push(v);
    }
    const labels: Record<string, string> = {
      entity: 'Entity',
      tenant: 'Tenant',
      system: 'System',
    };
    return Object.entries(groups)
      .filter(([, items]) => items.length > 0)
      .map(([name, items]) => ({ name: labels[name] ?? name, items }));
  };

  toggleGroup(name: string): void {
    this.expandedState[name] = !this.expandedState[name];
    this.expanded.set({ ...this.expandedState });
  }

  insertVariable(v: TemplateVariable): void {
    const snippet = `th:text="\${${v.path}}"`;
    this.insertSnippet.emit(snippet);
  }
}
