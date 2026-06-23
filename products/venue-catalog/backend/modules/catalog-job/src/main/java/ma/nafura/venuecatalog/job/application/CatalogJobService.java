package ma.nafura.venuecatalog.job.application;

import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.ObjectMapper;
import ma.nafura.platform.integrations.googleplaces.GooglePlacesException;
import ma.nafura.platform.integrations.googleplaces.PlaceDetails;
import ma.nafura.platform.integrations.googleplaces.PlaceSearchHit;
import ma.nafura.platform.integrations.googleplaces.PlaceSearchResult;
import ma.nafura.platform.jobrunner.IdempotencyStore;
import ma.nafura.platform.jobrunner.JobLockService;
import ma.nafura.platform.jobrunner.JobStatus;
import ma.nafura.venuecatalog.compliance.MediaSyncService;
import ma.nafura.venuecatalog.job.adapter.persistence.CatalogJobEntity;
import ma.nafura.venuecatalog.job.adapter.persistence.CatalogJobRepository;
import ma.nafura.venuecatalog.job.domain.CatalogJobProvider;
import ma.nafura.venuecatalog.job.domain.CatalogJobType;
import ma.nafura.venuecatalog.job.domain.JobStepLabel;
import ma.nafura.venuecatalog.job.domain.model.JobModels;
import ma.nafura.venuecatalog.place.adapter.persistence.CatalogPlaceSourceRecordEntity;
import ma.nafura.venuecatalog.place.application.CatalogPlaceService;
import ma.nafura.venuecatalog.place.domain.CityCode;
import ma.nafura.venuecatalog.place.domain.PrimaryCategory;
import ma.nafura.venuecatalog.source.adapter.PlaceProviderPort;
import ma.nafura.venuecatalog.source.adapter.PlaceSearchQueries;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.context.annotation.Lazy;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.time.Duration;
import java.time.OffsetDateTime;
import java.util.ArrayList;
import java.util.HexFormat;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.UUID;

@Service
public class CatalogJobService {

    private static final Logger log = LoggerFactory.getLogger(CatalogJobService.class);
    private static final String IDEMPOTENCY_SCOPE = "catalog-jobs";

    private final CatalogJobRepository jobRepository;
    private final PlaceProviderPort placeProvider;
    private final CatalogPlaceService catalogPlaceService;
    private final MediaSyncService mediaSyncService;
    private final IdempotencyStore idempotencyStore;
    private final JobLockService jobLockService;
    private final ObjectMapper objectMapper;
    private final VenueCatalogJobProperties jobProperties;

    private final CatalogJobAsyncLauncher asyncLauncher;

    public CatalogJobService(
            CatalogJobRepository jobRepository,
            PlaceProviderPort placeProvider,
            CatalogPlaceService catalogPlaceService,
            MediaSyncService mediaSyncService,
            Optional<IdempotencyStore> idempotencyStore,
            Optional<JobLockService> jobLockService,
            ObjectMapper objectMapper,
            VenueCatalogJobProperties jobProperties,
            @Lazy CatalogJobAsyncLauncher asyncLauncher
    ) {
        this.jobRepository = jobRepository;
        this.placeProvider = placeProvider;
        this.catalogPlaceService = catalogPlaceService;
        this.mediaSyncService = mediaSyncService;
        this.idempotencyStore = idempotencyStore.orElse(null);
        this.jobLockService = jobLockService.orElse(null);
        this.objectMapper = objectMapper;
        this.jobProperties = jobProperties;
        this.asyncLauncher = asyncLauncher;
    }

    @Transactional
    public CatalogJobEntity enqueueSearchJob(JobModels.JobRequest request, String requestedBy, String idempotencyKey) {
        validateSearchRequest(request);
        return enqueue(CatalogJobType.GOOGLE_TEXT_SEARCH, request, requestedBy, idempotencyKey);
    }

    @Transactional
    public CatalogJobEntity enqueueRefreshJob(JobModels.JobRequest request, String requestedBy, String idempotencyKey) {
        if (request.catalogPlaceIds() == null || request.catalogPlaceIds().isEmpty()) {
            throw new JobValidationException("catalogPlaceIds required");
        }
        return enqueue(CatalogJobType.GOOGLE_DETAILS_REFRESH, request, requestedBy, idempotencyKey);
    }

    private CatalogJobEntity enqueue(CatalogJobType type, JobModels.JobRequest request, String requestedBy, String idempotencyKey) {
        String payloadHash = hashPayload(request);
        if (idempotencyKey != null && idempotencyStore != null) {
            Optional<String> existing = idempotencyStore.findExistingJobId(IDEMPOTENCY_SCOPE, idempotencyKey, payloadHash);
            if (existing.isPresent()) {
                return jobRepository.findById(UUID.fromString(existing.get())).orElseThrow();
            }
        }

        CatalogJobEntity job = new CatalogJobEntity();
        job.setType(type);
        job.setProvider(CatalogJobProvider.GOOGLE_PLACES);
        job.setStatus(JobStatus.QUEUED);
        job.setRequest(request);
        job.setRequestedBy(requestedBy);
        job.setIdempotencyKey(idempotencyKey);
        job = jobRepository.save(job);

        if (idempotencyKey != null && idempotencyStore != null) {
            idempotencyStore.remember(
                    IDEMPOTENCY_SCOPE,
                    idempotencyKey,
                    payloadHash,
                    job.getId(),
                    Duration.ofHours(jobProperties.getIdempotencyTtlHours())
            );
        }
        runAsync(job.getId());
        return job;
    }

    public void runAsync(UUID jobId) {
        if (jobLockService != null && !jobLockService.tryAcquire(jobId, Duration.ofMinutes(30))) {
            log.info("Job {} already running elsewhere", jobId);
            return;
        }
        asyncLauncher.launch(jobId);
    }

    @Transactional
    public void execute(UUID jobId) {
        try {
            executeInternal(jobId);
        } finally {
            if (jobLockService != null) {
                jobLockService.release(jobId);
            }
        }
    }

    private void executeInternal(UUID jobId) {
        CatalogJobEntity job = jobRepository.findById(jobId).orElseThrow();
        if (job.getStatus() != JobStatus.QUEUED) {
            return;
        }
        job.setStatus(JobStatus.RUNNING);
        job.setStartedAt(OffsetDateTime.now());
        jobRepository.save(job);

        try {
            switch (job.getType()) {
                case GOOGLE_TEXT_SEARCH, GOOGLE_NEARBY_SEARCH -> runSearchJob(job);
                case GOOGLE_DETAILS_REFRESH -> runRefreshJob(job);
                default -> throw new JobValidationException("Unsupported job type " + job.getType());
            }
        } catch (GooglePlacesException ex) {
            failJob(job, ex.getStatusCode() == 429 ? "provider_quota_exceeded" : "provider_error", ex.getMessage(), ex.isRetryable());
        } catch (Exception ex) {
            log.error("Job {} failed", jobId, ex);
            failJob(job, "job_failed", ex.getMessage(), true);
        }
    }

    private void runSearchJob(CatalogJobEntity job) {
        JobModels.JobRequest request = job.getRequest();
        updateProgress(job, 0, 1, JobStepLabel.SEARCH_PROVIDER.name());

        PlaceSearchResult searchResult;
        if ("NEARBY".equalsIgnoreCase(request.mode())) {
            Map<String, Object> query = request.query();
            searchResult = placeProvider.searchNearby(new PlaceSearchQueries.NearbySearchQuery(
                    doubleValue(query.get("lat")),
                    doubleValue(query.get("lng")),
                    intValue(query.get("radiusMeters"), 3000),
                    maxResults(request)
            ));
            job.setType(CatalogJobType.GOOGLE_NEARBY_SEARCH);
        } else {
            Map<String, Object> query = request.query();
            searchResult = placeProvider.searchText(new PlaceSearchQueries.TextSearchQuery(
                    stringValue(query.get("q")),
                    stringValue(query.get("countryCode")),
                    stringValue(query.get("cityCode")),
                    stringValue(query.get("primaryCategoryHint")),
                    maxResults(request)
            ));
        }

        List<PlaceSearchHit> hits = searchResult.places() == null ? List.of() : searchResult.places();
        int created = 0;
        int updated = 0;
        int skipped = 0;
        int index = 0;
        boolean refreshMedia = refreshMediaEnabled(request);

        for (PlaceSearchHit hit : hits) {
            index++;
            updateProgress(job, index, hits.size(), JobStepLabel.FETCH_DETAILS.name());
            if (hit.id() == null) {
                skipped++;
                continue;
            }
            PlaceDetails details = placeProvider.fetchDetails(hit.id());
            sleepBetweenRequests();

            updateProgress(job, index, hits.size(), JobStepLabel.UPSERT_PLACES.name());
            CityCode cityCode = CityCode.valueOf(stringValue(request.query().get("cityCode"), "OTHER"));
            PrimaryCategory hint = parseCategoryHint(request);
            CatalogPlaceService.UpsertResult upsert = catalogPlaceService.upsertFromProvider(
                    details,
                    cityCode,
                    stringValue(request.query().get("countryCode"), "MA"),
                    hint
            );
            if (upsert.created()) {
                created++;
            } else {
                updated++;
            }

            if (refreshMedia) {
                updateProgress(job, index, hits.size(), JobStepLabel.SYNC_MEDIA.name());
                mediaSyncService.syncPlaceMedia(
                        upsert.place().getId(),
                        details,
                        placeProvider::fetchPhoto
                );
            }
        }

        completeJob(job, new JobModels.JobResult(hits.size(), created, updated, 0, skipped, 0));
    }

    private void runRefreshJob(CatalogJobEntity job) {
        JobModels.JobRequest request = job.getRequest();
        List<UUID> placeIds = request.catalogPlaceIds();
        int created = 0;
        int updated = 0;
        int index = 0;
        for (UUID placeId : placeIds) {
            index++;
            updateProgress(job, index, placeIds.size(), JobStepLabel.FETCH_DETAILS.name());
            List<CatalogPlaceSourceRecordEntity> sources = catalogPlaceService.findSourceRecords(placeId);
            if (sources.isEmpty()) {
                continue;
            }
            PlaceDetails details = placeProvider.fetchDetails(sources.getFirst().getExternalId());
            sleepBetweenRequests();
            updateProgress(job, index, placeIds.size(), JobStepLabel.UPSERT_PLACES.name());
            CatalogPlaceService.UpsertResult upsert = catalogPlaceService.upsertFromProvider(
                    details,
                    catalogPlaceService.findById(placeId).orElseThrow().getCityCode(),
                    catalogPlaceService.findById(placeId).orElseThrow().getCountryCode(),
                    catalogPlaceService.findById(placeId).orElseThrow().getPrimaryCategory()
            );
            updated++;
            if (Boolean.TRUE.equals(request.refreshMedia())) {
                updateProgress(job, index, placeIds.size(), JobStepLabel.SYNC_MEDIA.name());
                mediaSyncService.syncPlaceMedia(placeId, details, placeProvider::fetchPhoto);
            }
        }
        completeJob(job, new JobModels.JobResult(placeIds.size(), created, updated, 0, 0, 0));
    }

    @Transactional(readOnly = true)
    public Optional<CatalogJobEntity> getJob(UUID id) {
        return jobRepository.findById(id);
    }

    @Transactional(readOnly = true)
    public Page<CatalogJobEntity> listJobs(JobStatus status, CatalogJobType type, CatalogJobProvider provider, int page, int size) {
        PageRequest pageable = PageRequest.of(page, size);
        if (status != null) {
            return jobRepository.findByStatus(status, pageable);
        }
        if (type != null) {
            return jobRepository.findByType(type, pageable);
        }
        if (provider != null) {
            return jobRepository.findByProvider(provider, pageable);
        }
        return jobRepository.findAll(pageable);
    }

    private void completeJob(CatalogJobEntity job, JobModels.JobResult result) {
        job.setResult(result);
        job.setProgress(new JobModels.JobProgress(result.candidatesFound(), result.candidatesFound(), "details merged"));
        job.setStatus(JobStatus.SUCCEEDED);
        job.setFinishedAt(OffsetDateTime.now());
        jobRepository.save(job);
    }

    private void failJob(CatalogJobEntity job, String code, String message, boolean retryable) {
        job.setError(new JobModels.JobError(code, message, retryable));
        job.setStatus(JobStatus.FAILED);
        job.setFinishedAt(OffsetDateTime.now());
        jobRepository.save(job);
    }

    private void updateProgress(CatalogJobEntity job, int current, int total, String stepLabel) {
        job.setProgress(new JobModels.JobProgress(current, total, stepLabel));
        jobRepository.save(job);
    }

    private static void validateSearchRequest(JobModels.JobRequest request) {
        if (request == null || request.query() == null) {
            throw new JobValidationException("query required");
        }
        if ("NEARBY".equalsIgnoreCase(request.mode())) {
            if (request.query().get("lat") == null || request.query().get("lng") == null) {
                throw new JobValidationException("lat and lng required for NEARBY mode");
            }
            return;
        }
        Object q = request.query().get("q");
        if (q == null || q.toString().isBlank()) {
            throw new JobValidationException("query.q required for TEXT mode");
        }
    }

    private static boolean refreshMediaEnabled(JobModels.JobRequest request) {
        if (request.options() == null || !request.options().containsKey("refreshMedia")) {
            return true;
        }
        Object value = request.options().get("refreshMedia");
        return value == null || Boolean.parseBoolean(value.toString());
    }

    private static Integer maxResults(JobModels.JobRequest request) {
        if (request.options() == null) {
            return 20;
        }
        return intValue(request.options().get("maxResults"), 20);
    }

    private static PrimaryCategory parseCategoryHint(JobModels.JobRequest request) {
        String hint = stringValue(request.query().get("primaryCategoryHint"), null);
        if (hint == null) {
            return PrimaryCategory.OTHER;
        }
        try {
            return PrimaryCategory.valueOf(hint);
        } catch (IllegalArgumentException ex) {
            return PrimaryCategory.OTHER;
        }
    }

    private String hashPayload(JobModels.JobRequest request) {
        try {
            byte[] bytes = objectMapper.writeValueAsBytes(request);
            MessageDigest digest = MessageDigest.getInstance("SHA-256");
            return HexFormat.of().formatHex(digest.digest(bytes));
        } catch (Exception e) {
            throw new IllegalStateException(e);
        }
    }

    private static String stringValue(Object value) {
        return stringValue(value, null);
    }

    private static String stringValue(Object value, String defaultValue) {
        return value == null ? defaultValue : value.toString();
    }

    private static int intValue(Object value, int defaultValue) {
        if (value == null) {
            return defaultValue;
        }
        if (value instanceof Number number) {
            return number.intValue();
        }
        return Integer.parseInt(value.toString());
    }

    private void sleepBetweenRequests() {
        try {
            Thread.sleep(jobProperties.getInterRequestDelayMs());
        } catch (InterruptedException e) {
            Thread.currentThread().interrupt();
            throw new IllegalStateException("Job interrupted", e);
        }
    }

    private static double doubleValue(Object value) {
        if (value instanceof Number number) {
            return number.doubleValue();
        }
        return Double.parseDouble(value.toString());
    }
}
