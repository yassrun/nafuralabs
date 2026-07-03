/**
 * Not Found (404) Page
 *
 * Page brandée affichée quand la route ne correspond à aucune définition.
 * Inclut une suggestion de retour vers les zones les plus fréquentées de l'ERP
 * (dashboard, chantiers, marchés, achats, finance).
 */

import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { Location } from '@angular/common';
import { Router, RouterModule } from '@angular/router';

@Component({
  selector: 'app-not-found-page',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CommonModule, RouterModule],
  template: `
    <main class="nf-404">
      <section class="nf-404__card">
        <header class="nf-404__brand">
          <img src="/assets/branding/nafura-logo.svg" alt="Nafura" class="nf-404__logo" />
        </header>

        <div class="nf-404__hero">
          <span class="nf-404__code">404</span>
          <h1 class="nf-404__title">Page introuvable</h1>
          <p class="nf-404__lead">
            La page que vous recherchez n'existe pas, a été déplacée ou
            n'est plus disponible.
          </p>
          <p class="nf-404__path">
            <code>{{ currentPath() }}</code>
          </p>
        </div>

        <div class="nf-404__actions">
          <button type="button" class="nf-404__btn nf-404__btn--ghost" (click)="goBack()">
            ← Retour
          </button>
          <a routerLink="/" class="nf-404__btn nf-404__btn--primary">
            Tableau de bord
          </a>
        </div>

        <nav class="nf-404__suggestions" aria-label="Raccourcis ERP">
          <h2>Vous cherchiez peut-être :</h2>
          <ul>
            <li><a routerLink="/chantiers">Chantiers</a></li>
            <li><a routerLink="/marches">Marchés &amp; Facturation</a></li>
            <li><a routerLink="/achats">Achats</a></li>
            <li><a routerLink="/finance">Finance</a></li>
            <li><a routerLink="/inventory">Stock &amp; Matériel</a></li>
            <li><a routerLink="/rh">RH &amp; Paie</a></li>
          </ul>
        </nav>
      </section>

      <footer class="nf-404__footer">
        <p>Nafura ERP · BTP Maroc</p>
      </footer>
    </main>
  `,
  styles: [`
    :host { display: block; }

    .nf-404 {
      min-height: 100vh;
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      gap: 1.5rem;
      padding: 2rem 1rem;
      background: linear-gradient(135deg, #f1f5f9 0%, #e0e7ff 100%);
    }

    .nf-404__card {
      background: white;
      border-radius: 1rem;
      padding: 2.5rem;
      max-width: 640px;
      width: 100%;
      box-shadow: 0 10px 30px rgba(15, 23, 42, 0.08);
      text-align: center;
      display: flex;
      flex-direction: column;
      gap: 1.5rem;
    }

    .nf-404__brand {
      display: flex;
      justify-content: center;
    }

    .nf-404__logo {
      height: 48px;
      width: auto;
    }

    .nf-404__hero { display: flex; flex-direction: column; align-items: center; gap: 0.5rem; }

    .nf-404__code {
      font-size: 5rem;
      font-weight: 800;
      color: #4f46e5;
      letter-spacing: -0.05em;
      line-height: 1;
    }

    .nf-404__title {
      font-size: 1.5rem;
      color: #0f172a;
      margin: 0;
    }

    .nf-404__lead {
      color: #475569;
      max-width: 36ch;
      margin: 0;
    }

    .nf-404__path {
      margin: 0;
      color: #94a3b8;
      font-size: 0.85rem;
    }

    .nf-404__path code {
      background: #f1f5f9;
      padding: 0.125rem 0.5rem;
      border-radius: 0.375rem;
      font-family: ui-monospace, "SF Mono", Menlo, monospace;
      color: #475569;
      word-break: break-all;
    }

    .nf-404__actions {
      display: flex;
      justify-content: center;
      gap: 0.75rem;
      flex-wrap: wrap;
    }

    .nf-404__btn {
      display: inline-flex;
      align-items: center;
      justify-content: center;
      padding: 0.6rem 1.25rem;
      border-radius: 0.5rem;
      font-weight: 600;
      font-size: 0.9rem;
      text-decoration: none;
      border: 1px solid transparent;
      cursor: pointer;
      transition: background 120ms, color 120ms, border-color 120ms;
    }

    .nf-404__btn--primary {
      background: #4f46e5;
      color: white;
    }

    .nf-404__btn--primary:hover {
      background: #4338ca;
    }

    .nf-404__btn--ghost {
      background: transparent;
      color: #475569;
      border-color: #cbd5e1;
    }

    .nf-404__btn--ghost:hover {
      background: #f1f5f9;
      color: #0f172a;
    }

    .nf-404__suggestions {
      margin-top: 0.5rem;
      padding-top: 1.25rem;
      border-top: 1px solid #e2e8f0;
    }

    .nf-404__suggestions h2 {
      font-size: 0.85rem;
      color: #64748b;
      font-weight: 600;
      margin: 0 0 0.75rem;
    }

    .nf-404__suggestions ul {
      list-style: none;
      padding: 0;
      margin: 0;
      display: flex;
      flex-wrap: wrap;
      gap: 0.5rem;
      justify-content: center;
    }

    .nf-404__suggestions a {
      display: inline-block;
      padding: 0.4rem 0.75rem;
      background: #f8fafc;
      border-radius: 999px;
      color: #334155;
      text-decoration: none;
      font-size: 0.825rem;
      border: 1px solid #e2e8f0;
      transition: background 120ms, color 120ms, border-color 120ms;
    }

    .nf-404__suggestions a:hover {
      background: #eef2ff;
      color: #4f46e5;
      border-color: #c7d2fe;
    }

    .nf-404__footer {
      color: #64748b;
      font-size: 0.8rem;
    }

    /* Dark mode */
    :host-context(.nf-theme-dark) .nf-404 {
      background: linear-gradient(135deg, #0f172a 0%, #1e1b4b 100%);
    }
    :host-context(.nf-theme-dark) .nf-404__card {
      background: #1e293b;
      box-shadow: 0 10px 30px rgba(0, 0, 0, 0.4);
    }
    :host-context(.nf-theme-dark) .nf-404__title { color: #f8fafc; }
    :host-context(.nf-theme-dark) .nf-404__lead { color: #cbd5e1; }
    :host-context(.nf-theme-dark) .nf-404__path code { background: #0f172a; color: #cbd5e1; }
    :host-context(.nf-theme-dark) .nf-404__btn--ghost { color: #cbd5e1; border-color: #475569; }
    :host-context(.nf-theme-dark) .nf-404__btn--ghost:hover { background: #334155; color: #f8fafc; }
    :host-context(.nf-theme-dark) .nf-404__suggestions { border-color: #334155; }
    :host-context(.nf-theme-dark) .nf-404__suggestions h2 { color: #94a3b8; }
    :host-context(.nf-theme-dark) .nf-404__suggestions a { background: #0f172a; color: #cbd5e1; border-color: #334155; }
    :host-context(.nf-theme-dark) .nf-404__suggestions a:hover { background: #1e1b4b; color: #a5b4fc; border-color: #4f46e5; }
    :host-context(.nf-theme-dark) .nf-404__footer { color: #94a3b8; }
  `],
})
export class NotFoundPage {
  private readonly location = inject(Location);
  private readonly router = inject(Router);

  currentPath(): string {
    return this.router.url || this.location.path() || '/';
  }

  goBack(): void {
    if (history.length > 1) {
      this.location.back();
    } else {
      this.router.navigateByUrl('/');
    }
  }
}
