package ma.nafura.rh.api.controller;

import java.time.LocalDate;
import ma.nafura.platform.authorization.security.authorization.RequirePermission;
import ma.nafura.platform.authorization.security.authorization.SecuredResource;
import ma.nafura.rh.api.dto.AnalyticsBucketResponseDto;
import ma.nafura.rh.service.RhAnalyticsBucketService;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/v1/rh/analytics")
@SecuredResource(domain = "rh", feature = "analytics", resource = "analytics")
public class RhAnalyticsController {

    private final RhAnalyticsBucketService service;

    public RhAnalyticsController(RhAnalyticsBucketService service) {
        this.service = service;
    }

    @GetMapping
    @RequirePermission("rh.analytics.read")
    public ResponseEntity<AnalyticsBucketResponseDto> getAnalytics(
            @RequestParam(required = false) String dimensions,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate from,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate to,
            @RequestParam(required = false) String metrics) {
        return ResponseEntity.ok(service.compute(dimensions, from, to, metrics));
    }
}
