import { Component, ChangeDetectionStrategy, computed, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';

import { PageShellComponent } from '@platform/lib/anatomy/components/organisms/page-shell';
import { PageHeaderComponent } from '@platform/lib/anatomy/components/molecules/page-header';
import { TabsComponent, type TabItem } from '@platform/lib/anatomy/components/molecules/tabs';
import { ListingActionsComponent, type ListingActionItem } from '@platform/lib/anatomy/components/molecules/listing-actions';
import { ButtonComponent } from '@platform/lib/anatomy/components/atoms/button';
import { DataTableComponent } from '@platform/lib/anatomy/components/organisms/data-table';
import type { ColumnConfig } from '@platform/lib/anatomy/types';

interface ContactRow { id: string; name: string; role: string; email: string; phone: string; }
interface ClientRow { id: string; name: string; code: string; status: string; }
interface DocumentRow { id: string; name: string; type: string; status: string; }

@Component({
  selector: 'sb-details-tabs',
  standalone: true,
  imports: [FormsModule, PageShellComponent, PageHeaderComponent, TabsComponent, ListingActionsComponent, ButtonComponent, DataTableComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <nf-page-shell scroll>
      <nf-page-header [config]="headerConfig()" />

      <div class="detail-toolbar">
        <div class="detail-form-actions">
          <nf-button variant="ghost" icon="x" (clicked)="cancel()">Annuler</nf-button>
          <nf-button variant="primary" icon="save" (clicked)="save()">Enregistrer</nf-button>
        </div>
        <nf-listing-actions
          placement="start"
          [actions]="entityActions"
          (actionClick)="onToolbarAction($event)" />
      </div>

      <nf-tabs [tabs]="tabs" [activeTab]="activeTab()" (tabChange)="activeTab.set($event)" />

      @switch (activeTab()) {
        @case ('general') {
          <section class="master-panel">
            <div class="section-heading">
              <div>
                <h2>Informations générales</h2>
                <p>Master entity : les champs principaux du fournisseur.</p>
              </div>
            </div>
            <div class="form-grid">
              <label><span>Nom</span><input [(ngModel)]="supplier.name" name="supplier-name" /></label>
              <label><span>Statut</span><select [(ngModel)]="supplier.status" name="supplier-status"><option>Actif</option><option>En attente</option><option>Archivé</option></select></label>
              <label><span>ICE</span><input [(ngModel)]="supplier.ice" name="supplier-ice" /></label>
              <label><span>Email principal</span><input [(ngModel)]="supplier.email" name="supplier-email" type="email" /></label>
              <label class="form-grid__wide"><span>Adresse</span><input [(ngModel)]="supplier.address" name="supplier-address" /></label>
            </div>
          </section>
        }
        @case ('contacts') {
          <section class="slave-panel">
            <div class="section-heading"><div><h2>Contacts</h2><p>Slave 1-N rattaché au fournisseur.</p></div><nf-button variant="secondary" icon="plus" (clicked)="addContact()">Ajouter</nf-button></div>
            <nf-data-table [items]="contacts()" [columns]="contactColumns" [selectable]="false" />
          </section>
        }
        @case ('clients') {
          <section class="slave-panel"><h2>Clients liés</h2><p>Autre slave métier consultable depuis le master.</p><nf-data-table [items]="clients" [columns]="clientColumns" [selectable]="false" /></section>
        }
        @case ('documents') {
          <section class="slave-panel"><h2>Documents</h2><p>Pièces et justificatifs du fournisseur.</p><nf-data-table [items]="documents" [columns]="documentColumns" [selectable]="false" /></section>
        }
      }
    </nf-page-shell>
  `,
  styles: [`
    .master-panel, .slave-panel { margin-top: 16px; padding: 20px; border: 1px solid var(--nf-border-default, #e2e8f0); border-radius: 8px; background: var(--nf-surface-section, #fff); }
    .detail-toolbar { display: flex; align-items: center; justify-content: space-between; gap: 16px; margin: -8px 0 8px; padding-bottom: 8px; border-bottom: 1px solid var(--nf-border-default, #e2e8f0); }
    .detail-form-actions { display: flex; align-items: center; gap: 8px; }
    .section-heading { display: flex; align-items: flex-start; justify-content: space-between; gap: 16px; margin-bottom: 18px; }
    h2 { margin: 0 0 4px; font-size: 1rem; }
    p { margin: 0; color: var(--nf-text-muted, #64748b); font-size: 0.8125rem; }
    .form-grid { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 14px; max-width: 760px; }
    label { display: grid; gap: 5px; font-size: 0.8125rem; }
    label span { color: var(--nf-text-muted, #64748b); }
    input, select { min-height: 36px; padding: 0 10px; border: 1px solid var(--nf-border-default, #dbe2ea); border-radius: 6px; font: inherit; background: #fff; }
    .form-grid__wide { grid-column: 1 / -1; }
    @media (max-width: 640px) { .form-grid { grid-template-columns: 1fr; } .form-grid__wide { grid-column: auto; } .section-heading { flex-direction: column; } }
  `],
})
export class DetailsTabsPage {
  readonly activeTab = signal('general');
  readonly entityActions: ListingActionItem[] = [
    { id: 'duplicate', label: 'Dupliquer', icon: 'copy', variant: 'secondary' },
    { id: 'delete', label: 'Supprimer', icon: 'trash-2', variant: 'danger' },
  ];
  readonly tabs: TabItem[] = [
    { id: 'general', label: 'Général', icon: 'building-2' },
    { id: 'contacts', label: 'Contacts', icon: 'users' },
    { id: 'clients', label: 'Clients', icon: 'briefcase-business' },
    { id: 'documents', label: 'Documents', icon: 'file-text' },
  ];
  readonly supplier = { name: 'Atlas Fournitures SA', status: 'Actif', ice: '001234567000089', email: 'contact@atlas.example', address: 'Casablanca, Maroc' };
  readonly contacts = signal<ContactRow[]>([
    { id: 'c1', name: 'Sara Amrani', role: 'Commerciale', email: 'sara@atlas.example', phone: '+212 600 000 001' },
    { id: 'c2', name: 'Youssef Karim', role: 'Comptabilité', email: 'youssef@atlas.example', phone: '+212 600 000 002' },
  ]);
  readonly clients: ClientRow[] = [
    { id: 'cl1', name: 'Atlas Bâtiment SA', code: 'CLI-001', status: 'Actif' },
    { id: 'cl2', name: 'Casa Travaux', code: 'CLI-014', status: 'Actif' },
  ];
  readonly documents: DocumentRow[] = [
    { id: 'd1', name: 'Registre de commerce.pdf', type: 'Registre', status: 'Validé' },
    { id: 'd2', name: 'Attestation ICE.pdf', type: 'ICE', status: 'À vérifier' },
  ];
  readonly contactColumns: ColumnConfig[] = [
    { key: 'name', field: 'name', label: 'Nom' }, { key: 'role', field: 'role', label: 'Rôle' }, { key: 'email', field: 'email', label: 'Email' }, { key: 'phone', field: 'phone', label: 'Téléphone' },
  ];
  readonly clientColumns: ColumnConfig[] = [
    { key: 'code', field: 'code', label: 'Code' }, { key: 'name', field: 'name', label: 'Client' }, { key: 'status', field: 'status', label: 'Statut' },
  ];
  readonly documentColumns: ColumnConfig[] = [
    { key: 'name', field: 'name', label: 'Document' }, { key: 'type', field: 'type', label: 'Type' }, { key: 'status', field: 'status', label: 'Statut' },
  ];
  readonly headerConfig = computed(() => ({
    title: this.supplier.name,
    subtitle: 'Details tabs 1-N — master fournisseur + slaves métier',
    icon: 'building-2',
  }));

  onToolbarAction(actionId: string): void {
    if (actionId === 'duplicate') this.duplicate();
    if (actionId === 'delete') this.delete();
  }
  save(): void {}
  cancel(): void {}
  duplicate(): void {}
  delete(): void {}
  addContact(): void {
    const id = `c${this.contacts().length + 1}`;
    this.contacts.update((rows) => [...rows, { id, name: `Nouveau contact ${rows.length + 1}`, role: 'À définir', email: '—', phone: '—' }]);
  }
}