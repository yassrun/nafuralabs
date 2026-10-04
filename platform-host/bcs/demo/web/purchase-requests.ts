import type { ListingPageConfig } from '@platform/platform/listing';
import type { RecordPageConfig } from '@platform/platform/record';

const REQUESTS = '/api/v1/demo/purchase-requests';
const route = (id: string) => `/demo/purchase-requests/${id}`;
const money = (value: unknown) => (value == null ? '—' : `${Number(value).toLocaleString('fr-MA', { minimumFractionDigits: 2 })} MAD`);

export const PURCHASE_REQUESTS_LISTING: ListingPageConfig = {
  title: 'Demandes d’achat',
  subtitle: 'Approuvées par un responsable au-delà de 10 000 MAD',
  icon: 'shopping-cart',
  endpoint: REQUESTS,
  searchFields: ['subject', 'supplierName'],
  segments: [
    { id: 'all', label: 'Toutes' },
    { id: 'draft', label: 'Brouillons', filters: { status: 'DRAFT' } },
    { id: 'submitted', label: 'En approbation', filters: { status: 'SUBMITTED' } },
    { id: 'approved', label: 'À commander', filters: { status: 'APPROVED' } },
    { id: 'ordered', label: 'Commandées', filters: { status: 'ORDERED' } },
  ],
  paging: 'server',
  board: {
    columns: 'lifecycle',
    defaultView: 'table',
    card: { title: 'subject', subtitle: 'supplierName', badge: 'amount' },
  },
  columns: [
    { key: 'subject', field: 'subject', label: 'Objet', sortable: true },
    { key: 'supplier', field: 'supplierName', label: 'Fournisseur', sortable: true },
    { key: 'amount', field: 'amount', label: 'Montant', transform: money, sortable: true, width: '160px' },
    { key: 'neededBy', field: 'neededBy', label: 'Pour le', type: 'date', sortable: true, width: '130px' },
    { key: 'status', field: 'status', label: 'Statut', type: 'badge', lifecycle: true, width: '150px' },
  ],
  emptyState: { icon: 'shopping-cart', title: 'Aucune demande d’achat', message: 'Créez une demande, soumettez-la : elle suit son circuit d’approbation.' },
  open: (request) => route(String(request['id'])),
  actions: [
    { id: 'create', label: 'Nouvelle demande', icon: 'plus', variant: 'primary', permission: 'demo.purchasing.request.create', route: '/demo/purchase-requests/new' },
  ],
};

/** A record with a lifecycle: status badge, transitions in the toolbar, editable only as a draft. */
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
        description: 'Au-delà de 10 000 MAD, la soumission part en approbation chez un responsable.',
        fields: [
          { key: 'subject', field: 'subject', label: 'Objet', type: 'text', required: true, wide: true },
          { key: 'supplierId', field: 'supplierId', label: 'Fournisseur', type: 'select', lookupKey: 'suppliers' },
          { key: 'amount', field: 'amount', label: 'Montant (MAD)', type: 'number', validation: { min: 0 } },
          { key: 'neededBy', field: 'neededBy', label: 'Pour le', type: 'date' },
          { key: 'justification', field: 'justification', label: 'Justification', type: 'textarea' },
        ],
      },
      { title: 'Pièces jointes', kind: 'attachments', accept: ['application/pdf', 'image/png', 'image/jpeg'], maxSizeMb: 10 },
      { title: 'Notes', kind: 'comments' },
    ],
  },
  messages: { created: 'Demande créée.', saved: 'Demande enregistrée.', deleted: 'Demande supprimée.' },
};
