package ma.nafura.usageops.api.controller;

import lombok.RequiredArgsConstructor;
import ma.nafura.usageops.api.security.OpsSuperAdminAccess;
import ma.nafura.usageops.federation.dto.FederatedUsageDtos.TenantInfo;
import ma.nafura.usageops.federation.service.UsageFederationService;
import ma.nafura.usageops.federation.service.UsageFederationService.FleetTenantUsage;
import ma.nafura.usageops.federation.service.UsageFederationService.TenantDetailUsage;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestHeader;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.time.Instant;
import java.time.YearMonth;
import java.time.ZoneOffset;
import java.util.List;

@RestController
@RequestMapping("/api/v1/ops")
@RequiredArgsConstructor
public class OpsUsageController {

    private final UsageFederationService usageFederationService;

    @GetMapping("/tenants")
    public ResponseEntity<List<TenantInfo>> listTenants(
            @RequestHeader(value = "Authorization", required = false) String authorization) {
        OpsSuperAdminAccess.require();
        return ResponseEntity.ok(usageFederationService.listTenants(authorization));
    }

    @GetMapping("/usage/overview")
    public ResponseEntity<List<FleetTenantUsage>> overview(
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) Instant from,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) Instant to,
            @RequestParam(required = false) String productId,
            @RequestHeader(value = "Authorization", required = false) String authorization) {
        OpsSuperAdminAccess.require();
        Instant[] range = defaultMonthRange(from, to);
        return ResponseEntity.ok(usageFederationService.overview(range[0], range[1], productId, authorization));
    }

    @GetMapping("/usage/tenants/{tenantId}")
    public ResponseEntity<TenantDetailUsage> tenantDetail(
            @PathVariable String tenantId,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) Instant from,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) Instant to,
            @RequestHeader(value = "Authorization", required = false) String authorization) {
        OpsSuperAdminAccess.require();
        Instant[] range = defaultMonthRange(from, to);
        return ResponseEntity.ok(usageFederationService.tenantDetail(tenantId, range[0], range[1], authorization));
    }

    private static Instant[] defaultMonthRange(Instant from, Instant to) {
        YearMonth month = YearMonth.now(ZoneOffset.UTC);
        Instant defaultFrom = month.atDay(1).atStartOfDay().toInstant(ZoneOffset.UTC);
        Instant defaultTo = Instant.now();
        return new Instant[]{
                from != null ? from : defaultFrom,
                to != null ? to : defaultTo
        };
    }
}
