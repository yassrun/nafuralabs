package ma.nafura.ventes.api.controller;

import java.time.LocalDate;
import ma.nafura.platform.authorization.security.authorization.RequirePermission;
import ma.nafura.platform.authorization.security.authorization.SecuredResource;
import ma.nafura.ventes.api.dto.AnalyticsBucketResponseDto;
import ma.nafura.ventes.service.VentesAnalyticsBucketService;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/v1/ventes/analytics")
@SecuredResource(domain = "ventes", feature = "analytics", resource = "analytics")
public class VentesAnalyticsController {

    private final VentesAnalyticsBucketService service;

    public VentesAnalyticsController(VentesAnalyticsBucketService service) {
        this.service = service;
    }

    @GetMapping
    @RequirePermission("ventes.analytics.read")
    public ResponseEntity<AnalyticsBucketResponseDto> getAnalytics(
            @RequestParam(required = false) String dimensions,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate from,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate to,
            @RequestParam(required = false) String metrics) {
        return ResponseEntity.ok(service.compute(dimensions, from, to, metrics));
    }
}
