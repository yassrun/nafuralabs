import type { ListingPageConfig } from '@platform/platform/listing';
import type { RecordPageConfig } from '@platform/platform/record';

const PROJECTS = '/api/v1/demo/projects';
const route = (id: string) => `/demo/projects/${id}`;

export const PROJECTS_LISTING: ListingPageConfig = {
  title: 'Projets',
  subtitle: 'De l’étude à la clôture',
  icon: 'hard-hat',
  endpoint: PROJECTS,
  quickFilters: [{ property: 'city' }],
  views: [
    { id: 'all', label: 'Tous', layout: 'table', show: ['name', 'client', 'city', 'budget', 'progress', 'status'], footer: { budget: 'sum' } },
    { id: 'steps', label: 'Étapes', layout: 'board', groupBy: 'status', hide: ['CLOSED'], card: ['name', 'client', 'budget'] },
    {
      id: 'quote',
      label: 'En devis',
      layout: 'table',
      filter: { status: { in: ['QUOTE', 'VALIDATION'] } },
      show: ['name', 'client', 'quoteAmount', 'quoteDate', 'status'],
    },
    { id: 'starts', label: 'Démarrages', layout: 'calendar', date: 'startDate', card: ['name', 'client'] },
  ],
  emptyState: { icon: 'hard-hat', title: 'Aucun projet', message: 'Un projet commence par une étude.' },
  open: (project) => route(String(project['id'])),
  actions: [{ id: 'create', label: 'Nouveau projet', icon: 'plus', variant: 'primary', permission: 'demo.projects.project.create', route: '/demo/projects/new' }],
};

/** A lifecycle as steps: each step opens with its status, the next one unlocks with the transition. */
export const PROJECT_RECORD: RecordPageConfig = {
  title: (project) => String(project['name']),
  subtitle: (project) => [project['client'], project['city']].filter(Boolean).join(' · '),
  createTitle: 'Nouveau projet',
  icon: 'hard-hat',
  endpoint: PROJECTS,
  back: { label: 'Projets', route: '/demo/projects' },
  route,
  lifecycle: true,
  permissions: { create: 'demo.projects.project.create', update: 'demo.projects.project.update', delete: 'demo.projects.project.delete' },
  layout: {
    kind: 'steps',
    steps: [
      {
        id: 'study',
        label: 'Étude',
        states: ['STUDY'],
        sections: [
          {
            title: 'Projet',
            fields: [
              { key: 'name', field: 'name', label: 'Nom du projet', type: 'text', required: true },
              { key: 'client', field: 'client', label: 'Client', type: 'text', required: true },
              { key: 'city', field: 'city', label: 'Ville', type: 'text' },
              { key: 'budget', field: 'budget', label: 'Budget estimé (MAD)', type: 'number', validation: { min: 0 } },
              { key: 'description', field: 'description', label: 'Description', type: 'richtext', toolbar: 'full', wide: true },
            ],
          },
          {
            title: 'Étude',
            description: 'Budget et étude sont demandés pour passer au devis.',
            fields: [{ key: 'studyNotes', field: 'studyNotes', label: 'Conclusions de l’étude', type: 'textarea' }],
          },
        ],
      },
      {
        id: 'quote',
        label: 'Devis',
        states: ['QUOTE', 'VALIDATION'],
        sections: [
          {
            title: 'Devis',
            description: 'Au-delà de 100 000 MAD, le lancement est validé par un responsable.',
            fields: [
              { key: 'quoteAmount', field: 'quoteAmount', label: 'Montant du devis (MAD)', type: 'number', validation: { min: 0 } },
              { key: 'quoteDate', field: 'quoteDate', label: 'Date du devis', type: 'date' },
              { key: 'startDate', field: 'startDate', label: 'Démarrage prévu', type: 'date' },
            ],
          },
        ],
      },
      {
        id: 'execution',
        label: 'Réalisation',
        states: ['EXECUTION'],
        sections: [
          {
            title: 'Avancement',
            fields: [{ key: 'progress', field: 'progress', label: 'Avancement (%)', type: 'number', validation: { min: 0, max: 100 } }],
          },
        ],
      },
      {
        id: 'closing',
        label: 'Clôture',
        states: ['CLOSED'],
        sections: [
          {
            title: 'Clôture',
            description: 'Le bilan est demandé pour clôturer.',
            fields: [{ key: 'closingNotes', field: 'closingNotes', label: 'Bilan du projet', type: 'textarea' }],
          },
        ],
      },
    ],
  },
  messages: { created: 'Projet créé.', saved: 'Projet enregistré.', deleted: 'Projet supprimé.' },
};
