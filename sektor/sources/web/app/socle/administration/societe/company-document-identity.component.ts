import { Component } from '@angular/core';

import { OrganizationIdentityPage } from '@platform/features/organization-identity';

/**
 * Thin Sektor wrapper — legal identity is owned by platform organization-identity.
 */
@Component({
  selector: 'app-company-document-identity',
  standalone: true,
  imports: [OrganizationIdentityPage],
  template: `<nf-organization-identity-page [embedded]="true" />`,
  styles: [`:host { display: block; }`],
})
export class CompanyDocumentIdentityComponent {}
