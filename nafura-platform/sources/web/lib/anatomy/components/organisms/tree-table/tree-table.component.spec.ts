import { Component } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { By } from '@angular/platform-browser';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { TranslateModule } from '@ngx-translate/core';
import { ChevronDown, ChevronRight, LUCIDE_ICONS, LucideIconProvider } from 'lucide-angular';

import {
  TreeTableComponent,
  expandAncestorKeys,
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
      [showDetail]="showDetail"
      [selectable]="selectable"
      [selectedKeys]="selected">
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
  selectable: boolean | 'multiple' = false;
  selected = new Set<string>();
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

  it('shows checkboxes in multiple selection mode', () => {
    fixture.componentInstance.selectable = 'multiple';
    fixture.detectChanges();
    const boxes = (fixture.nativeElement as HTMLElement).querySelectorAll('.nf-table-checkbox');
    expect(boxes.length).toBeGreaterThan(0);
  });

  it('keeps every checkbox click when the parent has not written back yet', () => {
    fixture.componentInstance.selectable = 'multiple';
    fixture.detectChanges();
    const table = fixture.debugElement.query(By.directive(TreeTableComponent))
      .componentInstance as TreeTableComponent<TestRow>;
    const emitted: string[][] = [];
    table.selectedKeysChange.subscribe((keys) => emitted.push([...keys].sort()));

    table.toggleRow('parent', true);
    table.toggleRow('child', true);

    expect(emitted.at(-1)).toEqual(['child', 'parent']);
    expect(table.isSelected('parent')).toBe(true);
    expect(table.isSelected('child')).toBe(true);
  });

  it('pins stickyEnd columns to the right', () => {
    const sticky = (fixture.nativeElement as HTMLElement)
      .querySelectorAll('.nf-tree-table__cell--sticky-end');
    expect(sticky.length).toBeGreaterThan(0);
    expect((sticky[0] as HTMLElement).style.right).toBe('0px');
    expect((sticky[0] as HTMLElement).style.minWidth).toBe('8rem');
  });

  it('expandAncestorKeys lists parents of a nested node', () => {
    const nodes: NfTreeNode<TestRow>[] = [{
      key: 'lot',
      data: { name: 'Lot' },
      children: [{
        key: 'sl',
        data: { name: 'Sous-lot' },
        children: [{ key: 'art', data: { name: 'Article' }, leaf: true }],
      }],
    }];
    expect([...expandAncestorKeys(nodes, 'art')].sort()).toEqual(['lot', 'sl']);
  });

  it('reveal expands ancestors so a nested row is visible', () => {
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
    expect((fixture.nativeElement as HTMLElement).textContent).not.toContain('Child');

    const table = fixture.debugElement.query(By.directive(TreeTableComponent))
      .componentInstance as TreeTableComponent<TestRow>;
    expect(table.reveal('child')).toBe(true);
    fixture.detectChanges();
    expect((fixture.nativeElement as HTMLElement).textContent).toContain('Child');
  });

  it('reveal collapses every branch except the target path', () => {
    fixture.componentInstance.nodes = [
      {
        key: 'lot-a',
        data: { name: 'Lot A' },
        expanded: true,
        children: [{
          key: 'art-a',
          data: { name: 'Article A' },
          leaf: true,
        }],
      },
      {
        key: 'lot-b',
        data: { name: 'Lot B' },
        expanded: true,
        children: [{
          key: 'art-b',
          data: { name: 'Article B' },
          leaf: true,
        }],
      },
    ];
    fixture.detectChanges();
    expect((fixture.nativeElement as HTMLElement).textContent).toContain('Article A');
    expect((fixture.nativeElement as HTMLElement).textContent).toContain('Article B');

    const table = fixture.debugElement.query(By.directive(TreeTableComponent))
      .componentInstance as TreeTableComponent<TestRow>;
    expect(table.reveal('art-b')).toBe(true);
    fixture.detectChanges();
    expect((fixture.nativeElement as HTMLElement).textContent).toContain('Article B');
    expect((fixture.nativeElement as HTMLElement).textContent).not.toContain('Article A');
    expect((fixture.nativeElement as HTMLElement).textContent).toContain('Lot A');
  });
});
