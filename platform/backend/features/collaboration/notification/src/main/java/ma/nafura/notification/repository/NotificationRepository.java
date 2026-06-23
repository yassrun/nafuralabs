package ma.nafura.platform.collaboration.notification.repository;

import ma.nafura.platform.collaboration.notification.domain.model.Notification;
import ma.nafura.platform.framework.repository.TenantScopedRepository;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.OffsetDateTime;
import java.util.Collection;
import java.util.UUID;

@Repository
public interface NotificationRepository extends TenantScopedRepository<Notification, UUID> {

    Page<Notification> findByTenantIdAndRecipientIdOrderBySentAtDesc(
            UUID tenantId, UUID recipientId, Pageable pageable);

    long countByTenantIdAndRecipientIdAndIsReadFalse(UUID tenantId, UUID recipientId);

    @Modifying
    @Query("UPDATE Notification n SET n.isRead = true, n.readAt = :now, n.updatedAt = :now " +
           "WHERE n.tenantId = :tenantId AND n.recipientId = :recipientId AND n.isRead = false")
    int markAllReadByTenantAndRecipient(
            @Param("tenantId") UUID tenantId,
            @Param("recipientId") UUID recipientId,
            @Param("now") OffsetDateTime now);

    @Modifying
    @Query("UPDATE Notification n SET n.isRead = true, n.readAt = :now, n.updatedAt = :now " +
           "WHERE n.tenantId = :tenantId AND n.recipientId = :recipientId AND n.id IN :ids AND n.isRead = false")
    int markReadByIds(
            @Param("tenantId") UUID tenantId,
            @Param("recipientId") UUID recipientId,
            @Param("ids") Collection<UUID> ids,
            @Param("now") OffsetDateTime now);

    @Modifying
    @Query("DELETE FROM Notification n " +
           "WHERE n.tenantId = :tenantId AND n.recipientId = :recipientId AND n.isRead = true AND n.sentAt < :before")
    int deleteReadBefore(
            @Param("tenantId") UUID tenantId,
            @Param("recipientId") UUID recipientId,
            @Param("before") OffsetDateTime before);

    java.util.List<Notification> findByTenantIdAndIsReadFalse(UUID tenantId);
}


