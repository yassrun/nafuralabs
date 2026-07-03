import { CommonModule } from '@angular/common';
import { MadCurrencyPipe } from '@lib/anatomy/pipes/mad-currency.pipe';
import { Component, LOCALE_ID, OnInit, computed, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { MatDialog } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatMenuModule } from '@angular/material/menu';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatChipsModule } from '@angular/material/chips';

import {
  PageShellComponent,
  PageHeaderComponent,
  ButtonComponent,
  IconComponent,
} from '@lib/anatomy';

import {
  CautionBancaireDialogComponent,
  FactureStatusBadgeComponent,
  LiberationDialogComponent,
  RetenueSummaryCardComponent,
  type CautionBancaireDialogData,
  type CautionBancaireDialogResult,
  type LiberationDialogData,
  type LiberationDialogResult,
} from '@applications/erp/ventes/components';
import type { RetenueGarantieListItem } from '@applications/erp/ventes/models';

import { RetenuesGarantieFacade } from './retenues-garantie.facade';

interface QuickChip {
  id: string;
  label: string;
  active: boolean;
}

@Component({
  selector: 'app-retenues-garantie',
  standalone: true,
  imports: [
    CommonModule,
    MadCurrencyPipe,
    FormsModule,
    PageShellComponent,
    PageHeaderComponent,
    ButtonComponent,
    IconComponent,
    MatButtonModule,
    MatIconModule,
    MatMenuModule,
    MatTooltipModule,
    MatChipsModule,
    FactureStatusBadgeComponent,
    RetenueSummaryCardComponent,
  ],
  templateUrl: './retenues-garantie.page.html',
  styleUrls: ['./retenues-garantie.page.scss'],
})
export class RetenuesGarantiePage implements OnInit {
  readonly facade = inject(RetenuesGarantieFacade);
  private readonly dialog = inject(MatDialog);
  private readonly locale = inject(LOCALE_ID);

  readonly headerConfig = {
    title: 'Retenues garanties',
    breadcrumbs: [
      { label: 'Ventes', route: '/ventes' },
      { label: 'Retenues garanties' },
    ],
  };

  readonly searchTerm = signal('');
  readonly activeStatus = signal<string | null>(null);

  readonly chips = computed<QuickChip[]>(() => {
    const filters = this.facade.filters();
    return [
      {
        id: 'a-liberer',
        label: 'À libérer < 30 j',
        active: !!filters.liberationsSous30j,
      },
      {
        id: 'caution',
        label: 'Avec caution bancaire',
        active: !!filters.hasCaution,
      },
      {
        id: 'liberees',
        label: 'Libérées',
        active: filters.status === 'LIBEREE',
      },
      {
        id: 'en-cours',
        label: 'En cours',
        active: filters.status === 'EN_COURS',
      },
    ];
  });

  readonly clientOptions = computed(() => {
    const seen = new Map<string, string>();
    for (const r of this.facade.retenues()) {
      if (r.clientId && r.clientName && !seen.has(r.clientId)) {
        seen.set(r.clientId, r.clientName);
      }
    }
    return Array.from(seen, ([id, name]) => ({ id, name }));
  });

  ngOnInit(): void {
    void this.facade.load();
  }

  onSearchChange(value: string): void {
    this.searchTerm.set(value);
    this.facade.setFilter('search', value || undefined);
  }

  onStatusChange(value: string | null): void {
    this.activeStatus.set(value);
    this.facade.setFilter('status', value ?? undefined);
  }

  onClientChange(value: string | null): void {
    this.facade.setFilter('clientId', value ?? undefined);
  }

  toggleChip(chipId: string): void {
    if (chipId === 'a-liberer') {
      const active = !this.facade.filters().liberationsSous30j;
      this.facade.setFilter('liberationsSous30j', active || undefined);
    } else if (chipId === 'caution') {
      const active = !this.facade.filters().hasCaution;
      this.facade.setFilter('hasCaution', active || undefined);
    } else if (chipId === 'liberees') {
      const active = this.facade.filters().status === 'LIBEREE';
      this.facade.setFilter('status', active ? undefined : 'LIBEREE');
      this.activeStatus.set(active ? null : 'LIBEREE');
    } else if (chipId === 'en-cours') {
      const active = this.facade.filters().status === 'EN_COURS';
      this.facade.setFilter('status', active ? undefined : 'EN_COURS');
      this.activeStatus.set(active ? null : 'EN_COURS');
    }
  }

  resetFilters(): void {
    this.searchTerm.set('');
    this.activeStatus.set(null);
    this.facade.resetFilters();
  }

  formatDate(value?: string): string {
    if (!value) return '—';
    const d = new Date(value);
    return Number.isNaN(d.getTime()) ? value : d.toLocaleDateString(this.locale);
  }

  delaiTone(r: RetenueGarantieListItem): 'ok' | 'warn' | 'danger' | 'past' | 'paid' {
    if (r.status === 'LIBEREE') return 'paid';
    if (r.delaiRestant === null || r.delaiRestant === undefined) return 'ok';
    if (r.delaiRestant < 0) return 'past';
    if (r.delaiRestant <= 60) return 'warn';
    return 'ok';
  }

  delaiLabel(r: RetenueGarantieListItem): string {
    if (r.status === 'LIBEREE') return 'Libérée';
    const d = r.delaiRestant;
    if (d === null || d === undefined) return '—';
    if (d < 0) return `À libérer (+${Math.abs(d)} j)`;
    return `J − ${d}`;
  }

  canDemanderLiberation(r: RetenueGarantieListItem): boolean {
    return (
      r.status === 'EN_COURS' &&
      (r.delaiRestant === null ||
        r.delaiRestant === undefined ||
        r.delaiRestant <= 0)
    );
  }

  canMarquerLiberee(r: RetenueGarantieListItem): boolean {
    return r.status === 'LIBERATION_DEMANDEE';
  }

  canRemplacerCaution(r: RetenueGarantieListItem): boolean {
    return r.status === 'EN_COURS' || r.status === 'LIBERATION_DEMANDEE';
  }

  async openDemanderLiberation(r: RetenueGarantieListItem): Promise<void> {
    const dialogRef = this.dialog.open<
      LiberationDialogComponent,
      LiberationDialogData,
      LiberationDialogResult
    >(LiberationDialogComponent, {
      data: { retenue: r, action: 'demande' },
      maxWidth: '720px',
    });
    const result = await dialogRef.afterClosed().toPromise();
    if (!result) return;
    await this.facade.demanderLiberation(r.id);
  }

  async openMarquerLiberee(r: RetenueGarantieListItem): Promise<void> {
    const dialogRef = this.dialog.open<
      LiberationDialogComponent,
      LiberationDialogData,
      LiberationDialogResult
    >(LiberationDialogComponent, {
      data: { retenue: r, action: 'marquer' },
      maxWidth: '720px',
    });
    const result = await dialogRef.afterClosed().toPromise();
    if (!result) return;
    await this.facade.marquerLiberee(r.id, result.dateLiberation);
  }

  async openRemplacerCaution(r: RetenueGarantieListItem): Promise<void> {
    const dialogRef = this.dialog.open<
      CautionBancaireDialogComponent,
      CautionBancaireDialogData,
      CautionBancaireDialogResult
    >(CautionBancaireDialogComponent, {
      data: {
        retenue: r,
        banques: this.facade.banques().map((b) => ({ id: b.id, nom: b.nom })),
      },
      maxWidth: '720px',
    });
    const result = await dialogRef.afterClosed().toPromise();
    if (!result) return;
    await this.facade.remplacerParCaution(r.id, result);
  }
}
