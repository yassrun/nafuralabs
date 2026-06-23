package ma.nafura.platform.collaboration.webhook.service;

import java.time.OffsetDateTime;
import java.util.LinkedHashMap;
import java.util.Map;
import java.util.UUID;
import ma.nafura.platform.collaboration.webhook.domain.model.WebhookEvent;
import org.springframework.stereotype.Component;

@Component
public class WebhookPayloadBuilder {

    /**
     * Builds JSON payload per spec: id, event (dotted e.g. "entity.created"), timestamp, tenant, data.
     */
    public Map<String, Object> buildPayload(
            UUID deliveryId,
            WebhookEvent event,
            UUID tenantId,
            Map<String, Object> data
    ) {
        Map<String, Object> payload = new LinkedHashMap<>();
        payload.put("id", deliveryId != null ? deliveryId.toString() : null);
        payload.put("event", toDottedEventName(event));
        payload.put("timestamp", OffsetDateTime.now().toString());
        payload.put("tenant", tenantId != null ? tenantId.toString() : null);
        payload.put("data", data != null ? data : Map.of());
        return payload;
    }

    /**
     * Converts enum to dotted event name (e.g. ENTITY_CREATED -> "entity.created").
     */
    public static String toDottedEventName(WebhookEvent event) {
        if (event == null) {
            return "unknown";
        }
        return switch (event) {
            case ENTITY_CREATED -> "entity.created";
            case ENTITY_UPDATED -> "entity.updated";
            case ENTITY_DELETED -> "entity.deleted";
            case APPROVAL_REQUESTED -> "approval.requested";
            case APPROVAL_APPROVED -> "approval.approved";
            case APPROVAL_REJECTED -> "approval.rejected";
            case MEMBER_INVITED -> "member.invited";
            case MEMBER_ACTIVATED -> "member.activated";
            case DOMAIN_ACTIVATED -> "domain.activated";
        };
    }
}

