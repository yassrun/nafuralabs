package ma.nafura.platform.collaboration.notification.service;

import java.time.OffsetDateTime;
import java.util.List;
import java.util.Map;
import java.util.UUID;
import java.util.stream.Collectors;

import lombok.RequiredArgsConstructor;
import ma.nafura.platform.collaboration.notification.domain.model.Notification;
import ma.nafura.platform.collaboration.notification.repository.NotificationRepository;
import ma.nafura.platform.framework.context.TenantContext;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

/**
 * Aggregates unread notifications per user and sends a digest email.
 * Intended to be invoked by a scheduled job.
 */
@Service
@RequiredArgsConstructor
public class NotificationDigestService {

    private final NotificationRepository notificationRepository;
    private final EmailService emailService;
    private final DigestEmailRenderer digestEmailRenderer;

    /**
     * Build and send digest emails for the given users.
     *
     * @param userEmails mapping of userId → email address
     */
    @Transactional
    public void sendDigestForUsers(Map<UUID, String> userEmails) {
        UUID tenantId = TenantContext.getTenantId();
        OffsetDateTime now = OffsetDateTime.now();

        List<Notification> unread = notificationRepository
                .findByTenantIdAndIsReadFalse(tenantId);

        Map<UUID, List<Notification>> byUser = unread.stream()
                .filter(n -> userEmails.containsKey(n.getRecipientId()))
                .collect(Collectors.groupingBy(Notification::getRecipientId));

        for (Map.Entry<UUID, List<Notification>> entry : byUser.entrySet()) {
            UUID userId = entry.getKey();
            String email = userEmails.get(userId);
            List<Notification> userNotifications = entry.getValue();

            if (userNotifications.isEmpty()) {
                continue;
            }

            DigestEmailRenderer.DigestEmailContent content =
                    digestEmailRenderer.render(userNotifications);

            emailService.sendEmail(
                    email,
                    content.subject(),
                    content.htmlBody(),
                    content.textBody()
            );

            userNotifications.forEach(n -> n.setUpdatedAt(now));
            notificationRepository.saveAll(userNotifications);
        }
    }
}

