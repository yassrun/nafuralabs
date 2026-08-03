import { Injectable, inject, signal } from '@angular/core';
import { Router } from '@angular/router';

export interface TourStep {
  id: string;
  title: string;
  body: string;
  selector?: string;    // CSS selector to highlight
  route?: string;       // navigate to this route before showing
  position?: 'top' | 'bottom' | 'left' | 'right' | 'center';
}

export interface Tour {
  id: string;
  name: string;
  steps: TourStep[];
}

const STORAGE_KEY = 'nafura-onboarding';
const TOUR_SEEN_PREFIX = 'nafura-tour-seen-';

@Injectable({ providedIn: 'root' })
export class OnboardingService {
  private readonly router = inject(Router);

  private toursRegistry: Tour[] = [];
  private routeTourMap: { prefix: string; tourId: string }[] = [];

  readonly active = signal(false);
  readonly currentTour = signal<Tour | null>(null);
  readonly currentStepIndex = signal(0);

  readonly currentStep = () => {
    const tour = this.currentTour();
    const idx = this.currentStepIndex();
    return tour?.steps[idx] ?? null;
  };

  readonly isLastStep = () => {
    const tour = this.currentTour();
    return tour ? this.currentStepIndex() >= tour.steps.length - 1 : true;
  };

  get tours(): Tour[] {
    return this.toursRegistry;
  }

  /** Register product tours (replaces any previous registry). */
  setTours(tours: Tour[], routeMap: { prefix: string; tourId: string }[] = []): void {
    this.toursRegistry = [...tours];
    this.routeTourMap = [...routeMap];
  }

  /** Start a tour by id. */
  start(tourId: string): void {
    const tour = this.toursRegistry.find(t => t.id === tourId);
    if (!tour) return;
    this.currentTour.set(tour);
    this.currentStepIndex.set(0);
    this.active.set(true);
    this.applyStep(tour.steps[0]);
  }

  next(): void {
    const tour = this.currentTour();
    if (!tour) return;
    const idx = this.currentStepIndex() + 1;
    if (idx >= tour.steps.length) { this.end(); return; }
    this.currentStepIndex.set(idx);
    this.applyStep(tour.steps[idx]);
  }

  prev(): void {
    const idx = Math.max(0, this.currentStepIndex() - 1);
    this.currentStepIndex.set(idx);
    const step = this.currentTour()?.steps[idx];
    if (step) this.applyStep(step);
  }

  end(): void {
    const tourId = this.currentTour()?.id;
    this.active.set(false);
    this.currentTour.set(null);
    this.currentStepIndex.set(0);
    if (tourId) {
      this.markTourSeen(tourId);
    }
    if (tourId === 'shell') {
      this.markCompleted();
    }
  }

  isFirstLaunch(): boolean {
    try { return !localStorage.getItem(STORAGE_KEY); } catch { return false; }
  }

  shouldShowTour(tourId: string): boolean {
    if (this.active()) {
      return false;
    }
    try {
      return !localStorage.getItem(TOUR_SEEN_PREFIX + tourId);
    } catch {
      return false;
    }
  }

  /** Auto-start contextual tour on first visit of a top-level module. */
  maybeAutoStartForUrl(url: string): void {
    const path = url.split('?')[0];
    if (path.startsWith('/signup') || path.startsWith('/onboarding')) {
      return;
    }
    const tourId = this.resolveTourForUrl(path);
    if (!tourId || !this.shouldShowTour(tourId)) {
      return;
    }
    if (tourId === 'shell') {
      // Shell welcome tour is opt-in (? button) — avoids blocking new tenants on first login.
      return;
    }
    setTimeout(() => this.start(tourId), 400);
  }

  resolveTourForUrl(path: string): string | null {
    for (const entry of this.routeTourMap) {
      // Contextual tours only on module landing URLs — not create/detail/edit deep links.
      if (path === entry.prefix) {
        return entry.tourId;
      }
    }
    if (path === '/' || path === '') {
      return this.toursRegistry.some(t => t.id === 'shell') ? 'shell' : null;
    }
    return null;
  }

  markTourSeen(tourId: string): void {
    try {
      localStorage.setItem(TOUR_SEEN_PREFIX + tourId, '1');
    } catch {
      /* noop */
    }
  }

  private markCompleted(): void {
    try { localStorage.setItem(STORAGE_KEY, '1'); } catch { /* noop */ }
  }

  private applyStep(step: TourStep): void {
    if (step.route) void this.router.navigate([step.route]);
  }
}
