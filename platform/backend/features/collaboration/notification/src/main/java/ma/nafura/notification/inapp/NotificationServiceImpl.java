package ma.nafura.platform.collaboration.notification.inapp;

import ma.nafura.platform.collaboration.notification.domain.model.Notification;
import ma.nafura.platform.collaboration.notification.repository.NotificationRepository;
import ma.nafura.platform.framework.context.TenantContext;
import ma.nafura.platform.framework.context.UserContext;
import ma.nafura.platform.framework.service.crud.CrudNotFoundException;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import jakarta.persistence.criteria.Predicate;
import java.time.OffsetDateTime;
import java.util.ArrayList;
import java.util.List;
import java.util.UUID;

@Service
@RequiredArgsConstructor
public class NotificationServiceImpl implements NotificationService {

    private final NotificationRepository notificationRepository;

    @Override
    @Transactional
    public Notification send(UUID userId, String channel, NotificationPayload payload) {
        UUID tenantId = TenantContext.getTenantId();
        String title = payload != null && payload.getTitle() != null ? payload.getTitle() : "";
        String body = payload != null ? payload.getBody() : null;
        Notification n = Notification.builder()
                .tenantId(tenantId)
                .recipientId(userId)
                .title(title)
                .body(body)
                .channel(channel != null ? channel : "in_app")
                .entityType(payload != null ? payload.getEntityType() : null)
                .entityId(payload != null ? payload.getEntityId() : null)
                .isRead(false)
                .sentAt(OffsetDateTime.now())
                .build();
        return notificationRepository.save(n);
    }

    @Override
    @Transactional(readOnly = true)
    public Page<Notification> listForCurrentUser(Pageable pageable) {
        UUID tenantId = TenantContext.getTenantId();
        UUID userId = UserContext.getUserIdOrNull();
        if (userId == null) {
            return Page.empty(pageable);
        }
        return notificationRepository.findByTenantIdAndRecipientIdOrderBySentAtDesc(tenantId, userId, pageable);
    }

    @Override
    @Transactional(readOnly = true)
    public Page<Notification> listForCurrentUser(String source, Boolean isRead, OffsetDateTime from, OffsetDateTime to, Pageable pageable) {
        UUID tenantId = TenantContext.getTenantId();
        UUID userId = UserContext.getUserIdOrNull();
        if (userId == null) {
            return Page.empty(pageable);
        }
        return notificationRepository.findAll(
                filteredSpec(tenantId, userId, source, isRead, from, to), pageable);
    }

    private Specification<Notification> filteredSpec(
            UUID tenantId,
            UUID userId,
            String source,
            Boolean isRead,
            OffsetDateTime from,
            OffsetDateTime to) {
        return (root, query, cb) -> {
            List<Predicate> predicates = new ArrayList<>();
            predicates.add(cb.equal(root.get("tenantId"), tenantId));
            predicates.add(cb.equal(root.get("recipientId"), userId));
            if (source != null && !source.isBlank()) {
                predicates.add(cb.equal(root.get("source"), source.trim()));
            }
            if (isRead != null) {
                predicates.add(cb.equal(root.get("isRead"), isRead));
            }
            if (from != null) {
                predicates.add(cb.greaterThanOrEqualTo(root.get("sentAt"), from));
            }
            if (to != null) {
                predicates.add(cb.lessThanOrEqualTo(root.get("sentAt"), to));
            }
            query.orderBy(cb.desc(root.get("sentAt")));
            return cb.and(predicates.toArray(Predicate[]::new));
        };
    }

    @Override
    @Transactional(readOnly = true)
    public long countUnreadForCurrentUser() {
        UUID tenantId = TenantContext.getTenantId();
        UUID userId = UserContext.getUserIdOrNull();
        if (userId == null) {
            return 0;
        }
        return notificationRepository.countByTenantIdAndRecipientIdAndIsReadFalse(tenantId, userId);
    }

    @Override
    @Transactional
    public void markRead(UUID notificationId) {
        Notification n = notificationRepository.findByIdAndTenantId(notificationId, TenantContext.getTenantId())
                .orElseThrow(() -> new CrudNotFoundException("Notification not found: " + notificationId));
        if (n.getRecipientId().equals(UserContext.getUserIdOrNull())) {
            n.setIsRead(true);
            n.setReadAt(OffsetDateTime.now());
            notificationRepository.save(n);
        }
    }

    @Override
    @Transactional
    public void markAllRead() {
        UUID tenantId = TenantContext.getTenantId();
        UUID userId = UserContext.getUserIdOrNull();
        if (userId == null) {
            return;
        }
        notificationRepository.markAllReadByTenantAndRecipient(tenantId, userId, OffsetDateTime.now());
    }

    @Override
    @Transactional
    public void markReadBulk(Iterable<UUID> notificationIds) {
        UUID tenantId = TenantContext.getTenantId();
        UUID userId = UserContext.getUserIdOrNull();
        if (userId == null) {
            return;
        }
        var idsList = notificationIds == null ? java.util.List.<UUID>of() : (notificationIds instanceof java.util.List
                ? (java.util.List<UUID>) notificationIds
                : java.util.stream.StreamSupport.stream(notificationIds.spliterator(), false).toList());
        if (idsList.isEmpty()) {
            return;
        }
        notificationRepository.markReadByIds(tenantId, userId, idsList, OffsetDateTime.now());
    }

    @Override
    @Transactional
    public long deleteReadBefore(OffsetDateTime before) {
        UUID tenantId = TenantContext.getTenantId();
        UUID userId = UserContext.getUserIdOrNull();
        if (userId == null || before == null) {
            return 0;
        }
        return notificationRepository.deleteReadBefore(tenantId, userId, before);
    }
}


