package ma.nafura.chantiers.api.controller;

import java.time.LocalDate;
import ma.nafura.chantiers.api.dto.AnalyticsBucketResponseDto;
import ma.nafura.chantiers.service.ChantiersAnalyticsBucketService;
import ma.nafura.platform.authorization.security.authorization.RequirePermission;
import ma.nafura.platform.authorization.security.authorization.SecuredResource;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/v1/chantiers/analytics")
@SecuredResource(domain = "chantiers", feature = "analytics", resource = "analytics")
public class ChantiersAnalyticsController {

    private final ChantiersAnalyticsBucketService service;

    public ChantiersAnalyticsController(ChantiersAnalyticsBucketService service) {
        this.service = service;
    }

    @GetMapping
    @RequirePermission("chantiers.analytics.read")
    public ResponseEntity<AnalyticsBucketResponseDto> getAnalytics(
            @RequestParam(required = false) String dimensions,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate from,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate to,
            @RequestParam(required = false) String metrics) {
        return ResponseEntity.ok(service.compute(dimensions, from, to, metrics));
    }
}
