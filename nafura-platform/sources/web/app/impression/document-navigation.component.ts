import { Component } from '@angular/core';
import { RouterLink, RouterLinkActive } from '@angular/router';
import { MatTabsModule } from '@angular/material/tabs';
import { TranslateModule } from '@ngx-translate/core';

@Component({
  selector: 'app-document-navigation',
  standalone: true,
  imports: [RouterLink, RouterLinkActive, MatTabsModule, TranslateModule],
  template: `
    <nav mat-tab-nav-bar [tabPanel]="panel" [attr.aria-label]="'administration.documents.title' | translate">
      <a mat-tab-link routerLink="/administration/documents/settings" routerLinkActive
        #settings="routerLinkActive" [active]="settings.isActive">
        {{ 'administration.documents.identity' | translate }}
      </a>
      <a mat-tab-link routerLink="/administration/documents/templates" routerLinkActive
        #templates="routerLinkActive" [active]="templates.isActive">
        {{ 'administration.documents.models' | translate }}
      </a>
    </nav>
    <mat-tab-nav-panel #panel><ng-content /></mat-tab-nav-panel>
  `,
  styles: [`
    :host { display: block; min-width: 0; }
    nav { flex: 0 0 auto; margin-bottom: 24px; }
    :host(.fill) { display: flex; flex-direction: column; flex: 1 1 0; min-height: 0; }
    :host(.fill) mat-tab-nav-panel { display: flex; flex-direction: column; flex: 1 1 0; min-height: 0; }
  `],
})
export class DocumentNavigationComponent {}
