package ma.nafura.platform.collaboration.notification.controller;

import java.util.List;
import java.util.UUID;

import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import lombok.RequiredArgsConstructor;
import ma.nafura.platform.authorization.security.authorization.RequirePermission;
import ma.nafura.platform.collaboration.notification.service.NotificationPreferences;
import ma.nafura.platform.collaboration.notification.service.NotificationPreferences.Setting;
import ma.nafura.platform.framework.context.TenantContext;
import ma.nafura.platform.framework.context.UserContext;

/**
 * Notification channels per declared event: the signed-in user's choices, and the organisation's
 * (which bound them). See {@link NotificationPreferences}.
 */
@RestController
@RequestMapping("/api/v1/platform/collaboration/notification-preferences")
@RequiredArgsConstructor
public class NotificationPreferenceController {

    private final NotificationPreferences preferences;

    public record Choice(String event, String channel, boolean enabled) {
    }

    @GetMapping
    public List<Setting> mine() {
        return preferences.forUser(TenantContext.getTenantId(), currentUser());
    }

    @PutMapping
    public ResponseEntity<List<Setting>> setMine(@RequestBody Choice choice) {
        preferences.setForUser(TenantContext.getTenantId(), currentUser(), choice.event(), choice.channel(), choice.enabled());
        return ResponseEntity.ok(mine());
    }

    @GetMapping("/organisation")
    @RequirePermission(value = "administration.notifications.configure", fullPermission = true)
    public List<Setting> organisation() {
        return preferences.forOrganisation(TenantContext.getTenantId());
    }

    @PutMapping("/organisation")
    @RequirePermission(value = "administration.notifications.configure", fullPermission = true)
    public ResponseEntity<List<Setting>> setOrganisation(@RequestBody Choice choice) {
        preferences.setForOrganisation(TenantContext.getTenantId(), choice.event(), choice.channel(), choice.enabled());
        return ResponseEntity.ok(organisation());
    }

    private static UUID currentUser() {
        UUID userId = UserContext.getUserIdOrNull();
        if (userId == null) {
            throw new IllegalStateException("Authenticated user required");
        }
        return userId;
    }
}
