package ma.nafura.usageops.api.controller;

import lombok.RequiredArgsConstructor;
import ma.nafura.platform.framework.context.UserContext;
import ma.nafura.usageops.alerts.domain.UsageAlertDismissal;
import ma.nafura.usageops.alerts.domain.UsageAlertEvent;
import ma.nafura.usageops.alerts.service.SoftQuotaEvaluationJob;
import ma.nafura.usageops.alerts.service.UsageAlertService;
import ma.nafura.usageops.api.security.OpsSuperAdminAccess;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestHeader;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;
import java.util.Map;
import java.util.UUID;

@RestController
@RequestMapping("/api/v1/ops/alerts")
@RequiredArgsConstructor
public class OpsAlertController {

    private final UsageAlertService usageAlertService;
    private final SoftQuotaEvaluationJob softQuotaEvaluationJob;

    @GetMapping
    public ResponseEntity<List<UsageAlertEvent>> list() {
        OpsSuperAdminAccess.require();
        String userId = resolveUserId();
        return ResponseEntity.ok(usageAlertService.listActiveForUser(userId));
    }

    @PostMapping("/dismiss")
    public ResponseEntity<UsageAlertDismissal> dismiss(@RequestBody Map<String, String> body) {
        OpsSuperAdminAccess.require();
        String alertKey = body.get("alertKey");
        if (alertKey == null || alertKey.isBlank()) {
            return ResponseEntity.badRequest().build();
        }
        return ResponseEntity.ok(usageAlertService.dismiss(alertKey, resolveUserId()));
    }

    @PostMapping("/evaluate")
    public ResponseEntity<Map<String, Object>> evaluate(
            @RequestHeader(value = "Authorization", required = false) String authorization) {
        OpsSuperAdminAccess.require();
        int fired = softQuotaEvaluationJob.evaluate(authorization);
        return ResponseEntity.ok(Map.of("fired", fired));
    }

    private static String resolveUserId() {
        UUID userId = UserContext.getUserIdOrNull();
        if (userId != null) {
            return userId.toString();
        }
        String email = UserContext.getUserEmail();
        return email != null ? email : "ops";
    }
}
