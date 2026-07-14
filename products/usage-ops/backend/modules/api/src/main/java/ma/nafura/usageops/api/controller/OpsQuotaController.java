package ma.nafura.usageops.api.controller;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.RequiredArgsConstructor;
import ma.nafura.usageops.api.security.OpsSuperAdminAccess;
import ma.nafura.usageops.quotas.domain.UsageSoftQuota;
import ma.nafura.usageops.quotas.service.SoftQuotaService;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.math.BigDecimal;
import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/v1/ops/quotas")
@RequiredArgsConstructor
public class OpsQuotaController {

    private final SoftQuotaService softQuotaService;

    @GetMapping
    public ResponseEntity<List<UsageSoftQuota>> list() {
        OpsSuperAdminAccess.require();
        return ResponseEntity.ok(softQuotaService.listAll());
    }

    @PostMapping
    public ResponseEntity<UsageSoftQuota> create(@RequestBody QuotaRequest request) {
        OpsSuperAdminAccess.require();
        UsageSoftQuota created = softQuotaService.create(
                request.tenantId(),
                request.metricKey(),
                request.softLimit(),
                request.warnPercent(),
                request.productId(),
                request.enabled()
        );
        return ResponseEntity.status(HttpStatus.CREATED).body(created);
    }

    @PutMapping("/{id}")
    public ResponseEntity<UsageSoftQuota> update(@PathVariable UUID id, @RequestBody QuotaRequest request) {
        OpsSuperAdminAccess.require();
        return ResponseEntity.ok(softQuotaService.update(
                id,
                request.tenantId(),
                request.metricKey(),
                request.softLimit(),
                request.warnPercent(),
                request.productId(),
                request.enabled()
        ));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> delete(@PathVariable UUID id) {
        OpsSuperAdminAccess.require();
        softQuotaService.delete(id);
        return ResponseEntity.noContent().build();
    }

    public record QuotaRequest(
            String tenantId,
            @NotBlank String metricKey,
            @NotNull BigDecimal softLimit,
            Integer warnPercent,
            String productId,
            Boolean enabled
    ) {
    }
}
