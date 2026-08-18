package ma.nafura.platform.administration.iam;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyBoolean;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.Mockito.doAnswer;
import static org.mockito.Mockito.when;

import com.fasterxml.jackson.databind.ObjectMapper;
import java.time.OffsetDateTime;
import java.time.ZoneOffset;
import java.util.ArrayList;
import java.util.Collection;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.Objects;
import java.util.Optional;
import java.util.UUID;
import ma.nafura.platform.administration.iam.api.request.publicapi.AcceptInvitationRequest;
import ma.nafura.platform.administration.iam.api.request.tenant.InviteMemberRequest;
import ma.nafura.platform.administration.iam.api.response.publicapi.InvitationAcceptResponse;
import ma.nafura.platform.administration.iam.api.response.tenant.MemberListResponse;
import ma.nafura.platform.administration.iam.api.response.tenant.TenantMemberResponse;
import ma.nafura.platform.administration.iam.domain.model.TenantInvitation;
import ma.nafura.platform.administration.iam.repository.TenantCustomRolePermissionRepository;
import ma.nafura.platform.administration.iam.repository.TenantCustomRoleRepository;
import ma.nafura.platform.administration.iam.repository.TenantInvitationRepository;
import ma.nafura.platform.administration.iam.service.IamService;
import ma.nafura.platform.administration.iam.service.InvitationAcceptService;
import ma.nafura.platform.administration.iam.service.InvitationTokenService;
import ma.nafura.platform.administration.iam.service.TenantInvitationDeliveryService;
import ma.nafura.platform.administration.iam.service.port.InvitationEmailPort;
import ma.nafura.platform.authorization.domain.model.TenantUserRole;
import ma.nafura.platform.authorization.repository.TenantUserRoleRepository;
import ma.nafura.platform.authorization.service.PermissionService;
import ma.nafura.platform.identity.domain.model.AppUser;
import ma.nafura.platform.identity.repository.AppUserRepository;
import ma.nafura.platform.identity.service.AppUserProvisioningService;
import ma.nafura.platform.identity.service.port.IdentityKeycloakProvisioningPort;
import ma.nafura.platform.tenancy.domain.model.Tenant;
import ma.nafura.platform.tenancy.domain.model.TenantMembership;
import ma.nafura.platform.tenancy.repository.TenantDomainRepository;
import ma.nafura.platform.tenancy.repository.TenantMembershipRepository;
import ma.nafura.platform.tenancy.repository.TenantRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.mockito.junit.jupiter.MockitoSettings;
import org.mockito.quality.Strictness;
import org.springframework.data.domain.PageImpl;
import org.springframework.data.domain.Pageable;
import org.springframework.test.util.ReflectionTestUtils;

/**
 * CH-00-INIT-identite · baseline comportement actuel (AC-3).
 * État initial : tenants A/B, email d'invite {@code invitee-a@example.test}, IdP non branché.
 */
@ExtendWith(MockitoExtension.class)
@MockitoSettings(strictness = Strictness.LENIENT)
class IdentiteBaselineTest {

    private static final UUID TENANT_A = UUID.fromString("aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa");
    private static final UUID TENANT_B = UUID.fromString("bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb");
    private static final String EMAIL_M = "member-m@example.test";
    private static final String EMAIL_INVITE = "invitee-a@example.test";
    private static final String ROLE_A = "OWNER";

    @Mock private TenantRepository tenantRepository;
    @Mock private AppUserRepository appUserRepository;
    @Mock private TenantMembershipRepository tenantMembershipRepository;
    @Mock private TenantDomainRepository tenantDomainRepository;
    @Mock private TenantUserRoleRepository tenantUserRoleRepository;
    @Mock private TenantCustomRoleRepository tenantCustomRoleRepository;
    @Mock private TenantCustomRolePermissionRepository tenantCustomRolePermissionRepository;
    @Mock private PermissionService permissionService;
    @Mock private TenantInvitationRepository tenantInvitationRepository;
    @Mock private TenantInvitationDeliveryService tenantInvitationDeliveryService;
    @Mock private IdentityKeycloakProvisioningPort keycloakProvisioningPort;
    @Mock private InvitationEmailPort invitationEmailPort;

    private final Map<UUID, AppUser> users = new LinkedHashMap<>();
    private final Map<String, TenantMembership> memberships = new LinkedHashMap<>();
    private final List<TenantUserRole> roles = new ArrayList<>();
    private final Map<UUID, TenantInvitation> invitationsByJti = new LinkedHashMap<>();
    private final Map<UUID, Tenant> tenants = new LinkedHashMap<>();

    private IamService iam;
    private InvitationAcceptService accept;
    private InvitationTokenService tokens;

    @BeforeEach
    void setUp() {
        stubRepos();
        when(permissionService.getAllRoleCodes()).thenReturn(List.of(ROLE_A));
        when(tenantCustomRoleRepository.findByTenantIdOrderByRoleCode(any())).thenReturn(List.of());
        when(tenantInvitationDeliveryService.createAndSendInvitation(any(), any(), any(), any(), any()))
                .thenReturn("FAILED");
        when(keycloakProvisioningPort.isEnabled()).thenReturn(false);

        tokens = new InvitationTokenService(new ObjectMapper());
        ReflectionTestUtils.setField(tokens, "tokenSecret", "test-invitation-secret-key-32chars-min");
        ReflectionTestUtils.setField(tokens, "expiryDays", 7L);

        iam = new IamService(
                tenantRepository,
                appUserRepository,
                tenantMembershipRepository,
                tenantDomainRepository,
                tenantUserRoleRepository,
                tenantCustomRoleRepository,
                tenantCustomRolePermissionRepository,
                new AppUserProvisioningService(appUserRepository),
                permissionService,
                tenantInvitationRepository,
                tenantInvitationDeliveryService);
        accept = new InvitationAcceptService(
                tokens,
                tenantInvitationRepository,
                tenantMembershipRepository,
                tenantRepository,
                appUserRepository,
                keycloakProvisioningPort,
                invitationEmailPort);

        seedTenant(TENANT_A, "tenant-a", "Tenant A", "admin-a@example.test");
        seedTenant(TENANT_B, "tenant-b", "Tenant B", "admin-b@example.test");
        AppUser adminA = seedUser("admin-a@example.test");
        AppUser adminB = seedUser("admin-b@example.test");
        seedMembership(TENANT_A, adminA, "ACTIVE");
        seedMembership(TENANT_B, adminB, "ACTIVE");
        seedRole(TENANT_A, adminA.getId(), ROLE_A);
        seedRole(TENANT_B, adminB.getId(), ROLE_A);
    }

    @Test
    void deuxTenants() {
        AppUser memberM = seedUser(EMAIL_M);
        seedMembership(TENANT_A, memberM, "ACTIVE");
        seedRole(TENANT_A, memberM.getId(), ROLE_A);

        MemberListResponse listedA = iam.getMembers(TENANT_A, 1, 20, null, null, null, "email", "asc");
        MemberListResponse listedB = iam.getMembers(TENANT_B, 1, 20, null, null, null, "email", "asc");

        assertThat(listedA.items()).extracting(TenantMemberResponse::email).contains(EMAIL_M);
        assertThat(iam.getMember(TENANT_A, memberM.getId()).email()).isEqualTo(EMAIL_M);
        assertThat(listedB.items()).extracting(TenantMemberResponse::email).doesNotContain(EMAIL_M);
        assertThatThrownBy(() -> iam.getMember(TENANT_B, memberM.getId()))
                .isInstanceOf(IllegalArgumentException.class)
                .hasMessage("Member not found");
        assertThatThrownBy(() -> iam.removeMember(TENANT_B, memberM.getId()))
                .isInstanceOf(IllegalArgumentException.class)
                .hasMessage("Member not found");
    }

    @Test
    void inviterMembre() {
        TenantMemberResponse invited =
                iam.inviteMember(TENANT_A, new InviteMemberRequest(EMAIL_INVITE, List.of(ROLE_A), null));

        assertThat(invited.status()).isEqualTo("invited");
        assertThat(invited.email()).isEqualTo(EMAIL_INVITE);
        assertThatThrownBy(
                        () -> iam.inviteMember(
                                TENANT_A, new InviteMemberRequest(EMAIL_INVITE, List.of(ROLE_A), null)))
                .isInstanceOf(IllegalArgumentException.class)
                .hasMessage("User already exists in this tenant");

        TenantMemberResponse invitedB =
                iam.inviteMember(TENANT_B, new InviteMemberRequest(EMAIL_INVITE, List.of(ROLE_A), null));
        assertThat(invitedB.userId()).isEqualTo(invited.userId());
        assertThat(invitedB.status()).isEqualTo("invited");
    }

    @Test
    void accepterInvitation() {
        AppUser invitee = seedUser(EMAIL_INVITE);
        TenantMembership membership = seedMembership(TENANT_A, invitee, "INVITED");
        seedRole(TENANT_A, invitee.getId(), ROLE_A);
        InvitationTokenService.GeneratedToken generated =
                tokens.generateInviteToken(TENANT_A, EMAIL_INVITE, List.of(ROLE_A));
        seedInvitation(TENANT_A, invitee.getId(), EMAIL_INVITE, generated);

        InvitationAcceptResponse first =
                accept.accept(new AcceptInvitationRequest(generated.token(), null, null, null));
        assertThat(membership.getStatus()).isEqualTo("ACTIVE");
        assertThat(first.alreadyAccepted()).isFalse();
        assertThat(first.loginRequired()).isTrue();

        InvitationAcceptResponse second =
                accept.accept(new AcceptInvitationRequest(generated.token(), null, null, null));
        assertThat(second.alreadyAccepted()).isTrue();
        assertThat(membership.getStatus()).isEqualTo("ACTIVE");

        assertThatThrownBy(
                        () -> accept.accept(new AcceptInvitationRequest("not-a-token", null, null, null)))
                .isInstanceOf(IllegalArgumentException.class)
                .hasMessage("INVALID_OR_EXPIRED_INVITATION");
    }

    @Test
    void retirerMembre() {
        AppUser member = seedUser(EMAIL_INVITE);
        seedMembership(TENANT_A, member, "INVITED");
        seedRole(TENANT_A, member.getId(), ROLE_A);

        iam.removeMember(TENANT_A, member.getId());

        assertThat(tenantMembershipRepository.existsByTenantIdAndUserId(TENANT_A, member.getId()))
                .isFalse();
        assertThat(appUserRepository.findById(member.getId())).isPresent();
    }

    private AppUser seedUser(String email) {
        return users.values().stream()
                .filter(u -> u.getEmail().equalsIgnoreCase(email))
                .findFirst()
                .orElseGet(
                        () -> {
                            AppUser user = AppUser.builder()
                                    .id(UUID.randomUUID())
                                    .email(email.toLowerCase())
                                    .name(email.split("@")[0])
                                    .status("ACTIVE")
                                    .build();
                            users.put(user.getId(), user);
                            return user;
                        });
    }

    private TenantMembership seedMembership(UUID tenantId, AppUser user, String status) {
        TenantMembership membership = TenantMembership.builder()
                .id(UUID.randomUUID())
                .tenantId(tenantId)
                .userId(user.getId())
                .status(status)
                .createdAt(OffsetDateTime.now(ZoneOffset.UTC))
                .build();
        memberships.put(memKey(tenantId, user.getId()), membership);
        return membership;
    }

    private void seedRole(UUID tenantId, UUID userId, String roleCode) {
        roles.add(TenantUserRole.builder()
                .id(UUID.randomUUID())
                .tenantId(tenantId)
                .userId(userId)
                .roleCode(roleCode)
                .build());
    }

    private void seedTenant(UUID id, String key, String name, String ownerEmail) {
        Tenant tenant = Tenant.builder()
                .id(id)
                .key(key)
                .name(name)
                .ownerEmail(ownerEmail)
                .applicationId("app")
                .build();
        tenants.put(id, tenant);
    }

    private void seedInvitation(
            UUID tenantId, UUID userId, String email, InvitationTokenService.GeneratedToken generated) {
        TenantInvitation invitation = TenantInvitation.builder()
                .id(UUID.randomUUID())
                .tenantId(tenantId)
                .userId(userId)
                .email(email.toLowerCase())
                .tokenJti(generated.jti())
                .status(TenantInvitation.STATUS_PENDING)
                .expiresAt(OffsetDateTime.ofInstant(generated.expiresAt(), ZoneOffset.UTC))
                .build();
        invitationsByJti.put(generated.jti(), invitation);
    }

    private static String memKey(UUID tenantId, UUID userId) {
        return tenantId + ":" + userId;
    }

    private void stubRepos() {
        when(appUserRepository.save(any(AppUser.class)))
                .thenAnswer(
                        inv -> {
                            AppUser user = inv.getArgument(0);
                            if (user.getId() == null) {
                                user.setId(UUID.randomUUID());
                            }
                            users.put(user.getId(), user);
                            return user;
                        });
        when(appUserRepository.findById(any()))
                .thenAnswer(inv -> Optional.ofNullable(users.get(inv.getArgument(0))));
        when(appUserRepository.findByEmailIgnoreCase(anyString()))
                .thenAnswer(
                        inv -> {
                            String email = inv.getArgument(0);
                            return users.values().stream()
                                    .filter(u -> u.getEmail().equalsIgnoreCase(email))
                                    .findFirst();
                        });
        when(appUserRepository.searchMembers(
                        any(), anyBoolean(), any(), anyBoolean(), any(), anyBoolean(), any(), any()))
                .thenAnswer(
                        inv -> {
                            UUID tenantId = inv.getArgument(0);
                            Pageable pageable = inv.getArgument(7);
                            List<AppUser> found = memberships.values().stream()
                                    .filter(m -> tenantId.equals(m.getTenantId()))
                                    .map(m -> users.get(m.getUserId()))
                                    .filter(Objects::nonNull)
                                    .toList();
                            return new PageImpl<>(found, pageable, found.size());
                        });

        when(tenantMembershipRepository.save(any(TenantMembership.class)))
                .thenAnswer(
                        inv -> {
                            TenantMembership membership = inv.getArgument(0);
                            if (membership.getId() == null) {
                                membership.setId(UUID.randomUUID());
                            }
                            memberships.put(memKey(membership.getTenantId(), membership.getUserId()), membership);
                            return membership;
                        });
        when(tenantMembershipRepository.findByTenantIdAndUserId(any(), any()))
                .thenAnswer(
                        inv -> Optional.ofNullable(
                                memberships.get(memKey(inv.getArgument(0), inv.getArgument(1)))));
        when(tenantMembershipRepository.existsByTenantIdAndUserId(any(), any()))
                .thenAnswer(inv -> memberships.containsKey(memKey(inv.getArgument(0), inv.getArgument(1))));
        when(tenantMembershipRepository.existsByTenantIdAndEmail(any(), anyString()))
                .thenAnswer(
                        inv -> {
                            UUID tenantId = inv.getArgument(0);
                            String email = inv.getArgument(1);
                            return memberships.values().stream()
                                    .filter(m -> tenantId.equals(m.getTenantId()))
                                    .map(m -> users.get(m.getUserId()))
                                    .filter(Objects::nonNull)
                                    .anyMatch(u -> u.getEmail().equalsIgnoreCase(email));
                        });
        when(tenantMembershipRepository.findByTenantIdAndUserIdIn(any(), any()))
                .thenAnswer(
                        inv -> {
                            UUID tenantId = inv.getArgument(0);
                            Collection<UUID> ids = inv.getArgument(1);
                            return memberships.values().stream()
                                    .filter(m -> tenantId.equals(m.getTenantId()) && ids.contains(m.getUserId()))
                                    .toList();
                        });
        doAnswer(
                        inv -> {
                            memberships.remove(memKey(inv.getArgument(0), inv.getArgument(1)));
                            return null;
                        })
                .when(tenantMembershipRepository)
                .deleteByTenantIdAndUserId(any(), any());

        when(tenantUserRoleRepository.saveAll(any()))
                .thenAnswer(
                        inv -> {
                            Iterable<TenantUserRole> saved = inv.getArgument(0);
                            for (TenantUserRole role : saved) {
                                if (role.getId() == null) {
                                    role.setId(UUID.randomUUID());
                                }
                                roles.add(role);
                            }
                            return roles;
                        });
        when(tenantUserRoleRepository.findRoleCodesByTenantIdAndUserId(any(), any()))
                .thenAnswer(
                        inv -> {
                            UUID tenantId = inv.getArgument(0);
                            UUID userId = inv.getArgument(1);
                            return roles.stream()
                                    .filter(r -> tenantId.equals(r.getTenantId()) && userId.equals(r.getUserId()))
                                    .map(TenantUserRole::getRoleCode)
                                    .toList();
                        });
        when(tenantUserRoleRepository.findByTenantIdAndUserIdIn(any(), any()))
                .thenAnswer(
                        inv -> {
                            UUID tenantId = inv.getArgument(0);
                            Collection<UUID> ids = inv.getArgument(1);
                            return roles.stream()
                                    .filter(r -> tenantId.equals(r.getTenantId()) && ids.contains(r.getUserId()))
                                    .toList();
                        });
        doAnswer(
                        inv -> {
                            UUID tenantId = inv.getArgument(0);
                            UUID userId = inv.getArgument(1);
                            roles.removeIf(r -> tenantId.equals(r.getTenantId()) && userId.equals(r.getUserId()));
                            return null;
                        })
                .when(tenantUserRoleRepository)
                .deleteByTenantIdAndUserId(any(), any());

        when(tenantInvitationRepository.save(any(TenantInvitation.class)))
                .thenAnswer(
                        inv -> {
                            TenantInvitation invitation = inv.getArgument(0);
                            if (invitation.getId() == null) {
                                invitation.setId(UUID.randomUUID());
                            }
                            invitationsByJti.put(invitation.getTokenJti(), invitation);
                            return invitation;
                        });
        when(tenantInvitationRepository.findByTokenJti(any()))
                .thenAnswer(inv -> Optional.ofNullable(invitationsByJti.get(inv.getArgument(0))));
        when(tenantInvitationRepository.findFirstByTenantIdAndUserIdAndStatusOrderByCreatedAtDesc(
                        any(), any(), any()))
                .thenAnswer(
                        inv -> {
                            UUID tenantId = inv.getArgument(0);
                            UUID userId = inv.getArgument(1);
                            String status = inv.getArgument(2);
                            return invitationsByJti.values().stream()
                                    .filter(i -> tenantId.equals(i.getTenantId())
                                            && userId.equals(i.getUserId())
                                            && status.equals(i.getStatus()))
                                    .findFirst();
                        });

        when(tenantRepository.findById(any()))
                .thenAnswer(inv -> Optional.ofNullable(tenants.get(inv.getArgument(0))));
    }
}
