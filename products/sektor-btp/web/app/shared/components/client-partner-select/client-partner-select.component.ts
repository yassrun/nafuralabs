import { CommonModule } from '@angular/common';
import {
  ChangeDetectionStrategy,
  Component,
  HostListener,
  computed,
  inject,
  input,
  output,
  signal,
} from '@angular/core';
import { FormsModule } from '@angular/forms';

import { NfSelectComponent, type NfSelectOption } from '@lib/anatomy';

import {
  ErpLookupService,
  partnerLookupLabel,
} from '@app/shared/services/erp-lookup.service';

export interface ClientPartnerSelection {
  clientId: string | null;
  clientNom: string | null;
}

/**
 * Sélecteur Partner (rôle CLIENT) — valeur = UUID, libellé = code — raison sociale.
 * Pas de saisie libre : le nom est dérivé du référentiel.
 */
@Component({
  selector: 'app-client-partner-select',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CommonModule, FormsModule, NfSelectComponent],
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
  private readonly loaded = signal(false);

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
    void this.reload();
  }

  @HostListener('window:focus')
  onWindowFocus(): void {
    void this.reload();
  }

  async reload(): Promise<void> {
    try {
      const items = await this.erpLookup.partnersByRole('CLIENT');
      this.partners.set(
        items.map((item) => ({
          value: String(item.key),
          label: partnerLookupLabel(item),
        })),
      );
      this.loaded.set(true);
    } catch {
      this.partners.set([]);
      this.loaded.set(true);
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
    // Extraire la raison sociale après "CODE — " si présent.
    const nom =
      label && label.includes(' — ')
        ? label.split(' — ').slice(1).join(' — ').replace(/ \(à resélectionner\)$/, '')
        : label;
    this.selectionChange.emit({ clientId: id, clientNom: nom });
  }
}
