import { Injectable, signal } from '@angular/core';

@Injectable({ providedIn: 'root' })
export class CommandPaletteService {
  private readonly isOpen = signal(false);
  readonly open = this.isOpen.asReadonly();

  toggle(): void {
    this.isOpen.update((v) => !v);
  }

  show(): void {
    this.isOpen.set(true);
  }

  hide(): void {
    this.isOpen.set(false);
  }
}
