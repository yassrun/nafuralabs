package ma.nafura.platform.authorization.security.authorization;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.boot.ApplicationArguments;
import org.springframework.boot.ApplicationRunner;
import org.springframework.context.ApplicationContext;
import org.springframework.core.annotation.Order;
import org.springframework.stereotype.Component;
import org.springframework.web.bind.annotation.RestController;

import java.lang.reflect.Method;
import java.util.ArrayList;
import java.util.List;

/**
 * Validates @SecuredResource and @RequirePermission annotations at startup.
 *
 * <p>Manifest-free validation. Validation is structural only.
 */
@Slf4j
@Component
@Order(100)
@RequiredArgsConstructor
public class PermissionMappingValidator implements ApplicationRunner {
    
    private final ApplicationContext applicationContext;
    
    @Override
    public void run(ApplicationArguments args) {
        log.info("Validating permission mappings (manifest-free mode)...");

        List<String> mappings = new ArrayList<>();
        
        // Get all REST controllers
        var controllers = applicationContext.getBeansWithAnnotation(RestController.class);
        
        for (var entry : controllers.entrySet()) {
            Object controller = entry.getValue();
            Class<?> controllerClass = controller.getClass();
            
            // Skip proxy classes - get the actual class
            if (controllerClass.getName().contains("$$")) {
                controllerClass = controllerClass.getSuperclass();
            }
            
            // Check for @SecuredResource
            SecuredResource securedResource = controllerClass.getAnnotation(SecuredResource.class);
            if (securedResource == null) {
                continue;
            }
            
            String scope = resolvePermissionScope(securedResource, controllerClass);
            
            // Log the mapping
            mappings.add(String.format("  %s → %s.*",
                    controllerClass.getSimpleName(), scope));
            
            // Validate @RequirePermission on methods
            for (Method method : controllerClass.getDeclaredMethods()) {
                RequirePermission requirePermission = method.getAnnotation(RequirePermission.class);
                if (requirePermission != null && !requirePermission.fullPermission()) {
                    String action = requirePermission.value();
                    if (action == null || action.isBlank()) {
                        throw new IllegalStateException(
                                "Invalid @RequirePermission on " + controllerClass.getSimpleName() +
                                "::" + method.getName() + ": action must be non-empty");
                    }
                    String fullPermission = String.format("%s.%s", scope, action);
                    mappings.add(String.format("    %s() → %s", method.getName(), fullPermission));
                }
            }
        }

        log.info("Permission mapping validation PASSED");
        
        if (!mappings.isEmpty()) {
            log.info("Permission mappings:");
            mappings.forEach(log::info);
        }
    }

    private String resolvePermissionScope(SecuredResource securedResource, Class<?> controllerClass) {
        String domain = normalize(securedResource.domain());
        String feature = normalize(securedResource.feature());
        String module = normalize(securedResource.module());
        String resource = normalize(securedResource.resource());

        if (resource == null) {
            throw new IllegalStateException(
                    "Invalid @SecuredResource on " + controllerClass.getSimpleName() +
                    ": resource must be non-empty");
        }

        if (domain != null || feature != null) {
            if (domain == null || feature == null) {
                throw new IllegalStateException(
                        "Invalid @SecuredResource on " + controllerClass.getSimpleName() +
                        ": domain and feature must both be provided");
            }
            if (module != null) {
                log.warn("Controller {} defines both domain/feature and legacy module in @SecuredResource; using domain/feature",
                        controllerClass.getSimpleName());
            }
            return String.format("%s.%s.%s", domain, feature, resource);
        }

        if (module != null) {
            return String.format("%s.%s", module, resource);
        }

        throw new IllegalStateException(
                "Invalid @SecuredResource on " + controllerClass.getSimpleName() +
                ": provide domain+feature (preferred) or legacy module");
    }

    private String normalize(String value) {
        if (value == null) {
            return null;
        }
        String trimmed = value.trim();
        return trimmed.isEmpty() ? null : trimmed;
    }
}

