/**
 * Access Denied Page
 * 
 * Shown when user lacks required permissions.
 */

import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';

@Component({
  selector: 'app-access-denied-page',
  standalone: true,
  imports: [CommonModule, RouterModule],
  template: `
    <div class="error-page">
      <div class="error-card">
        <span class="error-icon">🚫</span>
        <h1>Access Denied</h1>
        <p>You don't have permission to access this page.</p>
        <a routerLink="/" class="btn btn--primary">Go to Dashboard</a>
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
      max-width: 400px;
    }

    .error-icon {
      font-size: 4rem;
      display: block;
      margin-bottom: 1rem;
    }

    h1 {
      margin: 0 0 0.5rem;
      color: #1f2937;
    }

    p {
      color: #6b7280;
      margin: 0 0 1.5rem;
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
  `],
})
export class AccessDeniedPage {}
