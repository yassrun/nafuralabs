package ma.nafura.platform.administration.access.roles;

import java.io.IOException;
import java.io.InputStream;
import java.util.ArrayList;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.Set;
import java.util.stream.Collectors;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import lombok.extern.slf4j.Slf4j;
import ma.nafura.platform.authorization.domain.model.RolePermission;
import ma.nafura.platform.authorization.repository.RolePermissionRepository;
import ma.nafura.platform.authorization.service.PermissionService;
import org.springframework.boot.ApplicationArguments;
import org.springframework.boot.ApplicationRunner;
import org.springframework.core.io.Resource;
import org.springframework.core.io.support.PathMatchingResourcePatternResolver;
import org.springframework.transaction.support.TransactionTemplate;

/**
 * Makes {@code role_permission} match the roles declared by configuration: the platform's generic roles,
 * business contexts' default roles and the application's cross-BC roles. Only declared role codes are
 * touched. Without an application manifest only the platform roles are declared.
 */
@Slf4j
public class DeclaredRolesSeeder implements ApplicationRunner {

    public static final String APPLICATION_MANIFEST = "classpath:nafura/app.nafura.json";
    public static final String BUSINESS_CONTEXT_MANIFESTS = "classpath*:META-INF/nafura/bc/*.json";
    public static final String PLATFORM_ROLES = "classpath:META-INF/nafura/platform/roles.json";

    private final RolePermissionRepository repository;
    private final PermissionService permissionService;
    private final TransactionTemplate transaction;
    private final ObjectMapper json = new ObjectMapper();
    private final PathMatchingResourcePatternResolver resources = new PathMatchingResourcePatternResolver();
    private volatile Map<String, DeclaredRoles.Role> declared = Map.of();
    private volatile List<BusinessContext> businessContexts = List.of();

    /** A business context the application embeds; {@code domainCode} is its permission namespace (bc.demo → demo). */
    public record BusinessContext(String id, String domainCode, String label, String icon) {
    }

    public DeclaredRolesSeeder(RolePermissionRepository repository, PermissionService permissionService,
                               TransactionTemplate transaction) {
        this.repository = repository;
        this.permissionService = permissionService;
        this.transaction = transaction;
    }

    @Override
    public void run(ApplicationArguments args) throws IOException {
        // Platform roles hold in every application; business-context and application roles need its manifest.
        Resource application = resources.getResource(APPLICATION_MANIFEST);
        JsonNode manifest = application.exists() ? read(application) : json.createObjectNode();
        List<JsonNode> contexts = new ArrayList<>();
        if (application.exists()) {
            for (Resource context : resources.getResources(BUSINESS_CONTEXT_MANIFESTS)) {
                contexts.add(read(context));
            }
        }
        Map<String, DeclaredRoles.Role> roles = DeclaredRoles.resolve(read(resources.getResource(PLATFORM_ROLES)), manifest, contexts);
        transaction.executeWithoutResult(status -> roles.values().forEach(this::sync));
        permissionService.invalidateAllRoleCaches();
        declared = Map.copyOf(roles);
        businessContexts = embeddedContexts(manifest, contexts);
        log.info("Declared roles synchronized: {}", roles.keySet());
    }

    /** Business contexts of the application, in manifest order. */
    public List<BusinessContext> businessContexts() {
        return businessContexts;
    }

    private static List<BusinessContext> embeddedContexts(JsonNode application, List<JsonNode> contexts) {
        List<BusinessContext> result = new ArrayList<>();
        for (JsonNode reference : application.path("spec").path("businessContexts")) {
            String id = reference.asText();
            contexts.stream().filter(c -> id.equals(c.path("metadata").path("id").asText())).findFirst().ifPresent(c -> {
                JsonNode spec = c.path("spec");
                result.add(new BusinessContext(id, id.substring(id.indexOf('.') + 1),
                        spec.path("label").asText(id), spec.path("icon").asText("layout-grid")));
            });
        }
        return List.copyOf(result);
    }

    /** Roles owned by configuration (platform, business contexts, application), by code. */
    public Optional<DeclaredRoles.Role> declaredRole(String code) {
        return Optional.ofNullable(code == null ? null : declared.get(code));
    }

    private void sync(DeclaredRoles.Role role) {
        List<RolePermission> current = repository.findByRoleCode(role.code());
        Set<String> present = current.stream().map(RolePermission::getPermission).collect(Collectors.toSet());
        repository.deleteAll(current.stream().filter(row -> !role.permissions().contains(row.getPermission())).toList());
        repository.saveAll(role.permissions().stream().filter(permission -> !present.contains(permission))
                .map(permission -> RolePermission.builder().roleCode(role.code()).permission(permission).build())
                .toList());
    }

    private JsonNode read(Resource resource) throws IOException {
        try (InputStream in = resource.getInputStream()) {
            return json.readTree(in);
        }
    }
}
