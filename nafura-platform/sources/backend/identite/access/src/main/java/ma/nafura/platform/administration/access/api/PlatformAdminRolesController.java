package ma.nafura.platform.administration.access.api;

import java.util.Comparator;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Locale;
import java.util.Map;
import java.util.UUID;
import java.util.stream.Collectors;

import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import ma.nafura.platform.administration.access.service.AccessService;
import ma.nafura.platform.authorization.security.authorization.RequirePermission;
import ma.nafura.platform.authorization.security.authorization.SecuredResource;
import ma.nafura.platform.framework.context.TenantContext;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageImpl;
import org.springframework.data.domain.PageRequest;
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
 * Record-compatible roles API for {@code nf-listing-page} / {@code nf-record-page}.
 * Tenant comes from {@code X-Tenant-Id}; delegates to {@link AccessService}.
 */
@RestController
@RequestMapping("/api/v1/platform/admin/roles")
@SecuredResource(module = "tenant", resource = "admin")
@RequiredArgsConstructor
public class PlatformAdminRolesController {

    private final AccessService access;

    @GetMapping("/properties")
    @RequirePermission(value = "tenant.roles.read", fullPermission = true)
    public Map<String, Object> properties() {
        Map<String, Object> props = new LinkedHashMap<>();
        props.put("id", Map.of("label", "Code", "filterable", true, "sortable", true));
        props.put("name", Map.of("label", "Libellé", "filterable", true, "sortable", true));
        props.put("description", Map.of("label", "Description"));
        props.put("isSystem", Map.of("label", "Système", "type", "boolean", "filterable", true));
        props.put("memberCount", Map.of("label", "Membres", "type", "number", "sortable", true));
        props.put("priority", Map.of("label", "Priorité", "type", "number", "sortable", true));
        return props;
    }

    @GetMapping
    @RequirePermission(value = "tenant.roles.read", fullPermission = true)
    public Page<RoleResponse> list(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "25") int size,
            @RequestParam(required = false) String q,
            @RequestParam(required = false) String filter) {
        UUID tenantId = tenant();
        List<RoleResponse> all = access.getRoles(tenantId);
        String needle = q == null || q.isBlank() ? "" : q.trim().toLowerCase(Locale.ROOT);
        Boolean systemOnly = null;
        if (filter != null && filter.contains("\"isSystem\"")) {
            if (filter.contains("\"is\":false") || filter.contains("\"is\": false")) systemOnly = false;
            else if (filter.contains("\"is\":true") || filter.contains("\"is\": true")) systemOnly = true;
        }
        Boolean systemFilter = systemOnly;
        List<RoleResponse> filtered = all.stream()
                .filter(role -> systemFilter == null || role.isSystem() == systemFilter)
                .filter(role -> needle.isEmpty()
                        || contains(role.id(), needle)
                        || contains(role.name(), needle)
                        || contains(role.description(), needle))
                .collect(Collectors.toList());
        filtered.sort(Comparator.comparingInt(RoleResponse::priority).reversed().thenComparing(RoleResponse::name, String.CASE_INSENSITIVE_ORDER));
        int from = Math.min(page * size, filtered.size());
        int to = Math.min(from + size, filtered.size());
        return new PageImpl<>(filtered.subList(from, to), PageRequest.of(page, size), filtered.size());
    }

    @GetMapping("/options")
    @RequirePermission(value = "tenant.roles.read", fullPermission = true)
    public List<Map<String, String>> options() {
        return access.getRoles(tenant()).stream()
                .map(role -> Map.of("value", role.id(), "label", role.name()))
                .toList();
    }

    @GetMapping("/{id}")
    @RequirePermission(value = "tenant.roles.read", fullPermission = true)
    public RoleResponse get(@PathVariable String id) {
        return access.getRole(tenant(), id);
    }

    @PostMapping
    @RequirePermission(value = "tenant.roles.write", fullPermission = true)
    public ResponseEntity<RoleResponse> create(@Valid @RequestBody CreateRoleRequest request) {
        return ResponseEntity.status(HttpStatus.CREATED).body(access.createRole(tenant(), request));
    }

    @PutMapping("/{id}")
    @RequirePermission(value = "tenant.roles.write", fullPermission = true)
    public RoleResponse update(@PathVariable String id, @RequestBody Map<String, Object> body) {
        @SuppressWarnings("unchecked")
        List<String> permissions = body.get("permissions") instanceof List<?> list
                ? list.stream().map(String::valueOf).toList()
                : null;
        UpdateRoleRequest request = new UpdateRoleRequest(
                body.get("name") instanceof String name ? name : null,
                body.get("description") instanceof String description ? description : null,
                permissions);
        return access.updateRole(tenant(), id, request);
    }

    @DeleteMapping("/{id}")
    @RequirePermission(value = "tenant.roles.write", fullPermission = true)
    public ResponseEntity<Void> delete(@PathVariable String id) {
        access.deleteRole(tenant(), id);
        return ResponseEntity.noContent().build();
    }

    private static UUID tenant() {
        UUID tenantId = TenantContext.getTenantId();
        if (tenantId == null) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Tenant required");
        }
        return tenantId;
    }

    private static boolean contains(String value, String needle) {
        return value != null && value.toLowerCase(Locale.ROOT).contains(needle);
    }
}
