/**
 * Wizard Shell Component
 *
 * Step-based flow: stepper (labels + current) + projected step body + action bar (Back / Next or Submit).
 * Dedicated stepper semantics (progression + validation); not nf-tabs.
 *
 * Visual states: completed = check, current = filled number, upcoming = ghost,
 * incomplete = check + badge on a visited step.
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
import { ButtonListComponent, type ButtonListItem } from '../../molecules/button-list';
import type { WizardStepConfig } from './wizard-step.interface';
import {
  wizardStepVisualState,
  type WizardStepVisualState,
} from './wizard-step-state.util';

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
              [attr.data-state]="stepState(i)"
              [class.nf-wizard-shell__step--current]="stepState(i) === 'current'"
              [class.nf-wizard-shell__step--completed]="stepState(i) === 'completed'"
              [class.nf-wizard-shell__step--incomplete]="stepState(i) === 'incomplete'"
              [class.nf-wizard-shell__step--upcoming]="stepState(i) === 'upcoming'"
              [class.nf-wizard-shell__step--clickable]="isStepClickable(i)"
              [attr.aria-current]="stepState(i) === 'current' ? 'step' : null"
              [attr.aria-label]="stepAriaLabel(step, i)"
              [attr.role]="isStepClickable(i) ? 'button' : null"
              [attr.tabindex]="isStepClickable(i) ? 0 : null"
              (click)="onStepClick(i)"
              (keydown.enter)="onStepClick(i)">
              <span class="nf-wizard-shell__step-indicator">
                @if (stepState(i) === 'completed' || stepState(i) === 'incomplete') {
                  <svg
                    class="nf-wizard-shell__check"
                    viewBox="0 0 12 12"
                    aria-hidden="true"
                    focusable="false">
                    <path
                      d="M2.2 6.2 L4.6 8.6 L9.8 3.4"
                      fill="none"
                      stroke="currentColor"
                      stroke-width="1.8"
                      stroke-linecap="round"
                      stroke-linejoin="round" />
                  </svg>
                } @else {
                  {{ i + 1 }}
                }
                @if (stepState(i) === 'incomplete') {
                  <span class="nf-wizard-shell__incomplete-badge" aria-hidden="true">!</span>
                }
              </span>
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
        <!-- Fallback: project unmarked children (attribute selectors can miss in some builds). -->
        <ng-content></ng-content>
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

  /**
   * 0-based indexes of visited steps that still have issues.
   * Never applied to the current or upcoming steps.
   */
  incompleteStepIndexes = input<readonly number[]>([]);

  /** Whether the current step is valid (enables Next/Submit) */
  canProceed = input<boolean>(true);

    /** Back button label (required) */
    backLabel = input.required<string>();

    /** Next button label (required) */
    nextLabel = input.required<string>();

    /** Submit button label (required) */
    submitLabel = input.required<string>();

  /** Whether to show the submit button on the last step (default true). */
  showSubmit = input<boolean>(true);

  /** Allow clicking completed / current steps to jump (opt-in). */
  allowStepNavigation = input<boolean>(false);

  /** Back button icon */
  backIcon = input<string>('arrow_back');

  /** Next button icon */
  nextIcon = input<string>('arrow_forward');

  /** Submit button icon */
  submitIcon = input<string>('check');

  /**
   * Actions de bas de parcours (Enregistrer, Annuler…) — à gauche du Suivant.
   * Les gestes hors formulaire restent dans l’en-tête.
   */
  extraActions = input<ButtonListItem[]>([]);

  /** Emitted when Back is clicked */
  back = output<void>();

  /** Emitted when Next is clicked */
  next = output<void>();

  /** Emitted when Submit is clicked (last step) */
  submit = output<void>();

  /** Emitted for `extraActions` ids (save, cancel, …). */
  action = output<string>();

  /** Emitted when a navigable step is clicked (0-based index). */
  stepSelect = output<number>();

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
    const extras = this.extraActions().filter((a) => a.visible !== false);
    const actions: ButtonListItem[] = [...extras];
    if (this.isLastStep()) {
      if (this.showSubmit()) {
        actions.push({
          id: 'submit',
          label: this.submitLabel(),
          icon: this.submitIcon(),
          variant: 'primary',
          disabled: !this.canProceed(),
        });
      }
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

  stepState(index: number): WizardStepVisualState {
    return wizardStepVisualState(index, this.currentStepIndex(), this.incompleteStepIndexes());
  }

  isStepClickable(index: number): boolean {
    return this.allowStepNavigation() && index <= this.currentStepIndex();
  }

  stepAriaLabel(step: WizardStepConfig, index: number): string {
    const state = this.stepState(index);
    if (state === 'completed') return `${step.label}, terminé`;
    if (state === 'incomplete') return `${step.label}, incomplet`;
    if (state === 'current') return `${step.label}, en cours`;
    return step.label;
  }

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
      default:
        this.action.emit(actionId);
    }
  }

  onStepClick(index: number): void {
    if (!this.allowStepNavigation()) return;
    if (index > this.currentStepIndex()) return;
    if (index === this.currentStepIndex()) return;
    this.stepSelect.emit(index);
  }
}
