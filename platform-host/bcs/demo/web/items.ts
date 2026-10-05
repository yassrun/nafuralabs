import type { ListingPageConfig } from '@platform/platform/listing';
import type { RecordPageConfig } from '@platform/platform/record';

const ITEMS = '/api/v1/demo/items';
const route = (id: string) => `/demo/items/${id}`;
const UNITS = ['u', 'kg', 'm', 'm²', 'm³', 'L', 'h'].map((value) => ({ value, label: value }));

export const ITEMS_LISTING: ListingPageConfig = {
  title: 'Articles',
  subtitle: 'Le catalogue de ce que l’on achète',
  icon: 'package',
  endpoint: ITEMS,
  quickFilters: [{ property: 'categoryId' }, { property: 'unit' }],
  views: [
    { id: 'active', label: 'Actifs', layout: 'table', filter: { active: { is: true } }, show: ['code', 'name', 'categoryId', 'unit', 'unitPrice'] },
    { id: 'all', label: 'Tous', layout: 'table', show: ['code', 'name', 'categoryId', 'unit', 'unitPrice', 'active'] },
  ],
  emptyState: { icon: 'package', title: 'Aucun article', message: 'Ajoutez les articles que vous achetez.' },
  open: (item) => route(String(item['id'])),
  actions: [{ id: 'create', label: 'Nouvel article', icon: 'plus', variant: 'primary', permission: 'demo.purchasing.item.create', route: '/demo/items/new' }],
};

/** The standard record: one screen of sections, contextual save bar. */
export const ITEM_RECORD: RecordPageConfig = {
  title: (item) => String(item['name']),
  subtitle: (item) => [item['code'], item['categoryName']].filter(Boolean).join(' · '),
  createTitle: 'Nouvel article',
  icon: 'package',
  endpoint: ITEMS,
  back: { label: 'Articles', route: '/demo/items' },
  route,
  lookups: { categories: '/api/v1/demo/categories/options' },
  permissions: { create: 'demo.purchasing.item.create', update: 'demo.purchasing.item.update', delete: 'demo.purchasing.item.delete' },
  defaults: { active: true, unit: 'u' },
  layout: {
    kind: 'sections',
    sections: [
      {
        title: 'Article',
        fields: [
          { key: 'code', field: 'code', label: 'Code', type: 'text', required: true, validation: { maxLength: 40 } },
          { key: 'name', field: 'name', label: 'Désignation', type: 'text', required: true },
          { key: 'categoryId', field: 'categoryId', label: 'Catégorie', type: 'select', lookupKey: 'categories' },
          { key: 'active', field: 'active', label: 'Article actif', type: 'checkbox' },
        ],
      },
      {
        title: 'Achat',
        description: 'Unité et prix de référence pour les demandes d’achat.',
        fields: [
          { key: 'unit', field: 'unit', label: 'Unité', type: 'select', options: UNITS, required: true },
          { key: 'unitPrice', field: 'unitPrice', label: 'Prix unitaire (MAD)', type: 'number', validation: { min: 0 } },
          { key: 'description', field: 'description', label: 'Description', type: 'textarea' },
        ],
      },
    ],
  },
  messages: { created: 'Article créé.', saved: 'Article enregistré.', deleted: 'Article supprimé.' },
};
