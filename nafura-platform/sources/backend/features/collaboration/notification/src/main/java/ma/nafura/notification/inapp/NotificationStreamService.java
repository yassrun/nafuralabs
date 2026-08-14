package ma.nafura.platform.collaboration.notification.inapp;

import java.io.IOException;
import java.util.Map;
import java.util.UUID;
import java.util.concurrent.ConcurrentHashMap;
import org.springframework.stereotype.Service;
import org.springframework.web.servlet.mvc.method.annotation.SseEmitter;

@Service
public class NotificationStreamService {

    private final Map<String, SseEmitter> emitters = new ConcurrentHashMap<>();

    public SseEmitter register(UUID tenantId, UUID userId) {
        String key = key(tenantId, userId);
        SseEmitter emitter = new SseEmitter(0L);
        emitters.put(key, emitter);
        emitter.onCompletion(() -> emitters.remove(key, emitter));
        emitter.onTimeout(() -> emitters.remove(key, emitter));
        emitter.onError(ex -> emitters.remove(key, emitter));
        return emitter;
    }

    public void pushToUser(UUID tenantId, UUID userId, Map<String, Object> payload) {
        String key = key(tenantId, userId);
        SseEmitter emitter = emitters.get(key);
        if (emitter == null) {
            return;
        }
        try {
            emitter.send(SseEmitter.event().name("notification").data(payload));
        } catch (IOException ex) {
            emitters.remove(key, emitter);
            emitter.completeWithError(ex);
        }
    }

    public void pushRefresh(UUID tenantId, UUID userId, String reason) {
        pushToUser(tenantId, userId, Map.of(
                "type", "refresh",
                "reason", reason != null ? reason : "update"));
    }

    private static String key(UUID tenantId, UUID userId) {
        return tenantId + ":" + userId;
    }
}
