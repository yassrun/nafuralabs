/**
 * Feature Unavailable Page
 *
 * Shown when a feature is not enabled for the tenant.
 */

import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, ActivatedRoute } from '@angular/router';

@Component({
  selector: 'app-feature-unavailable-page',
  standalone: true,
  imports: [CommonModule, RouterModule],
  template: `
    <div class="error-page">
      <div class="error-card">
        <span class="error-icon">📦</span>
        <h1>Feature Not Available</h1>
        <p>
          The <strong>{{ featureId }}</strong> feature is not enabled for your workspace.
        </p>
        <p>Contact your administrator to enable this feature.</p>
        <div class="error-actions">
          <a routerLink="/" class="btn btn--primary">Go to Dashboard</a>
          <a routerLink="/settings" class="btn btn--secondary">View Settings</a>
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
      background: #f3f4f6;
      padding: 1rem;
    }

    .error-card {
      background: white;
      padding: 3rem;
      border-radius: 12px;
      box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
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
      margin: 0 0 1rem;
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
export class FeatureUnavailablePage {
  private readonly route = inject(ActivatedRoute);

  get featureId(): string {
    return this.route.snapshot.paramMap.get('featureId')
      ?? this.route.snapshot.paramMap.get('moduleId')
      ?? 'Unknown';
  }
}
