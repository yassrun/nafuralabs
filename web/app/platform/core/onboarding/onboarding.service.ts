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

const TOURS: Tour[] = [
  {
    id: 'shell',
    name: 'Bienvenue dans Nafura ERP',
    steps: [
      {
        id: 'shell-1',
        title: '🏗 Bienvenue dans Nafura ERP',
        body: 'Votre ERP BTP Maroc — chantiers, marchés, facturation, paie et HSE dans une seule application.',
        position: 'center',
      },
      {
        id: 'shell-2',
        title: '📋 Navigation latérale',
        body: 'La barre gauche organise tous vos modules métier par zone (Opérations, Business, Équipe). Cliquez sur une section pour l\'ouvrir.',
        selector: '.naf-shell__sidebar',
        position: 'right',
      },
      {
        id: 'shell-3',
        title: '⌨️ Raccourcis clavier',
        body: 'Appuyez sur Ctrl+K pour ouvrir la palette de commandes. Tapez le nom d\'un module ou d\'un chantier pour y accéder instantanément. Utilisez « g c » pour aller aux Chantiers, « g a » aux Achats, etc.',
        position: 'center',
      },
      {
        id: 'shell-4',
        title: '🔔 Alertes en temps réel',
        body: 'La cloche en haut à droite affiche les alertes ERP : approbations en attente, factures en retard, cautions expirant bientôt, NC critiques.',
        position: 'center',
      },
      {
        id: 'shell-5',
        title: '✅ Tour terminé !',
        body: 'Vous êtes prêt. Retrouvez ce tour à tout moment via le bouton ? ou Ctrl+/ dans n\'importe quel écran. Bonne utilisation !',
        position: 'center',
      },
    ],
  },
  {
    id: 'chantiers',
    name: 'Tour Chantiers',
    steps: [
      { id: 'ch-1', title: '🏗 Module Chantiers', body: 'Vos projets de construction : fiche détail avec onglets Lots / Phases / Budget / Situations / Documents. Cliquez sur un chantier pour l\'ouvrir.', route: '/chantiers', position: 'center' },
      { id: 'ch-2', title: '📅 Planning Gantt', body: 'Visualisez toutes vos phases sur un Gantt interactif. Cliquez sur une barre de chantier pour ouvrir sa fiche, cliquez sur une phase pour la détailler.', route: '/chantiers/planning', position: 'center' },
      { id: 'ch-3', title: '📎 Attachements & Journal', body: 'Saisissez les quantités exécutées par poste (carnet d\'attachement) et les événements chantier (journal : visites MOA, intempéries, OS).', position: 'center' },
    ],
  },
  {
    id: 'marches',
    name: 'Tour Marchés BTP',
    steps: [
      { id: 'mar-1', title: '📋 Marchés BTP', body: 'Gérez vos contrats MOA : type (Forfait / BPU / Régie), cautions bancaires, révision K, pénalités de retard.', route: '/marches/contrats', position: 'center' },
      { id: 'mar-2', title: '🧾 Facturation situation', body: 'Facturez chaque situation validée. Le décompte calcule automatiquement : RG 7%, TVA 20%, RAS 5% si MOA public, timbre fiscal.', route: '/marches/factures', position: 'center' },
    ],
  },
  {
    id: 'pilotage',
    name: 'Tour Pilotage & trésorerie',
    steps: [
      { id: 'pil-1', title: '📊 Marges chantier', body: 'Suivez marge HT, risques et exportez les données pour le comité de pilotage.', route: '/pilotage/marges-chantier', position: 'center' },
      { id: 'pil-2', title: '💶 Cash-flow', body: 'Visualisez les encaissements prévisionnels et les alertes de trésorerie.', route: '/pilotage/cash-flow', position: 'center' },
    ],
  },
];

const STORAGE_KEY = 'nafura-onboarding';
const TOUR_SEEN_PREFIX = 'nafura-tour-seen-';

/** First URL segment → tour id (M-TRA-14). */
const ROUTE_TOUR_MAP: { prefix: string; tourId: string }[] = [
  { prefix: '/chantiers', tourId: 'chantiers' },
  { prefix: '/marches', tourId: 'marches' },
  { prefix: '/pilotage', tourId: 'pilotage' },
  { prefix: '/dashboard', tourId: 'shell' },
];

@Injectable({ providedIn: 'root' })
export class OnboardingService {
  private readonly router = inject(Router);

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

  readonly tours = TOURS;

  /** Start a tour by id. */
  start(tourId: string): void {
    const tour = TOURS.find(t => t.id === tourId);
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

  /** Auto-start contextual tour on first visit of a top-level module (M-TRA-14). */
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
    for (const entry of ROUTE_TOUR_MAP) {
      // Contextual tours only on module landing URLs — not create/detail/edit deep links.
      if (path === entry.prefix) {
        return entry.tourId;
      }
    }
    if (path === '/' || path === '') {
      return 'shell';
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
    try { localStorage.setItem(STORAGE_KEY, '1'); } catch {}
  }

  private applyStep(step: TourStep): void {
    if (step.route) void this.router.navigate([step.route]);
  }
}
