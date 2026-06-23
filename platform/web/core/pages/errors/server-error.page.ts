import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';

@Component({
  selector: 'app-server-error-page',
  standalone: true,
  imports: [CommonModule, RouterLink],
  template: `
    <div class="error-page">
      <div class="error-card">
        <div class="error-illustration">
          <div class="crane">🏗</div>
          <div class="bolt">⚡</div>
        </div>
        <h1 class="error-code">500</h1>
        <h2 class="error-title">Erreur serveur inattendue</h2>
        <p class="error-body">
          Une erreur interne s'est produite. Notre équipe technique a été automatiquement notifiée.
          Veuillez réessayer dans quelques instants.
        </p>
        <div class="error-actions">
          <a routerLink="/" class="btn btn--primary">← Retour à l'accueil</a>
          <button class="btn btn--ghost" (click)="reload()">🔄 Réessayer</button>
        </div>
        <p class="correlation-id">ID : ERR-{{ correlationId }}</p>
      </div>
    </div>
  `,
  styles: [`
    .error-page { min-height: 100vh; display: flex; align-items: center; justify-content: center; background: #f8fafc; padding: 2rem; }
    .error-card { background: white; border: 1px solid #e2e8f0; border-radius: 1.5rem; padding: 3rem 2.5rem; max-width: 480px; width: 100%; text-align: center; box-shadow: 0 4px 24px rgba(0,0,0,0.06); }
    .error-illustration { display: flex; gap: 1rem; justify-content: center; font-size: 3rem; margin-bottom: 1rem; }
    .bolt { animation: pulse 1.5s ease-in-out infinite; }
    @keyframes pulse { 0%, 100% { opacity: 1; } 50% { opacity: 0.4; } }
    .error-code { font-size: 5rem; font-weight: 800; color: #e2e8f0; margin: 0 0 0.5rem; line-height: 1; }
    .error-title { font-size: 1.4rem; font-weight: 700; color: #0f172a; margin: 0 0 0.875rem; }
    .error-body { color: #64748b; font-size: 0.9rem; line-height: 1.6; margin: 0 0 1.5rem; }
    .error-actions { display: flex; gap: 0.75rem; justify-content: center; flex-wrap: wrap; margin-bottom: 1rem; }
    .btn { padding: 9px 18px; border-radius: 8px; font-size: 14px; font-weight: 600; cursor: pointer; text-decoration: none; border: none; }
    .btn--primary { background: #0d9488; color: white; }
    .btn--primary:hover { background: #0f766e; }
    .btn--ghost { background: none; border: 1px solid #e2e8f0; color: #475569; }
    .btn--ghost:hover { background: #f8fafc; }
    .correlation-id { font-size: 11px; color: #94a3b8; margin: 0; font-family: monospace; }
  `],
})
export class ServerErrorPage {
  readonly correlationId = Math.random().toString(36).slice(2, 10).toUpperCase();
  reload(): void { window.location.reload(); }
}
