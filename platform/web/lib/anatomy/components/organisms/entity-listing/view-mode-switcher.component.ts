/**
 * View Mode Switcher Component
 *
 * Toggle between different view modes (table, cards, grid, list).
 */

import { Component, input, output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ButtonComponent } from '../../atoms/button';
import type { ViewMode } from '../../../types';

interface ViewModeOption {
  mode: ViewMode;
  icon: string;
  label: string;
}

const VIEW_MODE_OPTIONS: ViewModeOption[] = [
  { mode: 'table', icon: 'table-2', label: 'Table view' },
  { mode: 'cards', icon: 'layout-grid', label: 'Card view' },
  { mode: 'grid', icon: 'grid-3x3', label: 'Grid view' },
  { mode: 'list', icon: 'list', label: 'List view' },
];

@Component({
  selector: 'nf-view-mode-switcher',
  standalone: true,
  imports: [CommonModule, ButtonComponent],
  template: `
    <div class="nf-view-mode-switcher">
      @for (option of availableOptions(); track option.mode) {
        <nf-button
          [variant]="currentMode() === option.mode ? 'tertiary' : 'ghost'"
          [icon]="option.icon"
          [iconLibrary]="'lucide'"
          [active]="currentMode() === option.mode"
          [attr.aria-label]="option.label"
          [attr.aria-pressed]="currentMode() === option.mode"
          size="sm"
          (clicked)="onModeClick(option.mode)">
        </nf-button>
      }
    </div>
  `,
  styles: [`
    .nf-view-mode-switcher {
      display: flex;
      align-items: center;
      gap: 2px;
    }
  `],
})
export class ViewModeSwitcherComponent {
  /** Available view modes */
  modes = input.required<ViewMode[]>();

  /** Currently active view mode */
  currentMode = input.required<ViewMode>();

  /** Emitted when user selects a different mode */
  modeChange = output<ViewMode>();

  /** Filter options to only show available modes */
  availableOptions(): ViewModeOption[] {
    const available = this.modes();
    return VIEW_MODE_OPTIONS.filter((opt) => available.includes(opt.mode));
  }

  onModeClick(mode: ViewMode): void {
    if (mode !== this.currentMode()) {
      this.modeChange.emit(mode);
    }
  }
}
