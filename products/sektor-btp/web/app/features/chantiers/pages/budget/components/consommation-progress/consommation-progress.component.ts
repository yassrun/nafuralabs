import { CommonModule, DecimalPipe } from '@angular/common';
import { Component, input } from '@angular/core';

@Component({
  selector: 'app-consommation-progress',
  standalone: true,
  imports: [CommonModule, DecimalPipe],
  template: `
    <div class="consumption-cell">
      <div class="consumption-bar">
        <span [style.width.%]="width()" [class]="tone()"></span>
      </div>
      <strong>{{ value() | number:'1.0-1' }}%</strong>
      @if (value() > 100) {
        <em>Depasse</em>
      }
    </div>
  `,
  styles: [`
    .consumption-cell { display: grid; gap: 0.3rem; }
    .consumption-bar { width: 100%; height: 0.5rem; border-radius: 999px; background: var(--nf-color-bg-muted); overflow: hidden; }
    .consumption-bar span { display: block; height: 100%; border-radius: inherit; }
    .ok { background: var(--nf-color-success-600); }
    .warn { background: var(--nf-color-warning-500); }
    .high { background: var(--nf-color-warning-600); }
    .over { background: var(--nf-color-danger-700); }
    strong { color: var(--nf-text-primary); }
    em { color: var(--nf-color-danger-700); font-style: normal; font-weight: 700; font-size: 0.75rem; }
  `],
})
export class ConsommationProgressComponent {
  readonly value = input.required<number>();

  width(): number {
    return Math.min(this.value(), 100);
  }

  tone(): string {
    const value = this.value();
    if (value > 100) return 'over';
    if (value > 90) return 'high';
    if (value >= 70) return 'warn';
    return 'ok';
  }
}
