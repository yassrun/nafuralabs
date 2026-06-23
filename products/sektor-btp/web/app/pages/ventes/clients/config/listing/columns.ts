import type { BadgeVariant, ColumnConfig } from '@lib/anatomy/types';

export const COLUMNS: ColumnConfig[] = [
  { key: 'code', label: 'Code', field: 'code', type: 'text', sortable: true, width: '120px' },
  { key: 'nom', label: 'Client', field: 'nom', type: 'text', sortable: true },
  {
    key: 'type', label: 'Forme', field: 'type', type: 'badge', sortable: true, width: '130px',
    badgeVariant: (v: unknown) => {
      const map: Record<string, BadgeVariant> = {
        SA: 'info', SARL: 'info', SAS: 'info',
        Particulier: 'default', Administration: 'info', Cooperative: 'default',
      };
      return map[String(v)] ?? 'default';
    },
  },
  { key: 'ville', label: 'Ville', field: 'ville', type: 'text', sortable: true, width: '150px' },
  { key: 'ice', label: 'ICE', field: 'ice', type: 'text', width: '160px', transform: (v) => String(v ?? '—') },
  { key: 'telephone', label: 'Tél.', field: 'telephone', type: 'text', width: '140px', transform: (v) => String(v ?? '—') },
  { key: 'email', label: 'Email', field: 'email', type: 'text', transform: (v) => String(v ?? '—') },
  {
    key: 'actif', label: 'Actif', field: 'actif', type: 'badge', sortable: true, width: '90px',
    transform: (v) => v ? 'Actif' : 'Inactif',
    badgeVariant: (v) => v ? 'success' : 'default',
  },
];
