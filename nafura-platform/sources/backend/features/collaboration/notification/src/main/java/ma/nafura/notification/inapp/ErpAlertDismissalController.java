package ma.nafura.platform.collaboration.notification.inapp;

import java.util.List;
import java.util.Map;
import java.util.Set;
import ma.nafura.platform.authorization.security.authorization.SecuredResource;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/v1/erp/alerts")
@SecuredResource(domain = "collaboration", feature = "collaboration", resource = "notification")
@RequiredArgsConstructor
public class ErpAlertDismissalController {

    private final ErpAlertDismissalService dismissalService;

    @GetMapping("/dismissals")
    public ResponseEntity<Map<String, Set<String>>> listDismissals() {
        return ResponseEntity.ok(Map.of("keys", dismissalService.dismissedKeysForCurrentUser()));
    }

    @PostMapping("/dismiss")
    public ResponseEntity<Void> dismiss(@RequestBody DismissRequest request) {
        dismissalService.dismiss(request.alertKey());
        return ResponseEntity.noContent().build();
    }

    @PostMapping("/dismissals/cleanup")
    public ResponseEntity<Void> cleanup(@RequestBody CleanupRequest request) {
        dismissalService.cleanupResolved(request.activeKeys());
        return ResponseEntity.noContent().build();
    }

    public record DismissRequest(String alertKey) {
    }

    public record CleanupRequest(List<String> activeKeys) {
    }
}
