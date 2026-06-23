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
