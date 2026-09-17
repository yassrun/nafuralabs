import { wizardStepVisualState } from './wizard-step-state.util';

describe('wizardStepVisualState', () => {
  it('does not mark consulted steps complete when explicit milestones are supplied', () => {
    expect(wizardStepVisualState(1, 5, [], [0])).toBe('upcoming');
    expect(wizardStepVisualState(0, 5, [], [0])).toBe('completed');
  });
  it('retains completed milestones when navigating back', () => {
    expect(wizardStepVisualState(2, 0, [], [0, 1, 2])).toBe('completed');
  });
  it('marks the current index as current', () => {
    expect(wizardStepVisualState(1, 1, [0])).toBe('current');
  });

  it('marks later indexes as upcoming even if listed incomplete', () => {
    expect(wizardStepVisualState(2, 1, [2])).toBe('upcoming');
  });

  it('marks earlier indexes as completed by default', () => {
    expect(wizardStepVisualState(0, 2)).toBe('completed');
  });

  it('marks a visited incomplete index with the badge state', () => {
    expect(wizardStepVisualState(2, 3, [2])).toBe('incomplete');
  });
});
