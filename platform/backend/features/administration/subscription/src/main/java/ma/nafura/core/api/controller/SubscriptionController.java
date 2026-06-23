package ma.nafura.platform.subscription.api.controller;

import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import ma.nafura.platform.subscription.api.request.UpgradePlanRequest;
import ma.nafura.platform.subscription.api.response.SubscriptionOverviewResponse;
import ma.nafura.platform.authorization.security.authorization.RequirePermission;
import ma.nafura.platform.subscription.service.SubscriptionManagementService;
import ma.nafura.platform.framework.context.TenantContext;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.UUID;

@RestController
@RequestMapping("/api/v1/administration/subscriptions")
@RequiredArgsConstructor
public class SubscriptionController {

    private final SubscriptionManagementService subscriptionManagementService;

    @GetMapping
    @RequirePermission(value = "tenant.subscriptions.read", fullPermission = true)
    public ResponseEntity<SubscriptionOverviewResponse> getOverview() {
        UUID tenantId = TenantContext.getTenantId();
        return ResponseEntity.ok(subscriptionManagementService.getOverview(tenantId));
    }

    @PostMapping("/upgrade")
    @RequirePermission(value = "tenant.subscriptions.write", fullPermission = true)
    public ResponseEntity<Void> upgradePlan(@Valid @RequestBody UpgradePlanRequest request) {
        UUID tenantId = TenantContext.getTenantId();
        subscriptionManagementService.upgradePlan(tenantId, request);
        return ResponseEntity.noContent().build();
    }
}



