package ma.nafura.platform.collaboration.notification.event;

import java.util.LinkedHashSet;
import java.util.Set;
import java.util.UUID;
import java.util.regex.Matcher;
import java.util.regex.Pattern;
import lombok.RequiredArgsConstructor;
import ma.nafura.platform.collaboration.comment.event.CommentCreatedEvent;
import ma.nafura.platform.collaboration.notification.service.NotificationCreationService;
import ma.nafura.platform.framework.context.TenantContext;
import ma.nafura.platform.identity.domain.model.AppUser;
import ma.nafura.platform.identity.repository.AppUserRepository;
import org.springframework.context.event.EventListener;
import org.springframework.stereotype.Component;

@Component
@RequiredArgsConstructor
public class MentionNotificationListener {

    private static final Pattern MENTION_PATTERN = Pattern.compile("@\\{([^}]+)}");

    private final NotificationCreationService notificationCreationService;
    private final AppUserRepository appUserRepository;

    @EventListener
    public void onCommentCreated(CommentCreatedEvent event) {
        if (event.getTenantId() == null || event.getBody() == null || event.getBody().isBlank()) {
            return;
        }

        Set<UUID> targetUserIds = new LinkedHashSet<>();
        Set<String> seenIdentifiers = new LinkedHashSet<>();
        Matcher matcher = MENTION_PATTERN.matcher(event.getBody());
        while (matcher.find()) {
            String rawIdentifier = matcher.group(1);
            if (rawIdentifier == null) {
                continue;
            }
            String identifier = rawIdentifier.trim();
            if (identifier.isBlank()) {
                continue;
            }
            String normalized = identifier.toLowerCase();
            if (!seenIdentifiers.add(normalized)) {
                continue;
            }
            AppUser mentioned = appUserRepository.findMentionCandidate(event.getTenantId(), identifier).orElse(null);
            if (mentioned != null && mentioned.getId() != null) {
                targetUserIds.add(mentioned.getId());
            }
        }

        for (UUID targetUserId : targetUserIds) {
            if (event.getAuthorUserId() != null && event.getAuthorUserId().equals(targetUserId)) {
                continue;
            }
            AppUser target = appUserRepository.findById(targetUserId).orElse(null);
            if (target == null || target.getEmail() == null || target.getEmail().isBlank()) {
                continue;
            }

            withTenant(event.getTenantId(), () -> {
                NotificationEvent notificationEvent = NotificationEvent.builder()
                        .sourceObject(this)
                        .recipientId(targetUserId)
                        .title("You were mentioned")
                        .body(buildMessageBody(event.getEntityType()))
                        .entityType(event.getEntityType())
                        .entityId(event.getEntityId())
                        .source("mention")
                        .actionUrl(buildActionUrl(event.getEntityType(), event.getEntityId()))
                        .build();
                notificationCreationService.createAndDeliver(notificationEvent, target.getEmail());
            });
        }
    }

    private String buildMessageBody(String entityType) {
        if (entityType == null || entityType.isBlank()) {
            return "You were mentioned in a comment.";
        }
        return "You were mentioned in a comment on " + readableEntity(entityType) + ".";
    }

    private String buildActionUrl(String entityType, UUID entityId) {
        if (entityType == null || entityType.isBlank()) {
            return "/notifications";
        }
        if (entityId == null) {
            return "/" + entityType.toLowerCase();
        }
        return "/" + entityType.toLowerCase() + "/" + entityId;
    }

    private String readableEntity(String entityType) {
        String value = entityType.replace('-', ' ').replace('_', ' ').trim();
        if (value.isEmpty()) {
            return "record";
        }
        return Character.toUpperCase(value.charAt(0)) + value.substring(1);
    }

    private void withTenant(UUID tenantId, Runnable work) {
        UUID previous = TenantContext.getTenantIdOrNull();
        try {
            TenantContext.setTenantId(tenantId);
            work.run();
        } finally {
            if (previous != null) {
                TenantContext.setTenantId(previous);
            } else {
                TenantContext.clear();
            }
        }
    }
}
