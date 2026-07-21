import { CommonModule } from '@angular/common';
import {
  ChangeDetectionStrategy,
  Component,
  effect,
  inject,
  input,
  output,
  signal,
} from '@angular/core';
import { FormsModule } from '@angular/forms';

import type { BordereauTreeRow } from '../../utils/bordereau-tree.util';
import { BordereauArbreComponent } from '../bordereau-arbre/bordereau-arbre.component';
import { PosteDecompositionPanelComponent } from '../poste-decomposition-panel/poste-decomposition-panel.component';

@Component({
  selector: 'app-decomposition-workspace',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    CommonModule,
    FormsModule,
    BordereauArbreComponent,
    PosteDecompositionPanelComponent,
  ],
  templateUrl: './decomposition-workspace.component.html',
  styleUrl: './decomposition-workspace.component.scss',
})
export class DecompositionWorkspaceComponent {
  readonly dpgfId = input.required<string>();
  readonly modifiable = input(true);
  readonly fgDefaut = input(10);
  readonly margeDefaut = input(17.5);
  readonly tvaDefaut = input(20);
  readonly focusNoeudId = input<string | null>(null);

  readonly change = output<void>();

  readonly selectedPoste = signal<BordereauTreeRow | null>(null);
  readonly selectedKey = signal<string | null>(null);
  readonly mobileDetailOpen = signal(false);
  readonly search = signal('');
  readonly treeReloadToken = signal(0);

  constructor() {
    effect(() => {
      const focusId = this.focusNoeudId();
      if (focusId) {
        // Selection is applied once the tree emits a matching row via focus request.
        this.mobileDetailOpen.set(true);
      }
    });
  }

  onSelectPoste(row: BordereauTreeRow | null): void {
    this.selectedPoste.set(row);
    this.selectedKey.set(row?.key ?? null);
    if (row) this.mobileDetailOpen.set(true);
  }

  closeMobileDetail(): void {
    this.mobileDetailOpen.set(false);
  }

  onTreeChange(): void {
    this.change.emit();
  }

  onPosteChange(): void {
    this.treeReloadToken.update((n) => n + 1);
    this.change.emit();
  }
}
