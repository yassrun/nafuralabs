import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, Component, EventEmitter, Input, Output, computed, signal } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { MatRippleModule } from '@angular/material/core';
import { TranslateModule } from '@ngx-translate/core';

import { DocTypeListItem, DocTypesByDomain, DomainListItem } from '../../models/doc-type-definition.model';
import { FlipIconRtlDirective } from '../../../../../lib/anatomy/directives';

export interface DiscoveryDomainCard {
  id: string;
  label: string;
  description: string;
  icon: string;
  color: string;
}

@Component({
  selector: 'app-extraction-discovery',
  standalone: true,
  imports: [
    CommonModule,
    MatButtonModule,
    MatCardModule,
    MatIconModule,
    MatRippleModule,
    TranslateModule,
    FlipIconRtlDirective,
  ],
  templateUrl: './extraction-discovery.component.html',
  styleUrl: './extraction-discovery.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ExtractionDiscoveryComponent {
  @Input() set domains(value: DomainListItem[]) {
    this.domainsSignal.set(value);
  }
  get domains(): DomainListItem[] {
    return this.domainsSignal();
  }
  
  @Input() docTypesByDomain: DocTypesByDomain | null = null;
  @Output() selectDocType = new EventEmitter<{ domainKey: string; docTypeKey: string }>();
  @Output() createCustom = new EventEmitter<void>();

  private readonly domainsSignal = signal<DomainListItem[]>([]);
  readonly selectedDomain = signal<string | null>(null);

  readonly selectedDomainLabel = computed(() => {
    const id = this.selectedDomain();
    if (!id) return '';
    return this.domainCards().find(d => d.id === id)?.label ?? '';
  });

  // Map backend domains to UI cards with metadata
  readonly domainCards = computed<DiscoveryDomainCard[]>(() => {
    return this.domainsSignal().map(domain => this.mapDomainToCard(domain));
  });

  onDomainClick(domainId: string): void {
    this.selectedDomain.set(domainId);
  }

  onBack(): void {
    this.selectedDomain.set(null);
  }

  onDocTypeClick(domainKey: string, docTypeKey: string): void {
    this.selectDocType.emit({ domainKey, docTypeKey });
  }

  getDocTypesForDomain(domainKey: string): DocTypeListItem[] {
    if (!this.docTypesByDomain) return [];
    return this.docTypesByDomain.domains[domainKey]?.docTypes ?? [];
  }

  private mapDomainToCard(domain: DomainListItem): DiscoveryDomainCard {
    const metadata = this.getDomainMetadata(domain.domainKey);
    return {
      id: domain.domainKey,
      label: domain.label,
      description: metadata.description,
      icon: metadata.icon,
      color: metadata.color,
    };
  }

  private getDomainMetadata(domainKey: string): { description: string; icon: string; color: string } {
    const metadataMap: Record<string, { description: string; icon: string; color: string }> = {
      'logistic': {
        description: 'Delivery notes, transport docs, stock flows.',
        icon: 'local_shipping',
        color: '#3f51b5',
      },
      'finance': {
        description: 'Invoices, receipts, bank statements.',
        icon: 'account_balance',
        color: '#4caf50',
      },
      'btp': {
        description: 'Construction documents, building permits, site reports.',
        icon: 'construction',
        color: '#ff9800',
      },
      'inventory': {
        description: 'Stock management, warehouse documents.',
        icon: 'inventory_2',
        color: '#9c27b0',
      },
    };

    return metadataMap[domainKey] || {
      description: `Documents related to ${domainKey}.`,
      icon: 'folder',
      color: '#757575',
    };
  }
}
