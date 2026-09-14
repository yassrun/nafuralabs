import { hasRoles, resolveStatusActions } from './resolve-status-actions';
import type { StatusActionBarConfig, StatusActionContext } from '../types';

const CONFIG: StatusActionBarConfig<'DRAFT' | 'DONE', StatusActionContext> = {
  statuses: {
    DRAFT: { label: 'Brouillon', variant: 'default' },
    DONE: { label: 'Terminé', variant: 'success' },
  },
  transitions: [
    {
      from: 'DRAFT',
      to: 'DONE',
      action: 'APPROVE',
      actionLabel: 'Valider',
      variant: 'primary',
      hasAccess: hasRoles('BTP_DG'),
    },
    {
      from: 'DRAFT',
      to: 'DONE',
      action: 'REJECT',
      actionLabel: 'Refuser',
      variant: 'ghost',
      hasAccess: hasRoles('BTP_DG'),
      isVisible: (ctx) => ctx.availableActions?.includes('REJECT') !== false,
    },
  ],
  commands: [
    {
      action: 'SAVE',
      actionLabel: 'Enregistrer',
      variant: 'secondary',
      isVisible: (ctx) => (ctx as StatusActionContext & { canSave?: boolean }).canSave === true,
    },
  ],
};

describe('resolveStatusActions', () => {
  it('hides transitions when the role does not match', () => {
    const actions = resolveStatusActions(CONFIG, { status: 'DRAFT', roles: ['BTP_LECTEUR_ETUDE'] });
    expect(actions.map((a) => a.action)).toEqual([]);
  });

  it('shows matching transitions and puts primary last', () => {
    const actions = resolveStatusActions(CONFIG, { status: 'DRAFT', roles: ['BTP_DG'] });
    expect(actions.map((a) => a.action)).toEqual(['REJECT', 'APPROVE']);
    expect(actions.at(-1)?.variant).toBe('primary');
  });

  it('hides a transition when isVisible is false', () => {
    const actions = resolveStatusActions(CONFIG, {
      status: 'DRAFT',
      roles: ['BTP_DG'],
      availableActions: [],
    });
    expect(actions.map((a) => a.action)).toEqual(['APPROVE']);
  });

  it('keeps commands that are visible regardless of status', () => {
    const actions = resolveStatusActions(CONFIG, {
      status: 'DONE',
      roles: [],
      canSave: true,
    } as StatusActionContext & { canSave: boolean });
    expect(actions.map((a) => a.action)).toEqual(['SAVE']);
  });
});
