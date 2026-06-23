package ma.nafura.platform.collaboration.audit;

import jakarta.persistence.criteria.Predicate;
import ma.nafura.platform.collaboration.audit.domain.model.AuditEvent;
import ma.nafura.platform.collaboration.audit.repository.AuditEventRepository;
import ma.nafura.platform.framework.context.TenantContext;
import ma.nafura.platform.framework.context.UserContext;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.util.StringUtils;

import java.time.OffsetDateTime;
import java.util.ArrayList;
import java.util.List;
import java.util.Map;
import java.util.UUID;

@Service
@RequiredArgsConstructor
public class AuditServiceImpl implements AuditService {

    private final AuditEventRepository auditEventRepository;

    @Override
    @Transactional
    public AuditEvent log(String entityType, UUID entityId, String action, Map<String, Object> payload) {
        return log(entityType, entityId, action, null, payload);
    }

    @Override
    @Transactional
    public AuditEvent log(String entityType, UUID entityId, String action, String details, Map<String, Object> payload) {
        UUID tenantId = TenantContext.getTenantId();
        String actor = UserContext.getUserEmail();
        if (actor == null || actor.isBlank()) {
            actor = "system";
        }
        AuditEvent event = AuditEvent.builder()
                .tenantId(tenantId)
                .entityType(entityType)
                .entityId(entityId)
                .action(action)
                .actor(actor)
                .eventAt(OffsetDateTime.now())
                .details(details)
                .payload(payload)
                .build();
        return auditEventRepository.save(event);
    }

    @Override
    @Transactional(readOnly = true)
    public Page<AuditEvent> getTimeline(String entityType, UUID entityId, Pageable pageable) {
        UUID tenantId = TenantContext.getTenantId();
        return auditEventRepository.findByTenantIdAndEntityTypeAndEntityIdOrderByEventAtDesc(
                tenantId, entityType, entityId, pageable);
    }

    @Override
    @Transactional(readOnly = true)
    public Page<AuditEvent> getLog(AuditLogQuery query, Pageable pageable) {
        UUID tenantId = TenantContext.getTenantId();
        Specification<AuditEvent> spec = buildLogSpecification(tenantId, query);
        return auditEventRepository.findAll(spec, pageable);
    }

    @Override
    @Transactional(readOnly = true)
    public List<String> getDistinctEntityTypes() {
        UUID tenantId = TenantContext.getTenantId();
        return auditEventRepository.findDistinctEntityTypesByTenantId(tenantId);
    }

    private Specification<AuditEvent> buildLogSpecification(UUID tenantId, AuditLogQuery query) {
        return (root, q, cb) -> {
            List<Predicate> predicates = new ArrayList<>();
            predicates.add(cb.equal(root.get("tenantId"), tenantId));

            if (query != null && StringUtils.hasText(query.getSearch())) {
                String pattern = "%" + query.getSearch().toLowerCase() + "%";
                predicates.add(cb.or(
                        cb.like(cb.lower(root.get("actor")), pattern),
                        cb.like(cb.lower(root.get("details")), pattern)
                ));
            }
            if (query != null && StringUtils.hasText(query.getEntityType())) {
                predicates.add(cb.equal(root.get("entityType"), query.getEntityType()));
            }
            if (query != null && StringUtils.hasText(query.getAction())) {
                predicates.add(cb.equal(root.get("action"), query.getAction()));
            }
            if (query != null && StringUtils.hasText(query.getActor())) {
                predicates.add(cb.like(cb.lower(root.get("actor")), "%" + query.getActor().toLowerCase() + "%"));
            }
            if (query != null && query.getFrom() != null) {
                predicates.add(cb.greaterThanOrEqualTo(root.get("eventAt"), query.getFrom()));
            }
            if (query != null && query.getTo() != null) {
                predicates.add(cb.lessThanOrEqualTo(root.get("eventAt"), query.getTo()));
            }
            return cb.and(predicates.toArray(new Predicate[0]));
        };
    }
}


