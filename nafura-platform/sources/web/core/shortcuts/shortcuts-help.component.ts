import { Component, output, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ShortcutsService } from './shortcuts.service';

@Component({
  selector: 'nf-shortcuts-help',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="overlay" (click)="close.emit()">
      <div class="modal" (click)="$event.stopPropagation()">
        <div class="modal-header">
          <h2>Raccourcis clavier</h2>
          <button class="close-btn" (click)="close.emit()">✕</button>
        </div>
        @for (cat of categories; track cat) {
          <div class="category">
            <h3>{{ cat }}</h3>
            <div class="shortcuts">
              @for (s of byCategory(cat); track s.keys) {
                <div class="shortcut-row">
                  <kbd class="kbd">{{ s.keys }}</kbd>
                  <span class="desc">{{ s.description }}</span>
                </div>
              }
            </div>
          </div>
        }
      </div>
    </div>
  `,
  styles: [`
    .overlay { position: fixed; inset: 0; background: rgba(15,23,42,0.5); z-index: 1000; display: flex; align-items: center; justify-content: center; backdrop-filter: blur(2px); }
    .modal { background: white; border-radius: 1rem; padding: 1.5rem; min-width: 460px; max-width: 560px; max-height: 80vh; overflow-y: auto; box-shadow: 0 20px 60px rgba(0,0,0,0.2); }
    .modal-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 1.25rem; }
    .modal-header h2 { margin: 0; font-size: 1.1rem; font-weight: 700; color: #0f172a; }
    .close-btn { background: none; border: none; font-size: 1.2rem; cursor: pointer; color: #64748b; padding: 4px 8px; border-radius: 4px; }
    .close-btn:hover { background: #f1f5f9; }
    .category { margin-bottom: 1.25rem; }
    .category h3 { font-size: 0.72rem; font-weight: 700; color: #94a3b8; text-transform: uppercase; letter-spacing: 0.08em; margin: 0 0 0.6rem; }
    .shortcuts { display: flex; flex-direction: column; gap: 6px; }
    .shortcut-row { display: flex; align-items: center; gap: 1rem; }
    .kbd { display: inline-block; padding: 3px 8px; background: #f1f5f9; border: 1px solid #e2e8f0; border-bottom: 2px solid #cbd5e1; border-radius: 5px; font-family: monospace; font-size: 12px; font-weight: 600; color: #1e293b; min-width: 80px; text-align: center; white-space: nowrap; }
    .desc { font-size: 0.87rem; color: #475569; }
  `],
})
export class ShortcutsHelpComponent {
  private readonly service = inject(ShortcutsService);

  readonly close = output<void>();

  readonly categories = ['Navigation', 'Actions', 'Interface'];

  byCategory(cat: string) {
    return this.service.shortcuts.filter(s => s.category === cat);
  }
}
