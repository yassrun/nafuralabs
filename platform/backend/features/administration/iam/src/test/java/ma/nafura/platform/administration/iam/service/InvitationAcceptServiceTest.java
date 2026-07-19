package ma.nafura.platform.administration.iam.service;

import ma.nafura.platform.administration.iam.api.request.publicapi.AcceptInvitationRequest;
import ma.nafura.platform.administration.iam.api.response.publicapi.InvitationAcceptResponse;
import ma.nafura.platform.administration.iam.domain.model.TenantInvitation;
import ma.nafura.platform.administration.iam.repository.TenantInvitationRepository;
import ma.nafura.platform.administration.iam.service.port.InvitationEmailPort;
import ma.nafura.platform.identity.domain.model.AppUser;
import ma.nafura.platform.identity.repository.AppUserRepository;
import ma.nafura.platform.identity.service.port.IdentityKeycloakProvisioningPort;
import ma.nafura.platform.tenancy.domain.model.Tenant;
import ma.nafura.platform.tenancy.domain.model.TenantMembership;
import ma.nafura.platform.tenancy.repository.TenantMembershipRepository;
import ma.nafura.platform.tenancy.repository.TenantRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.time.OffsetDateTime;
import java.time.ZoneOffset;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class InvitationAcceptServiceTest {

    @Mock private InvitationTokenService invitationTokenService;
    @Mock private TenantInvitationRepository tenantInvitationRepository;
    @Mock private TenantMembershipRepository tenantMembershipRepository;
    @Mock private TenantRepository tenantRepository;
    @Mock private AppUserRepository appUserRepository;
    @Mock private IdentityKeycloakProvisioningPort keycloakProvisioningPort;
    @Mock private InvitationEmailPort invitationEmailPort;

    @InjectMocks private InvitationAcceptService invitationAcceptService;

    private UUID tenantId;
    private UUID userId;
    private UUID jti;
    private String email;

    @BeforeEach
    void setUp() {
        tenantId = UUID.randomUUID();
        userId = UUID.randomUUID();
        jti = UUID.randomUUID();
        email = "invitee@example.com";
    }

    @Test
    void accept_existingKeycloakUser_activatesMembership() {
        String token = "signed.token";
        TenantInvitation invitation = pendingInvitation();
        Tenant tenant = tenant();
        TenantMembership membership = invitedMembership();
        AppUser user = AppUser.builder().id(userId).email(email).name("Invitee").build();

        when(invitationTokenService.validateToken(token)).thenReturn(
            new InvitationTokenService.InviteTokenPayload(
                tenantId, email, List.of("MEMBER"), jti, OffsetDateTime.now(ZoneOffset.UTC).plusDays(1).toInstant()
            )
        );
        when(tenantInvitationRepository.findByTokenJti(jti)).thenReturn(Optional.of(invitation));
        when(tenantRepository.findById(tenantId)).thenReturn(Optional.of(tenant));
        when(tenantMembershipRepository.findByTenantIdAndUserId(tenantId, userId)).thenReturn(Optional.of(membership));
        when(appUserRepository.findById(userId)).thenReturn(Optional.of(user));
        when(appUserRepository.findByEmailIgnoreCase(email)).thenReturn(Optional.of(user));
        when(keycloakProvisioningPort.isEnabled()).thenReturn(true);
        when(keycloakProvisioningPort.userExists(email)).thenReturn(true);

        InvitationAcceptResponse response = invitationAcceptService.accept(new AcceptInvitationRequest(token, null, null, null));

        assertThat(response.loginRequired()).isTrue();
        assertThat(membership.getStatus()).isEqualTo("ACTIVE");
        assertThat(invitation.getStatus()).isEqualTo(TenantInvitation.STATUS_ACCEPTED);
        verify(tenantMembershipRepository).save(membership);
    }

    private TenantInvitation pendingInvitation() {
        return TenantInvitation.builder()
            .id(UUID.randomUUID())
            .tenantId(tenantId)
            .userId(userId)
            .email(email)
            .tokenJti(jti)
            .status(TenantInvitation.STATUS_PENDING)
            .expiresAt(OffsetDateTime.now(ZoneOffset.UTC).plusDays(7))
            .build();
    }

    private Tenant tenant() {
        Tenant tenant = new Tenant();
        tenant.setId(tenantId);
        tenant.setKey("acme");
        tenant.setName("Acme");
        return tenant;
    }

    private TenantMembership invitedMembership() {
        return TenantMembership.builder()
            .tenantId(tenantId)
            .userId(userId)
            .status("INVITED")
            .build();
    }
}
