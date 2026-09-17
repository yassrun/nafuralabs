import assert from 'node:assert/strict';
import { createRequire } from 'node:module';
import { fileURLToPath } from 'node:url';
const require = createRequire(new URL('../../sources/web/package.json', import.meta.url));
const { build } = require('esbuild');
async function load(relative) {
  const entry = fileURLToPath(new URL(relative, import.meta.url));
  const result = await build({ entryPoints: [entry], bundle: true, write: false, platform: 'node', format: 'esm' });
  return import('data:text/javascript;base64,' + Buffer.from(result.outputFiles[0].text).toString('base64'));
}
const { wizardStepVisualState: state } = await load('../../../nafura-platform/sources/web/lib/anatomy/components/organisms/wizard-shell/wizard-step-state.util.ts');
const { CHANTIER_STATUS_BAR: bar, lifecycleStep, preparationStep, CHANTIER_PREPARATION_STEPS } = await load('../../sources/web/app/chantiers/create/chantier-workflow.config.ts');
const { chantierToUi, mapUiStatusToBackend } = await load('../../sources/web/app/chantiers/services/chantier.mapper.ts');
assert.equal(state(1, 5, [], [0]), 'upcoming', 'Consulting a future page must not complete earlier milestones');
assert.equal(state(2, 0, [], [0, 1, 2]), 'completed', 'Going back preserves validated milestones');
assert.equal(state(0, 2), 'completed', 'Existing study wizard behavior is preserved');
assert.equal(lifecycleStep('SUSPENDU'), lifecycleStep('EN_COURS'), 'Suspension stays in execution');
assert.equal(CHANTIER_PREPARATION_STEPS.length, 4, 'Preparation has cadrage, BDP, équipe, démarrage');
assert.equal(preparationStep(['cps']), 0);
assert.equal(preparationStep(['bdp_chiffre']), 1);
assert.equal(preparationStep(['responsables']), 2);
assert.equal(preparationStep(['dates_prevues']), 3);
assert.equal(lifecycleStep('CLOS'), 7, 'Closed chantier keeps the guarantees page');
for (const transition of bar.transitions) {
  assert.equal(transition.hasAccess({ status: String(transition.from), availableActions: [] }), false, 'Missing capabilities fail closed');
}
assert.equal(chantierToUi({ id: 'c', code: 'C', status: 'PRET_A_DEMARRER' }).status, 'EN_PREPARATION', 'Ready is never mapped to active');
assert.equal(chantierToUi({ id: 'c', code: 'C', status: 'EN_ATTENTE_RECEPTION_PROVISOIRE' }).lifecycleStatus, 'EN_ATTENTE_RECEPTION_PROVISOIRE');
assert.equal(mapUiStatusToBackend('ANNULE'), 'ANNULE', 'Cancellation is distinct from closure');
console.log('14 workflow assertions passed (including every transition permission).');
