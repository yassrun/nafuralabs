import type { ListingPageConfig } from '@platform/platform/listing';

const FORM_FIELDS = [
  { key: 'code', field: 'code', label: 'Code', type: 'text' as const, required: true },
  { key: 'name', field: 'name', label: 'Nom', type: 'text' as const, required: true },
  { key: 'description', field: 'description', label: 'Description', type: 'textarea' as const },
];

/** A hierarchy: the tree listing, its parent pre-filled when adding a child. */
export const CATEGORIES_LISTING: ListingPageConfig = {
  title: 'Catégories',
  subtitle: 'L’arborescence des familles d’achat',
  icon: 'folder-tree',
  endpoint: '/api/v1/demo/categories',
  emptyMessage: 'Aucune catégorie',
  views: [
    {
      id: 'tree',
      label: 'Arborescence',
      layout: 'tree',
      show: ['name', 'code', 'description'],
      tree: {
        parentField: 'parentId',
        create: 'create',
        edit: 'edit',
        deleted: 'Catégorie supprimée.',
        labels: {
          addNode: 'Nouvelle catégorie',
          addChild: 'Sous-catégorie',
          deleteConfirmMessage: 'Supprimer cette catégorie et ses sous-catégories ?',
        },
      },
    },
  ],
  actions: [
    {
      id: 'create',
      label: 'Nouvelle catégorie',
      icon: 'plus',
      variant: 'primary',
      permission: 'demo.purchasing.category.create',
      form: { title: 'Nouvelle catégorie', fields: FORM_FIELDS },
      request: { method: 'POST' },
      success: 'Catégorie créée.',
    },
    {
      id: 'edit',
      row: true,
      label: 'Modifier',
      icon: 'pencil',
      permission: 'demo.purchasing.category.update',
      form: { title: 'Catégorie', fields: FORM_FIELDS, values: (category) => ({ ...category }) },
      request: { method: 'PUT' },
      success: 'Catégorie enregistrée.',
    },
  ],
};
