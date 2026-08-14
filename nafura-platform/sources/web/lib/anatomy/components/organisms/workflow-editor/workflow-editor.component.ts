import { Component, input, output, signal } from '@angular/core';
import { CommonModule } from '@angular/common';

export type WorkflowNodeType = 'start' | 'task' | 'decision' | 'end';

export interface WorkflowNode {
  id: string;
  label: string;
  type: WorkflowNodeType;
  assigneeRole?: string;
  slaHours?: number;
}

export interface WorkflowEdge {
  id: string;
  from: string;
  to: string;
  label?: string;
  condition?: string;
}

export interface WorkflowConnectEvent {
  from: string;
  to: string;
}

@Component({
  selector: 'nf-workflow-editor',
  standalone: true,
  imports: [CommonModule],
  template: `
    <section class="nf-workflow-editor">
      <header class="nf-workflow-editor__header">
        <h3 class="nf-workflow-editor__title">{{ title() }}</h3>
        <button type="button" class="nf-workflow-editor__btn" [disabled]="readonly()" (click)="addNodeRequested.emit()">
          {{ addNodeLabel() }}
        </button>
      </header>

      <div class="nf-workflow-editor__grid">
        <article class="nf-workflow-editor__panel">
          <h4 class="nf-workflow-editor__panel-title">{{ nodesLabel() }}</h4>
          @if (nodes().length === 0) {
            <p class="nf-workflow-editor__empty">{{ emptyNodesLabel() }}</p>
          } @else {
            <ul class="nf-workflow-editor__list">
              @for (node of nodes(); track node.id) {
                <li class="nf-workflow-editor__item">
                  <button type="button" class="nf-workflow-editor__item-btn" (click)="selectNode.emit(node.id)">
                    <strong>{{ node.label }}</strong>
                    <span class="nf-workflow-editor__type">{{ node.type }}</span>
                    @if (node.assigneeRole) {
                      <span class="nf-workflow-editor__meta">Role: {{ node.assigneeRole }}</span>
                    }
                    @if (node.slaHours != null) {
                      <span class="nf-workflow-editor__meta">SLA: {{ node.slaHours }}h</span>
                    }
                  </button>
                  @if (!readonly()) {
                    <button type="button" class="nf-workflow-editor__icon-btn nf-workflow-editor__icon-btn--danger" (click)="deleteNodeRequested.emit(node.id)">
                      ×
                    </button>
                  }
                </li>
              }
            </ul>
          }
        </article>

        <article class="nf-workflow-editor__panel">
          <h4 class="nf-workflow-editor__panel-title">{{ transitionsLabel() }}</h4>
          @if (!readonly()) {
            <div class="nf-workflow-editor__connect">
              <select class="nf-workflow-editor__select" [value]="connectFrom()" (change)="onFromChange($event)">
                <option value="">{{ fromLabel() }}</option>
                @for (node of nodes(); track node.id) {
                  <option [value]="node.id">{{ node.label }}</option>
                }
              </select>
              <select class="nf-workflow-editor__select" [value]="connectTo()" (change)="onToChange($event)">
                <option value="">{{ toLabel() }}</option>
                @for (node of nodes(); track node.id) {
                  <option [value]="node.id">{{ node.label }}</option>
                }
              </select>
              <button type="button" class="nf-workflow-editor__btn" [disabled]="!canConnect()" (click)="onConnect()">
                {{ connectLabel() }}
              </button>
            </div>
          }

          @if (edges().length === 0) {
            <p class="nf-workflow-editor__empty">{{ emptyTransitionsLabel() }}</p>
          } @else {
            <ul class="nf-workflow-editor__list">
              @for (edge of edges(); track edge.id) {
                <li class="nf-workflow-editor__item">
                  <button type="button" class="nf-workflow-editor__item-btn" (click)="selectEdge.emit(edge.id)">
                    <strong>{{ edge.from }} -> {{ edge.to }}</strong>
                    @if (edge.label) {
                      <span class="nf-workflow-editor__meta">{{ edge.label }}</span>
                    }
                    @if (edge.condition) {
                      <span class="nf-workflow-editor__meta">When: {{ edge.condition }}</span>
                    }
                  </button>
                  @if (!readonly()) {
                    <button type="button" class="nf-workflow-editor__icon-btn nf-workflow-editor__icon-btn--danger" (click)="deleteEdgeRequested.emit(edge.id)">
                      ×
                    </button>
                  }
                </li>
              }
            </ul>
          }
        </article>
      </div>
    </section>
  `,
  styles: [`
    :host { display: block; }
    .nf-workflow-editor {
      border: 1px solid var(--nf-border-default);
      border-radius: 10px;
      background: var(--nf-surface-card);
      padding: 10px;
      display: grid;
      gap: 10px;
    }
    .nf-workflow-editor__header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      gap: 10px;
    }
    .nf-workflow-editor__title { margin: 0; color: var(--nf-text-primary); font-size: var(--nf-font-size-md, 1rem); }
    .nf-workflow-editor__grid {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 10px;
    }
    .nf-workflow-editor__panel {
      border: 1px solid var(--nf-border-default);
      border-radius: 8px;
      padding: 8px;
      display: grid;
      gap: 8px;
      min-height: 220px;
    }
    .nf-workflow-editor__panel-title {
      margin: 0;
      color: var(--nf-text-primary);
      font-size: var(--nf-font-size-sm, 0.875rem);
    }
    .nf-workflow-editor__empty {
      margin: 0;
      color: var(--nf-text-muted);
      font-size: var(--nf-font-size-sm, 0.875rem);
    }
    .nf-workflow-editor__list {
      margin: 0;
      padding: 0;
      list-style: none;
      display: grid;
      gap: 6px;
      align-content: start;
    }
    .nf-workflow-editor__item {
      display: flex;
      align-items: start;
      gap: 6px;
    }
    .nf-workflow-editor__item-btn {
      flex: 1;
      border: 1px solid var(--nf-border-default);
      border-radius: 8px;
      background: var(--nf-surface-card);
      color: var(--nf-text-secondary);
      text-align: left;
      display: grid;
      gap: 2px;
      padding: 6px 8px;
      cursor: pointer;
    }
    .nf-workflow-editor__type {
      width: fit-content;
      border-radius: 999px;
      padding: 1px 8px;
      background: var(--nf-surface-section);
      color: var(--nf-text-muted);
      font-size: var(--nf-font-size-xs, 0.75rem);
      text-transform: uppercase;
    }
    .nf-workflow-editor__meta {
      font-size: var(--nf-font-size-xs, 0.75rem);
      color: var(--nf-text-muted);
    }
    .nf-workflow-editor__connect {
      display: grid;
      grid-template-columns: 1fr 1fr auto;
      gap: 6px;
    }
    .nf-workflow-editor__select {
      border: 1px solid var(--nf-border-default);
      border-radius: 6px;
      padding: 4px 6px;
      color: var(--nf-text-primary);
      background: var(--nf-surface-card);
    }
    .nf-workflow-editor__btn,
    .nf-workflow-editor__icon-btn {
      border: 1px solid var(--nf-border-default);
      border-radius: 6px;
      background: transparent;
      color: var(--nf-text-secondary);
      cursor: pointer;
    }
    .nf-workflow-editor__btn { padding: 4px 10px; }
    .nf-workflow-editor__icon-btn {
      width: 24px;
      height: 24px;
      display: inline-flex;
      align-items: center;
      justify-content: center;
    }
    .nf-workflow-editor__icon-btn--danger {
      color: var(--nf-color-danger-600);
      border-color: var(--nf-color-danger-300);
    }
    @media (max-width: 900px) {
      .nf-workflow-editor__grid { grid-template-columns: 1fr; }
      .nf-workflow-editor__connect { grid-template-columns: 1fr; }
    }
  `],
})
export class WorkflowEditorComponent {
  nodes = input<WorkflowNode[]>([]);
  edges = input<WorkflowEdge[]>([]);
  readonly = input<boolean>(false);
  title = input<string>('Workflow Editor');
  addNodeLabel = input<string>('Add node');
  nodesLabel = input<string>('Nodes');
  transitionsLabel = input<string>('Transitions');
  emptyNodesLabel = input<string>('No workflow nodes yet.');
  emptyTransitionsLabel = input<string>('No transitions yet.');
  fromLabel = input<string>('From node');
  toLabel = input<string>('To node');
  connectLabel = input<string>('Connect');

  addNodeRequested = output<void>();
  deleteNodeRequested = output<string>();
  connectNodesRequested = output<WorkflowConnectEvent>();
  deleteEdgeRequested = output<string>();
  selectNode = output<string>();
  selectEdge = output<string>();

  readonly connectFrom = signal('');
  readonly connectTo = signal('');

  canConnect(): boolean {
    return this.connectFrom().trim().length > 0 && this.connectTo().trim().length > 0;
  }

  onFromChange(event: Event): void {
    const target = event.target as HTMLSelectElement | null;
    this.connectFrom.set(target?.value || '');
  }

  onToChange(event: Event): void {
    const target = event.target as HTMLSelectElement | null;
    this.connectTo.set(target?.value || '');
  }

  onConnect(): void {
    const from = this.connectFrom().trim();
    const to = this.connectTo().trim();
    if (!from || !to) return;
    this.connectNodesRequested.emit({ from, to });
    this.connectTo.set('');
  }
}

