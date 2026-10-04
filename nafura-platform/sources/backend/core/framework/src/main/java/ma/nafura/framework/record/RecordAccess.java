package ma.nafura.platform.framework.record;

import java.util.Map;
import java.util.UUID;
import java.util.concurrent.ConcurrentHashMap;
import java.util.function.Predicate;

import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Component;
import org.springframework.web.server.ResponseStatusException;

import ma.nafura.platform.framework.context.UserContext;

/**
 * Permissions of a record, used by attachments and notes: read to see, update to add or remove.
 * A record controller registers its entity key at startup.
 */
@Component
public class RecordAccess {

    public record Gate(String read, String update, Predicate<UUID> present) {
    }

    private final Map<String, Gate> gates = new ConcurrentHashMap<>();

    public void register(String entity, String read, String update, Predicate<UUID> present) {
        if (entity != null && !entity.isBlank()) {
            gates.put(entity, new Gate(read, update, present));
        }
    }

    public boolean known(String entity) {
        return entity != null && gates.containsKey(entity);
    }

    public void require(String entity, String id, boolean write) {
        UUID uuid;
        try {
            uuid = UUID.fromString(id);
        } catch (IllegalArgumentException | NullPointerException e) {
            throw new ResponseStatusException(HttpStatus.NOT_FOUND, "Record not found");
        }
        require(entity, uuid, write);
    }

    public void require(String entity, UUID id, boolean write) {
        Gate gate = gates.get(entity);
        if (gate == null || id == null || !gate.present().test(id)) {
            throw new ResponseStatusException(gate == null ? HttpStatus.FORBIDDEN : HttpStatus.NOT_FOUND,
                    gate == null ? "Unknown record" : "Record not found");
        }
        String permission = write ? gate.update() : gate.read();
        if (permission == null || !UserContext.hasPermission(permission)) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Permission denied: " + permission);
        }
    }
}
