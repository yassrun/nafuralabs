import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { OnboardingService } from './onboarding.service';

/**
 * OnboardingTour — inline tour overlay rendered by the shell.
 * Activated via OnboardingService.start(tourId).
 */
@Component({
  selector: 'nf-onboarding-tour',
  standalone: true,
  imports: [CommonModule],
  template: `
    @if (svc.active() && svc.currentStep(); as step) {
      <div class="tour-backdrop" (click)="svc.end()"></div>
      <div class="tour-card" [class]="'tour-card--' + (step.position ?? 'center')">
        <div class="tour-progress">
          @for (s of svc.currentTour()!.steps; track s.id; let i = $index) {
            <div class="progress-dot" [class.progress-dot--done]="i < svc.currentStepIndex()" [class.progress-dot--active]="i === svc.currentStepIndex()"></div>
          }
        </div>

        <button class="tour-close" (click)="svc.end()" title="Fermer le tour">✕</button>

        <h3 class="tour-title">{{ step.title }}</h3>
        <p class="tour-body">{{ step.body }}</p>

        <div class="tour-footer">
          <span class="tour-step-info">{{ svc.currentStepIndex() + 1 }} / {{ svc.currentTour()!.steps.length }}</span>
          <div class="tour-actions">
            @if (svc.currentStepIndex() > 0) {
              <button class="btn btn--ghost" (click)="svc.prev()">← Précédent</button>
            }
            @if (!svc.isLastStep()) {
              <button class="btn btn--primary" (click)="svc.next()">Suivant →</button>
            } @else {
              <button class="btn btn--success" (click)="svc.end()">✓ Terminer</button>
            }
          </div>
        </div>
      </div>
    }
  `,
  styles: [`
    .tour-backdrop { position: fixed; inset: 0; background: rgba(15,23,42,0.4); z-index: 1999; backdrop-filter: blur(1px); }

    .tour-card { position: fixed; z-index: 2000; background: white; border-radius: 1rem; padding: 1.5rem; box-shadow: 0 20px 60px rgba(0,0,0,0.2); max-width: 440px; width: 90vw; }
    .tour-card--center { top: 50%; left: 50%; transform: translate(-50%, -50%); }
    .tour-card--right   { top: 50%; left: 280px; transform: translateY(-50%); }
    .tour-card--bottom  { bottom: 80px; left: 50%; transform: translateX(-50%); }
    .tour-card--top     { top: 80px; left: 50%; transform: translateX(-50%); }

    .tour-progress { display: flex; gap: 6px; margin-bottom: 0.875rem; }
    .progress-dot { width: 8px; height: 8px; border-radius: 50%; background: #e2e8f0; transition: background 200ms; }
    .progress-dot--done   { background: #0d9488; }
    .progress-dot--active { background: #0d9488; box-shadow: 0 0 0 3px rgba(13,148,136,0.2); }

    .tour-close { position: absolute; top: 1rem; right: 1rem; background: none; border: none; font-size: 1rem; cursor: pointer; color: #94a3b8; padding: 4px; border-radius: 4px; }
    .tour-close:hover { background: #f1f5f9; color: #475569; }

    .tour-title { margin: 0 0 0.75rem; font-size: 1.05rem; font-weight: 700; color: #0f172a; }
    .tour-body  { margin: 0 0 1.25rem; font-size: 0.9rem; color: #475569; line-height: 1.6; }

    .tour-footer { display: flex; align-items: center; justify-content: space-between; }
    .tour-step-info { font-size: 12px; color: #94a3b8; }
    .tour-actions { display: flex; gap: 0.5rem; }

    .btn { padding: 7px 14px; border-radius: 7px; font-size: 13px; font-weight: 600; cursor: pointer; border: 1px solid transparent; }
    .btn--ghost   { background: white; border-color: #e2e8f0; color: #475569; }
    .btn--ghost:hover { background: #f8fafc; }
    .btn--primary { background: #0d9488; color: white; }
    .btn--primary:hover { background: #0f766e; }
    .btn--success { background: #16a34a; color: white; }
    .btn--success:hover { background: #15803d; }
  `],
})
export class OnboardingTourComponent {
  readonly svc = inject(OnboardingService);
}
