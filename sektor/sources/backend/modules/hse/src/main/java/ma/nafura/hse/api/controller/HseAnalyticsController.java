package ma.nafura.hse.api.controller;

import java.time.LocalDate;
import ma.nafura.hse.api.dto.AnalyticsBucketResponseDto;
import ma.nafura.hse.service.HseAnalyticsBucketService;
import ma.nafura.platform.authorization.security.authorization.RequirePermission;
import ma.nafura.platform.authorization.security.authorization.SecuredResource;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/v1/hse/analytics")
@SecuredResource(domain = "hse", feature = "analytics", resource = "analytics")
public class HseAnalyticsController {

    private final HseAnalyticsBucketService service;

    public HseAnalyticsController(HseAnalyticsBucketService service) {
        this.service = service;
    }

    @GetMapping
    @RequirePermission("hse.analytics.read")
    public ResponseEntity<AnalyticsBucketResponseDto> getAnalytics(
            @RequestParam(required = false) String dimensions,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate from,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate to,
            @RequestParam(required = false) String metrics) {
        return ResponseEntity.ok(service.compute(dimensions, from, to, metrics));
    }
}
