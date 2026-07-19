import { CommonModule } from '@angular/common';
import {
  ChangeDetectionStrategy,
  Component,
  EventEmitter,
  Input,
  OnChanges,
  Output,
  SimpleChanges,
  inject,
  signal,
} from '@angular/core';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import {
  TreeTableComponent,
  type NfTreeNode,
  type NfTreeTableColumn,
} from '@lib/anatomy/components';

import type { FieldIssue } from '../../doc-extractor/models/extraction.model';
import type { UiArrayColumn, UiTreeConfig } from '../../doc-extractor/models/ui-schema.model';
import type { SmartImportRow, SmartImportRowStatus } from '../models/smart-import.model';
import { formatIssueMessage } from '../utils/issue-display.util';
import {
  buildSmartImportTreeNodes,
  getRelativeValue,
  type SmartImportTreeNode,
} from '../utils/tree-flatten.util';

export interface SmartImportTreeNodeEvent {
  node: SmartImportTreeNode;
}

@Component({
  selector: 'nf-smart-import-tree-table',
  standalone: true,
  imports: [CommonModule, TranslateModule, TreeTableComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="wrap">
      @if (title) {
        <h3>{{ title }}</h3>
      }

      <nf-tree-table
        [nodes]="filteredTreeNodes()"
        [columns]="treeColumns"
        treeColumnKey="level"
        minWidth="48rem"
        scrollHeight="min(52vh, 560px)"
        [expandedKeys]="expandedKeys()"
        [rowClickable]="true"
        [rowClass]="rowClass"
        [rowTitle]="rowTitle"
        [showDetail]="showDetail"
        (expandedKeysChange)="expandedKeys.set($event)"
        (rowDblClick)="nodeActivate.emit({ node: $event })">
        <ng-template #cell let-node let-column="column">
          @switch (column.key) {
            @case ('status') {
              <span class="badge" [attr.data-status]="node.status">
                {{ statusKey(node.status) | translate }}
              </span>
            }
            @case ('level') {
              <span class="level-badge">{{ node.levelLabel }}</span>
            }
            @default {
              {{ displayValue(node.data, column.field ?? '') }}
            }
          }
        </ng-template>

        <ng-template #detail let-node>
          <ul class="issues-list">
            @for (issue of node.issues; track issue.path + issue.kind) {
              <li>{{ humanIssue(issue) }}</li>
            }
          </ul>
        </ng-template>
      </nf-tree-table>
    </div>
  `,
  styles: [`
    .wrap { display: grid; gap: .5rem; }
    h3 { margin: 0; font-size: .95rem; }
    .level-badge {
      display: inline-block;
      padding: .1rem .4rem;
      border-radius: 999px;
      background: var(--nf-color-bg-subtle);
      font-size: .7rem;
    }
    .badge {
      display: inline-block;
      padding: .1rem .45rem;
      border-radius: 999px;
      background: var(--nf-color-bg-subtle);
      font-size: .7rem;
    }
    .badge[data-status='READY'] { color: var(--nf-color-success-700, #15803d); }
    .badge[data-status='NEEDS_REVIEW'] { color: var(--nf-color-warning-700, #b45309); }
    .badge[data-status='DUPLICATE'],
    .badge[data-status='IGNORED'] { color: var(--nf-color-text-secondary); }
    .badge[data-status='FAILED'] { color: var(--nf-color-danger-700, #b91c1c); }
    .issues-list {
      margin: 0 0 .45rem;
      padding-inline-start: 7rem;
      color: var(--nf-color-danger-700, #b91c1c);
      font-size: .8rem;
    }
    :host ::ng-deep .nf-smart-import-row--muted > td { opacity: .55; }
    :host ::ng-deep .nf-smart-import-row--invalid > td {
      background: color-mix(in srgb, var(--nf-color-warning-500, #f59e0b) 8%, transparent);
    }
  `],
})
export class SmartImportTreeTableComponent implements OnChanges {
  private readonly translate = inject(TranslateService);

  @Input({ required: true }) rows: SmartImportRow[] = [];
  @Input({ required: true }) tree!: UiTreeConfig;
  @Input() title = '';
  @Input() filter: SmartImportRowStatus | 'ALL' = 'ALL';
  @Input() extraIssues: FieldIssue[] = [];
  @Output() readonly nodeActivate = new EventEmitter<SmartImportTreeNodeEvent>();

  private knownKeys = new Set<string>();
  readonly filteredTreeNodes = signal<NfTreeNode<SmartImportTreeNode>[]>([]);
  readonly expandedKeys = signal<Set<string>>(new Set());

  readonly rowClass = (node: SmartImportTreeNode): Record<string, boolean> => ({
    'nf-smart-import-row--invalid': node.status === 'NEEDS_REVIEW',
    'nf-smart-import-row--muted': this.isMuted(node.status),
  });

  readonly rowTitle = (_node: SmartImportTreeNode): string =>
    this.translate.instant('platform.smartImport.review.dblclickHint');

  readonly showDetail = (node: SmartImportTreeNode): boolean =>
    node.status === 'NEEDS_REVIEW' && node.issues.length > 0;

  get columns(): UiArrayColumn[] {
    return this.tree?.columns ?? [];
  }

  get treeColumns(): NfTreeTableColumn<SmartImportTreeNode>[] {
    return [
      {
        key: 'status',
        label: 'platform.smartImport.columns.status',
        width: '110px',
      },
      {
        key: 'level',
        label: 'platform.smartImport.columns.level',
        width: '140px',
      },
      ...this.columns.map((column) => ({
        key: `field:${column.path}`,
        label: column.label,
        field: column.path,
        width: column.widthPx ? `${column.widthPx}px` : undefined,
      })),
    ];
  }

  ngOnChanges(_changes: SimpleChanges): void {
    this.rebuild();
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
      this.filteredTreeNodes.set([]);
      this.expandedKeys.set(new Set());
      this.knownKeys = new Set();
      return;
    }

    const nodes = buildSmartImportTreeNodes({
      rows: this.rows,
      tree: this.tree,
      allIssues: this.extraIssues,
    });
    this.filteredTreeNodes.set(
      nodes.filter((node) =>
        this.filter === 'ALL' || this.rows[node.data.rootIndex]?.status === this.filter,
      ),
    );

    const allKeys = this.collectKeys(nodes);
    const nextExpanded = new Set(
      [...this.expandedKeys()].filter((key) => allKeys.has(key)),
    );
    for (const key of allKeys) {
      if (!this.knownKeys.has(key)) nextExpanded.add(key);
    }
    this.knownKeys = allKeys;
    this.expandedKeys.set(nextExpanded);
  }

  private collectKeys(nodes: NfTreeNode<SmartImportTreeNode>[]): Set<string> {
    const keys = new Set<string>();
    const visit = (items: NfTreeNode<SmartImportTreeNode>[]) => {
      for (const node of items) {
        keys.add(node.key);
        if (node.children) visit(node.children);
      }
    };
    visit(nodes);
    return keys;
  }
}
