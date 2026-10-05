package ma.nafura.platform.administration.access.service;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import java.util.List;
import java.util.Optional;
import java.util.Set;
import java.util.UUID;

import ma.nafura.platform.administration.access.api.CreateRoleRequest;
import ma.nafura.platform.administration.access.api.UpdateRoleRequest;
import ma.nafura.platform.administration.access.domain.TenantCustomRole;
import ma.nafura.platform.administration.access.domain.TenantCustomRolePermissionRepository;
import ma.nafura.platform.administration.access.domain.TenantCustomRoleRepository;
import ma.nafura.platform.administration.access.roles.DeclaredRolesSeeder;
import ma.nafura.platform.authorization.repository.TenantUserRoleRepository;
import ma.nafura.platform.authorization.service.PermissionMetadataService;
import ma.nafura.platform.authorization.service.PermissionService;
import ma.nafura.platform.framework.context.UserContext;
import ma.nafura.platform.tenancy.repository.TenantDomainRepository;
import ma.nafura.platform.tenancy.repository.TenantRepository;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.mockito.junit.jupiter.MockitoSettings;
import org.mockito.quality.Strictness;
import org.springframework.beans.factory.support.StaticListableBeanFactory;
import org.springframework.test.util.ReflectionTestUtils;
import org.springframework.web.server.ResponseStatusException;

@ExtendWith(MockitoExtension.class)
@MockitoSettings(strictness = Strictness.LENIENT)
class AccessServiceTest {

    private static final UUID TENANT = UUID.randomUUID();

    @Mock private TenantRepository tenants;
    @Mock private TenantDomainRepository domains;
    @Mock private TenantUserRoleRepository userRoles;
    @Mock private TenantCustomRoleRepository customRoles;
    @Mock private TenantCustomRolePermissionRepository customPermissions;
    @Mock private PermissionService permissionService;
    @Mock private PermissionMetadataService catalog;

    private AccessService access;

    @BeforeEach
    void setUp() {
        access = new AccessService(tenants, domains, userRoles, customRoles, customPermissions, permissionService, catalog,
                new StaticListableBeanFactory().getBeanProvider(DeclaredRolesSeeder.class));
        ReflectionTestUtils.setField(access, "customRolesEnabled", true);
        when(tenants.existsById(TENANT)).thenReturn(true);
        when(permissionService.roleExists("DEMO_LEAD")).thenReturn(true);
        when(catalog.getAllPermissionCodes()).thenReturn(List.of("demo.notes.note.read", "demo.notes.note.create", "tenant.members.read"));
        when(customRoles.save(any(TenantCustomRole.class))).thenAnswer(inv -> inv.getArgument(0));
        UserContext.setPermissions(Set.of("demo.notes.note.read", "tenant.members.read"));
    }

    @AfterEach
    void clear() {
        UserContext.setPermissions(Set.of());
    }

    @Test
    void anOrganizationRoleCannotTakeTheCodeOfADeclaredRole() {
        assertThatThrownBy(() -> access.createRole(TENANT, new CreateRoleRequest("demo_lead", "Lead", null, List.of())))
                .hasMessageContaining("declared");
        verify(customRoles, never()).save(any());
    }

    @Test
    void anAdministratorCannotGrantMoreThanTheyHave() {
        assertThatThrownBy(() -> access.createRole(TENANT, new CreateRoleRequest("JUNIOR", "Junior", null,
                List.of("demo.notes.note.read", "demo.notes.note.create"))))
                .isInstanceOf(ResponseStatusException.class)
                .hasMessageContaining("demo.notes.note.create");
        verify(customRoles, never()).save(any());
    }

    @Test
    void anOrganizationRoleNeverCarriesAnOperatorPermissionEvenFromAnOperator() {
        UserContext.setPermissions(Set.of("platform.operator.*"));
        assertThatThrownBy(() -> access.createRole(TENANT, new CreateRoleRequest("OPS", "Ops", null,
                List.of("platform.operator.organizations.create"))))
                .hasMessageContaining("granted only by the deployment");
        verify(customRoles, never()).save(any());
    }

    @Test
    void onlyKnownPermissionsCanBeGranted() {
        assertThatThrownBy(() -> access.createRole(TENANT, new CreateRoleRequest("JUNIOR", "Junior", null, List.of("anything.at.all"))))
                .hasMessageContaining("Unknown permission(s): anything.at.all");
    }

    @Test
    void anOrganizationRoleWithinTheAdministratorsPermissionsIsCreated() {
        assertThat(access.createRole(TENANT, new CreateRoleRequest("junior", "Junior", null, List.of("demo.notes.note.read"))).id())
                .isEqualTo("JUNIOR");
    }

    @Test
    void declaredRolesAreReadOnly() {
        when(customRoles.findByTenantIdAndRoleCode(TENANT, "DEMO_LEAD")).thenReturn(Optional.empty());

        assertThatThrownBy(() -> access.updateRole(TENANT, "DEMO_LEAD", new UpdateRoleRequest("X", null, List.of())))
                .hasMessageContaining("Custom role not found");
        assertThatThrownBy(() -> access.deleteRole(TENANT, "DEMO_LEAD")).hasMessageContaining("Cannot delete declared role");
    }

    @Test
    void anApplicationCanKeepOrganizationsToItsDeclaredRoles() {
        ReflectionTestUtils.setField(access, "customRolesEnabled", false);

        assertThatThrownBy(() -> access.createRole(TENANT, new CreateRoleRequest("JUNIOR", "Junior", null, List.of())))
                .isInstanceOf(ResponseStatusException.class)
                .hasMessageContaining("declared roles");
    }
}
