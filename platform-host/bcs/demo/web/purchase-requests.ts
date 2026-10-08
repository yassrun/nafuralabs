import type { ListingPageConfig } from '@platform/platform/listing';
import type { RecordPageConfig } from '@platform/platform/record';

const REQUESTS = '/api/v1/demo/purchase-requests';
const route = (id: string) => `/demo/purchase-requests/${id}`;
const money = (value: unknown) => (value == null ? '—' : `${Number(value).toLocaleString('fr-MA', { minimumFractionDigits: 2 })} MAD`);
/** Demo VAT rate for the computed TTC (display only). */
const VAT = 0.2;

export const PURCHASE_REQUESTS_LISTING: ListingPageConfig = {
  title: 'Demandes d’achat',
  subtitle: 'Approuvées par un responsable au-delà de 10 000 MAD',
  icon: 'shopping-cart',
  endpoint: REQUESTS,
  loadHeader: () =>
    import('./screens/purchase-requests-header/purchase-requests-header.component').then(
      (m) => m.PurchaseRequestsHeaderComponent,
    ),
  quickFilters: [
    { id: 'mine', label: 'Mes demandes', filter: { createdBy: { is: 'me' } } },
    { id: 'late', label: 'En retard', filter: { and: [{ neededBy: { before: 'today' } }, { status: { notIn: ['ORDERED', 'REJECTED'] } }] } },
    { id: 'big', label: 'Plus de 10 000 MAD', filter: { amount: { gt: 10000 } } },
    { property: 'supplierId' },
    { property: 'status', operator: 'in' },
  ],
  views: [
    { id: 'all', label: 'Toutes', layout: 'table', show: ['subject', 'supplierId', 'amount', 'neededBy', 'status'], footer: { amount: 'sum' } },
    { id: 'pipeline', label: 'Circuit', layout: 'board', groupBy: 'status', card: ['subject', 'supplierId', 'amount'] },
    {
      id: 'to-order',
      label: 'À commander',
      layout: 'table',
      filter: { status: { is: 'APPROVED' } },
      sort: [{ neededBy: 'asc' }, { amount: 'desc' }],
      show: ['subject', 'supplierId', 'amount', 'neededBy'],
      footer: { amount: 'sum' },
      hideQuickFilters: ['status'],
    },
    {
      id: 'casablanca',
      label: 'Fournisseurs de Casablanca',
      layout: 'table',
      filter: { supplierId: { where: { city: { is: 'Casablanca' } } } },
      show: ['subject', 'supplierId', 'amount', 'status'],
    },
    { id: 'agenda', label: 'Échéances', layout: 'calendar', date: 'neededBy', card: ['subject', 'amount'] },
  ],
  emptyState: { icon: 'shopping-cart', title: 'Aucune demande d’achat', message: 'Créez une demande, soumettez-la : elle suit son circuit d’approbation.' },
  open: (request) => route(String(request['id'])),
  actions: [
    { id: 'create', label: 'Nouvelle demande', icon: 'plus', variant: 'primary', permission: 'demo.purchasing.request.create', route: '/demo/purchase-requests/new' },
  ],
};

/** A record with a lifecycle: status badge, transitions in the toolbar, conditional fields. */
export const PURCHASE_REQUEST_RECORD: RecordPageConfig = {
  title: (request) => String(request['subject']),
  subtitle: (request) => [request['supplierName'], money(request['amount'])].filter(Boolean).join(' · '),
  createTitle: 'Nouvelle demande d’achat',
  icon: 'shopping-cart',
  endpoint: REQUESTS,
  back: { label: 'Demandes d’achat', route: '/demo/purchase-requests' },
  route,
  lifecycle: true,
  lookups: { suppliers: '/api/v1/demo/suppliers/options' },
  actions: [
    {
      id: 'duplicate',
      label: 'Dupliquer',
      icon: 'copy',
      permission: 'demo.purchasing.request.duplicate',
      request: { method: 'POST', url: `${REQUESTS}/{id}/duplicate` },
      result: 'record',
      success: 'Demande dupliquée.',
    },
    {
      id: 'pdf',
      label: 'Bon de commande (PDF)',
      icon: 'file-down',
      permission: 'demo.purchasing.request.print',
      when: (request) => request['status'] === 'ORDERED',
      request: { method: 'POST', url: `${REQUESTS}/{id}/pdf` },
      result: 'download',
    },
  ],
  permissions: {
    create: 'demo.purchasing.request.create',
    update: 'demo.purchasing.request.update',
    delete: 'demo.purchasing.request.delete',
  },
  layout: {
    kind: 'sections',
    sections: [
      {
        title: 'Demande',
        description: 'Au-delà de 10 000 MAD, la soumission part en approbation chez un responsable. En approbation, seul le commentaire reste modifiable.',
        fields: [
          { key: 'subject', field: 'subject', label: 'Objet', type: 'text', required: true, wide: true },
          { key: 'supplierId', field: 'supplierId', label: 'Fournisseur', type: 'select', lookupKey: 'suppliers' },
          { key: 'amount', field: 'amount', label: 'Montant HT', validation: { min: 0 } },
          {
            key: 'amountTtc',
            field: 'amountTtc',
            label: 'Montant TTC',
            type: 'computed',
            format: 'money',
            currency: 'MAD',
            compute: (request) => {
              const ht = Number(request['amount'] ?? 0);
              return Number.isFinite(ht) ? ht * (1 + VAT) : null;
            },
            helpText: 'HT × 1,20 (affichage seulement, non enregistré).',
          },
          { key: 'neededBy', field: 'neededBy', label: 'Pour le', type: 'date' },
          { key: 'justification', field: 'justification', label: 'Justification', type: 'textarea' },
          { key: 'comment', field: 'comment', label: 'Commentaire', type: 'textarea' },
          {
            key: 'rejectionReason',
            field: 'rejectionReason',
            label: 'Motif du rejet',
            type: 'textarea',
            visible: (request) => request['status'] === 'REJECTED',
            requiredWhen: (request) => request['status'] === 'REJECTED',
          },
        ],
      },
      { title: 'Pièces jointes', kind: 'attachments', accept: ['application/pdf', 'image/png', 'image/jpeg'], maxSizeMb: 10 },
      { title: 'Notes', kind: 'comments' },
      { title: 'Activité', kind: 'audit' },
    ],
  },
  messages: { created: 'Demande créée.', saved: 'Demande enregistrée.', deleted: 'Demande supprimée.' },
};
