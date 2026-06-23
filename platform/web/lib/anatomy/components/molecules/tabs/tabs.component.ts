import { Component, input, output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatTabsModule } from '@angular/material/tabs';
import { MatIconModule } from '@angular/material/icon';
import { BadgeComponent } from '../../atoms/badge';

/**
 * Tab item interface.
 */
export interface TabItem {
  id: string;
  label: string;
  icon?: string;
  disabled?: boolean;
  badge?: string;
}

/**
 * Tabs Component
 *
 * Tab navigation.
 *
 * @example
 * <nf-tabs
 *   [tabs]="[
 *     { id: 'general', label: 'General', icon: 'info' },
 *     { id: 'settings', label: 'Settings', icon: 'settings' },
 *     { id: 'history', label: 'History', badge: '3' }
 *   ]"
 *   [activeTab]="activeTab"
 *   (tabChange)="onTabChange($event)">
 * </nf-tabs>
 */
@Component({
  selector: 'nf-tabs',
  standalone: true,
  imports: [CommonModule, MatTabsModule, MatIconModule, BadgeComponent],
  template: `
    <mat-tab-group
      class="nf-tabs"
      [selectedIndex]="selectedIndex()"
      (selectedIndexChange)="onTabSelect($event)"
    >
      @for (tab of tabs(); track tab.id) {
        <mat-tab [disabled]="tab.disabled">
          <ng-template mat-tab-label>
            <div class="nf-tabs__label">
              @if (tab.icon) {
                <mat-icon class="nf-tabs__icon">{{ tab.icon }}</mat-icon>
              }
              <span>{{ tab.label }}</span>
              @if (tab.badge) {
                <nf-badge variant="info" size="sm" rounded>{{ tab.badge }}</nf-badge>
              }
            </div>
          </ng-template>
        </mat-tab>
      }
    </mat-tab-group>
  `,
  styles: [`
    .nf-tabs {
      ::ng-deep {
        .mat-mdc-tab-labels {
          border-bottom: 1px solid var(--nf-color-border, #e0e0e0);
        }
      }
    }

    .nf-tabs__label {
      display: flex;
      align-items: center;
      gap: 8px;
    }

    .nf-tabs__icon {
      font-size: 20px;
      width: 20px;
      height: 20px;
    }
  `],
})
export class TabsComponent {
  // Inputs
  tabs = input.required<TabItem[]>();
  activeTab = input<string>('');

  // Outputs
  tabChange = output<string>();

  // Get selected index from activeTab
  selectedIndex = () => {
    const tabsArray = this.tabs();
    const activeId = this.activeTab();
    const index = tabsArray.findIndex((tab) => tab.id === activeId);
    return index >= 0 ? index : 0;
  };

  onTabSelect(index: number): void {
    const tabsArray = this.tabs();
    if (tabsArray[index]) {
      this.tabChange.emit(tabsArray[index].id);
    }
  }
}
