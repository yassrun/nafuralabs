import { AiPanelService, componentForSlot } from '@platform/platform/app-shell';

describe('chrome widgets', () => {
  describe('AiPanelService', () => {
    beforeEach(() => {
      localStorage.removeItem('shell.aiPanel.open');
    });

    it('toggles and persists open state', () => {
      const panel = new AiPanelService();
      expect(panel.open()).toBe(false);

      panel.toggle();
      expect(panel.open()).toBe(true);
      expect(localStorage.getItem('shell.aiPanel.open')).toBe('1');

      panel.toggle();
      expect(panel.open()).toBe(false);
      expect(localStorage.getItem('shell.aiPanel.open')).toBe('0');
    });

    it('does not toggle when the feature is disabled', () => {
      const panel = new AiPanelService();
      panel.toggle(false);
      expect(panel.open()).toBe(false);
    });

    it('closes when conversation options disable the feature', () => {
      const panel = new AiPanelService();
      panel.setOpen(true);
      panel.syncFromOptions({ enabled: false });
      expect(panel.open()).toBe(false);
    });
  });

  describe('componentForSlot', () => {
    class SampleWidget {}

    it('returns the first component registered for a chrome slot', () => {
      expect(
        componentForSlot(
          [{ slot: 'header-ai', component: SampleWidget }],
          'header-ai',
        ),
      ).toBe(SampleWidget);
    });

    it('returns null when the app did not override the slot', () => {
      expect(componentForSlot([], 'sidebar-user-menu')).toBeNull();
      expect(componentForSlot(null, 'header-notifications')).toBeNull();
    });
  });
});
