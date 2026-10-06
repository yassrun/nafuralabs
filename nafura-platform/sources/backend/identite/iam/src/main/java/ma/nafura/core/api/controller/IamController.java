package ma.nafura.platform.administration.iam.api.controller;

import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import ma.nafura.platform.administration.iam.api.request.tenant.*;
import ma.nafura.platform.administration.iam.api.response.publicapi.ResendInvitationResponse;
import ma.nafura.platform.administration.iam.api.response.tenant.*;
import ma.nafura.platform.authorization.security.authorization.RequirePermission;
import ma.nafura.platform.authorization.security.authorization.SecuredResource;
import ma.nafura.platform.administration.iam.service.IamService;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;
import java.util.UUID;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;

/**
 * Members of an organization: info, members, invitations, members of a role.
 */
@Slf4j
@RestController
@RequestMapping("/api/tenants")
@SecuredResource(module = "tenant", resource = "admin")
@RequiredArgsConstructor
public class IamController {

    private final IamService iamService;

    // ─────────────────────────────────────────────────────────────────────────────
    // Tenant Info
    // ─────────────────────────────────────────────────────────────────────────────

    /**
     * GET /api/tenants/{tenantId}
     * Get tenant information.
     */
    @GetMapping("/{tenantId}")
    @RequirePermission(value = "tenant.read", fullPermission = true)
    public ResponseEntity<TenantInfoResponse> getTenantInfo(
            @PathVariable UUID tenantId,
            @AuthenticationPrincipal Jwt jwt) {
        
        log.debug("GET /api/tenants/{}", tenantId);
        
        TenantInfoResponse response = iamService.getTenantInfo(tenantId);
        return ResponseEntity.ok(response);
    }

    /**
     * GET /api/tenants/{tenantId}/stats
     * Get tenant usage statistics.
     */
    @GetMapping("/{tenantId}/stats")
    @RequirePermission(value = "tenant.read", fullPermission = true)
    public ResponseEntity<TenantStatsResponse> getTenantStats(
            @PathVariable UUID tenantId,
            @AuthenticationPrincipal Jwt jwt) {
        
        log.debug("GET /api/tenants/{}/stats", tenantId);
        
        TenantStatsResponse response = iamService.getTenantStats(tenantId);
        return ResponseEntity.ok(response);
    }

    /**
     * PATCH /api/tenants/{tenantId}
     * Update tenant settings.
     */
    @PatchMapping("/{tenantId}")
    @RequirePermission(value = "tenant.update", fullPermission = true)
    public ResponseEntity<TenantInfoResponse> updateTenant(
            @PathVariable UUID tenantId,
            @RequestBody Map<String, Object> updates,
            @AuthenticationPrincipal Jwt jwt) {
        
        log.info("PATCH /api/tenants/{}", tenantId);
        
        TenantInfoResponse response = iamService.updateTenant(tenantId, updates);
        return ResponseEntity.ok(response);
    }

    // ─────────────────────────────────────────────────────────────────────────────
    // Members
    // ─────────────────────────────────────────────────────────────────────────────

    /**
     * GET /api/tenants/{tenantId}/members
     * Get paginated list of tenant members.
     */
    @GetMapping("/{tenantId}/members")
    @RequirePermission(value = "tenant.members.read", fullPermission = true)
    public ResponseEntity<MemberListResponse> getMembers(
            @PathVariable UUID tenantId,
            @RequestParam(value = "page", defaultValue = "1") int page,
            @RequestParam(value = "pageSize", defaultValue = "20") int pageSize,
            @RequestParam(value = "search", required = false) String search,
            @RequestParam(value = "status", required = false) String status,
            @RequestParam(value = "role", required = false) String role,
            @RequestParam(value = "sortBy", defaultValue = "displayName") String sortBy,
            @RequestParam(value = "sortDirection", defaultValue = "asc") String sortDirection,
            @AuthenticationPrincipal Jwt jwt) {
        
        log.debug("GET /api/tenants/{}/members page={} pageSize={}", tenantId, page, pageSize);
        
        MemberListResponse response = iamService.getMembers(
            tenantId, page, pageSize, search, status, role, sortBy, sortDirection
        );
        return ResponseEntity.ok(response);
    }

    /**
     * GET /api/tenants/{tenantId}/members/{userId}
     * Get a single member.
     */
    @GetMapping("/{tenantId}/members/{userId}")
    @RequirePermission(value = "tenant.members.read", fullPermission = true)
    public ResponseEntity<TenantMemberResponse> getMember(
            @PathVariable UUID tenantId,
            @PathVariable UUID userId,
            @AuthenticationPrincipal Jwt jwt) {
        
        log.debug("GET /api/tenants/{}/members/{}", tenantId, userId);
        
        TenantMemberResponse response = iamService.getMember(tenantId, userId);
        return ResponseEntity.ok(response);
    }

    /**
     * POST /api/tenants/{tenantId}/members/invite
     * Invite a new member.
     */
    @PostMapping("/{tenantId}/members/invite")
    @RequirePermission(value = "tenant.members.invite", fullPermission = true)
    public ResponseEntity<TenantMemberResponse> inviteMember(
            @PathVariable UUID tenantId,
            @Valid @RequestBody InviteMemberRequest request,
            @AuthenticationPrincipal Jwt jwt) {
        
        log.info("POST /api/tenants/{}/members/invite email={}", tenantId, request.email());
        
        TenantMemberResponse response = iamService.inviteMember(tenantId, request);
        return ResponseEntity.status(HttpStatus.CREATED).body(response);
    }

    /**
     * PATCH /api/tenants/{tenantId}/members/{userId}/roles
     * Update a member's roles.
     */
    @PatchMapping("/{tenantId}/members/{userId}/roles")
    @RequirePermission(value = "tenant.members.write", fullPermission = true)
    public ResponseEntity<TenantMemberResponse> updateMemberRoles(
            @PathVariable UUID tenantId,
            @PathVariable UUID userId,
            @Valid @RequestBody UpdateMemberRolesRequest request,
            @AuthenticationPrincipal Jwt jwt) {
        
        log.info("PATCH /api/tenants/{}/members/{}/roles", tenantId, userId);
        
        TenantMemberResponse response = iamService.updateMemberRoles(tenantId, userId, request.roles());
        return ResponseEntity.ok(response);
    }

    /**
     * PATCH /api/tenants/{tenantId}/members/{userId}/status
     * Update a member's status (suspend/reactivate).
     */
    @PatchMapping("/{tenantId}/members/{userId}/status")
    @RequirePermission(value = "tenant.members.suspend", fullPermission = true)
    public ResponseEntity<TenantMemberResponse> updateMemberStatus(
            @PathVariable UUID tenantId,
            @PathVariable UUID userId,
            @Valid @RequestBody UpdateMemberStatusRequest request,
            @AuthenticationPrincipal Jwt jwt) {
        
        log.info("PATCH /api/tenants/{}/members/{}/status to {}", tenantId, userId, request.status());
        
        TenantMemberResponse response = iamService.updateMemberStatus(tenantId, userId, request.status());
        return ResponseEntity.ok(response);
    }

    /**
     * DELETE /api/tenants/{tenantId}/members/{userId}
     * Remove a member from the tenant.
     */
    @DeleteMapping("/{tenantId}/members/{userId}")
    @RequirePermission(value = "tenant.members.remove", fullPermission = true)
    public ResponseEntity<Void> removeMember(
            @PathVariable UUID tenantId,
            @PathVariable UUID userId,
            @AuthenticationPrincipal Jwt jwt) {
        
        log.info("DELETE /api/tenants/{}/members/{}", tenantId, userId);
        
        iamService.removeMember(tenantId, userId);
        return ResponseEntity.noContent().build();
    }

    /**
     * POST /api/tenants/{tenantId}/members/{userId}/resend-invitation
     * Resend invitation to a pending member.
     */
    @PostMapping("/{tenantId}/members/{userId}/resend-invitation")
    @RequirePermission(value = "tenant.members.invite", fullPermission = true)
    public ResponseEntity<ResendInvitationResponse> resendInvitation(
            @PathVariable UUID tenantId,
            @PathVariable UUID userId,
            @AuthenticationPrincipal Jwt jwt) {
        
        log.info("POST /api/tenants/{}/members/{}/resend-invitation", tenantId, userId);
        
        String status = iamService.resendInvitation(tenantId, userId);
        TenantMemberResponse member = iamService.getMember(tenantId, userId);
        String delivery = status != null ? status.toLowerCase() : "failed";
        String message = "sent".equals(delivery)
                ? "Invitation renvoyée avec succès."
                : "Invitation régénérée, mais l'e-mail n'a pas pu être envoyé.";
        return ResponseEntity.ok(new ResendInvitationResponse(member.email(), delivery, message));
    }

    // ─────────────────────────────────────────────────────────────────────────────
    // Members of a role (roles themselves: AccessController)
    // ─────────────────────────────────────────────────────────────────────────────

    /**
     * GET /api/tenants/{tenantId}/roles/{roleCode}/members
     * Get paginated members assigned to a role.
     */
    @GetMapping("/{tenantId}/roles/{roleCode}/members")
    @RequirePermission(value = "tenant.roles.read", fullPermission = true)
    public ResponseEntity<Page<TenantMemberResponse>> getRoleMembers(
            @PathVariable UUID tenantId,
            @PathVariable String roleCode,
            Pageable pageable,
            @AuthenticationPrincipal Jwt jwt) {
        
        log.debug("GET /api/tenants/{}/roles/{}/members", tenantId, roleCode);
        
        Page<TenantMemberResponse> response = iamService.getRoleMembers(tenantId, roleCode, pageable);
        return ResponseEntity.ok(response);
    }

    /**
     * POST /api/tenants/{tenantId}/roles/{roleCode}/members
     * Assign role to multiple members.
     */
    @PostMapping("/{tenantId}/roles/{roleCode}/members")
    @RequirePermission(value = "tenant.roles.write", fullPermission = true)
    public ResponseEntity<Void> assignRoleToMembers(
            @PathVariable UUID tenantId,
            @PathVariable String roleCode,
            @Valid @RequestBody BulkMemberRoleRequest request,
            @AuthenticationPrincipal Jwt jwt) {
        
        log.info("POST /api/tenants/{}/roles/{}/members", tenantId, roleCode);
        
        iamService.assignRoleToMembers(tenantId, roleCode, request);
        return ResponseEntity.noContent().build();
    }

    /**
     * DELETE /api/tenants/{tenantId}/roles/{roleCode}/members
     * Remove role from multiple members.
     */
    @DeleteMapping("/{tenantId}/roles/{roleCode}/members")
    @RequirePermission(value = "tenant.roles.write", fullPermission = true)
    public ResponseEntity<Void> removeRoleFromMembers(
            @PathVariable UUID tenantId,
            @PathVariable String roleCode,
            @Valid @RequestBody BulkMemberRoleRequest request,
            @AuthenticationPrincipal Jwt jwt) {
        
        log.info("DELETE /api/tenants/{}/roles/{}/members", tenantId, roleCode);
        
        iamService.removeRoleFromMembers(tenantId, roleCode, request);
        return ResponseEntity.noContent().build();
    }
}



