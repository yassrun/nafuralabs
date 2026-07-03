/**
 * Wizard Shell Component
 *
 * Step-based flow: stepper (labels + current) + projected step body + action bar (Back / Next or Submit).
 * Dedicated stepper semantics (progression + validation); not nf-tabs.
 *
 * @example
 * <nf-wizard-shell
 *   [steps]="steps"
 *   [currentStepIndex]="currentStep()"
 *   [canProceed]="stepValid()"
 *   (back)="onBack()"
 *   (next)="onNext()"
 *   (submit)="onSubmit()">
 *   <ng-container stepContent>...</ng-container>
 * </nf-wizard-shell>
 */

import { Component, input, output, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatIconModule } from '@angular/material/icon';
import { ButtonListComponent } from '../../molecules/button-list';
import type { WizardStepConfig } from './wizard-step.interface';

@Component({
  selector: 'nf-wizard-shell',
  standalone: true,
  imports: [CommonModule, MatIconModule, ButtonListComponent],
  template: `
    <div class="nf-wizard-shell">
      <nav class="nf-wizard-shell__stepper" aria-label="Steps">
        <ol class="nf-wizard-shell__steps">
          @for (step of steps(); track step.id; let i = $index) {
            <li
              class="nf-wizard-shell__step"
              [class.nf-wizard-shell__step--current]="i === currentStepIndex()"
              [class.nf-wizard-shell__step--completed]="i < currentStepIndex()"
              [attr.aria-current]="i === currentStepIndex() ? 'step' : null">
              <span class="nf-wizard-shell__step-indicator">{{ i + 1 }}</span>
              @if (step.icon) {
                <mat-icon class="nf-wizard-shell__step-icon">{{ step.icon }}</mat-icon>
              }
              <span class="nf-wizard-shell__step-label">{{ step.label }}</span>
            </li>
          }
        </ol>
      </nav>
      <div class="nf-wizard-shell__content" role="region" [attr.aria-label]="currentStepLabel()">
        <ng-content select="[stepContent]"></ng-content>
      </div>
      <div class="nf-wizard-shell__actions">
        <nf-button-list
          [actions]="leftActions()"
          [size]="'md'"
          (actionClick)="onActionClick($event)">
        </nf-button-list>
        <nf-button-list
          [actions]="rightActions()"
          [size]="'md'"
          (actionClick)="onActionClick($event)">
        </nf-button-list>
      </div>
    </div>
  `,
  styleUrls: ['./wizard-shell.component.scss'],
})
export class WizardShellComponent {
  /** Step definitions */
  steps = input.required<WizardStepConfig[]>();

  /** Current step index (0-based) */
  currentStepIndex = input<number>(0);

  /** Whether the current step is valid (enables Next/Submit) */
  canProceed = input<boolean>(true);

    /** Back button label (required) */
    backLabel = input.required<string>();

    /** Next button label (required) */
    nextLabel = input.required<string>();

    /** Submit button label (required) */
    submitLabel = input.required<string>();

    /** Back button icon */
    backIcon = input<string>('arrow_back');

    /** Next button icon */
    nextIcon = input<string>('arrow_forward');

    /** Submit button icon */
    submitIcon = input<string>('check');

  /** Emitted when Back is clicked */
  back = output<void>();

  /** Emitted when Next is clicked */
  next = output<void>();

  /** Emitted when Submit is clicked (last step) */
  submit = output<void>();

  currentStepLabel = computed(() => {
    const stepsArray = this.steps();
    const idx = this.currentStepIndex();
    return stepsArray[idx]?.label ?? '';
  });

  isLastStep = computed(() => {
    const stepsArray = this.steps();
    const idx = this.currentStepIndex();
    return stepsArray.length > 0 && idx >= stepsArray.length - 1;
  });

  leftActions = computed(() => {
    const actions: { id: string; label: string; icon: string; variant?: 'secondary' | 'ghost' }[] = [];
    if (this.currentStepIndex() > 0) {
      actions.push({
        id: 'back',
        label: this.backLabel(),
        icon: this.backIcon(),
        variant: 'secondary',
      });
    }
    return actions;
  });

  rightActions = computed(() => {
    const actions: { id: string; label: string; icon?: string; variant?: 'primary' | 'secondary'; disabled?: boolean }[] = [];
    if (this.isLastStep()) {
      actions.push({
        id: 'submit',
        label: this.submitLabel(),
        icon: this.submitIcon(),
        variant: 'primary',
        disabled: !this.canProceed(),
      });
    } else {
      actions.push({
        id: 'next',
        label: this.nextLabel(),
        icon: this.nextIcon(),
        variant: 'primary',
        disabled: !this.canProceed(),
      });
    }
    return actions;
  });

  onActionClick(actionId: string): void {
    switch (actionId) {
      case 'back':
        this.back.emit();
        break;
      case 'next':
        this.next.emit();
        break;
      case 'submit':
        this.submit.emit();
        break;
    }
  }
}
