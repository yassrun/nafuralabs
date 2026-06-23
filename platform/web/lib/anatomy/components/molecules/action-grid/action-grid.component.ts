import { Component, input, output } from '@angular/core';
import { CommonModule } from '@angular/common';

import { ButtonComponent } from '../../atoms/button';

export interface ActionGridItem {
  id: string;
  label: string;
  icon?: string;
  iconLibrary?: 'material' | 'lucide';
}

@Component({
  selector: 'nf-action-grid',
  standalone: true,
  imports: [CommonModule, ButtonComponent],
  template: `
    <div class="nf-action-grid">
      @for (item of items(); track item.id) {
        <nf-button
          variant="tertiary"
          size="md"
          [icon]="item.icon"
          [iconLibrary]="item.iconLibrary ?? 'lucide'"
          (clicked)="onActionClick(item)">
          {{ item.label }}
        </nf-button>
      }
    </div>
  `,
  styles: [
    `
      :host {
        display: block;
      }

      .nf-action-grid {
        display: grid;
        grid-template-columns: repeat(auto-fit, minmax(180px, 1fr));
        gap: var(--nf-space-3, 12px);
      }

      .nf-action-grid nf-button {
        width: 100%;
        justify-content: flex-start;
      }
    `,
  ],
})
export class ActionGridComponent {
  items = input<ActionGridItem[]>([]);
  actionClick = output<ActionGridItem>();

  onActionClick(item: ActionGridItem): void {
    this.actionClick.emit(item);
  }
}
