import { Component } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { TranslateModule } from '@ngx-translate/core';
import { ChevronDown, ChevronRight, LUCIDE_ICONS, LucideIconProvider } from 'lucide-angular';

import {
  TreeTableComponent,
  type NfTreeNode,
  type NfTreeTableColumn,
} from './tree-table.component';

interface TestRow {
  name: string;
  detail?: string;
}

@Component({
  standalone: true,
  imports: [TreeTableComponent],
  template: `
    <nf-tree-table
      [nodes]="nodes"
      [columns]="columns"
      treeColumnKey="name"
      [loading]="loading"
      [showDetail]="showDetail">
      <ng-template #cell let-row>{{ row.name }}</ng-template>
      <ng-template #detail let-row>
        <span class="test-detail">{{ row.detail }}</span>
      </ng-template>
    </nf-tree-table>
  `,
})
class TreeTableHostComponent {
  loading = false;
  columns: NfTreeTableColumn<TestRow>[] = [
    { key: 'name', label: 'Name' },
    { key: 'actions', label: 'Actions', width: '8rem', stickyEnd: true },
  ];
  nodes: NfTreeNode<TestRow>[] = [{
    key: 'parent',
    data: { name: 'Parent' },
    expanded: true,
    children: [{
      key: 'child',
      data: { name: 'Child', detail: 'Needs review' },
      leaf: true,
    }],
  }];
  showDetail = (row: TestRow): boolean => Boolean(row.detail);
}

describe('TreeTableComponent', () => {
  let fixture: ComponentFixture<TreeTableHostComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [
        TreeTableHostComponent,
        NoopAnimationsModule,
        TranslateModule.forRoot(),
      ],
      providers: [
        {
          provide: LUCIDE_ICONS,
          useValue: new LucideIconProvider({ ChevronDown, ChevronRight }),
        },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(TreeTableHostComponent);
    fixture.detectChanges();
  });

  it('renders nested heterogeneous nodes through a projected cell', () => {
    const text = (fixture.nativeElement as HTMLElement).textContent ?? '';
    expect(text).toContain('Parent');
    expect(text).toContain('Child');
  });

  it('renders a conditional projected detail row', () => {
    const detail = (fixture.nativeElement as HTMLElement)
      .querySelector('.test-detail');
    expect(detail?.textContent).toContain('Needs review');
  });

  it('renders the empty state when nodes are cleared', () => {
    fixture.componentInstance.nodes = [];
    fixture.detectChanges();

    expect((fixture.nativeElement as HTMLElement).querySelector('nf-empty-state'))
      .not.toBeNull();
  });

  it('hides children when the parent is collapsed', () => {
    fixture.componentInstance.nodes = [{
      key: 'parent',
      data: { name: 'Parent' },
      expanded: false,
      children: [{
        key: 'child',
        data: { name: 'Child' },
        leaf: true,
      }],
    }];
    fixture.detectChanges();

    const text = (fixture.nativeElement as HTMLElement).textContent ?? '';
    expect(text).toContain('Parent');
    expect(text).not.toContain('Child');
  });

  it('renders a single lucide chevron on an expandable row', () => {
    const root = fixture.nativeElement as HTMLElement;
    const toggler = root.querySelector('.nf-tree-table__toggler:not(.nf-tree-table__toggler--leaf)');
    expect(toggler).not.toBeNull();
    expect(toggler!.querySelectorAll('mat-icon').length).toBe(0);
    expect(toggler!.querySelectorAll('lucide-icon').length).toBe(1);
  });

  it('pins stickyEnd columns to the right', () => {
    const sticky = (fixture.nativeElement as HTMLElement)
      .querySelectorAll('.nf-tree-table__cell--sticky-end');
    expect(sticky.length).toBeGreaterThan(0);
    expect((sticky[0] as HTMLElement).style.right).toBe('0px');
    expect((sticky[0] as HTMLElement).style.minWidth).toBe('8rem');
  });
});
