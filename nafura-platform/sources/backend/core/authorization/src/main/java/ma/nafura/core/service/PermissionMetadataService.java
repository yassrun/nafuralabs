package ma.nafura.platform.authorization.service;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import ma.nafura.platform.authorization.api.response.tenant.PermissionGroupResponse;
import ma.nafura.platform.authorization.repository.RolePermissionRepository;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.Locale;
import java.util.Map;
import java.util.stream.Collectors;

/**
 * Service for discovery and metadata of system permissions.
 *
 * Source: role_permission table only (manifest-free mode).
 */
@Slf4j
@Service
@RequiredArgsConstructor
public class PermissionMetadataService {

    private final RolePermissionRepository rolePermissionRepository;

    /**
     * Get all available permissions grouped by module.
     */
    public List<PermissionGroupResponse> getAllPermissions() {
        return buildFromDatabasePermissions();
    }

    /**
     * Get permissions for domains in a specific application.
     * Application filtering is not applied in manifest-free mode.
     */
    public List<PermissionGroupResponse> getPermissionsForApplication(String applicationId) {
        return buildFromDatabasePermissions();
    }

    /**
     * Get flat list of all permission codes.
     */
    public List<String> getAllPermissionCodes() {
        return rolePermissionRepository.findAll().stream()
            .map(rp -> rp.getPermission())
            .distinct()
            .collect(Collectors.toList());
    }

    /**
     * Get permission codes for a specific application.
     */
    public List<String> getPermissionCodesForApplication(String applicationId) {
        return getAllPermissionCodes();
    }

    private List<PermissionGroupResponse> buildFromDatabasePermissions() {
        List<String> codes = rolePermissionRepository.findAll().stream()
            .map(rp -> rp.getPermission())
            .filter(code -> code != null && !code.isBlank())
            .distinct()
            .collect(Collectors.toList());

        Map<String, List<String>> grouped = codes.stream()
            .collect(Collectors.groupingBy(this::moduleOf, Collectors.toList()));

        return grouped.entrySet().stream()
            .map(entry -> new PermissionGroupResponse(
                titleOf(entry.getKey()),
                entry.getKey(),
                entry.getValue().stream()
                    .sorted()
                    .map(code -> new PermissionGroupResponse.PermissionDefinition(
                        code,
                        code,
                        "",
                        entry.getKey(),
                        categoryOf(code)
                    ))
                    .collect(Collectors.toList())
            ))
            .sorted((a, b) -> a.moduleId().compareTo(b.moduleId()))
            .collect(Collectors.toList());
    }

    private String moduleOf(String code) {
        String[] parts = code.split("\\.");
        return parts.length > 1 ? parts[0] : "global";
    }

    private String categoryOf(String code) {
        String[] parts = code.split("\\.");
        return parts.length > 2 ? parts[1] : "";
    }

    private String titleOf(String moduleId) {
        if (moduleId == null || moduleId.isBlank()) return "Global";
        return moduleId.substring(0, 1).toUpperCase(Locale.ROOT) + moduleId.substring(1);
    }
}

