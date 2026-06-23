package ma.nafura.venuecatalog.api.controller;

import jakarta.validation.Valid;
import ma.nafura.venuecatalog.api.dto.CatalogDtos;
import ma.nafura.venuecatalog.api.mapper.CatalogDtoMapper;
import ma.nafura.venuecatalog.api.security.CatalogReadAccess;
import ma.nafura.venuecatalog.api.security.CatalogWriteAccess;
import ma.nafura.venuecatalog.job.adapter.persistence.CatalogJobEntity;
import ma.nafura.venuecatalog.job.application.CatalogJobService;
import ma.nafura.venuecatalog.job.domain.CatalogJobProvider;
import ma.nafura.venuecatalog.job.domain.CatalogJobType;
import ma.nafura.platform.jobrunner.JobStatus;
import org.springframework.data.domain.Page;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestHeader;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.server.ResponseStatusException;

import java.util.Base64;
import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/v1/catalog/jobs")
public class CatalogJobsController {

    private final CatalogJobService jobService;
    private final CatalogDtoMapper mapper;

    public CatalogJobsController(CatalogJobService jobService, CatalogDtoMapper mapper) {
        this.jobService = jobService;
        this.mapper = mapper;
    }

    @PostMapping("/google-places-search")
    @CatalogWriteAccess
    public ResponseEntity<CatalogDtos.JobAcceptedResponse> startSearchJob(
            @Valid @RequestBody CatalogDtos.GooglePlacesSearchRequest request,
            @RequestHeader(value = "Idempotency-Key", required = false) String idempotencyKey,
            @AuthenticationPrincipal Jwt jwt
    ) {
        CatalogJobEntity job = jobService.enqueueSearchJob(
                mapper.toJobRequest(request),
                subject(jwt),
                idempotencyKey
        );
        return ResponseEntity.status(HttpStatus.ACCEPTED)
                .body(new CatalogDtos.JobAcceptedResponse(job.getId(), job.getStatus().name()));
    }

    @PostMapping("/google-places-refresh")
    @CatalogWriteAccess
    public ResponseEntity<CatalogDtos.JobAcceptedResponse> startRefreshJob(
            @Valid @RequestBody CatalogDtos.GooglePlacesRefreshRequest request,
            @RequestHeader(value = "Idempotency-Key", required = false) String idempotencyKey,
            @AuthenticationPrincipal Jwt jwt
    ) {
        CatalogJobEntity job = jobService.enqueueRefreshJob(
                mapper.toJobRequest(request),
                subject(jwt),
                idempotencyKey
        );
        return ResponseEntity.status(HttpStatus.ACCEPTED)
                .body(new CatalogDtos.JobAcceptedResponse(job.getId(), job.getStatus().name()));
    }

    @GetMapping
    @CatalogReadAccess
    public CatalogDtos.JobListResponse listJobs(
            @RequestParam(required = false) JobStatus status,
            @RequestParam(required = false) CatalogJobType type,
            @RequestParam(required = false) CatalogJobProvider provider,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size
    ) {
        Page<CatalogJobEntity> jobs = jobService.listJobs(status, type, provider, page, size);
        List<CatalogDtos.JobDetailDto> items = jobs.getContent().stream().map(mapper::toJob).toList();
        String cursor = Base64.getEncoder().encodeToString(String.valueOf(page + 1).getBytes());
        return new CatalogDtos.JobListResponse(items, new CatalogDtos.PageDto(size, null, cursor));
    }

    @GetMapping("/{id}")
    @CatalogReadAccess
    public CatalogDtos.JobDetailDto getJob(@PathVariable UUID id) {
        CatalogJobEntity job = jobService.getJob(id)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "not_found"));
        return mapper.toJob(job);
    }

    private static String subject(Jwt jwt) {
        if (jwt == null) {
            return "SYSTEM";
        }
        return jwt.getSubject() != null ? jwt.getSubject() : "SYSTEM";
    }
}
