import { InvitationApiService } from './invitation-api.service';

describe('InvitationApiService', () => {
  it('maps preview response', async () => {
    const service = Object.create(InvitationApiService.prototype) as InvitationApiService;
    (service as unknown as { get: jasmine.Spy }).get = jasmine
      .createSpy('get')
      .and.resolveTo({
        tenantId: 'tenant-1',
        tenantKey: 'acme',
        tenantName: 'Acme',
        email: 'user@example.com',
        requiresAccountSetup: true,
        alreadyAccepted: false,
        expiresAt: '2026-01-01T00:00:00Z',
      });

    const preview = await service.preview('token-abc');
    expect(preview.tenantName).toBe('Acme');
    expect(preview.requiresAccountSetup).toBeTrue();
  });
});
