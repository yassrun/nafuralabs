package ma.nafura.platform.administration.iam.service;

import static org.assertj.core.api.Assertions.assertThatCode;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.Mockito.doAnswer;
import static org.mockito.Mockito.when;

import java.time.OffsetDateTime;
import java.time.ZoneOffset;
import java.util.ArrayList;
import java.util.Collection;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.UUID;
import ma.nafura.platform.administration.access.service.AccessService;
import ma.nafura.platform.authorization.domain.model.TenantUserRole;
import ma.nafura.platform.authorization.repository.TenantUserRoleRepository;
import ma.nafura.platform.identity.domain.model.AppUser;
import ma.nafura.platform.identity.repository.AppUserRepository;
import ma.nafura.platform.identity.service.AppUserProvisioningService;
import ma.nafura.platform.administration.iam.repository.TenantInvitationRepository;
import ma.nafura.platform.tenancy.domain.model.TenantMembership;
import ma.nafura.platform.tenancy.repository.TenantMembershipRepository;
import ma.nafura.platform.tenancy.repository.TenantRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.mockito.junit.jupiter.MockitoSettings;
import org.mockito.quality.Strictness;

@ExtendWith(MockitoExtension.class)
@MockitoSettings(strictness = Strictness.LENIENT)
class IamServiceLastOwnerTest {

    private static final UUID TENANT_ID = UUID.fromString("aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa");
    private static final String OWNER = "OWNER";
    private static final String MEMBER = "MEMBER";

    @Mock private TenantRepository tenantRepository;
    @Mock private AppUserRepository appUserRepository;
    @Mock private TenantMembershipRepository tenantMembershipRepository;
    @Mock private TenantUserRoleRepository tenantUserRoleRepository;
    @Mock private TenantInvitationRepository tenantInvitationRepository;
    @Mock private TenantInvitationDeliveryService tenantInvitationDeliveryService;
    @Mock private AccessService accessService;
    @Mock private MembershipAudit membershipAudit;

    private final Map<UUID, AppUser> users = new LinkedHashMap<>();
    private final Map<String, TenantMembership> memberships = new LinkedHashMap<>();
    private final List<TenantUserRole> roles = new ArrayList<>();

    private IamService iam;

    @BeforeEach
    void setUp() {
        stubRepos();
        when(accessService.roleExists(any(), anyString())).thenReturn(true);
        when(tenantUserRoleRepository.countActiveMembersWithRoleExcludingUser(any(), anyString(), any()))
                .thenAnswer(inv -> {
                    UUID tenantId = inv.getArgument(0);
                    String roleCode = inv.getArgument(1);
                    UUID excludeUserId = inv.getArgument(2);
                    return roles.stream()
                            .filter(r -> tenantId.equals(r.getTenantId()) && roleCode.equals(r.getRoleCode()))
                            .filter(r -> !excludeUserId.equals(r.getUserId()))
                            .filter(r -> {
                                TenantMembership membership = memberships.get(memKey(tenantId, r.getUserId()));
                                return membership != null
                                        && "ACTIVE".equalsIgnoreCase(membership.getStatus());
                            })
                            .count();
                });

        iam = new IamService(
                tenantRepository,
                appUserRepository,
                tenantMembershipRepository,
                tenantUserRoleRepository,
                new AppUserProvisioningService(appUserRepository),
                tenantInvitationRepository,
                tenantInvitationDeliveryService,
                accessService,
                membershipAudit);
    }

    @Test
    void suspendLastActiveOwnerIsRejected() {
        AppUser owner = seedActiveOwner("owner@example.test");

        assertThatThrownBy(() -> iam.updateMemberStatus(TENANT_ID, owner.getId(), "suspended"))
                .isInstanceOf(IllegalStateException.class)
                .hasMessage(IamService.LAST_ACTIVE_OWNER_MESSAGE);
    }

    @Test
    void suspendOwnerWhenAnotherActiveOwnerExists() {
        AppUser owner = seedActiveOwner("owner@example.test");
        AppUser coOwner = seedUser("co-owner@example.test");
        seedMembership(TENANT_ID, coOwner, "ACTIVE");
        seedRole(TENANT_ID, coOwner.getId(), OWNER);

        assertThatCode(() -> iam.updateMemberStatus(TENANT_ID, owner.getId(), "suspended"))
                .doesNotThrowAnyException();
    }

    @Test
    void removeLastActiveOwnerIsRejected() {
        AppUser owner = seedActiveOwner("owner@example.test");

        assertThatThrownBy(() -> iam.removeMember(TENANT_ID, owner.getId()))
                .isInstanceOf(IllegalStateException.class)
                .hasMessage(IamService.LAST_ACTIVE_OWNER_MESSAGE);
    }

    @Test
    void removeOwnerWhenAnotherActiveOwnerExists() {
        AppUser owner = seedActiveOwner("owner@example.test");
        AppUser coOwner = seedUser("co-owner@example.test");
        seedMembership(TENANT_ID, coOwner, "ACTIVE");
        seedRole(TENANT_ID, coOwner.getId(), OWNER);

        assertThatCode(() -> iam.removeMember(TENANT_ID, owner.getId()))
                .doesNotThrowAnyException();
    }

    @Test
    void removeSuspendedOwnerIsAllowedEvenIfOnlyOwnerRoleHolder() {
        AppUser owner = seedUser("owner@example.test");
        seedMembership(TENANT_ID, owner, "SUSPENDED");
        seedRole(TENANT_ID, owner.getId(), OWNER);

        assertThatCode(() -> iam.removeMember(TENANT_ID, owner.getId()))
                .doesNotThrowAnyException();
    }

    @Test
    void removeOwnerRoleFromLastActiveOwnerIsRejected() {
        AppUser owner = seedActiveOwner("owner@example.test");

        assertThatThrownBy(() -> iam.updateMemberRoles(TENANT_ID, owner.getId(), List.of(MEMBER)))
                .isInstanceOf(IllegalStateException.class)
                .hasMessage(IamService.LAST_ACTIVE_OWNER_MESSAGE);
    }

    @Test
    void replaceOwnerRoleWhenAnotherActiveOwnerExists() {
        AppUser owner = seedActiveOwner("owner@example.test");
        AppUser coOwner = seedUser("co-owner@example.test");
        seedMembership(TENANT_ID, coOwner, "ACTIVE");
        seedRole(TENANT_ID, coOwner.getId(), OWNER);

        assertThatCode(() -> iam.updateMemberRoles(TENANT_ID, owner.getId(), List.of(MEMBER)))
                .doesNotThrowAnyException();
    }

    private AppUser seedActiveOwner(String email) {
        AppUser owner = seedUser(email);
        seedMembership(TENANT_ID, owner, "ACTIVE");
        seedRole(TENANT_ID, owner.getId(), OWNER);
        return owner;
    }

    private AppUser seedUser(String email) {
        AppUser user = AppUser.builder()
                .id(UUID.randomUUID())
                .email(email.toLowerCase())
                .name(email.split("@")[0])
                .status("ACTIVE")
                .build();
        users.put(user.getId(), user);
        return user;
    }

    private void seedMembership(UUID tenantId, AppUser user, String status) {
        TenantMembership membership = TenantMembership.builder()
                .id(UUID.randomUUID())
                .tenantId(tenantId)
                .userId(user.getId())
                .status(status)
                .createdAt(OffsetDateTime.now(ZoneOffset.UTC))
                .build();
        memberships.put(memKey(tenantId, user.getId()), membership);
    }

    private void seedRole(UUID tenantId, UUID userId, String roleCode) {
        roles.add(TenantUserRole.builder()
                .id(UUID.randomUUID())
                .tenantId(tenantId)
                .userId(userId)
                .roleCode(roleCode)
                .build());
    }

    private static String memKey(UUID tenantId, UUID userId) {
        return tenantId + ":" + userId;
    }

    private void stubRepos() {
        when(appUserRepository.findById(any()))
                .thenAnswer(inv -> Optional.ofNullable(users.get(inv.getArgument(0))));
        when(tenantMembershipRepository.findByTenantIdAndUserId(any(), any()))
                .thenAnswer(
                        inv -> Optional.ofNullable(
                                memberships.get(memKey(inv.getArgument(0), inv.getArgument(1)))));
        when(tenantMembershipRepository.existsByTenantIdAndUserId(any(), any()))
                .thenAnswer(inv -> memberships.containsKey(memKey(inv.getArgument(0), inv.getArgument(1))));
        when(tenantMembershipRepository.save(any(TenantMembership.class)))
                .thenAnswer(inv -> inv.getArgument(0));
        doAnswer(inv -> {
                    memberships.remove(memKey(inv.getArgument(0), inv.getArgument(1)));
                    return null;
                })
                .when(tenantMembershipRepository)
                .deleteByTenantIdAndUserId(any(), any());
        when(tenantUserRoleRepository.findRoleCodesByTenantIdAndUserId(any(), any()))
                .thenAnswer(inv -> {
                    UUID tenantId = inv.getArgument(0);
                    UUID userId = inv.getArgument(1);
                    return roles.stream()
                            .filter(r -> tenantId.equals(r.getTenantId()) && userId.equals(r.getUserId()))
                            .map(TenantUserRole::getRoleCode)
                            .toList();
                });
        when(tenantUserRoleRepository.saveAll(any()))
                .thenAnswer(inv -> {
                    Iterable<TenantUserRole> saved = inv.getArgument(0);
                    for (TenantUserRole role : saved) {
                        if (role.getId() == null) {
                            role.setId(UUID.randomUUID());
                        }
                        roles.add(role);
                    }
                    return roles;
                });
        doAnswer(inv -> {
                    UUID tenantId = inv.getArgument(0);
                    UUID userId = inv.getArgument(1);
                    roles.removeIf(r -> tenantId.equals(r.getTenantId()) && userId.equals(r.getUserId()));
                    return null;
                })
                .when(tenantUserRoleRepository)
                .deleteByTenantIdAndUserId(any(), any());
        when(tenantMembershipRepository.findByTenantIdAndUserIdIn(any(), any()))
                .thenAnswer(inv -> {
                    UUID tenantId = inv.getArgument(0);
                    Collection<UUID> ids = inv.getArgument(1);
                    return memberships.values().stream()
                            .filter(m -> tenantId.equals(m.getTenantId()) && ids.contains(m.getUserId()))
                            .toList();
                });
        when(tenantUserRoleRepository.findByTenantIdAndUserIdIn(any(), any()))
                .thenAnswer(inv -> {
                    UUID tenantId = inv.getArgument(0);
                    Collection<UUID> ids = inv.getArgument(1);
                    return roles.stream()
                            .filter(r -> tenantId.equals(r.getTenantId()) && ids.contains(r.getUserId()))
                            .toList();
                });
    }
}
