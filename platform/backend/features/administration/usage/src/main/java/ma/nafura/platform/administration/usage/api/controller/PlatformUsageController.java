package ma.nafura.platform.administration.usage.api.controller;

import lombok.RequiredArgsConstructor;
import ma.nafura.platform.administration.usage.api.response.AiUsageFeatureRowResponse;
import ma.nafura.platform.administration.usage.api.response.AiUsageSummaryResponse;
import ma.nafura.platform.administration.usage.api.response.AiUsageTenantRowResponse;
import ma.nafura.platform.administration.usage.api.response.AiUsageTimeseriesPointResponse;
import ma.nafura.platform.administration.usage.api.response.StorageUsageSummaryResponse;
import ma.nafura.platform.administration.usage.api.response.StorageUsageTenantRowResponse;
import ma.nafura.platform.administration.usage.api.response.UsageTenantInfoResponse;
import ma.nafura.platform.administration.usage.security.SuperAdminAccess;
import ma.nafura.platform.administration.usage.service.AiUsageQueryService;
import ma.nafura.platform.administration.usage.service.StorageUsageQueryService;
import ma.nafura.platform.tenancy.domain.model.Tenant;
import ma.nafura.platform.tenancy.repository.TenantRepository;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.time.Instant;
import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/v1/platform/usage")
@RequiredArgsConstructor
public class PlatformUsageController {

    private final AiUsageQueryService aiUsageQueryService;
    private final StorageUsageQueryService storageUsageQueryService;
    private final TenantRepository tenantRepository;

    @GetMapping("/tenants")
    public ResponseEntity<List<UsageTenantInfoResponse>> listTenants() {
        SuperAdminAccess.require();
        List<UsageTenantInfoResponse> tenants = tenantRepository.findAll().stream()
                .map(this::toTenantInfo)
                .toList();
        return ResponseEntity.ok(tenants);
    }

    @GetMapping("/ai/summary")
    public ResponseEntity<AiUsageSummaryResponse> aiSummary(
            @RequestParam(required = false) String tenantId,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) Instant from,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) Instant to) {
        SuperAdminAccess.require();
        return ResponseEntity.ok(aiUsageQueryService.summary(tenantId, from, to));
    }

    @GetMapping("/ai/by-tenant")
    public ResponseEntity<List<AiUsageTenantRowResponse>> aiByTenant(
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) Instant from,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) Instant to) {
        SuperAdminAccess.require();
        return ResponseEntity.ok(aiUsageQueryService.byTenant(from, to));
    }

    @GetMapping("/ai/timeseries")
    public ResponseEntity<List<AiUsageTimeseriesPointResponse>> aiTimeseries(
            @RequestParam(required = false) String tenantId,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) Instant from,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) Instant to,
            @RequestParam(required = false, defaultValue = "day") String grain) {
        SuperAdminAccess.require();
        // V1 supports day grain only
        return ResponseEntity.ok(aiUsageQueryService.timeseries(tenantId, from, to));
    }

    @GetMapping("/ai/by-feature")
    public ResponseEntity<List<AiUsageFeatureRowResponse>> aiByFeature(
            @RequestParam(required = false) String tenantId,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) Instant from,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) Instant to) {
        SuperAdminAccess.require();
        return ResponseEntity.ok(aiUsageQueryService.byFeature(tenantId, from, to));
    }

    @GetMapping("/storage/summary")
    public ResponseEntity<StorageUsageSummaryResponse> storageSummary(
            @RequestParam(required = false) UUID tenantId) {
        SuperAdminAccess.require();
        return ResponseEntity.ok(storageUsageQueryService.summary(tenantId));
    }

    @GetMapping("/storage/by-tenant")
    public ResponseEntity<List<StorageUsageTenantRowResponse>> storageByTenant() {
        SuperAdminAccess.require();
        return ResponseEntity.ok(storageUsageQueryService.byTenant());
    }

    private UsageTenantInfoResponse toTenantInfo(Tenant tenant) {
        return new UsageTenantInfoResponse(
                tenant.getId(),
                tenant.getKey(),
                tenant.getName(),
                tenant.getApplicationId()
        );
    }
}
