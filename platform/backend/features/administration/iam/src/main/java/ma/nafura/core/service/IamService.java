package ma.nafura.platform.administration.iam.service;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import ma.nafura.platform.administration.iam.api.request.tenant.BulkMemberRoleRequest;
import ma.nafura.platform.administration.iam.api.request.tenant.CreateRoleRequest;
import ma.nafura.platform.administration.iam.api.request.tenant.InviteMemberRequest;
import ma.nafura.platform.administration.iam.api.request.tenant.UpdateRoleRequest;
import ma.nafura.platform.administration.iam.api.request.tenant.UpdateDomainRequest;
import ma.nafura.platform.administration.iam.api.request.tenant.UpdateFeaturesRequest;
import ma.nafura.platform.administration.iam.api.request.tenant.UpdateMemberRolesRequest;
import ma.nafura.platform.administration.iam.api.request.tenant.UpdateMemberStatusRequest;
import ma.nafura.platform.administration.iam.api.response.tenant.*;
import ma.nafura.platform.administration.iam.domain.model.TenantCustomRole;
import ma.nafura.platform.administration.iam.domain.model.TenantCustomRolePermission;
import ma.nafura.platform.administration.iam.repository.TenantCustomRolePermissionRepository;
import ma.nafura.platform.administration.iam.repository.TenantCustomRoleRepository;
import ma.nafura.platform.authorization.domain.model.TenantUserRole;
import ma.nafura.platform.authorization.repository.TenantUserRoleRepository;
import ma.nafura.platform.authorization.service.PermissionService;
import ma.nafura.platform.identity.domain.model.AppUser;
import ma.nafura.platform.identity.repository.AppUserRepository;
import ma.nafura.platform.identity.service.AppUserProvisioningService;
import ma.nafura.platform.tenancy.domain.model.Tenant;
import ma.nafura.platform.tenancy.domain.model.TenantDomain;
import ma.nafura.platform.tenancy.domain.model.TenantMembership;
import ma.nafura.platform.tenancy.repository.TenantMembershipRepository;
import ma.nafura.platform.tenancy.repository.TenantDomainRepository;
import ma.nafura.platform.tenancy.repository.TenantRepository;
import ma.nafura.platform.framework.context.UserContext;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.ApplicationContext;
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
 * Service for Tenant Administration operations.
 * 
 * Supports per-tenant domain toggling within the application's available domains.
 * Each tenant can enable/disable domains that are part of their application bundle.
 */
@Slf4j
@Service
@RequiredArgsConstructor
public class IamService {

    private static final String DOMAIN_STATUS_ACTIVE = "ACTIVE";
    private static final String DOMAIN_STATUS_INACTIVE = "INACTIVE";
    private static final String MEMBER_STATUS_ACTIVE = "ACTIVE";
    private static final String MEMBER_STATUS_INVITED = "INVITED";

    private final TenantRepository tenantRepository;
    private final AppUserRepository appUserRepository;
    private final TenantMembershipRepository tenantMembershipRepository;
    private final TenantDomainRepository tenantDomainRepository;
    private final TenantUserRoleRepository tenantUserRoleRepository;
    private final TenantCustomRoleRepository tenantCustomRoleRepository;
    private final TenantCustomRolePermissionRepository tenantCustomRolePermissionRepository;
    private final AppUserProvisioningService appUserProvisioningService;
    private final PermissionService permissionService;
    private final InvitationTokenService invitationTokenService;
    private final ApplicationContext applicationContext;

    @Value("${nafura.application.id:app}")
    private String defaultApplicationId;

    @Value("${app.frontend-base-url:http://localhost:4200}")
    private String frontendBaseUrl;

    // ─────────────────────────────────────────────────────────────────────────────
    // Tenant Info
    // ─────────────────────────────────────────────────────────────────────────────

    /**
     * Get tenant information.
     */
    public TenantInfoResponse getTenantInfo(UUID tenantId) {
        Tenant tenant = tenantRepository.findById(tenantId)
            .orElseThrow(() -> new IllegalArgumentException("Tenant not found: " + tenantId));

        // Get enabled domains from tenant_domain table.
        List<String> enabledDomains = getEnabledDomainIds(tenantId);

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
        // Check if user already exists
        if (tenantMembershipRepository.existsByTenantIdAndEmail(tenantId, request.email())) {
            throw new IllegalArgumentException("User already exists in this tenant");
        }

        // Reuse existing identity user if present; otherwise create it.
        AppUser user = appUserProvisioningService.provisionAuthenticatedUser(request.email());

        TenantMembership membership = TenantMembership.builder()
            .tenantId(tenantId)
            .userId(user.getId())
            .status(MEMBER_STATUS_INVITED)
            .build();
        membership = tenantMembershipRepository.save(membership);
        replaceTenantRoles(tenantId, user.getId(), request.roles());

        sendInvitationEmailIfAvailable(tenantId, request.email(), request.roles());

        log.info("Invited new member {} to tenant {}", request.email(), tenantId);
        return toMemberResponse(user, membership, getTenantRoleCodes(tenantId, user.getId()));
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

        replaceTenantRoles(tenantId, userId, roles);

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

        membership.setStatus(status.toUpperCase());
        membership = tenantMembershipRepository.save(membership);

        log.info("Updated status for member {} in tenant {} to {}", userId, tenantId, status);
        return toMemberResponse(user, membership, getTenantRoleCodes(tenantId, userId));
    }

    /**
     * Remove a member from the tenant.
     */
    @Transactional
    public void removeMember(UUID tenantId, UUID userId) {
        if (!tenantMembershipRepository.existsByTenantIdAndUserId(tenantId, userId)) {
            throw new IllegalArgumentException("Member not found");
        }
        tenantUserRoleRepository.deleteByTenantIdAndUserId(tenantId, userId);
        tenantMembershipRepository.deleteByTenantIdAndUserId(tenantId, userId);
        log.info("Removed member {} from tenant {}", userId, tenantId);
    }

    /**
     * Resend invitation to a pending member.
     */
    public void resendInvitation(UUID tenantId, UUID userId) {
        TenantMembership membership = tenantMembershipRepository.findByTenantIdAndUserId(tenantId, userId)
            .filter(tm -> MEMBER_STATUS_INVITED.equalsIgnoreCase(tm.getStatus()))
            .orElseThrow(() -> new IllegalArgumentException("Pending invitation not found"));
        AppUser user = appUserRepository.findById(membership.getUserId())
            .orElseThrow(() -> new IllegalArgumentException("User not found"));

        List<String> roles = getTenantRoleCodes(tenantId, user.getId());
        sendInvitationEmailIfAvailable(tenantId, user.getEmail(), roles);
        log.info("Resent invitation to {} in tenant {}", user.getEmail(), tenantId);
    }

    private void sendInvitationEmailIfAvailable(UUID tenantId, String email, List<String> roles) {
        try {
            Class<?> emailServiceClass = Class.forName(
                "ma.nafura.platform.collaboration.notification.service.EmailService");
            Object emailService = applicationContext.getBean(emailServiceClass);
            Tenant tenant = tenantRepository.findById(tenantId).orElse(null);
            String tenantName = tenant != null ? tenant.getName() : "Organization";
            String inviteToken = invitationTokenService.generateInviteToken(tenantId, email, roles);
            String inviteLink = frontendBaseUrl + "/invite/accept?token=" + inviteToken;
            String inviterName = resolveInviterName();
            emailServiceClass.getMethod(
                "sendInvitationEmail", String.class, String.class, String.class, String.class, String.class)
                .invoke(emailService, email, tenantName, inviteLink, inviterName, null);
        } catch (Exception e) {
            log.warn("Failed to send invitation email to {}: {}", email, e.getMessage());
        }
    }

    private String resolveInviterName() {
        try {
            UUID userId = UserContext.getUserIdOrNull();
            if (userId != null) {
                return appUserRepository.findById(userId).map(AppUser::getName).orElse(UserContext.getUserEmail());
            }
        } catch (Exception ignored) {}
        return UserContext.getUserEmail() != null ? UserContext.getUserEmail() : "A team member";
    }

    // ─────────────────────────────────────────────────────────────────────────────
    // Roles & Permissions
    // ─────────────────────────────────────────────────────────────────────────────

    /**
     * Get all roles for a tenant with member counts (system + custom roles).
     */
    public List<RoleResponse> getRoles(UUID tenantId) {
        requireTenant(tenantId);
        Map<String, Long> memberCounts = getRoleMemberCounts(tenantId);
        List<RoleResponse> systemRoles = permissionService.getAllRoleCodes().stream()
            .map(role -> {
                List<String> permissions = permissionService.getPermissionsForRole(role);
                long count = memberCounts.getOrDefault(role.toUpperCase(Locale.ROOT), 0L);
                return RoleResponse.fromRole(role, permissions, count);
            })
            .collect(Collectors.toList());
        List<RoleResponse> customRoles = tenantCustomRoleRepository.findByTenantIdOrderByRoleCode(tenantId).stream()
            .map(custom -> {
                List<String> permissions = getPermissionsForTenantRole(tenantId, custom.getRoleCode());
                long count = memberCounts.getOrDefault(custom.getRoleCode().toUpperCase(Locale.ROOT), 0L);
                return new RoleResponse(
                    custom.getRoleCode(),
                    custom.getName(),
                    custom.getDescription() != null ? custom.getDescription() : "Custom role",
                    permissions,
                    false,
                    10,
                    count
                );
            })
            .collect(Collectors.toList());
        List<RoleResponse> result = new ArrayList<>(systemRoles);
        result.addAll(customRoles);
        return result;
    }

    /**
     * Get a single role (system or custom).
     */
    public RoleResponse getRole(UUID tenantId, String roleCode) {
        requireTenant(tenantId);
        String normalizedRoleCode = roleCode == null ? null : roleCode.trim().toUpperCase(Locale.ROOT);
        if (!roleExistsForTenant(tenantId, normalizedRoleCode)) {
            throw new IllegalArgumentException("Role not found: " + roleCode);
        }
        List<String> permissions = getPermissionsForTenantRole(tenantId, normalizedRoleCode);
        long memberCount = tenantUserRoleRepository.countByTenantIdAndRoleCode(tenantId, normalizedRoleCode);
        Optional<TenantCustomRole> custom = tenantCustomRoleRepository.findByTenantIdAndRoleCode(tenantId, normalizedRoleCode);
        if (custom.isPresent()) {
            return new RoleResponse(
                normalizedRoleCode,
                custom.get().getName(),
                custom.get().getDescription() != null ? custom.get().getDescription() : "Custom role",
                permissions,
                false,
                10,
                memberCount
            );
        }
        return RoleResponse.fromRole(normalizedRoleCode, permissions, memberCount);
    }

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

    /**
     * Get member counts per role for a tenant.
     */
    public Map<String, Long> getRoleMemberCounts(UUID tenantId) {
        requireTenant(tenantId);
        List<Object[]> rows = tenantUserRoleRepository.countMembersByRoleCode(tenantId);
        Map<String, Long> result = new HashMap<>();
        for (Object[] row : rows) {
            if (row.length >= 2 && row[0] != null && row[1] != null) {
                result.put(String.valueOf(row[0]).toUpperCase(Locale.ROOT), ((Number) row[1]).longValue());
            }
        }
        return result;
    }

    /** Whether the role exists for this tenant (system or custom). */
    private boolean roleExistsForTenant(UUID tenantId, String roleCode) {
        if (roleCode == null || roleCode.isBlank()) return false;
        return permissionService.roleExists(roleCode)
            || tenantCustomRoleRepository.existsByTenantIdAndRoleCode(tenantId, roleCode);
    }

    /** Permissions for a role in this tenant (from system role_permission or custom tenant_custom_role_permission). */
    private List<String> getPermissionsForTenantRole(UUID tenantId, String roleCode) {
        if (roleCode == null || roleCode.isBlank()) return List.of();
        List<TenantCustomRolePermission> custom = tenantCustomRolePermissionRepository.findByTenantIdAndRoleCode(tenantId, roleCode);
        if (!custom.isEmpty()) {
            return custom.stream().map(TenantCustomRolePermission::getPermission).toList();
        }
        return permissionService.getPermissionsForRole(roleCode);
    }

    /**
     * Create a custom role for the tenant. Fails if role code is already used (system or custom).
     */
    @Transactional
    public RoleResponse createRole(UUID tenantId, CreateRoleRequest request) {
        requireTenant(tenantId);
        String normalizedCode = request.roleCode().trim().toUpperCase(Locale.ROOT);
        if (permissionService.roleExists(normalizedCode)) {
            throw new IllegalArgumentException("Cannot create custom role with system role code: " + normalizedCode);
        }
        if (tenantCustomRoleRepository.existsByTenantIdAndRoleCode(tenantId, normalizedCode)) {
            throw new IllegalArgumentException("Role already exists: " + normalizedCode);
        }
        TenantCustomRole role = TenantCustomRole.builder()
            .tenantId(tenantId)
            .roleCode(normalizedCode)
            .name(request.name() != null ? request.name().trim() : normalizedCode)
            .description(request.description() != null ? request.description().trim() : null)
            .build();
        role = tenantCustomRoleRepository.save(role);
        List<String> perms = request.permissions() != null ? request.permissions().stream()
            .filter(p -> p != null && !p.isBlank())
            .map(String::trim)
            .distinct()
            .toList() : List.of();
        for (String perm : perms) {
            tenantCustomRolePermissionRepository.save(TenantCustomRolePermission.builder()
                .tenantId(tenantId)
                .roleCode(normalizedCode)
                .permission(perm)
                .build());
        }
        permissionService.invalidateRoleCache(normalizedCode);
        List<String> permissions = getPermissionsForTenantRole(tenantId, normalizedCode);
        return new RoleResponse(normalizedCode, role.getName(), role.getDescription() != null ? role.getDescription() : "Custom role",
            permissions, false, 10, 0L);
    }

    /**
     * Update a custom role. Only custom roles can be updated.
     */
    @Transactional
    public RoleResponse updateRole(UUID tenantId, String roleCode, UpdateRoleRequest request) {
        requireTenant(tenantId);
        String normalizedCode = roleCode == null ? null : roleCode.trim().toUpperCase(Locale.ROOT);
        TenantCustomRole role = tenantCustomRoleRepository.findByTenantIdAndRoleCode(tenantId, normalizedCode)
            .orElseThrow(() -> new IllegalArgumentException("Custom role not found: " + roleCode));
        if (request.name() != null && !request.name().isBlank()) {
            role.setName(request.name().trim());
        }
        if (request.description() != null) {
            role.setDescription(request.description().trim().isBlank() ? null : request.description().trim());
        }
        if (request.permissions() != null) {
            tenantCustomRolePermissionRepository.deleteByTenantIdAndRoleCode(tenantId, normalizedCode);
            List<String> perms = request.permissions().stream()
                .filter(p -> p != null && !p.isBlank())
                .map(String::trim)
                .distinct()
                .toList();
            for (String perm : perms) {
                tenantCustomRolePermissionRepository.save(TenantCustomRolePermission.builder()
                    .tenantId(tenantId)
                    .roleCode(normalizedCode)
                    .permission(perm)
                    .build());
            }
        }
        tenantCustomRoleRepository.save(role);
        permissionService.invalidateRoleCache(normalizedCode);
        long memberCount = tenantUserRoleRepository.countByTenantIdAndRoleCode(tenantId, normalizedCode);
        List<String> permissions = getPermissionsForTenantRole(tenantId, normalizedCode);
        return new RoleResponse(normalizedCode, role.getName(), role.getDescription() != null ? role.getDescription() : "Custom role",
            permissions, false, 10, memberCount);
    }

    /**
     * Delete a custom role. Only custom roles can be deleted. Removes the role from all members first.
     */
    @Transactional
    public void deleteRole(UUID tenantId, String roleCode) {
        requireTenant(tenantId);
        String normalizedCode = roleCode == null ? null : roleCode.trim().toUpperCase(Locale.ROOT);
        if (permissionService.roleExists(normalizedCode)) {
            throw new IllegalArgumentException("Cannot delete system role: " + roleCode);
        }
        if (!tenantCustomRoleRepository.existsByTenantIdAndRoleCode(tenantId, normalizedCode)) {
            throw new IllegalArgumentException("Custom role not found: " + roleCode);
        }
        List<UUID> userIds = tenantUserRoleRepository.findByTenantIdAndRoleCode(tenantId, normalizedCode).stream()
            .map(TenantUserRole::getUserId)
            .toList();
        if (!userIds.isEmpty()) {
            tenantUserRoleRepository.deleteByTenantIdAndRoleCodeAndUserIdIn(tenantId, normalizedCode, userIds);
        }
        tenantCustomRolePermissionRepository.deleteByTenantIdAndRoleCode(tenantId, normalizedCode);
        tenantCustomRoleRepository.deleteByTenantIdAndRoleCode(tenantId, normalizedCode);
        permissionService.invalidateRoleCache(normalizedCode);
        log.info("Deleted custom role {} in tenant {}", normalizedCode, tenantId);
    }

    // ─────────────────────────────────────────────────────────────────────────────
    // Domains & Features
    // ─────────────────────────────────────────────────────────────────────────────

    /**
     * Get all domains available to the tenant with their current enablement status.
     *
     * Domains available = domains present in tenant_domain table.
     * Domain enabled/disabled = per-tenant setting (from tenant_domain table).
     */
    public List<DomainToggleResponse> getDomains(UUID tenantId) {
        requireTenant(tenantId);
        return tenantDomainRepository.findByTenantId(tenantId).stream()
            .map(this::toDomainResponse)
            .toList();
    }
    
    /**
     * Get enabled domain IDs for a tenant.
     * Reads from tenant_domain table.
     */
    public List<String> getEnabledDomainIds(UUID tenantId) {
        requireTenant(tenantId);
        return tenantDomainRepository.findByTenantId(tenantId).stream()
            .filter(tm -> DOMAIN_STATUS_ACTIVE.equalsIgnoreCase(tm.getStatus()))
            .map(TenantDomain::getDomainCode)
            .collect(Collectors.toList());
    }
    
    /**
     * Check if a domain is enabled for a tenant.
     */
    public boolean isDomainEnabled(UUID tenantId, String domainId) {
        requireTenant(tenantId);
        return tenantDomainRepository.findByTenantIdAndDomainCode(tenantId, domainId)
            .map(tm -> DOMAIN_STATUS_ACTIVE.equalsIgnoreCase(tm.getStatus()))
            .orElse(false);
    }

    /**
     * Enable or disable a domain for a tenant.
     *
     * @param tenantId The tenant ID
     * @param domainCode The domain code to toggle
     * @param enabled Whether to enable or disable the domain
     * @return The updated domain status
     * @throws IllegalArgumentException if domain is not in the application or is a core domain
     */
    @Transactional
    public DomainToggleResponse updateDomain(UUID tenantId, String domainCode, boolean enabled) {
        requireTenant(tenantId);

        // Update or create tenant-domain status record (tenant_domain table).
        TenantDomain tenantDomain = tenantDomainRepository.findByTenantIdAndDomainCode(tenantId, domainCode)
            .orElseGet(() -> {
                TenantDomain tm = new TenantDomain();
                tm.setTenantId(tenantId);
                tm.setDomainCode(domainCode);
                return tm;
            });
        
        tenantDomain.setStatus(enabled ? DOMAIN_STATUS_ACTIVE : DOMAIN_STATUS_INACTIVE);
        tenantDomain = tenantDomainRepository.save(tenantDomain);

        log.info("Domain '{}' {} for tenant {}",
            domainCode, enabled ? "enabled" : "disabled", tenantId);

        return toDomainResponse(tenantDomain);
    }

    /**
     * Update feature flags.
     */
    @Transactional
    public void updateFeatures(UUID tenantId, Map<String, Object> features) {
        requireTenant(tenantId);
        log.info("Received feature update for tenant {}: {}", tenantId, features);
        // Feature flag persistence is intentionally deferred until a dedicated
        // feature-config storage model is introduced.
    }

    // ─────────────────────────────────────────────────────────────────────────────
    // Helper Methods
    // ─────────────────────────────────────────────────────────────────────────────

    private TenantMemberResponse toMemberResponse(
            AppUser user,
            TenantMembership membership,
            List<String> roles) {
        return new TenantMemberResponse(
            user.getId().toString(),
            user.getEmail(),
            user.getName() != null ? user.getName() : user.getEmail(),
            null, // avatarUrl - not in schema
            roles,
            membership != null && membership.getStatus() != null ? membership.getStatus().toLowerCase() : "active",
            membership != null ? formatDateTime(membership.getCreatedAt()) : formatDateTime(user.getCreatedAt()),
            formatDateTime(user.getUpdatedAt())
        );
    }

    private List<String> getTenantRoleCodes(UUID tenantId, UUID userId) {
        return tenantUserRoleRepository.findRoleCodesByTenantIdAndUserId(tenantId, userId);
    }

    private void replaceTenantRoles(UUID tenantId, UUID userId, List<String> roles) {
        List<String> normalizedRoles = roles == null ? List.of() : roles.stream()
            .filter(Objects::nonNull)
            .map(String::trim)
            .filter(role -> !role.isEmpty())
            .map(String::toUpperCase)
            .distinct()
            .toList();

        if (normalizedRoles.isEmpty()) {
            throw new IllegalArgumentException("At least one role is required");
        }

        Set<String> validRoleCodes = new HashSet<>(permissionService.getAllRoleCodes().stream()
            .map(String::toUpperCase)
            .toList());
        tenantCustomRoleRepository.findByTenantIdOrderByRoleCode(tenantId).stream()
            .map(r -> r.getRoleCode().toUpperCase(Locale.ROOT))
            .forEach(validRoleCodes::add);
        List<String> unknownRoles = normalizedRoles.stream()
            .filter(role -> !validRoleCodes.contains(role))
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

    private DomainToggleResponse toDomainResponse(TenantDomain tenantDomain) {
        String status = tenantDomain.getStatus() != null
            ? tenantDomain.getStatus().toUpperCase(Locale.ROOT)
            : DOMAIN_STATUS_INACTIVE;
        boolean enabled = DOMAIN_STATUS_ACTIVE.equalsIgnoreCase(status);

        String code = tenantDomain.getDomainCode();
        return new DomainToggleResponse(
            code,
            code,
            "",
            enabled,
            false,
            "folder",
            List.of()
        );
    }

    private String resolveApplicationId(Tenant tenant) {
        if (tenant.getApplicationId() != null && !tenant.getApplicationId().isBlank()) {
            return tenant.getApplicationId();
        }
        return defaultApplicationId;
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






