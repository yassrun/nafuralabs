import { Component, LOCALE_ID, inject } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-maintenance-page',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="maint-page">
      <div class="maint-card">
        <div class="maint-icon">🔧</div>
        <h1 class="maint-title">Maintenance en cours</h1>
        <p class="maint-body">
          Nafura ERP est temporairement indisponible pour maintenance planifiée.
          Nous revenons très bientôt — merci de votre patience.
        </p>
        <div class="maint-eta">
          <span class="eta-label">Reprise estimée</span>
          <strong class="eta-time">{{ eta }}</strong>
        </div>
        <button class="btn-retry" (click)="retry()">🔄 Vérifier la disponibilité</button>
        <p class="maint-contact">
          En cas d'urgence : <a href="mailto:support&#64;nafura-btp.ma">support&#64;nafura-btp.ma</a>
        </p>
      </div>
    </div>
  `,
  styles: [`
    .maint-page { min-height: 100vh; display: flex; align-items: center; justify-content: center; background: linear-gradient(135deg, #f0fdf4, #f8fafc); padding: 2rem; }
    .maint-card { background: white; border: 1px solid #e2e8f0; border-radius: 1.5rem; padding: 3rem 2.5rem; max-width: 460px; width: 100%; text-align: center; box-shadow: 0 4px 24px rgba(0,0,0,0.06); }
    .maint-icon { font-size: 4rem; margin-bottom: 1.25rem; animation: spin 4s linear infinite; display: inline-block; }
    @keyframes spin { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }
    .maint-title { font-size: 1.5rem; font-weight: 700; color: #0f172a; margin: 0 0 0.875rem; }
    .maint-body { color: #64748b; font-size: 0.9rem; line-height: 1.6; margin: 0 0 1.5rem; }
    .maint-eta { display: inline-flex; flex-direction: column; gap: 4px; background: #f0fdf4; border: 1px solid #bbf7d0; border-radius: 0.75rem; padding: 0.75rem 1.5rem; margin-bottom: 1.5rem; }
    .eta-label { font-size: 11px; color: #64748b; text-transform: uppercase; letter-spacing: 0.06em; }
    .eta-time { font-size: 1.1rem; font-weight: 700; color: #16a34a; }
    .btn-retry { padding: 9px 20px; border-radius: 8px; font-size: 14px; font-weight: 600; cursor: pointer; background: #0d9488; color: white; border: none; margin-bottom: 1rem; }
    .btn-retry:hover { background: #0f766e; }
    .maint-contact { font-size: 12px; color: #94a3b8; margin: 0; }
    .maint-contact a { color: #0d9488; text-decoration: none; }
  `],
})
export class MaintenancePage {
  private readonly locale = inject(LOCALE_ID);
  readonly eta = new Date(Date.now() + 2 * 3600 * 1000).toLocaleTimeString(this.locale, { hour: '2-digit', minute: '2-digit' }) + ' (heure locale)';
  retry(): void { window.location.reload(); }
}
