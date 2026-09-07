
import {
  ChangeDetectionStrategy,
  Component,
  computed,
  effect,
  inject,
  input,
  output,
  signal,
} from '@angular/core';
import { FormsModule } from '@angular/forms';

import { NfSelectComponent, type NfSelectOption } from '@platform/lib/anatomy';

import {
  ErpLookupService,
  partnerRaisonSocialeFromLabel,
  partnerSelectOptions,
} from '@app/socle/shared/services/erp-lookup.service';

export interface ClientPartnerSelection {
  clientId: string | null;
  clientNom: string | null;
}

/**
 * Sélecteur Partner (rôle CLIENT) — valeur = UUID, libellé = raison sociale (code en secondaire).
 * Pas de saisie libre : le nom est dérivé du référentiel.
 */
@Component({
  selector: 'app-client-partner-select',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [FormsModule, NfSelectComponent],
  template: `
    <nf-select
      [id]="controlId()"
      [label]="label()"
      [placeholder]="placeholder()"
      [options]="options()"
      [required]="required()"
      [disabled]="disabled()"
      lookupKey="clients"
      [listShortcut]="{ label: 'Voir la liste des clients' }"
      [lookupSearch]="searchClients"
      [selectedLabel]="clientNom() ?? undefined"
      [ngModel]="clientId()"
      (ngModelChange)="onChange($event)"
    />
  `,
  styles: [
    `
      :host {
        display: block;
      }
    `,
  ],
})
export class ClientPartnerSelectComponent {
  private readonly erpLookup = inject(ErpLookupService);

  readonly controlId = input('client-partner');
  readonly label = input('Client');
  readonly placeholder = input('Sélectionner un client');
  readonly required = input(false);
  readonly disabled = input(false);
  /** UUID Partner courant (peut être legacy / orphelin). */
  readonly clientId = input<string | null>(null);
  /** Nom d'affichage (snapshot ou legacy) pour fallback orphelin. */
  readonly clientNom = input<string | null>(null);

  readonly selectionChange = output<ClientPartnerSelection>();

  private readonly partners = signal<NfSelectOption[]>([]);

  readonly options = computed(() => {
    const list = [...this.partners()];
    const id = this.clientId()?.trim();
    if (id && !list.some((o) => o.value === id)) {
      const nom = this.clientNom()?.trim();
      list.unshift({
        value: id,
        label: nom ? `${nom} (à resélectionner)` : `${id} (inconnu)`,
      });
    }
    return list;
  });

  constructor() {
    effect(() => {
      const id = this.clientId()?.trim();
      if (id) {
        void this.resolvePartnerLabel(id);
      }
    });
  }

  searchClients = (q: string) =>
    this.erpLookup.partnersByRole('CLIENT', q).then((items) => {
      const opts = partnerSelectOptions(items);
      this.partners.set(opts);
      return opts;
    });

  private async resolvePartnerLabel(id: string): Promise<void> {
    const item = await this.erpLookup.partnerById(id);
    if (item) {
      this.partners.set(partnerSelectOptions([item]));
    }
  }

  onChange(raw: string | null | undefined): void {
    const id = typeof raw === 'string' && raw.trim() ? raw.trim() : null;
    if (!id) {
      this.selectionChange.emit({ clientId: null, clientNom: null });
      return;
    }
    const opt = this.options().find((o) => o.value === id);
    const label = opt?.label ?? this.clientNom() ?? null;
    const nom = partnerRaisonSocialeFromLabel(label);
    this.selectionChange.emit({ clientId: id, clientNom: nom || null });
  }
}
