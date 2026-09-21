/** Where Back / Next (or Submit) are rendered. */
export type WizardActionsPlacement = 'footer' | 'stepper';

/**
 * Wizard step definition.
 */
export interface WizardStepConfig {
  id: string;
  label: string;
  icon?: string;
  /** Optional description for a11y */
  description?: string;
}
