/**
 * Visual state of a wizard step.
 *
 * Position is shape, not hue: completed = check, current = filled number,
 * upcoming = ghost number. Incomplete is a badge on a visited step.
 */
export type WizardStepVisualState =
  | 'upcoming'
  | 'current'
  | 'completed'
  | 'incomplete';

export function wizardStepVisualState(
  index: number,
  currentIndex: number,
  incompleteIndexes: readonly number[] = [],
): WizardStepVisualState {
  if (index === currentIndex) return 'current';
  if (index > currentIndex) return 'upcoming';
  if (incompleteIndexes.includes(index)) return 'incomplete';
  return 'completed';
}
