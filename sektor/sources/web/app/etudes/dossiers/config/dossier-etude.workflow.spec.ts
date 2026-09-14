import { resolveStatusActions } from '@platform/lib/anatomy';

import { DOSSIER_STATUS_BAR, type DossierStatusContext } from './dossier-etude.workflow';

function ctx(over: Partial<DossierStatusContext> = {}): DossierStatusContext {
  return {
    status: 'DRAFT',
    availableActions: [],
    actionPrincipale: 'SOUMETTRE_GO',
    peutDeciderGo: false,
    peutAccepterAffectation: false,
    peutSaisirApresGo: false,
    peutRenvoyerAffectation: false,
    chargeDejaDesigne: false,
    peutAvisExecution: false,
    chiffragePret: false,
    structureVerrouillee: false,
    modifiable: true,
    phase: 'BORDEREAU',
    exigeAvis: false,
    peutValiderFinancier: false,
    peutValiderDefinitif: false,
    ...over,
  };
}

describe('DOSSIER_STATUS_BAR', () => {
  it('shows submit on draft for a coordinator', () => {
    const actions = resolveStatusActions(DOSSIER_STATUS_BAR, ctx());
    expect(actions.map((a) => a.action)).toContain('SOUMETTRE_GO');
    expect(actions.map((a) => a.action)).not.toContain('RENVOYER_AFFECTATION');
  });

  it('shows assign + reject on pending assignment for the manager', () => {
    const actions = resolveStatusActions(
      DOSSIER_STATUS_BAR,
      ctx({ status: 'PENDING_ASSIGNMENT', peutDeciderGo: true }),
    );
    expect(actions.map((a) => a.action)).toEqual(['NO_GO', 'ARCHIVER', 'DECIDER_GO']);
  });

  it('hides manager actions for a reader', () => {
    const actions = resolveStatusActions(
      DOSSIER_STATUS_BAR,
      ctx({ status: 'PENDING_ASSIGNMENT', peutDeciderGo: false }),
    );
    expect(actions.map((a) => a.action)).toEqual([]);
  });

  it('requires chiffrage prêt before completing the study', () => {
    const blocked = resolveStatusActions(
      DOSSIER_STATUS_BAR,
      ctx({ status: 'IN_PROGRESS', peutSaisirApresGo: true, chiffragePret: false }),
    );
    expect(blocked.map((a) => a.action)).toEqual(['SUSPENDRE_CHIFFRAGE']);

    const ready = resolveStatusActions(
      DOSSIER_STATUS_BAR,
      ctx({ status: 'IN_PROGRESS', peutSaisirApresGo: true, chiffragePret: true }),
    );
    expect(ready.map((a) => a.action)).toContain('SOUMETTRE_CHIFFRAGE');
  });

  it('shows valider / refuser on financial review', () => {
    const actions = resolveStatusActions(
      DOSSIER_STATUS_BAR,
      ctx({
        status: 'COMPLETED',
        actionPrincipale: 'VALIDER_FINANCIER',
        availableActions: ['APPROVE_FINANCIALLY', 'REJECT_FINANCIALLY', 'ARCHIVE_STUDY'],
        peutValiderFinancier: true,
      }),
    );
    expect(actions.map((a) => a.action)).toEqual(['ARCHIVER', 'REFUSER', 'VALIDER_FINANCIER']);
  });

  it('hides financial approve for the execution engineer', () => {
    const withoutApi = resolveStatusActions(
      DOSSIER_STATUS_BAR,
      ctx({
        status: 'COMPLETED',
        actionPrincipale: 'VALIDER_FINANCIER',
        peutAvisExecution: true,
        peutValiderFinancier: false,
      }),
    );
    expect(withoutApi.map((a) => a.action)).not.toContain('VALIDER_FINANCIER');
    expect(withoutApi.map((a) => a.action)).not.toContain('REFUSER');

    const withApi = resolveStatusActions(
      DOSSIER_STATUS_BAR,
      ctx({
        status: 'COMPLETED',
        actionPrincipale: 'VALIDER_FINANCIER',
        availableActions: ['APPROVE_FINANCIALLY', 'REJECT_FINANCIALLY'],
        peutAvisExecution: true,
        peutValiderFinancier: false,
      }),
    );
    expect(withApi.map((a) => a.action)).toEqual([]);
  });

  it('does not put quote or outcome actions on the status bar', () => {
    const actions = resolveStatusActions(
      DOSSIER_STATUS_BAR,
      ctx({ status: 'FINAL_APPROVED', actionPrincipale: 'GENERER_DEVIS' }),
    );
    expect(actions.map((a) => a.action)).toEqual([]);
  });
});
