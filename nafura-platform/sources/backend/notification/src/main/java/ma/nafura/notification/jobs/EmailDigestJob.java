package ma.nafura.platform.collaboration.notification.jobs;

import java.time.DayOfWeek;
import java.time.OffsetDateTime;
import java.util.ArrayList;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.UUID;
import java.util.stream.Collectors;

import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.util.HtmlUtils;

import jakarta.persistence.EntityManager;
import jakarta.persistence.PersistenceContext;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import ma.nafura.platform.collaboration.notification.domain.model.Notification;
import ma.nafura.platform.collaboration.notification.repository.NotificationRepository;
import ma.nafura.platform.collaboration.notification.service.EmailService;
import ma.nafura.platform.collaboration.notification.service.NotificationLinkResolver;
import ma.nafura.platform.framework.scheduling.ScheduledJob;
import ma.nafura.platform.framework.scheduling.ScheduledJobContext;
import ma.nafura.platform.identity.domain.model.AppUser;
import ma.nafura.platform.identity.repository.AppUserRepository;

/**
 * Daily at 08:00: one e-mail « Vos alertes » per user with undigested in-app notifications.
 * Frequency is {@code notifications.digestFrequency} on {@code user_setting}: {@code none} | {@code daily} | {@code weekly}.
 * Weekly is sent only on Mondays by this same job.
 */
@Component
@Slf4j
@RequiredArgsConstructor
public class EmailDigestJob implements ScheduledJob {

    private static final String DIGEST_KEY = "notifications.digestFrequency";
    private static final String DEFAULT_FREQUENCY = "daily";

    private final NotificationRepository notifications;
    private final AppUserRepository users;
    private final EmailService email;
    private final NotificationLinkResolver links;

    @PersistenceContext
    private EntityManager entityManager;

    @Override
    public String key() {
        return "email-digest";
    }

    @Override
    public String cron() {
        return "0 0 8 * * *";
    }

    @Override
    public String description() {
        return "Send daily notification digest";
    }

    @Override
    public boolean tenantScoped() {
        return true;
    }

    @Override
    @Transactional
    public void execute(ScheduledJobContext context) {
        UUID tenantId = context.tenantId();
        List<Notification> pending = notifications.findUndigestedInApp(tenantId);
        if (pending.isEmpty()) {
            log.info("Job {} tenant {}: nothing to digest", key(), tenantId);
            return;
        }

        Map<UUID, List<Notification>> byRecipient = pending.stream()
                .collect(Collectors.groupingBy(Notification::getRecipientId, LinkedHashMap::new, Collectors.toList()));

        DayOfWeek today = OffsetDateTime.now().getDayOfWeek();
        boolean monday = today == DayOfWeek.MONDAY;
        int sent = 0;
        int skipped = 0;

        for (Map.Entry<UUID, List<Notification>> entry : byRecipient.entrySet()) {
            UUID userId = entry.getKey();
            List<Notification> batch = entry.getValue();
            String frequency = digestFrequency(userId);
            if ("none".equalsIgnoreCase(frequency)) {
                skipped++;
                continue;
            }
            if ("weekly".equalsIgnoreCase(frequency) && !monday) {
                skipped++;
                continue;
            }

            AppUser user = users.findById(userId).orElse(null);
            String address = user != null ? user.getEmail() : null;
            if (address == null || address.isBlank()) {
                log.info("Job {} tenant {}: skip user {} (no e-mail)", key(), tenantId, userId);
                skipped++;
                continue;
            }

            try {
                email.sendEmail(address, "Vos alertes", htmlBody(batch), textBody(batch));
                List<UUID> ids = new ArrayList<>(batch.size());
                for (Notification n : batch) {
                    ids.add(n.getId());
                }
                notifications.markDigested(tenantId, ids, OffsetDateTime.now());
                sent++;
            } catch (RuntimeException e) {
                log.warn("Job {} tenant {}: digest failed for {}: {}", key(), tenantId, address, e.getMessage());
            }
        }

        log.info("Job {} tenant {}: sent={} skipped={} pendingRecipients={}",
                key(), tenantId, sent, skipped, byRecipient.size());
    }

    /** Same table / key as user-settings — no module dependency (capability catalog). */
    @SuppressWarnings("unchecked")
    private String digestFrequency(UUID userId) {
        List<String> values = entityManager.createNativeQuery(
                        "SELECT setting_value FROM user_setting WHERE user_id = :userId AND setting_key = :key")
                .setParameter("userId", userId)
                .setParameter("key", DIGEST_KEY)
                .getResultList();
        if (values.isEmpty() || values.get(0) == null || values.get(0).isBlank()) {
            return DEFAULT_FREQUENCY;
        }
        return values.get(0).trim();
    }

    private String htmlBody(List<Notification> batch) {
        StringBuilder html = new StringBuilder();
        html.append("<h2 style=\"font-size:1.1rem;margin:0 0 16px;\">Vos alertes</h2>");
        html.append("<ul style=\"padding-left:18px;margin:0;\">");
        for (Notification n : batch) {
            html.append("<li style=\"margin:0 0 12px;\">");
            html.append("<strong>").append(HtmlUtils.htmlEscape(n.getTitle())).append("</strong>");
            if (n.getBody() != null && !n.getBody().isBlank()) {
                html.append("<br/>").append(HtmlUtils.htmlEscape(n.getBody()));
            }
            String href = links.absolute(n.getActionUrl());
            if (href != null) {
                html.append("<br/><a href=\"").append(HtmlUtils.htmlEscape(href)).append("\">Ouvrir</a>");
            }
            html.append("</li>");
        }
        html.append("</ul>");
        return html.toString();
    }

    private String textBody(List<Notification> batch) {
        StringBuilder text = new StringBuilder("Vos alertes\n\n");
        for (Notification n : batch) {
            text.append("- ").append(n.getTitle());
            if (n.getBody() != null && !n.getBody().isBlank()) {
                text.append(" — ").append(n.getBody());
            }
            String href = links.absolute(n.getActionUrl());
            if (href != null) {
                text.append("\n  Ouvrir: ").append(href);
            }
            text.append("\n");
        }
        return text.toString();
    }
}
