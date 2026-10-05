package ma.nafura.host;

import java.util.ArrayList;
import java.util.List;

import jakarta.persistence.EntityManager;
import jakarta.persistence.metamodel.EntityType;
import ma.nafura.platform.framework.domain.OwnedEntity;
import ma.nafura.platform.framework.domain.ProductEntity;
import ma.nafura.platform.framework.domain.TenantEntity;
import ma.nafura.platform.framework.record.SharesWith;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.boot.ApplicationArguments;
import org.springframework.boot.ApplicationRunner;
import org.springframework.core.annotation.Order;

/** A business entity declares its scope. {@link SharesWith} links are collected for the consent screen. */
@Order(20)
public class EntityScopeGuard implements ApplicationRunner {

    private static final Logger log = LoggerFactory.getLogger(EntityScopeGuard.class);

    private final EntityManager entityManager;
    private final List<SharesWith> shares = new ArrayList<>();

    public EntityScopeGuard(EntityManager entityManager) {
        this.entityManager = entityManager;
    }

    public List<SharesWith> shares() {
        return List.copyOf(shares);
    }

    @Override
    public void run(ApplicationArguments args) {
        List<String> missing = new ArrayList<>();
        for (EntityType<?> type : entityManager.getMetamodel().getEntities()) {
            Class<?> java = type.getJavaType();
            Package pkg = java.getPackage();
            if (pkg != null && pkg.getName().startsWith("ma.nafura.bc.")) {
                boolean scoped = TenantEntity.class.isAssignableFrom(java)
                        || OwnedEntity.class.isAssignableFrom(java)
                        || ProductEntity.class.isAssignableFrom(java);
                if (!scoped) {
                    missing.add(java.getName());
                }
            }
            SharesWith share = java.getAnnotation(SharesWith.class);
            if (share != null) {
                shares.add(share);
                log.info("Share {} via {} fields {}", share.entity(), share.link(), List.of(share.fields()));
            }
        }
        if (!missing.isEmpty()) {
            throw new IllegalStateException("Business entities without a declared scope (organization, person or product): " + missing);
        }
    }
}
