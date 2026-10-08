package ma.nafura.platform.administration.iam.api.controller;

import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.UUID;

import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import ma.nafura.platform.administration.iam.api.request.tenant.BulkMemberRoleRequest;
import ma.nafura.platform.administration.iam.api.request.tenant.InviteMemberRequest;
import ma.nafura.platform.administration.iam.api.response.publicapi.ResendInvitationResponse;
import ma.nafura.platform.administration.iam.api.response.tenant.MemberListResponse;
import ma.nafura.platform.administration.iam.api.response.tenant.TenantMemberResponse;
import ma.nafura.platform.administration.iam.service.IamService;
import ma.nafura.platform.authorization.security.authorization.RequirePermission;
import ma.nafura.platform.authorization.security.authorization.SecuredResource;
import ma.nafura.platform.framework.context.TenantContext;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageImpl;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.server.ResponseStatusException;

/**
 * Record-compatible members API for {@code nf-listing-page} / {@code nf-record-page}.
 * {@code id} is the user id. Create is invite ({@code POST /invite}); {@code PUT} updates roles.
 */
@RestController
@RequestMapping("/api/v1/platform/admin/members")
@SecuredResource(module = "tenant", resource = "admin")
@RequiredArgsConstructor
public class PlatformAdminMembersController {

    private final IamService iam;

    @GetMapping("/properties")
    @RequirePermission(value = "tenant.members.read", fullPermission = true)
    public Map<String, Object> properties() {
        Map<String, Object> props = new LinkedHashMap<>();
        props.put("email", Map.of("label", "E-mail", "filterable", true, "sortable", true));
        props.put("displayName", Map.of("label", "Nom", "filterable", true, "sortable", true));
        props.put("status", Map.of(
                "label", "Statut",
                "type", "select",
                "options", List.of("active", "invited", "suspended"),
                "filterable", true));
        props.put("roleIds", Map.of("label", "Rôles", "type", "select", "filterable", true));
        props.put("joinedAt", Map.of("label", "Rejoint le", "type", "date", "sortable", true));
        props.put("lastActivityAt", Map.of("label", "Dernière activité", "type", "date", "sortable", true));
        props.put("invitationEmailStatus", Map.of("label", "E-mail d’invitation", "type", "select"));
        return props;
    }

    @GetMapping("/options")
    @RequirePermission(value = "tenant.members.read", fullPermission = true)
    public List<Map<String, String>> options(@RequestParam(required = false) String q) {
        MemberListResponse response = iam.getMembers(tenant(), 1, 500, q, null, null, "email", "asc");
        return response.items().stream()
                .map(member -> Map.of(
                        "value", member.userId(),
                        "label", member.displayName() != null && !member.displayName().isBlank()
                                ? member.displayName() + " (" + member.email() + ")"
                                : member.email()))
                .toList();
    }

    @GetMapping
    @RequirePermission(value = "tenant.members.read", fullPermission = true)
    public Page<MemberRecord> list(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "25") int size,
            @RequestParam(required = false) String q,
            @RequestParam(required = false) String filter) {
        UUID tenantId = tenant();
        // IamService pages are 1-based.
        String status = null;
        String role = null;
        if (filter != null && !filter.isBlank()) {
            // Lightweight parse for common quick filters: {"status":{"is":"active"}}, {"roleIds":{"is":"OWNER"}}
            if (filter.contains("\"status\"") && filter.contains("active")) status = "active";
            else if (filter.contains("\"status\"") && filter.contains("invited")) status = "invited";
            else if (filter.contains("\"status\"") && filter.contains("suspended")) status = "suspended";
            int roleIdx = filter.indexOf("\"roleIds\"");
            if (roleIdx >= 0) {
                int isIdx = filter.indexOf("\"is\"", roleIdx);
                if (isIdx > 0) {
                    int start = filter.indexOf('"', isIdx + 4);
                    int end = start > 0 ? filter.indexOf('"', start + 1) : -1;
                    if (start > 0 && end > start) role = filter.substring(start + 1, end);
                }
            }
        }
        MemberListResponse response = iam.getMembers(tenantId, page + 1, size, q, status, role, "email", "asc");
        List<MemberRecord> content = response.items().stream().map(MemberRecord::from).toList();
        return new PageImpl<>(content, PageRequest.of(page, size), response.total());
    }

    @GetMapping("/{id}")
    @RequirePermission(value = "tenant.members.read", fullPermission = true)
    public MemberRecord get(@PathVariable UUID id) {
        return MemberRecord.from(iam.getMember(tenant(), id));
    }

    @PutMapping("/{id}")
    @RequirePermission(value = "tenant.members.write", fullPermission = true)
    public MemberRecord update(@PathVariable UUID id, @RequestBody Map<String, Object> body) {
        @SuppressWarnings("unchecked")
        List<String> roles = body.get("roleIds") instanceof List<?> list
                ? list.stream().map(String::valueOf).toList()
                : body.get("roles") instanceof List<?> list
                    ? list.stream().map(String::valueOf).toList()
                    : List.of();
        return MemberRecord.from(iam.updateMemberRoles(tenant(), id, roles));
    }

    @PostMapping("/invite")
    @RequirePermission(value = "tenant.members.invite", fullPermission = true)
    public ResponseEntity<MemberRecord> invite(@Valid @RequestBody InviteMemberRequest request) {
        return ResponseEntity.status(HttpStatus.CREATED).body(MemberRecord.from(iam.inviteMember(tenant(), request)));
    }

    @PostMapping("/{id}/resend-invitation")
    @RequirePermission(value = "tenant.members.invite", fullPermission = true)
    public ResendInvitationResponse resend(@PathVariable UUID id) {
        String delivery = iam.resendInvitation(tenant(), id);
        TenantMemberResponse member = iam.getMember(tenant(), id);
        String status = delivery != null ? delivery.toLowerCase() : "failed";
        return new ResendInvitationResponse(
                member.email(),
                status,
                "sent".equals(status) ? "Invitation renvoyée avec succès." : "Invitation régénérée, mais l'e-mail n'a pas pu être envoyé.");
    }

    @PostMapping("/{id}/deactivate")
    @RequirePermission(value = "tenant.members.suspend", fullPermission = true)
    public MemberRecord deactivate(@PathVariable UUID id) {
        return MemberRecord.from(iam.updateMemberStatus(tenant(), id, "suspended"));
    }

    @PostMapping("/{id}/reactivate")
    @RequirePermission(value = "tenant.members.suspend", fullPermission = true)
    public MemberRecord reactivate(@PathVariable UUID id) {
        return MemberRecord.from(iam.updateMemberStatus(tenant(), id, "active"));
    }

    @DeleteMapping("/{id}")
    @RequirePermission(value = "tenant.members.remove", fullPermission = true)
    public ResponseEntity<Void> remove(@PathVariable UUID id) {
        iam.removeMember(tenant(), id);
        return ResponseEntity.noContent().build();
    }

    /** Members of a role — used as an embedded listing on the role record. */
    @GetMapping("/by-role/{roleCode}/properties")
    @RequirePermission(value = "tenant.roles.read", fullPermission = true)
    public Map<String, Object> roleMembersProperties() {
        Map<String, Object> props = new LinkedHashMap<>();
        props.put("email", Map.of("label", "E-mail", "sortable", true));
        props.put("displayName", Map.of("label", "Nom"));
        props.put("status", Map.of("label", "Statut", "type", "select"));
        props.put("joinedAt", Map.of("label", "Rejoint le", "type", "date"));
        return props;
    }

    @GetMapping("/by-role/{roleCode}")
    @RequirePermission(value = "tenant.roles.read", fullPermission = true)
    public Page<MemberRecord> roleMembers(
            @PathVariable String roleCode,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "25") int size) {
        Pageable pageable = PageRequest.of(page, size);
        Page<TenantMemberResponse> result = iam.getRoleMembers(tenant(), roleCode, pageable);
        return new PageImpl<>(result.getContent().stream().map(MemberRecord::from).toList(), pageable, result.getTotalElements());
    }

    @PostMapping("/by-role/{roleCode}")
    @RequirePermission(value = "tenant.roles.write", fullPermission = true)
    public ResponseEntity<Void> assignToRole(@PathVariable String roleCode, @Valid @RequestBody BulkMemberRoleRequest request) {
        iam.assignRoleToMembers(tenant(), roleCode, request);
        return ResponseEntity.noContent().build();
    }

    @DeleteMapping("/by-role/{roleCode}/{memberId}")
    @RequirePermission(value = "tenant.roles.write", fullPermission = true)
    public ResponseEntity<Void> removeFromRole(@PathVariable String roleCode, @PathVariable UUID memberId) {
        iam.removeRoleFromMembers(tenant(), roleCode, new BulkMemberRoleRequest(List.of(memberId)));
        return ResponseEntity.noContent().build();
    }

    private static UUID tenant() {
        UUID tenantId = TenantContext.getTenantId();
        if (tenantId == null) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Tenant required");
        }
        return tenantId;
    }

    /** Shape expected by {@code nf-record-page} / {@code nf-listing-page} ({@code id} + {@code roleIds}). */
    public record MemberRecord(
            String id,
            String email,
            String displayName,
            String avatarUrl,
            List<String> roleIds,
            String status,
            String joinedAt,
            String lastActivityAt,
            String invitationEmailStatus) {
        static MemberRecord from(TenantMemberResponse member) {
            return new MemberRecord(
                    member.userId(),
                    member.email(),
                    member.displayName(),
                    member.avatarUrl(),
                    member.roles(),
                    member.status(),
                    member.joinedAt(),
                    member.lastActivityAt(),
                    member.invitationEmailStatus());
        }
    }
}
