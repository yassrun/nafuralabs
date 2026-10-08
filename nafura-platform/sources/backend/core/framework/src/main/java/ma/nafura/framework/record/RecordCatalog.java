package ma.nafura.platform.framework.record;

import java.util.LinkedHashMap;
import java.util.Map;
import java.util.Optional;
import java.util.UUID;

import org.springframework.beans.factory.SmartInitializingSingleton;
import org.springframework.stereotype.Component;

import ma.nafura.platform.framework.scope.RecordScope;

/**
 * Every record descriptor registered at startup, with its API path and its read permission. Relation targets,
 * {@code via} fields and search paths are checked once they all exist: a wrong one fails startup, naming the file
 * and the property.
 */
@Component
public class RecordCatalog implements SmartInitializingSingleton {

    private final Map<String, Target> byEntity = new LinkedHashMap<>();
    private final Map<Class<?>, Target> byController = new LinkedHashMap<>();
    private final Map<Class<?>, Rules> rulesByType = new LinkedHashMap<>();

    /** A registered record: where its API lives and who may read it ({@code null}: no permission declared). */
    public record Target(RecordDescriptor descriptor, String basePath, String readPermission) {
    }

    public void register(RecordDescriptor descriptor, String basePath, String readPermission, Class<?> controller) {
        if (descriptor.entity() == null || descriptor.entity().isBlank()) {
            throw new IllegalStateException("Invalid record " + descriptor.source() + ": entity is required");
        }
        Target target = new Target(descriptor, basePath, readPermission);
        Target previous = byEntity.putIfAbsent(descriptor.entity(), target);
        if (previous != null) {
            throw new IllegalStateException("Invalid record " + descriptor.source() + ": entity " + descriptor.entity() + " is already declared by " + previous.descriptor().source());
        }
        if (controller != null) {
            byController.put(controller, target);
        }
    }

    /** The record served by this controller class, when it registered one. */
    public Target controller(Class<?> type) {
        return type == null ? null : byController.get(type);
    }

    /**
     * The business rules of a record type, from its {@link RecordController}: the seed applies them as the API does.
     * {@code validate} returns field → message (empty: valid).
     */
    public interface Rules {
        Map<String, String> validate(Object record);

        void beforeSave(Object record);

        void afterSave(Object record);
    }

    public void registerRules(Class<?> type, Rules rules) {
        Rules previous = rulesByType.putIfAbsent(type, rules);
        if (previous != null) {
            throw new IllegalStateException("Record " + type.getName() + " has two RecordControllers: its rules must live in one");
        }
    }

    public Optional<Rules> rules(Class<?> type) {
        return Optional.ofNullable(rulesByType.get(type));
    }

    public Target target(String entity) {
        return byEntity.get(entity);
    }

    public String endpoint(String entity) {
        Target target = byEntity.get(entity);
        return target == null || target.basePath() == null || target.basePath().isBlank() ? null : target.basePath();
    }

    public String optionsPath(String entity) {
        String endpoint = endpoint(entity);
        return endpoint == null ? null : endpoint + "/options";
    }

    @Override
    public void afterSingletonsInstantiated() {
        for (Target registration : byEntity.values()) {
            RecordDescriptor descriptor = registration.descriptor();
            for (RecordProperty property : descriptor.properties().values()) {
                if (!property.isRelation()) continue;
                Target target = byEntity.get(property.target());
                if (target == null) {
                    throw new IllegalStateException("Invalid record " + descriptor.source()
                            + ": property " + property.key() + ": unknown target " + property.target());
                }
                if ("relations".equals(property.type()) && target.descriptor().fieldType(property.via()) != UUID.class) {
                    throw new IllegalStateException("Invalid record " + descriptor.source()
                            + ": property " + property.key() + ": " + property.target() + " has no UUID field " + property.via());
                }
            }
            RecordScope scope = descriptor.scope();
            if (scope != null && !scope.node()) {
                Target node = byEntity.get(scope.of());
                if (node == null || node.descriptor().scope() == null || !node.descriptor().scope().node()) {
                    throw new IllegalStateException("Invalid record " + descriptor.source()
                            + ": scope of " + scope.of() + " is not a scope node");
                }
            }
            for (String path : descriptor.search()) {
                if (!path.contains(".")) continue;
                RecordProperty relation = descriptor.property(path.substring(0, path.indexOf('.')));
                RecordProperty leaf = byEntity.get(relation.target()).descriptor().property(path.substring(path.indexOf('.') + 1));
                if (leaf == null || !"text".equals(leaf.type())) {
                    throw new IllegalStateException("Invalid record " + descriptor.source()
                            + ": search " + path + ": not a text property of " + relation.target());
                }
            }
        }
    }
}
