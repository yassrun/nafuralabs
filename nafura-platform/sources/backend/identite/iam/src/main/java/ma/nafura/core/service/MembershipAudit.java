package ma.nafura.platform.administration.iam.service;

import java.util.List;
import java.util.Map;
import java.util.UUID;
import java.util.function.Supplier;
import lombok.RequiredArgsConstructor;
import ma.nafura.platform.collaboration.audit.AuditActions;
import ma.nafura.platform.collaboration.audit.AuditPayloadBuilder;
import ma.nafura.platform.collaboration.audit.AuditService;
import ma.nafura.platform.framework.context.TenantContext;
import org.springframework.stereotype.Component;

/**
 * Manual audit trail for tenant membership lifecycle (not covered by {@code @Auditable} on
 * {@link ma.nafura.platform.tenancy.domain.model.TenantMembership} because updates go through IAM services).
 */
@Component
@RequiredArgsConstructor
public class MembershipAudit {

    static final String ENTITY_TYPE = "tenant-member";

    private final AuditService auditService;

    public void invited(UUID tenantId, UUID userId, String email, List<String> roles) {
        withTenant(tenantId, () -> auditService.log(
                ENTITY_TYPE,
                userId,
                AuditActions.MEMBER_INVITE,
                "Invited member " + email,
                Map.of("email", email, "roles", roles, "status", "INVITED")));
    }

    public void accepted(UUID tenantId, UUID userId, String email) {
        withTenant(tenantId, () -> auditService.log(
                ENTITY_TYPE,
                userId,
                AuditActions.MEMBER_ACCEPT,
                "Accepted invitation for " + email,
                AuditPayloadBuilder.changes(
                        Map.of("status", "INVITED"),
                        Map.of("status", "ACTIVE"),
                        "status")));
    }

    public void resent(UUID tenantId, UUID userId, String email) {
        withTenant(tenantId, () -> auditService.log(
                ENTITY_TYPE,
                userId,
                AuditActions.MEMBER_RESEND,
                "Resent invitation to " + email,
                Map.of("email", email)));
    }

    public void rolesChanged(UUID tenantId, UUID userId, String email, List<String> fromRoles, List<String> toRoles) {
        withTenant(tenantId, () -> auditService.log(
                ENTITY_TYPE,
                userId,
                AuditActions.MEMBER_ROLES,
                "Updated roles for " + email,
                AuditPayloadBuilder.changes(
                        Map.of("roles", fromRoles),
                        Map.of("roles", toRoles),
                        "roles")));
    }

    public void statusChanged(UUID tenantId, UUID userId, String email, String fromStatus, String toStatus) {
        withTenant(tenantId, () -> auditService.log(
                ENTITY_TYPE,
                userId,
                AuditActions.STATUS_CHANGE,
                "Status of tenant-member from " + fromStatus + " to " + toStatus,
                AuditPayloadBuilder.changes(
                        Map.of("status", fromStatus),
                        Map.of("status", toStatus),
                        "status")));
    }

    public void removed(UUID tenantId, UUID userId, String email, List<String> roles, String status) {
        withTenant(tenantId, () -> auditService.log(
                ENTITY_TYPE,
                userId,
                AuditActions.MEMBER_REMOVE,
                "Removed member " + email,
                Map.of("email", email, "roles", roles, "status", status)));
    }

    private void withTenant(UUID tenantId, Runnable action) {
        withTenant(tenantId, () -> {
            action.run();
            return null;
        });
    }

    private <T> T withTenant(UUID tenantId, Supplier<T> action) {
        UUID previous = TenantContext.getTenantIdOrNull();
        TenantContext.setTenantId(tenantId);
        try {
            return action.get();
        } finally {
            if (previous != null) {
                TenantContext.setTenantId(previous);
            } else {
                TenantContext.clear();
            }
        }
    }
}
