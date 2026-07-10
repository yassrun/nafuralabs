/**
 * Access Required Page
 *
 * Shown when a feature is not available for the current tenant context.
 */

import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';

import { TenantContextService } from '../../tenant/tenant.context';

@Component({
  selector: 'app-upgrade-required-page',
  standalone: true,
  imports: [CommonModule, RouterModule],
  template: `
    <div class="error-page">
      <div class="error-card">
        <span class="error-icon">⭐</span>
        <h1>Access Required</h1>
        <p>This feature is not available for the current tenant context.</p>
        <p class="current-plan">
          Current tenant type: <strong>{{ tenantContext.tenantType() }}</strong>
        </p>
        <div class="error-actions">
          <a routerLink="/tenant-selection" class="btn btn--primary">
            Change Tenant
          </a>
          <a routerLink="/" class="btn btn--secondary">Go to Dashboard</a>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .error-page {
      min-height: 100vh;
      display: flex;
      align-items: center;
      justify-content: center;
      background: linear-gradient(135deg, #fef3c7 0%, #fde68a 100%);
      padding: 1rem;
    }

    .error-card {
      background: white;
      padding: 3rem;
      border-radius: 12px;
      box-shadow: 0 4px 20px rgba(0, 0, 0, 0.1);
      text-align: center;
      max-width: 450px;
    }

    .error-icon {
      font-size: 4rem;
      display: block;
      margin-bottom: 1rem;
    }

    h1 {
      margin: 0 0 1rem;
      color: #1f2937;
    }

    p {
      color: #6b7280;
      margin: 0 0 0.5rem;
    }

    .current-plan {
      background: #f3f4f6;
      padding: 0.5rem 1rem;
      border-radius: 6px;
      display: inline-block;
      margin-top: 0.5rem;
    }

    .current-plan strong {
      text-transform: capitalize;
    }

    .error-actions {
      display: flex;
      gap: 0.5rem;
      justify-content: center;
      margin-top: 1.5rem;
    }

    .btn {
      display: inline-block;
      padding: 0.75rem 1.5rem;
      border: none;
      border-radius: 6px;
      text-decoration: none;
      font-size: 1rem;
    }

    .btn--primary {
      background: #4f46e5;
      color: white;
    }

    .btn--secondary {
      background: #e5e7eb;
      color: #374151;
    }
  `],
})
export class UpgradeRequiredPage {
  protected readonly tenantContext = inject(TenantContextService);
}
