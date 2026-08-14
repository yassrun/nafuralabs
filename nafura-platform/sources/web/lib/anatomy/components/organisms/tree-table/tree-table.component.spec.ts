import { Component } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { TranslateModule } from '@ngx-translate/core';

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
  columns: NfTreeTableColumn<TestRow>[] = [{ key: 'name', label: 'Name' }];
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
});
