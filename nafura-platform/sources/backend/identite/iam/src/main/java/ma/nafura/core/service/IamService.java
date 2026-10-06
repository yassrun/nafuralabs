package ma.nafura.platform.administration.iam.service;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import ma.nafura.platform.administration.access.service.AccessService;
import ma.nafura.platform.administration.iam.api.request.tenant.BulkMemberRoleRequest;
import ma.nafura.platform.administration.iam.api.request.tenant.InviteMemberRequest;
import ma.nafura.platform.administration.iam.api.response.tenant.*;
import ma.nafura.platform.authorization.domain.model.TenantUserRole;
import ma.nafura.platform.authorization.repository.TenantUserRoleRepository;
import ma.nafura.platform.identity.domain.model.AppUser;
import ma.nafura.platform.identity.repository.AppUserRepository;
import ma.nafura.platform.identity.service.AppUserProvisioningService;
import ma.nafura.platform.tenancy.domain.model.Tenant;
import ma.nafura.platform.tenancy.domain.model.TenantMembership;
import ma.nafura.platform.tenancy.repository.TenantMembershipRepository;
import ma.nafura.platform.tenancy.repository.TenantRepository;
import ma.nafura.platform.administration.iam.domain.model.TenantInvitation;
import ma.nafura.platform.administration.iam.repository.TenantInvitationRepository;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageImpl;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.OffsetDateTime;
import java.util.*;
import java.util.stream.Collectors;

/**
 * Members of an organization: who they are, their invitations and the roles they hold.
 * The roles themselves and the business contexts switched on are {@link AccessService} (core).
 */
@Slf4j
@Service
@RequiredArgsConstructor
public class IamService {

    private static final String MEMBER_STATUS_ACTIVE = "ACTIVE";
    private static final String MEMBER_STATUS_INVITED = "INVITED";
    private static final String MEMBER_STATUS_SUSPENDED = "SUSPENDED";
    private static final String ROLE_OWNER = "OWNER";
    static final String LAST_ACTIVE_OWNER_MESSAGE =
            "The tenant must keep at least one active member with the OWNER role";

    private final TenantRepository tenantRepository;
    private final AppUserRepository appUserRepository;
    private final TenantMembershipRepository tenantMembershipRepository;
    private final TenantUserRoleRepository tenantUserRoleRepository;
    private final AppUserProvisioningService appUserProvisioningService;
    private final TenantInvitationRepository tenantInvitationRepository;
    private final TenantInvitationDeliveryService tenantInvitationDeliveryService;
    private final AccessService accessService;
    private final MembershipAudit membershipAudit;

    // ─────────────────────────────────────────────────────────────────────────────
    // Tenant Info
    // ─────────────────────────────────────────────────────────────────────────────

    /**
     * Get tenant information.
     */
    public TenantInfoResponse getTenantInfo(UUID tenantId) {
        Tenant tenant = tenantRepository.findById(tenantId)
            .orElseThrow(() -> new IllegalArgumentException("Tenant not found: " + tenantId));

        List<String> enabledDomains = accessService.getEnabledDomainIds(tenantId);

        return new TenantInfoResponse(
            tenant.getId().toString(),
            tenant.getKey(),
            tenant.getName(),
            "active",
            enabledDomains,
            Map.of(),
            tenant.getOwnerEmail(),
            tenant.getType(),
            formatDateTime(tenant.getCreatedAt()),
            formatDateTime(tenant.getUpdatedAt())
        );
    }

    /**
     * Get tenant usage statistics.
     */
    public TenantStatsResponse getTenantStats(UUID tenantId) {
        long totalMembers = tenantMembershipRepository.countByTenantId(tenantId);
        long activeMembers = tenantMembershipRepository.countByTenantIdAndStatus(tenantId, MEMBER_STATUS_ACTIVE);
        long pendingInvitations = tenantMembershipRepository.countByTenantIdAndStatus(tenantId, MEMBER_STATUS_INVITED);

        return new TenantStatsResponse(
            (int) totalMembers,
            (int) activeMembers,
            (int) pendingInvitations,
            null, // storageUsed - not tracked yet
            null, // storageLimit - not tracked yet
            null, // apiCallsThisMonth - not tracked yet
            null  // apiCallLimit - not tracked yet
        );
    }

    /**
     * Update tenant settings.
     */
    @Transactional
    public TenantInfoResponse updateTenant(UUID tenantId, Map<String, Object> updates) {
        Tenant tenant = tenantRepository.findById(tenantId)
            .orElseThrow(() -> new IllegalArgumentException("Tenant not found: " + tenantId));

        if (updates.containsKey("tenantName")) {
            tenant.setName((String) updates.get("tenantName"));
        }
        if (updates.containsKey("ownerEmail")) {
            tenant.setOwnerEmail((String) updates.get("ownerEmail"));
        }

        tenantRepository.save(tenant);
        return getTenantInfo(tenantId);
    }

    // ─────────────────────────────────────────────────────────────────────────────
    // Members
    // ─────────────────────────────────────────────────────────────────────────────

    /**
     * Get paginated list of tenant members.
     */
    public MemberListResponse getMembers(
        UUID tenantId,
        int page,
        int pageSize,
        String search,
        String status,
        String role,
        String sortBy,
        String sortDirection
    ) {
        int resolvedPage = Math.max(page, 1);
        int resolvedPageSize = Math.max(pageSize, 1);
        Sort sort = "desc".equalsIgnoreCase(sortDirection)
            ? Sort.by(mapSortField(sortBy)).descending()
            : Sort.by(mapSortField(sortBy)).ascending();

        Pageable pageable = PageRequest.of(resolvedPage - 1, resolvedPageSize, sort);
        String normalizedSearch = search != null && !search.isBlank()
            ? search.trim().toLowerCase(Locale.ROOT)
            : "";
        String normalizedStatus = status != null && !status.isBlank()
            ? status.trim().toUpperCase(Locale.ROOT)
            : "";
        String normalizedRole = role != null && !role.isBlank()
            ? role.trim().toUpperCase(Locale.ROOT)
            : "";

        Page<AppUser> usersPage = appUserRepository.searchMembers(
            tenantId,
            !normalizedSearch.isEmpty(),
            "%" + normalizedSearch + "%",
            !normalizedStatus.isEmpty(),
            normalizedStatus,
            !normalizedRole.isEmpty(),
            normalizedRole,
            pageable
        );

        List<UUID> userIds = usersPage.getContent().stream().map(AppUser::getId).toList();
        Map<UUID, TenantMembership> membershipsByUserId = userIds.isEmpty()
            ? Map.of()
            : tenantMembershipRepository.findByTenantIdAndUserIdIn(tenantId, userIds).stream()
                .collect(Collectors.toMap(TenantMembership::getUserId, tm -> tm));
        Map<UUID, List<String>> rolesByUserId = userIds.isEmpty()
            ? Map.of()
            : tenantUserRoleRepository.findByTenantIdAndUserIdIn(tenantId, userIds).stream()
                .collect(Collectors.groupingBy(
                    TenantUserRole::getUserId,
                    Collectors.mapping(TenantUserRole::getRoleCode, Collectors.toList())
                ));

        List<TenantMemberResponse> members = usersPage.getContent().stream()
            .map(user -> {
                TenantMembership membership = membershipsByUserId.get(user.getId());
                List<String> roles = rolesByUserId.getOrDefault(user.getId(), List.of());
                return toMemberResponse(user, membership, roles);
            })
            .collect(Collectors.toList());

        return new MemberListResponse(
            members,
            (int) usersPage.getTotalElements(),
            resolvedPage,
            resolvedPageSize,
            usersPage.getTotalPages()
        );
    }

    /**
     * Get a single member.
     */
    public TenantMemberResponse getMember(UUID tenantId, UUID userId) {
        AppUser user = appUserRepository.findById(userId)
            .orElseThrow(() -> new IllegalArgumentException("Member not found"));
        TenantMembership membership = tenantMembershipRepository.findByTenantIdAndUserId(tenantId, userId)
            .orElseThrow(() -> new IllegalArgumentException("Member not found"));

        return toMemberResponse(user, membership, getTenantRoleCodes(tenantId, userId));
    }

    /**
     * Invite a new member.
     */
    @Transactional
    public TenantMemberResponse inviteMember(UUID tenantId, InviteMemberRequest request) {
        // Check if user already exists — message is machine-readable for the UI (MEMBER_EXISTS:<status>).
        Optional<TenantMembership> existing =
                tenantMembershipRepository.findByTenantIdAndEmail(tenantId, request.email());
        if (existing.isPresent()) {
            String status = existing.get().getStatus() != null
                    ? existing.get().getStatus().toLowerCase(Locale.ROOT)
                    : "unknown";
            throw new IllegalStateException("MEMBER_EXISTS:" + status);
        }

        // Reuse existing identity user if present; otherwise create it.
        AppUser user = appUserProvisioningService.provisionAuthenticatedUser(request.email());

        TenantMembership membership = TenantMembership.builder()
            .tenantId(tenantId)
            .userId(user.getId())
            .status(MEMBER_STATUS_INVITED)
            .build();
        membership = tenantMembershipRepository.save(membership);
        List<String> invitedRoles = normalizeRoleCodes(request.roles());
        replaceTenantRoles(tenantId, user.getId(), invitedRoles);

        String emailDeliveryStatus = tenantInvitationDeliveryService.createAndSendInvitation(
            tenantId,
            user.getId(),
            request.email(),
            request.roles(),
            request.message()
        );

        List<String> assignedRoles = getTenantRoleCodes(tenantId, user.getId());
        membershipAudit.invited(tenantId, user.getId(), user.getEmail(), assignedRoles);

        log.info("Invited new member {} to tenant {} emailStatus={}", request.email(), tenantId, emailDeliveryStatus);
        return toMemberResponse(user, membership, assignedRoles, emailDeliveryStatus);
    }

    /**
     * Update a member's roles.
     */
    @Transactional
    public TenantMemberResponse updateMemberRoles(UUID tenantId, UUID userId, List<String> roles) {
        AppUser user = appUserRepository.findById(userId)
            .orElseThrow(() -> new IllegalArgumentException("Member not found"));
        TenantMembership membership = tenantMembershipRepository.findByTenantIdAndUserId(tenantId, userId)
            .orElseThrow(() -> new IllegalArgumentException("Member not found"));

        List<String> previousRoles = getTenantRoleCodes(tenantId, userId);
        List<String> normalizedRoles = normalizeRoleCodes(roles);
        ensureRetainsActiveOwner(tenantId, userId, membership, previousRoles, normalizedRoles, false);

        replaceTenantRoles(tenantId, userId, normalizedRoles);
        membershipAudit.rolesChanged(tenantId, userId, user.getEmail(), previousRoles, normalizedRoles);

        log.info("Updated roles for member {} in tenant {}", userId, tenantId);
        return toMemberResponse(user, membership, getTenantRoleCodes(tenantId, userId));
    }

    /**
     * Update a member's status.
     */
    @Transactional
    public TenantMemberResponse updateMemberStatus(UUID tenantId, UUID userId, String status) {
        AppUser user = appUserRepository.findById(userId)
            .orElseThrow(() -> new IllegalArgumentException("Member not found"));
        TenantMembership membership = tenantMembershipRepository.findByTenantIdAndUserId(tenantId, userId)
            .orElseThrow(() -> new IllegalArgumentException("Member not found"));

        String previousStatus = membership.getStatus();
        String nextStatus = status.toUpperCase(Locale.ROOT);
        if (MEMBER_STATUS_SUSPENDED.equals(nextStatus)) {
            ensureRetainsActiveOwner(
                    tenantId,
                    userId,
                    membership,
                    getTenantRoleCodes(tenantId, userId),
                    getTenantRoleCodes(tenantId, userId),
                    true);
        }

        membership.setStatus(nextStatus);
        membership = tenantMembershipRepository.save(membership);
        if (!Objects.equals(previousStatus, nextStatus)) {
            membershipAudit.statusChanged(tenantId, userId, user.getEmail(), previousStatus, nextStatus);
        }

        log.info("Updated status for member {} in tenant {} to {}", userId, tenantId, status);
        return toMemberResponse(user, membership, getTenantRoleCodes(tenantId, userId));
    }

    /**
     * Remove a member from the tenant.
     */
    @Transactional
    public void removeMember(UUID tenantId, UUID userId) {
        TenantMembership membership = tenantMembershipRepository.findByTenantIdAndUserId(tenantId, userId)
            .orElseThrow(() -> new IllegalArgumentException("Member not found"));
        AppUser user = appUserRepository.findById(userId)
            .orElseThrow(() -> new IllegalArgumentException("Member not found"));
        List<String> roles = getTenantRoleCodes(tenantId, userId);

        ensureRetainsActiveOwner(tenantId, userId, membership, roles, roles, true);

        membershipAudit.removed(tenantId, userId, user.getEmail(), roles, membership.getStatus());
        tenantUserRoleRepository.deleteByTenantIdAndUserId(tenantId, userId);
        tenantMembershipRepository.deleteByTenantIdAndUserId(tenantId, userId);
        log.info("Removed member {} from tenant {}", userId, tenantId);
    }

    /**
     * Resend invitation to a pending member.
     */
    @Transactional
    public String resendInvitation(UUID tenantId, UUID userId) {
        TenantMembership membership = tenantMembershipRepository.findByTenantIdAndUserId(tenantId, userId)
            .filter(tm -> MEMBER_STATUS_INVITED.equalsIgnoreCase(tm.getStatus()))
            .orElseThrow(() -> new IllegalArgumentException("Pending invitation not found"));
        AppUser user = appUserRepository.findById(membership.getUserId())
            .orElseThrow(() -> new IllegalArgumentException("User not found"));

        List<String> roles = getTenantRoleCodes(tenantId, user.getId());
        String emailDeliveryStatus = tenantInvitationDeliveryService.resendInvitation(
            tenantId,
            user.getId(),
            user.getEmail(),
            roles
        );
        // Same contract as invite: membership stays INVITED; delivery status is in the response.
        membershipAudit.resent(tenantId, user.getId(), user.getEmail());
        log.info(
                "Resent invitation to {} in tenant {} emailStatus={}",
                user.getEmail(),
                tenantId,
                emailDeliveryStatus);
        return emailDeliveryStatus;
    }

    // ─────────────────────────────────────────────────────────────────────────────
    // Members of a role
    // ─────────────────────────────────────────────────────────────────────────────

    /**
     * Get paginated members assigned to a specific role.
     */
    public Page<TenantMemberResponse> getRoleMembers(UUID tenantId, String roleCode, Pageable pageable) {
        requireTenant(tenantId);
        String normalizedRoleCode = roleCode == null ? null : roleCode.trim().toUpperCase(Locale.ROOT);
        if (!roleExistsForTenant(tenantId, normalizedRoleCode)) {
            throw new IllegalArgumentException("Role not found: " + roleCode);
        }
        Page<TenantUserRole> rolePage = tenantUserRoleRepository.findByTenantIdAndRoleCode(tenantId, normalizedRoleCode, pageable);
        List<UUID> userIds = rolePage.getContent().stream().map(TenantUserRole::getUserId).distinct().toList();
        if (userIds.isEmpty()) {
            return new PageImpl<>(List.of(), pageable, rolePage.getTotalElements());
        }
        Map<UUID, TenantMembership> membershipsByUserId = tenantMembershipRepository.findByTenantIdAndUserIdIn(tenantId, userIds).stream()
            .collect(Collectors.toMap(TenantMembership::getUserId, tm -> tm));
        List<AppUser> users = appUserRepository.findAllById(userIds);
        Map<UUID, AppUser> userMap = users.stream().collect(Collectors.toMap(AppUser::getId, u -> u));
        List<TenantMemberResponse> members = userIds.stream()
            .map(userId -> {
                AppUser user = userMap.get(userId);
                TenantMembership membership = membershipsByUserId.get(userId);
                if (user == null || membership == null) return null;
                List<String> roles = getTenantRoleCodes(tenantId, userId);
                return toMemberResponse(user, membership, roles);
            })
            .filter(Objects::nonNull)
            .toList();
        return new PageImpl<>(members, pageable, rolePage.getTotalElements());
    }

    /**
     * Assign a role to multiple members (adds role, does not replace existing roles).
     */
    @Transactional
    public void assignRoleToMembers(UUID tenantId, String roleCode, BulkMemberRoleRequest request) {
        requireTenant(tenantId);
        String normalizedRoleCode = roleCode == null ? null : roleCode.trim().toUpperCase(Locale.ROOT);
        if (!roleExistsForTenant(tenantId, normalizedRoleCode)) {
            throw new IllegalArgumentException("Role not found: " + roleCode);
        }
        List<UUID> memberIds = request.memberIds() != null ? request.memberIds() : List.of();
        Set<UUID> existingWithRole = tenantUserRoleRepository.findByTenantIdAndRoleCode(tenantId, normalizedRoleCode).stream()
            .map(TenantUserRole::getUserId)
            .collect(Collectors.toSet());
        for (UUID userId : memberIds) {
            if (existingWithRole.contains(userId)) continue;
            if (!tenantMembershipRepository.findByTenantIdAndUserId(tenantId, userId).isPresent()) {
                throw new IllegalArgumentException("Member not found: " + userId);
            }
            TenantUserRole tur = TenantUserRole.builder()
                .tenantId(tenantId)
                .userId(userId)
                .roleCode(normalizedRoleCode)
                .build();
            tenantUserRoleRepository.save(tur);
            existingWithRole.add(userId);
        }
        log.info("Assigned role {} to {} member(s) in tenant {}", normalizedRoleCode, memberIds.size(), tenantId);
    }

    /**
     * Remove a role from multiple members. Fails if any member would end up with zero roles.
     */
    @Transactional
    public void removeRoleFromMembers(UUID tenantId, String roleCode, BulkMemberRoleRequest request) {
        requireTenant(tenantId);
        String normalizedRoleCode = roleCode == null ? null : roleCode.trim().toUpperCase(Locale.ROOT);
        if (!roleExistsForTenant(tenantId, normalizedRoleCode)) {
            throw new IllegalArgumentException("Role not found: " + roleCode);
        }
        List<UUID> memberIds = request.memberIds() != null ? request.memberIds() : List.of();
        for (UUID userId : memberIds) {
            List<String> roles = getTenantRoleCodes(tenantId, userId);
            if (roles.size() <= 1 && roles.contains(normalizedRoleCode)) {
                throw new IllegalArgumentException("Cannot remove the last role from member " + userId);
            }
        }
        tenantUserRoleRepository.deleteByTenantIdAndRoleCodeAndUserIdIn(tenantId, normalizedRoleCode, memberIds);
        log.info("Removed role {} from {} member(s) in tenant {}", normalizedRoleCode, memberIds.size(), tenantId);
    }

    // ─────────────────────────────────────────────────────────────────────────────
    // Helper Methods
    // ─────────────────────────────────────────────────────────────────────────────

    private boolean roleExistsForTenant(UUID tenantId, String roleCode) {
        return accessService.roleExists(tenantId, roleCode);
    }

    private TenantMemberResponse toMemberResponse(
            AppUser user,
            TenantMembership membership,
            List<String> roles) {
        return toMemberResponse(user, membership, roles, resolveInvitationEmailStatus(membership));
    }

    private TenantMemberResponse toMemberResponse(
            AppUser user,
            TenantMembership membership,
            List<String> roles,
            String invitationEmailStatus) {
        return new TenantMemberResponse(
            user.getId().toString(),
            user.getEmail(),
            user.getName() != null ? user.getName() : user.getEmail(),
            null, // avatarUrl - not in schema
            roles,
            membership != null && membership.getStatus() != null ? membership.getStatus().toLowerCase() : "active",
            membership != null ? formatDateTime(membership.getCreatedAt()) : formatDateTime(user.getCreatedAt()),
            formatDateTime(user.getUpdatedAt()),
            invitationEmailStatus != null ? invitationEmailStatus.toLowerCase(Locale.ROOT) : null
        );
    }

    private String resolveInvitationEmailStatus(TenantMembership membership) {
        if (membership == null || !MEMBER_STATUS_INVITED.equalsIgnoreCase(membership.getStatus())) {
            return null;
        }
        return tenantInvitationRepository
            .findFirstByTenantIdAndUserIdAndStatusOrderByCreatedAtDesc(
                membership.getTenantId(),
                membership.getUserId(),
                TenantInvitation.STATUS_PENDING
            )
            .map(TenantInvitation::getEmailDeliveryStatus)
            .orElse(null);
    }

    private List<String> getTenantRoleCodes(UUID tenantId, UUID userId) {
        return tenantUserRoleRepository.findRoleCodesByTenantIdAndUserId(tenantId, userId);
    }

    private void replaceTenantRoles(UUID tenantId, UUID userId, List<String> normalizedRoles) {
        if (normalizedRoles.isEmpty()) {
            throw new IllegalArgumentException("At least one role is required");
        }

        List<String> unknownRoles = normalizedRoles.stream()
            .filter(role -> !accessService.roleExists(tenantId, role))
            .toList();
        if (!unknownRoles.isEmpty()) {
            throw new IllegalArgumentException("Unknown role code(s): " + String.join(", ", unknownRoles));
        }

        tenantUserRoleRepository.deleteByTenantIdAndUserId(tenantId, userId);
        List<TenantUserRole> tenantRoles = normalizedRoles.stream()
            .map(role -> TenantUserRole.builder()
                .tenantId(tenantId)
                .userId(userId)
                .roleCode(role)
                .build())
            .toList();
        tenantUserRoleRepository.saveAll(tenantRoles);
    }

    private List<String> normalizeRoleCodes(List<String> roles) {
        return roles == null ? List.of() : roles.stream()
            .filter(Objects::nonNull)
            .map(String::trim)
            .filter(role -> !role.isEmpty())
            .map(role -> role.toUpperCase(Locale.ROOT))
            .distinct()
            .toList();
    }

    private void ensureRetainsActiveOwner(
            UUID tenantId,
            UUID userId,
            TenantMembership membership,
            List<String> currentRoles,
            List<String> nextRoles,
            boolean leavingActiveStatus) {
        if (!MEMBER_STATUS_ACTIVE.equalsIgnoreCase(membership.getStatus())) {
            return;
        }
        if (!currentRoles.contains(ROLE_OWNER)) {
            return;
        }
        boolean losingOwnerRole = !nextRoles.contains(ROLE_OWNER);
        if (!leavingActiveStatus && !losingOwnerRole) {
            return;
        }
        long otherActiveOwners = tenantUserRoleRepository.countActiveMembersWithRoleExcludingUser(
                tenantId, ROLE_OWNER, userId);
        if (otherActiveOwners == 0) {
            throw new IllegalStateException(LAST_ACTIVE_OWNER_MESSAGE);
        }
    }

    private String mapSortField(String field) {
        if (field == null || field.isBlank()) {
            return "createdAt";
        }

        return switch (field) {
            case "displayName" -> "name";
            case "joinedAt", "createdAt" -> "createdAt";
            case "lastActivityAt", "lastLoginAt", "updatedAt" -> "updatedAt";
            case "email" -> "email";
            case "status" -> "status";
            default -> "createdAt";
        };
    }

    private String formatDateTime(OffsetDateTime dateTime) {
        return dateTime != null ? dateTime.toString() : null;
    }

    private Tenant requireTenant(UUID tenantId) {
        return tenantRepository.findById(tenantId)
            .orElseThrow(() -> new IllegalArgumentException("Tenant not found: " + tenantId));
    }
}






