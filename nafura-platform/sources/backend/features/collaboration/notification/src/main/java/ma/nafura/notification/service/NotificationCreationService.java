package ma.nafura.platform.collaboration.notification.service;

import java.time.OffsetDateTime;
import java.util.Map;
import java.util.UUID;

import lombok.RequiredArgsConstructor;
import ma.nafura.platform.collaboration.notification.domain.model.Notification;
import ma.nafura.platform.collaboration.notification.domain.model.NotificationPreference;
import ma.nafura.platform.collaboration.notification.event.NotificationEvent;
import ma.nafura.platform.collaboration.notification.inapp.NotificationStreamService;
import ma.nafura.platform.collaboration.notification.repository.NotificationPreferenceRepository;
import ma.nafura.platform.collaboration.notification.repository.NotificationRepository;
import ma.nafura.platform.framework.context.TenantContext;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

/**
 * Central service responsible for creating in-app notifications from
 * {@link NotificationEvent} instances and delegating email delivery based
 * on user preferences.
 */
@Service
@RequiredArgsConstructor
public class NotificationCreationService {

    private final NotificationRepository notificationRepository;
    private final NotificationPreferenceRepository notificationPreferenceRepository;
    private final EmailService emailService;
    private final NotificationEmailRenderer notificationEmailRenderer;
    private final NotificationStreamService notificationStreamService;

    /**
     * Create an in-app notification and, if enabled for the user, send an
     * accompanying email.
     */
    @Transactional
    public Notification createAndDeliver(NotificationEvent event, String recipientEmail) {
        Notification notification = createNotification(event);
        Notification saved = notificationRepository.save(notification);

        if (shouldSendEmail(event.getRecipientId(), event.getSource())) {
            NotificationEmailRenderer.EmailContent content =
                    notificationEmailRenderer.renderForNotification(saved, event);
            emailService.sendEmail(
                    recipientEmail,
                    content.subject(),
                    content.htmlBody(),
                    content.textBody()
            );
        }

        pushRealtime(saved);

        return saved;
    }

    private void pushRealtime(Notification saved) {
        notificationStreamService.pushToUser(
                saved.getTenantId(),
                saved.getRecipientId(),
                Map.of(
                        "type", "new_notification",
                        "id", saved.getId().toString(),
                        "title", saved.getTitle(),
                        "source", saved.getSource() != null ? saved.getSource() : "system"));
        notificationStreamService.pushRefresh(saved.getTenantId(), saved.getRecipientId(), "notification");
    }

    private Notification createNotification(NotificationEvent event) {
        UUID tenantId = TenantContext.getTenantId();
        return Notification.builder()
                .tenantId(tenantId)
                .recipientId(event.getRecipientId())
                .title(event.getTitle())
                .body(event.getBody())
                .channel("in_app")
                .entityType(event.getEntityType())
                .entityId(event.getEntityId())
                .source(event.getSource())
                .actionUrl(event.getActionUrl())
                .isRead(false)
                .sentAt(OffsetDateTime.now())
                .build();
    }

    private boolean shouldSendEmail(UUID userId, String source) {
        UUID tenantId = TenantContext.getTenantId();
        NotificationPreference pref = notificationPreferenceRepository
                .findFirstByTenantIdAndUserIdAndEventType(tenantId, userId, source)
                .orElse(null);

        // Default to email enabled if no preference exists
        return pref == null || Boolean.TRUE.equals(pref.getEmailEnabled());
    }
}

