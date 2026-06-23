import { Component, input, output } from '@angular/core';
import { CommonModule } from '@angular/common';

export type PipelineStepStatus = 'done' | 'current' | 'blocked' | 'pending';

export interface PipelineStep {
  id: string;
  label: string;
  status: PipelineStepStatus;
  subtitle?: string;
}

@Component({
  selector: 'nf-status-pipeline',
  standalone: true,
  imports: [CommonModule],
  template: `
    <ol class="nf-status-pipeline">
      @for (step of steps(); track step.id; let isLast = $last) {
        <li
          class="nf-status-pipeline__step"
          [class.nf-status-pipeline__step--done]="step.status === 'done'"
          [class.nf-status-pipeline__step--current]="step.status === 'current'"
          [class.nf-status-pipeline__step--blocked]="step.status === 'blocked'"
          [class.nf-status-pipeline__step--pending]="step.status === 'pending'">
          <button type="button" class="nf-status-pipeline__node" (click)="onStepClick(step)">
            <span class="nf-status-pipeline__label">{{ step.label }}</span>
            @if (step.subtitle) {
              <span class="nf-status-pipeline__subtitle">{{ step.subtitle }}</span>
            }
          </button>
          @if (!isLast) {
            <span class="nf-status-pipeline__connector"></span>
          }
        </li>
      }
    </ol>
  `,
  styles: [`
    :host { display: block; }
    .nf-status-pipeline {
      margin: 0;
      padding: 0;
      list-style: none;
      display: flex;
      align-items: center;
      gap: 8px;
      overflow-x: auto;
    }
    .nf-status-pipeline__step { display: inline-flex; align-items: center; gap: 8px; }
    .nf-status-pipeline__node {
      border: 1px solid var(--nf-border-default);
      border-radius: 999px;
      background: var(--nf-surface-card);
      color: var(--nf-text-secondary);
      padding: 6px 10px;
      display: grid;
      gap: 2px;
      cursor: pointer;
      text-align: left;
      white-space: nowrap;
    }
    .nf-status-pipeline__label { font-size: var(--nf-font-size-sm, 0.875rem); }
    .nf-status-pipeline__subtitle { font-size: var(--nf-font-size-xs, 0.75rem); color: var(--nf-text-muted); }
    .nf-status-pipeline__connector {
      width: 24px;
      height: 2px;
      background: var(--nf-border-default);
    }
    .nf-status-pipeline__step--done .nf-status-pipeline__node {
      border-color: var(--nf-color-success-400);
      color: var(--nf-color-success-700);
      background: var(--nf-color-success-50);
    }
    .nf-status-pipeline__step--current .nf-status-pipeline__node {
      border-color: var(--nf-color-primary-400);
      color: var(--nf-color-primary-700);
      background: var(--nf-color-primary-50);
    }
    .nf-status-pipeline__step--blocked .nf-status-pipeline__node {
      border-color: var(--nf-color-danger-300);
      color: var(--nf-color-danger-700);
      background: var(--nf-color-danger-50);
    }
  `],
})
export class StatusPipelineComponent {
  steps = input<PipelineStep[]>([]);
  stepClick = output<PipelineStep>();

  onStepClick(step: PipelineStep): void {
    this.stepClick.emit(step);
  }
}

