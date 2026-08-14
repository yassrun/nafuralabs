import { Component, inject } from '@angular/core';
import { RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';
import { MatToolbarModule } from '@angular/material/toolbar';
import { MatButtonModule } from '@angular/material/button';
import { MatListModule } from '@angular/material/list';
import { MatIconModule } from '@angular/material/icon';
import { MatSidenavModule } from '@angular/material/sidenav';
import { AuthService } from '../core/auth.service';

@Component({
  selector: 'app-admin-shell',
  standalone: true,
  imports: [
    RouterOutlet,
    RouterLink,
    RouterLinkActive,
    MatToolbarModule,
    MatButtonModule,
    MatListModule,
    MatIconModule,
    MatSidenavModule,
  ],
  template: `
    <mat-sidenav-container class="shell">
      <mat-sidenav mode="side" opened class="nav">
        <div class="brand">Venue Catalog</div>
        <mat-nav-list>
          <a mat-list-item routerLink="/catalog/search" routerLinkActive="active">
            <mat-icon matListItemIcon>search</mat-icon>
            <span matListItemTitle>Recherche / imports</span>
          </a>
        </mat-nav-list>
      </mat-sidenav>
      <mat-sidenav-content>
        <mat-toolbar color="primary">
          <span>Console ops</span>
          <span class="spacer"></span>
          <button mat-button type="button" (click)="logout()">Déconnexion</button>
        </mat-toolbar>
        <main class="content">
          <router-outlet />
        </main>
      </mat-sidenav-content>
    </mat-sidenav-container>
  `,
  styles: `
    .shell { height: 100vh; }
    .nav { width: 240px; border-right: 1px solid #e0e0e0; }
    .brand {
      padding: 1.25rem 1rem;
      font-weight: 600;
      font-size: 1.1rem;
      letter-spacing: 0.02em;
    }
    .spacer { flex: 1; }
    .content { padding: 1.25rem; }
    a.active { background: rgba(0, 0, 0, 0.06); }
  `,
})
export class AdminShellComponent {
  private readonly auth = inject(AuthService);

  logout(): void {
    this.auth.logout();
    window.location.assign('/login');
  }
}
