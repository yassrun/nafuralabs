import { ChangeDetectionStrategy, Component, output } from '@angular/core';
import { LucideAngularModule } from 'lucide-angular';

@Component({
  selector: 'nf-app-shell-top-bar-menu-button',
  standalone: true,
  imports: [LucideAngularModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <button
      type="button"
      class="nf-app-shell-top-bar-menu-button"
      aria-label="Ouvrir la navigation"
      (click)="pressed.emit()">
      <lucide-icon name="menu" [size]="20" aria-hidden="true"></lucide-icon>
    </button>
  `,
  styles: [`
    :host { display: inline-flex; }
    .nf-app-shell-top-bar-menu-button {
      display: inline-grid;
      width: 40px;
      height: 40px;
      place-items: center;
      border: 0;
      border-radius: 6px;
      color: inherit;
      background: transparent;
      cursor: pointer;
    }
    .nf-app-shell-top-bar-menu-button:hover {
      background: var(--nf-surface-hover, #f1f5f9);
    }
  `],
})
export class TopBarMenuButtonComponent {
  readonly pressed = output<void>();
}
