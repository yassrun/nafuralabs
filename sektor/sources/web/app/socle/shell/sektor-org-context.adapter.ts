import { Injectable, computed, inject } from '@angular/core';

import type { OrgContextPort } from '@platform/core/shell/org-context.port';
import { ThemeService } from '@platform/core/theme';

import { ETABLISSEMENT_TYPE_LABELS } from '../administration/societe/models';
import { SocieteService } from './societe.service';

@Injectable()
export class SektorOrgContextAdapter implements OrgContextPort {
  private readonly societe = inject(SocieteService);
  private readonly theme = inject(ThemeService);

  readonly settingsRoute = '/administration/societe';

  readonly orgs = computed(() =>
    this.societe.societes().map((s) => ({
      id: s.id,
      label: s.raisonSociale,
      meta: [s.formeJuridique, s.ice ? `ICE ${s.ice}` : null].filter(Boolean).join(' · '),
    })),
  );

  readonly sites = computed(() =>
    this.societe.etablissementsForCurrentSociete().map((e) => ({
      id: e.id,
      label: e.nom,
      meta: [ETABLISSEMENT_TYPE_LABELS[e.type] ?? e.type, e.ville].filter(Boolean).join(' · '),
    })),
  );

  readonly currentOrgId = this.societe.currentSocieteId;
  readonly currentSiteId = this.societe.currentEtablissementId;

  selectOrg(id: string): void {
    this.societe.setCurrentSociete(id);
    this.applyTheme();
  }

  selectSite(id: string): void {
    this.societe.setCurrentEtablissement(id);
    this.applyTheme();
  }

  private applyTheme(): void {
    const branding = this.theme.branding();
    const soc = this.societe.currentSociete();
    this.theme.applyDocumentChrome({
      logoUrl: branding?.logoUrl ?? null,
      faviconUrl: branding?.faviconUrl ?? null,
      primaryColor: branding?.primaryColor ?? null,
      tenantDisplayName: soc?.raisonSociale ?? branding?.tenantDisplayName ?? null,
    });
  }
}
