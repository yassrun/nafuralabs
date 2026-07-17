import { CommonModule } from '@angular/common';
import {
  ChangeDetectionStrategy,
  Component,
  EventEmitter,
  Input,
  OnChanges,
  Output,
  SimpleChanges,
  signal,
} from '@angular/core';
import { TranslateModule } from '@ngx-translate/core';

import type { FieldIssue } from '../../doc-extractor/models/extraction.model';
import type { UiArrayColumn, UiTreeConfig } from '../../doc-extractor/models/ui-schema.model';
import type { SmartImportRow, SmartImportRowStatus } from '../models/smart-import.model';
import { formatIssueMessage } from '../utils/issue-display.util';
import {
  flattenSmartImportTree,
  getRelativeValue,
  type SmartImportTreeNode,
} from '../utils/tree-flatten.util';

export interface SmartImportTreeNodeEvent {
  node: SmartImportTreeNode;
}

@Component({
  selector: 'nf-smart-import-tree-table',
  standalone: true,
  imports: [CommonModule, TranslateModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="wrap">
      @if (title) {
        <h3>{{ title }}</h3>
      }
      <div class="table-scroll">
        <table>
          <thead>
            <tr>
              <th class="status-col">{{ 'platform.smartImport.columns.status' | translate }}</th>
              <th class="level-col">{{ 'platform.smartImport.columns.level' | translate }}</th>
              @for (col of columns; track col.path) {
                <th [style.width.px]="col.widthPx ?? null">{{ col.label }}</th>
              }
            </tr>
          </thead>
          <tbody>
            @for (node of visibleNodes(); track node.path) {
              <tr
                [class.invalid]="node.status === 'NEEDS_REVIEW'"
                [class.muted]="isMuted(node.status)"
                (dblclick)="nodeActivate.emit({ node })"
                [attr.title]="'platform.smartImport.review.dblclickHint' | translate">
                <td class="status-col">
                  <span class="badge" [attr.data-status]="node.status">
                    {{ statusKey(node.status) | translate }}
                  </span>
                </td>
                <td class="level-col">
                  <button
                    type="button"
                    class="tree-toggle"
                    [style.padding-left.px]="node.depth * 16"
                    (click)="toggle(node.path); $event.stopPropagation()"
                    [attr.aria-expanded]="isExpanded(node.path)">
                    @if (node.expandable) {
                      <span class="chevron">{{ isExpanded(node.path) ? '▾' : '▸' }}</span>
                    } @else {
                      <span class="chevron spacer"></span>
                    }
                    <span class="level-badge">{{ node.levelLabel }}</span>
                  </button>
                </td>
                @for (col of columns; track col.path) {
                  <td class="cell">{{ displayValue(node.data, col.path) }}</td>
                }
              </tr>
              @if (node.issues.length > 0 && node.status === 'NEEDS_REVIEW') {
                <tr class="issues-row">
                  <td [attr.colspan]="columns.length + 2">
                    <ul [style.margin-left.px]="110 + node.depth * 16">
                      @for (issue of node.issues; track issue.path + issue.kind) {
                        <li>{{ humanIssue(issue) }}</li>
                      }
                    </ul>
                  </td>
                </tr>
              }
            }
          </tbody>
        </table>
      </div>
    </div>
  `,
  styles: [`
    .wrap { display: grid; gap: .5rem; }
    h3 { margin: 0; font-size: .95rem; }
    .table-scroll { overflow: auto; max-height: min(52vh, 560px); border: 1px solid var(--nf-color-border); border-radius: .5rem; }
    table { width: 100%; border-collapse: collapse; font-size: .875rem; }
    th, td { padding: .45rem .65rem; text-align: left; border-bottom: 1px solid var(--nf-color-border); vertical-align: top; }
    th { position: sticky; top: 0; background: var(--nf-color-bg-subtle, #f5f5f5); z-index: 1; }
    tbody tr { cursor: pointer; }
    tbody tr.muted { opacity: .55; }
    tbody tr.invalid { background: color-mix(in srgb, var(--nf-color-warning-500, #f59e0b) 8%, transparent); }
    tbody tr:hover { background: color-mix(in srgb, var(--nf-color-primary-500, #2563eb) 6%, transparent); }
    .cell { color: var(--nf-color-text-secondary); }
    .status-col { width: 110px; }
    .level-col { min-width: 140px; }
    .tree-toggle {
      display: inline-flex; align-items: center; gap: .35rem;
      border: 0; background: transparent; color: inherit; cursor: pointer; padding: 0; font: inherit;
    }
    .chevron { width: 1rem; display: inline-block; text-align: center; }
    .chevron.spacer { visibility: hidden; }
    .level-badge {
      font-size: .7rem; padding: .1rem .4rem; border-radius: 999px;
      background: var(--nf-color-bg-subtle);
    }
    .badge {
      display: inline-block; padding: .1rem .45rem; border-radius: 999px;
      font-size: .7rem; background: var(--nf-color-bg-subtle);
    }
    .badge[data-status='READY'] { color: var(--nf-color-success-700, #15803d); }
    .badge[data-status='NEEDS_REVIEW'] { color: var(--nf-color-warning-700, #b45309); }
    .badge[data-status='DUPLICATE'],
    .badge[data-status='IGNORED'] { color: var(--nf-color-text-secondary); }
    .badge[data-status='FAILED'] { color: var(--nf-color-danger-700, #b91c1c); }
    .issues-row td { padding-top: 0; }
    .issues-row ul { margin: 0 0 .45rem; padding-left: 1rem; color: var(--nf-color-danger-700, #b91c1c); font-size: .8rem; }
  `],
})
export class SmartImportTreeTableComponent implements OnChanges {
  @Input({ required: true }) rows: SmartImportRow[] = [];
  @Input({ required: true }) tree!: UiTreeConfig;
  @Input() title = '';
  @Input() filter: SmartImportRowStatus | 'ALL' = 'ALL';
  @Input() extraIssues: FieldIssue[] = [];
  @Output() readonly nodeActivate = new EventEmitter<SmartImportTreeNodeEvent>();

  private readonly collapsed = signal<Set<string>>(new Set());
  private readonly nodes = signal<SmartImportTreeNode[]>([]);
  readonly visibleNodes = signal<SmartImportTreeNode[]>([]);

  get columns(): UiArrayColumn[] {
    return this.tree?.columns ?? [];
  }

  ngOnChanges(_changes: SimpleChanges): void {
    this.rebuild();
  }

  toggle(path: string): void {
    const next = new Set(this.collapsed());
    if (next.has(path)) next.delete(path);
    else next.add(path);
    this.collapsed.set(next);
    this.applyVisibility();
  }

  isExpanded(path: string): boolean {
    return !this.collapsed().has(path);
  }

  displayValue(data: Record<string, unknown>, path: string): string {
    const value = getRelativeValue(data, path);
    if (value == null || value === '') return '—';
    return String(value);
  }

  statusKey(status: SmartImportRowStatus): string {
    return `platform.smartImport.status.${status.toLowerCase()}`;
  }

  isMuted(status: SmartImportRowStatus): boolean {
    return status === 'IGNORED' || status === 'DUPLICATE';
  }

  humanIssue(issue: FieldIssue): string {
    return formatIssueMessage(issue, { columns: this.columns });
  }

  private rebuild(): void {
    if (!this.tree) {
      this.nodes.set([]);
      this.visibleNodes.set([]);
      return;
    }
    const flat = flattenSmartImportTree({
      rows: this.rows,
      tree: this.tree,
      allIssues: this.extraIssues,
    });
    this.nodes.set(flat);
    this.applyVisibility();
  }

  private applyVisibility(): void {
    const collapsed = this.collapsed();
    const filter = this.filter;
    const filteredRoots = new Set(
      this.rows
        .map((row, index) => ({ row, index }))
        .filter(({ row }) => filter === 'ALL' || row.status === filter)
        .map(({ index }) => index),
    );

    const hiddenAncestors = new Set<string>();
    const visible: SmartImportTreeNode[] = [];
    for (const node of this.nodes()) {
      if (!filteredRoots.has(node.rootIndex)) continue;

      let ancestorCollapsed = false;
      for (const hidden of hiddenAncestors) {
        if (node.path.startsWith(hidden + '.') || node.path.startsWith(hidden + '[')) {
          ancestorCollapsed = true;
          break;
        }
      }
      // Also check path prefix against collapsed parent paths
      if (!ancestorCollapsed) {
        for (const path of collapsed) {
          if (node.path.startsWith(path + '.') || node.path.startsWith(path + '[')) {
            // Only hide if this node is a descendant, not the node itself
            if (node.path !== path) {
              ancestorCollapsed = true;
              break;
            }
          }
        }
      }
      if (ancestorCollapsed) continue;

      visible.push(node);
      if (collapsed.has(node.path) && node.expandable) {
        hiddenAncestors.add(node.path);
      }
    }
    this.visibleNodes.set(visible);
  }
}
