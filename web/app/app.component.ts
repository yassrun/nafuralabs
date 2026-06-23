/**
 * Root Application Component
 *
 * The root component that bootstraps the application.
 * Shell layout is now selected via routes (PlatformShellComponent or DoxuraShellComponent).
 * 
 * Note: Auth and i18n are initialized via APP_INITIALIZER in app.config.ts
 * before this component loads, so guards have access to auth state.
 */

import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterOutlet } from '@angular/router';

import { AuthFacade } from './platform/core/security';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [CommonModule, RouterOutlet],
  template: `
    <!-- Loading state during auth check -->
    @if (auth.status() === 'checking') {
      <div class="loading-screen">
        <div class="loading-spinner"></div>
        <p>Loading...</p>
      </div>
    }

    <!-- Main content (shell is rendered via routes) -->
    @else {
      <router-outlet />
    }
  `,
  styles: [`
    :host {
      display: block;
      height: 100vh;
      width: 100%;
      overflow-x: hidden;
    }

    .loading-screen {
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      height: 100vh;
      background: var(--color-bg, #f3f4f6);
    }

    .loading-spinner {
      width: 48px;
      height: 48px;
      border: 4px solid #e5e7eb;
      border-top-color: #4f46e5;
      border-radius: 50%;
      animation: spin 1s linear infinite;
    }

    @keyframes spin {
      to { transform: rotate(360deg); }
    }

    .loading-screen p {
      margin-top: 1rem;
      color: #6b7280;
    }
  `],
})
export class AppComponent {
  protected readonly auth = inject(AuthFacade);
}

