import type { ListingPageConfig } from '@platform/platform/listing';

/** The demo BC's only screen: pure configuration, rendered by the platform. */
export const NOTES_LISTING: ListingPageConfig = {
  title: 'Notes',
  subtitle: 'Notes partagées de l’équipe',
  icon: 'file-text',
  endpoint: '/api/v1/demo/notes',
  emptyMessage: 'Aucune note pour le moment.',
  views: [{ id: 'all', label: 'Toutes', layout: 'table', show: ['title'] }],
  actions: [
    {
      id: 'create',
      label: 'Nouvelle note',
      icon: 'plus',
      variant: 'primary',
      permission: 'demo.notes.note.create',
      form: { title: 'Nouvelle note', fields: [{ key: 'title', field: 'title', label: 'Titre', type: 'text', required: true, validation: { maxLength: 200 } }] },
      request: { method: 'POST' },
      success: 'Note ajoutée.',
    },
    {
      id: 'delete',
      row: true,
      label: 'Supprimer',
      icon: 'trash-2',
      variant: 'danger',
      permission: 'demo.notes.note.delete',
      confirm: { title: 'Supprimer la note', message: 'Cette note sera définitivement supprimée.', confirmLabel: 'Supprimer', danger: true },
      request: { method: 'DELETE' },
      success: 'Note supprimée.',
    },
  ],
};
