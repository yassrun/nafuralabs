import type { ListingPageConfig, Row } from '@platform/platform/listing';
import type { RecordPageConfig, RecordSection } from '@platform/platform/record';

const SUPPLIERS = '/api/v1/demo/suppliers';
const route = (id: string) => `/demo/suppliers/${id}`;

const PAYMENT_TERMS = ['Comptant', '30 jours', '60 jours', '90 jours'].map((value) => ({ value, label: value }));

export const SUPPLIERS_LISTING: ListingPageConfig = {
  title: 'Fournisseurs',
  subtitle: 'Les partenaires d’achat de l’organisation',
  icon: 'building-2',
  endpoint: SUPPLIERS,
  searchFields: ['code', 'name', 'city', 'categoryName'],
  segments: [
    { id: 'active', label: 'Actifs', filters: { active: true } },
    { id: 'inactive', label: 'Inactifs', filters: { active: false } },
    { id: 'all', label: 'Tous' },
  ],
  filters: [
    { key: 'city', label: 'Ville', type: 'text' },
    { key: 'paymentTerms', label: 'Paiement', type: 'select', options: PAYMENT_TERMS },
  ],
  columns: [
    { key: 'code', field: 'code', label: 'Code', sortable: true, width: '110px', cssClass: 'nf-cell--mono' },
    { key: 'name', field: 'name', label: 'Raison sociale', sortable: true },
    { key: 'category', field: 'categoryName', label: 'Catégorie', sortable: true },
    { key: 'city', field: 'city', label: 'Ville', sortable: true },
    { key: 'rating', field: 'rating', label: 'Note', transform: (rating) => (rating ? '★'.repeat(Number(rating)) : '—'), width: '110px' },
    {
      key: 'active',
      field: 'active',
      label: 'Statut',
      type: 'badge',
      transform: (active) => (active ? 'Actif' : 'Inactif'),
      badgeVariant: (active) => (active ? 'success' : 'default'),
      width: '110px',
    },
  ],
  emptyState: { icon: 'building-2', title: 'Aucun fournisseur', message: 'Créez votre premier fournisseur pour commencer.' },
  open: (supplier) => route(String(supplier['id'])),
  actions: [
    { id: 'create', label: 'Nouveau fournisseur', icon: 'plus', variant: 'primary', permission: 'demo.purchasing.supplier.create', route: '/demo/suppliers/new' },
    {
      id: 'delete',
      row: true,
      label: 'Supprimer',
      icon: 'trash-2',
      variant: 'danger',
      permission: 'demo.purchasing.supplier.delete',
      confirm: { title: 'Supprimer le fournisseur', message: 'Ses contacts seront supprimés aussi. Cette action est définitive.', confirmLabel: 'Supprimer', danger: true },
      request: { method: 'DELETE' },
      success: 'Fournisseur supprimé.',
    },
  ],
};

/** Contacts of a supplier: a related list, saved line by line. */
const contactsListing = (supplier: Row): ListingPageConfig => {
  const form = {
    title: 'Contact',
    fields: [
      { key: 'name', field: 'name', label: 'Nom', type: 'text' as const, required: true },
      { key: 'jobTitle', field: 'jobTitle', label: 'Fonction', type: 'text' as const },
      { key: 'email', field: 'email', label: 'E-mail', type: 'email' as const },
      { key: 'phone', field: 'phone', label: 'Téléphone', type: 'text' as const },
      { key: 'mainContact', field: 'mainContact', label: 'Contact principal', type: 'checkbox' as const },
    ],
  };
  return {
    title: 'Contacts',
    endpoint: '/api/v1/demo/supplier-contacts',
    query: { supplierId: String(supplier['id']) },
    searchFields: ['name', 'email', 'jobTitle'],
    pageSize: 10,
    columns: [
      { key: 'name', field: 'name', label: 'Nom', sortable: true },
      { key: 'jobTitle', field: 'jobTitle', label: 'Fonction' },
      { key: 'email', field: 'email', label: 'E-mail' },
      { key: 'phone', field: 'phone', label: 'Téléphone' },
      { key: 'main', field: 'mainContact', label: 'Principal', type: 'boolean', width: '110px' },
    ],
    emptyState: { icon: 'users', title: 'Aucun contact', message: 'Ajoutez les interlocuteurs de ce fournisseur.' },
    actions: [
      {
        id: 'add',
        label: 'Ajouter un contact',
        icon: 'user-plus',
        variant: 'primary',
        permission: 'demo.purchasing.contact.create',
        form: { ...form, title: 'Nouveau contact', body: (values) => ({ ...values, supplierId: supplier['id'] }) },
        request: { method: 'POST' },
        success: 'Contact ajouté.',
      },
      {
        id: 'edit',
        row: true,
        label: 'Modifier',
        icon: 'pencil',
        permission: 'demo.purchasing.contact.update',
        form: { ...form, values: (contact) => ({ ...contact }) },
        request: { method: 'PUT' },
        success: 'Contact enregistré.',
      },
      {
        id: 'remove',
        row: true,
        label: 'Retirer',
        icon: 'trash-2',
        variant: 'danger',
        permission: 'demo.purchasing.contact.delete',
        confirm: { title: 'Retirer le contact', message: 'Retirer ce contact du fournisseur ?', confirmLabel: 'Retirer', danger: true },
        request: { method: 'DELETE' },
        success: 'Contact retiré.',
      },
    ],
  };
};

const IDENTITY: RecordSection = {
  title: 'Identité',
  description: 'Comment le fournisseur est reconnu dans vos achats.',
  fields: [
    { key: 'code', field: 'code', label: 'Code', type: 'text', required: true, validation: { maxLength: 40 } },
    { key: 'name', field: 'name', label: 'Raison sociale', type: 'text', required: true, validation: { maxLength: 160 } },
    { key: 'categoryId', field: 'categoryId', label: 'Catégorie', type: 'select', lookupKey: 'categories' },
    { key: 'active', field: 'active', label: 'Fournisseur actif', type: 'checkbox' },
  ],
};

const COORDINATES: RecordSection = {
  title: 'Coordonnées',
  fields: [
    { key: 'email', field: 'email', label: 'E-mail', type: 'email' },
    { key: 'phone', field: 'phone', label: 'Téléphone', type: 'text' },
    { key: 'city', field: 'city', label: 'Ville', type: 'text' },
    { key: 'address', field: 'address', label: 'Adresse', type: 'text', wide: true },
  ],
};

const TERMS: RecordSection = {
  title: 'Conditions commerciales',
  fields: [
    { key: 'paymentTerms', field: 'paymentTerms', label: 'Paiement', type: 'select', options: PAYMENT_TERMS },
    { key: 'deliveryDays', field: 'deliveryDays', label: 'Délai de livraison (jours)', type: 'number', validation: { min: 0 } },
    { key: 'rating', field: 'rating', label: 'Note (1 à 5)', type: 'number', validation: { min: 1, max: 5 } },
    { key: 'notes', field: 'notes', label: 'Notes internes', type: 'textarea' },
  ],
};

export const SUPPLIER_RECORD: RecordPageConfig = {
  title: (supplier) => String(supplier['name']),
  subtitle: (supplier) => [supplier['code'], supplier['categoryName'], supplier['city']].filter(Boolean).join(' · '),
  createTitle: 'Nouveau fournisseur',
  icon: 'building-2',
  endpoint: SUPPLIERS,
  back: { label: 'Fournisseurs', route: '/demo/suppliers' },
  route,
  lookups: { categories: '/api/v1/demo/categories/options' },
  permissions: {
    create: 'demo.purchasing.supplier.create',
    update: 'demo.purchasing.supplier.update',
    delete: 'demo.purchasing.supplier.delete',
  },
  defaults: { active: true, paymentTerms: '30 jours' },
  layout: {
    kind: 'tabs',
    tabs: [
      { id: 'general', label: 'Général', sections: [IDENTITY, COORDINATES] },
      { id: 'contacts', label: 'Contacts', sections: [{ title: 'Interlocuteurs', listing: contactsListing }] },
      { id: 'terms', label: 'Conditions', sections: [TERMS] },
    ],
  },
  createLayout: {
    kind: 'steps',
    steps: [
      { id: 'identity', label: 'Identité', sections: [IDENTITY] },
      { id: 'coordinates', label: 'Coordonnées', sections: [COORDINATES] },
      { id: 'terms', label: 'Conditions', sections: [TERMS] },
    ],
  },
  messages: { created: 'Fournisseur créé.', saved: 'Fournisseur enregistré.', deleted: 'Fournisseur supprimé.' },
};
