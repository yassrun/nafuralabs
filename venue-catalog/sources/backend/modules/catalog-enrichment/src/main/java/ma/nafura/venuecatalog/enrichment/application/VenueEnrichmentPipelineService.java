package ma.nafura.venuecatalog.enrichment.application;

import ma.nafura.platform.geo.district.DistrictResolution;
import ma.nafura.platform.geo.district.DistrictResolutionMethod;
import ma.nafura.platform.geo.district.DistrictResolver;
import ma.nafura.platform.geo.district.GeoDistrict;
import ma.nafura.platform.jobrunner.JobStatus;
import ma.nafura.venuecatalog.enrichment.adapter.persistence.CatalogJobStepEntity;
import ma.nafura.venuecatalog.enrichment.adapter.persistence.CatalogJobStepRepository;
import ma.nafura.venuecatalog.enrichment.adapter.persistence.CatalogPlaceAiEnrichmentEntity;
import ma.nafura.venuecatalog.enrichment.adapter.persistence.CatalogPlaceAiEnrichmentRepository;
import ma.nafura.venuecatalog.enrichment.adapter.persistence.CatalogPlaceAppScoreEntity;
import ma.nafura.venuecatalog.enrichment.adapter.persistence.CatalogPlaceAppScoreRepository;
import ma.nafura.venuecatalog.enrichment.adapter.persistence.CatalogPlaceGeoResolutionEntity;
import ma.nafura.venuecatalog.enrichment.adapter.persistence.CatalogPlaceGeoResolutionRepository;
import ma.nafura.venuecatalog.enrichment.application.gemini.VenueGeminiClassifier;
import ma.nafura.venuecatalog.enrichment.application.scoring.UsefulnessScoreCalculator;
import ma.nafura.venuecatalog.enrichment.domain.EnrichmentModels;
import ma.nafura.venuecatalog.enrichment.domain.EnrichmentStepType;
import ma.nafura.venuecatalog.enrichment.domain.FilterDecision;
import ma.nafura.venuecatalog.enrichment.domain.UsefulnessDecision;
import ma.nafura.venuecatalog.place.adapter.persistence.CatalogPlaceEntity;
import ma.nafura.venuecatalog.place.application.CatalogPlaceService;
import ma.nafura.venuecatalog.place.application.PlaceNormalizationService;
import ma.nafura.venuecatalog.place.domain.PlaceStatus;
import ma.nafura.venuecatalog.place.domain.taxonomy.VenueMaTaxonomyV0;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.time.OffsetDateTime;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.HexFormat;
import java.util.LinkedHashMap;
import java.util.LinkedHashSet;
import java.util.List;
import java.util.Locale;
import java.util.Map;
import java.util.Optional;
import java.util.Set;
import java.util.UUID;
import java.util.stream.Collectors;

@Service
public class VenueEnrichmentPipelineService {

    private static final Logger log = LoggerFactory.getLogger(VenueEnrichmentPipelineService.class);

    private final DistrictResolver districtResolver;
    private final CatalogPlaceService catalogPlaceService;
    private final PlaceNormalizationService placeNormalizationService;
    private final CatalogPlaceGeoResolutionRepository geoRepository;
    private final CatalogPlaceAiEnrichmentRepository aiRepository;
    private final CatalogPlaceAppScoreRepository scoreRepository;
    private final CatalogJobStepRepository stepRepository;
    private final VenueGeminiClassifier geminiClassifier;
    private final UsefulnessScoreCalculator scoreCalculator;
    private final VenueCatalogEnrichmentProperties properties;
    private final com.fasterxml.jackson.databind.ObjectMapper objectMapper;

    public VenueEnrichmentPipelineService(
            DistrictResolver districtResolver,
            CatalogPlaceService catalogPlaceService,
            PlaceNormalizationService placeNormalizationService,
            CatalogPlaceGeoResolutionRepository geoRepository,
            CatalogPlaceAiEnrichmentRepository aiRepository,
            CatalogPlaceAppScoreRepository scoreRepository,
            CatalogJobStepRepository stepRepository,
            VenueGeminiClassifier geminiClassifier,
            UsefulnessScoreCalculator scoreCalculator,
            VenueCatalogEnrichmentProperties properties,
            com.fasterxml.jackson.databind.ObjectMapper objectMapper
    ) {
        this.districtResolver = districtResolver;
        this.catalogPlaceService = catalogPlaceService;
        this.placeNormalizationService = placeNormalizationService;
        this.geoRepository = geoRepository;
        this.aiRepository = aiRepository;
        this.scoreRepository = scoreRepository;
        this.stepRepository = stepRepository;
        this.geminiClassifier = geminiClassifier;
        this.scoreCalculator = scoreCalculator;
        this.properties = properties;
        this.objectMapper = objectMapper;
    }

    public EnrichmentModels.PipelinePlaceResult enrichPlace(UUID jobId, UUID placeId, EnrichmentStepType resumeFrom) {
        CatalogPlaceEntity place = catalogPlaceService.findById(placeId)
                .orElseThrow(() -> new IllegalArgumentException("Place not found: " + placeId));

        PlaceContext ctx = new PlaceContext(place);
        ctx.forceAiOverwrite = resumeFrom == EnrichmentStepType.AI_CLASSIFY;
        List<EnrichmentStepType> steps = orderedSteps(resumeFrom);
        EnrichmentStepType last = null;
        try {
            for (EnrichmentStepType step : steps) {
                last = step;
                switch (step) {
                    case RESOLVE_DISTRICT -> resolveDistrict(jobId, ctx);
                    case APPLY_HARD_FILTERS -> applyHardFilters(jobId, ctx);
                    case AI_CLASSIFY -> aiClassify(jobId, ctx);
                    case COMPUTE_USEFULNESS -> computeUsefulness(jobId, ctx);
                    case PERSIST_ENRICHMENT -> persistEnrichment(jobId, ctx);
                }
            }
            return new EnrichmentModels.PipelinePlaceResult(
                    placeId, true, false, last == null ? null : last.name(), null, null, false, details(
                    "filterDecision", ctx.filterDecision == null ? null : ctx.filterDecision.name(),
                    "verdict", ctx.verdict == null ? null : ctx.verdict.name(),
                    "shadowMode", properties.isShadowMode()
            ));
        } catch (Exception ex) {
            log.warn("Enrichment failed place={} step={}: {}", placeId, last, ex.getMessage());
            markStepFailed(jobId, placeId, last, "step_failed", ex.getMessage(), true);
            return new EnrichmentModels.PipelinePlaceResult(
                    placeId, false, true, last == null ? null : last.name(),
                    "step_failed", ex.getMessage(), true, details()
            );
        }
    }

    @Transactional(readOnly = true)
    public Optional<EnrichmentModels.PlaceEnrichmentSnapshot> getSnapshot(UUID placeId) {
        Optional<CatalogPlaceGeoResolutionEntity> geo = geoRepository.findByCatalogPlaceId(placeId);
        Optional<CatalogPlaceAiEnrichmentEntity> ai = aiRepository.findByCatalogPlaceId(placeId);
        List<CatalogPlaceAppScoreEntity> scores = scoreRepository.findByCatalogPlaceId(placeId);
        if (geo.isEmpty() && ai.isEmpty() && scores.isEmpty()) {
            return Optional.empty();
        }
        List<EnrichmentModels.AppScore> appScores = scores.stream().map(s -> new EnrichmentModels.AppScore(
                ma.nafura.venuecatalog.enrichment.domain.CatalogAppId.valueOf(s.getAppId()),
                s.getScore(),
                UsefulnessDecision.valueOf(s.getDecision()),
                s.getReasons() == null ? List.of() : s.getReasons(),
                null
        )).toList();
        return Optional.of(new EnrichmentModels.PlaceEnrichmentSnapshot(
                placeId,
                geo.map(CatalogPlaceGeoResolutionEntity::getDistrictCode).orElse(null),
                geo.map(CatalogPlaceGeoResolutionEntity::getDistrictLabel).orElse(null),
                geo.map(CatalogPlaceGeoResolutionEntity::getMethod).orElse(null),
                geo.map(CatalogPlaceGeoResolutionEntity::getConfidence).orElse(null),
                geo.map(CatalogPlaceGeoResolutionEntity::getGeoReferenceVersion).orElse(null),
                geo.map(CatalogPlaceGeoResolutionEntity::isNeedsReview).orElse(false),
                ai.map(e -> e.getVenueTypes() == null ? List.<String>of() : e.getVenueTypes()).orElse(List.of()),
                ai.map(e -> {
                    List<String> types = e.getVenueTypes();
                    return types == null || types.isEmpty() ? null : types.get(0);
                }).orElse(null),
                ai.map(e -> e.getSettings() == null ? List.<String>of() : e.getSettings()).orElse(List.of()),
                ai.map(e -> e.getOffers() == null ? List.<String>of() : e.getOffers()).orElse(List.of()),
                ai.map(e -> e.getExperiences() == null ? List.<String>of() : e.getExperiences()).orElse(List.of()),
                ai.map(e -> e.getSuitableFor() == null ? List.<String>of() : e.getSuitableFor()).orElse(List.of()),
                ai.map(e -> VenueMaTaxonomyV0.mergeFacetLists(e.getOffers(), e.getExperiences())).orElse(List.of()),
                ai.map(e -> e.getMusicStyles() == null ? List.<String>of() : e.getMusicStyles()).orElse(List.of()),
                ai.map(e -> e.getCuisines() == null ? List.<String>of() : e.getCuisines()).orElse(List.of()),
                ai.map(CatalogPlaceAiEnrichmentEntity::getConfidence).orElse(null),
                ai.map(CatalogPlaceAiEnrichmentEntity::getSelectionSuggestion).orElse(null),
                ai.map(e -> e.getFilterDecision() == null ? null : FilterDecision.valueOf(e.getFilterDecision())).orElse(null),
                ai.map(e -> e.getVerdict() == null ? null : UsefulnessDecision.valueOf(e.getVerdict())).orElse(null),
                ai.map(CatalogPlaceAiEnrichmentEntity::getCategoryFitScore).orElse(null),
                appScores,
                ai.map(e -> e.getEvidenceFields() == null ? List.<String>of() : e.getEvidenceFields()).orElse(List.of()),
                ai.map(e -> e.getWarnings() == null ? List.<String>of() : e.getWarnings()).orElse(List.of()),
                ai.isPresent() ? "ENRICHED" : geo.isPresent() ? "GEO_ONLY" : "NONE",
                ai.map(CatalogPlaceAiEnrichmentEntity::isManualOverride).orElse(false),
                ai.map(e -> e.getManualOverrideAt() == null ? null : e.getManualOverrideAt().toString()).orElse(null),
                ai.map(CatalogPlaceAiEnrichmentEntity::getManualOverrideBy).orElse(null)
        ));
    }

    @Transactional
    public EnrichmentModels.PlaceEnrichmentSnapshot applyManualTaxonomy(
            UUID placeId,
            EnrichmentModels.ManualTaxonomyOverride request,
            String actor
    ) {
        CatalogPlaceEntity place = catalogPlaceService.findById(placeId)
                .orElseThrow(() -> new IllegalArgumentException("Place not found: " + placeId));

        CatalogPlaceAiEnrichmentEntity ai = aiRepository.findByCatalogPlaceId(placeId)
                .orElseGet(CatalogPlaceAiEnrichmentEntity::new);
        ai.setCatalogPlaceId(placeId);
        if (ai.getTaxonomyVersion() == null) {
            ai.setTaxonomyVersion(VenueMaTaxonomyV0.VERSION);
        }
        if (ai.getPromptVersion() == null) {
            ai.setPromptVersion(properties.getPromptVersion() + "+manual");
        }
        if (ai.getInputHash() == null) {
            ai.setInputHash("manual-override");
        }
        if (ai.getModel() == null) {
            ai.setModel("manual");
        }

        List<String> venueTypes = normalizeVenueTypes(request.venueTypes(), ai.getVenueTypes());
        List<String> settings = normalizeFacet(
                request.settings() != null ? request.settings() : ai.getSettings(),
                VenueMaTaxonomyV0.settingValues(),
                "invalid_setting"
        );
        if (request.settings() == null && settings.isEmpty()) {
            settings = List.of("INDOOR");
        }
        List<String> offers = normalizeOffers(
                request.offers() != null ? request.offers() : ai.getOffers(),
                request.servesAlcohol()
        );
        List<String> experiences = normalizeFacet(
                request.experiences() != null ? request.experiences() : ai.getExperiences(),
                VenueMaTaxonomyV0.experienceValues(),
                "invalid_experience"
        );
        List<String> suitableFor = normalizeFacet(
                request.suitableFor() != null ? request.suitableFor() : ai.getSuitableFor(),
                VenueMaTaxonomyV0.suitableForValues(),
                "invalid_suitable_for"
        );

        ai.setVenueTypes(venueTypes);
        ai.setSettings(settings);
        ai.setOffers(offers);
        ai.setExperiences(experiences);
        ai.setSuitableFor(suitableFor);
        ai.setActivities(VenueMaTaxonomyV0.mergeFacetLists(offers, experiences));
        ai.setExperienceTags(experiences);
        ai.setAudienceTags(suitableFor);
        if (request.musicStyles() != null) {
            ai.setMusicStyles(sanitizeList(request.musicStyles()));
        }
        if (request.cuisines() != null) {
            ai.setCuisines(sanitizeList(request.cuisines()));
        }

        List<String> warnings = new ArrayList<>(ai.getWarnings() == null ? List.of() : ai.getWarnings());
        warnings.removeIf(w -> w != null && w.startsWith("manual_override"));
        warnings.add("manual_override");
        ai.setWarnings(warnings);

        if (request.servesAlcohol() != null) {
            var attrs = place.getAttributes();
            place.setAttributes(new ma.nafura.venuecatalog.place.domain.model.PlaceModels.PlaceAttributes(
                    request.servesAlcohol(),
                    attrs == null ? null : attrs.reservable(),
                    attrs == null ? null : attrs.wheelchairAccessible(),
                    attrs == null ? null : attrs.takeout()
            ));
            catalogPlaceService.savePlace(place);
        }

        EnrichmentModels.VenueClassification classification = toClassification(ai);
        int mediaCount = (int) catalogPlaceService.countActiveMedia(placeId);
        List<EnrichmentModels.AppScore> appScores = scoreCalculator.compute(place, classification, mediaCount);
        UsefulnessDecision verdict = request.verdict() != null && !request.verdict().isBlank()
                ? UsefulnessDecision.valueOf(request.verdict().trim().toUpperCase(Locale.ROOT))
                : scoreCalculator.globalVerdict(appScores);

        ai.setCategoryFitScore(classification.categoryFitScore());
        ai.setConfidence(Math.max(classification.confidence(), 0.9));
        ai.setSelectionSuggestion(verdict.name());
        ai.setVerdict(verdict.name());
        if (ai.getFilterDecision() == null) {
            ai.setFilterDecision(FilterDecision.CONTINUE.name());
        }
        ai.setManualOverride(true);
        ai.setManualOverrideAt(OffsetDateTime.now());
        ai.setManualOverrideBy(actor == null || actor.isBlank() ? "catalog-operator" : actor);
        aiRepository.save(ai);

        Map<String, CatalogPlaceAppScoreEntity> existingScores = new HashMap<>();
        for (CatalogPlaceAppScoreEntity score : scoreRepository.findByCatalogPlaceId(placeId)) {
            existingScores.put(score.getAppId(), score);
        }
        for (EnrichmentModels.AppScore score : appScores) {
            CatalogPlaceAppScoreEntity entity = existingScores.getOrDefault(score.appId().name(), new CatalogPlaceAppScoreEntity());
            entity.setCatalogPlaceId(placeId);
            entity.setAppId(score.appId().name());
            entity.setScore(score.score());
            entity.setDecision(score.decision().name());
            entity.setReasons(score.reasons());
            if (score.breakdown() != null) {
                entity.setScoreBreakdown(objectMapper.convertValue(score.breakdown(), Map.class));
            }
            scoreRepository.save(entity);
        }

        return getSnapshot(placeId).orElseThrow();
    }

    @Transactional
    public EnrichmentModels.PlaceEnrichmentSnapshot applyManualDistrict(
            UUID placeId,
            String districtCode,
            String actor
    ) {
        CatalogPlaceEntity place = catalogPlaceService.findById(placeId)
                .orElseThrow(() -> new IllegalArgumentException("Place not found: " + placeId));
        if (districtCode == null || districtCode.isBlank()) {
            throw new IllegalArgumentException("districtCode required");
        }
        String code = districtCode.trim().toUpperCase(Locale.ROOT);
        String citySlug = place.getCityCode() == null
                ? "casablanca"
                : place.getCityCode().name().toLowerCase(Locale.ROOT);
        GeoDistrict district = districtResolver.listDistricts(citySlug).stream()
                .filter(d -> code.equalsIgnoreCase(d.code()))
                .findFirst()
                .orElseThrow(() -> new IllegalArgumentException("Unknown districtCode: " + code));

        CatalogPlaceGeoResolutionEntity entity = geoRepository.findByCatalogPlaceId(placeId)
                .orElseGet(CatalogPlaceGeoResolutionEntity::new);
        entity.setCatalogPlaceId(placeId);
        entity.setDistrictCode(district.code());
        entity.setDistrictLabel(district.label());
        entity.setMethod(DistrictResolutionMethod.MANUAL.name());
        entity.setConfidence(1.0);
        entity.setGeoReferenceVersion(districtResolver.currentVersion(citySlug));
        entity.setGeoHash(geoHash(place));
        entity.setNeedsReview(false);
        entity.setNotes("manual_override by " + (actor == null || actor.isBlank() ? "catalog-operator" : actor));
        geoRepository.save(entity);

        if (place.getAddress() != null) {
            var address = place.getAddress();
            place.setAddress(new ma.nafura.venuecatalog.place.domain.model.PlaceModels.Address(
                    address.line1(),
                    district.label(),
                    address.postalCode(),
                    address.cityLabel(),
                    address.countryCode()
            ));
        }
        place.setCanonicalName(placeNormalizationService.cleanCanonicalName(
                place.getCanonicalName(),
                district.label(),
                place.getCityCode()
        ));
        catalogPlaceService.savePlace(place);
        return getSnapshot(placeId).orElseThrow();
    }

    @Transactional(readOnly = true)
    public List<CatalogJobStepEntity> listSteps(UUID jobId) {
        return stepRepository.findByJobIdOrderByCreatedAtAsc(jobId);
    }

    private void resolveDistrict(UUID jobId, PlaceContext ctx) {
        CatalogJobStepEntity step = beginStep(jobId, ctx.place.getId(), EnrichmentStepType.RESOLVE_DISTRICT);
        Optional<CatalogPlaceGeoResolutionEntity> existing = geoRepository.findByCatalogPlaceId(ctx.place.getId());
        if (existing.isPresent()
                && DistrictResolutionMethod.MANUAL.name().equals(existing.get().getMethod())) {
            ctx.geo = existing.get();
            completeStep(step, true, "manual_district_sticky", details(
                    "districtCode", existing.get().getDistrictCode(),
                    "method", existing.get().getMethod()
            ));
            return;
        }

        String geoHash = geoHash(ctx.place);
        String citySlug = citySlug(ctx.place);
        String version = districtResolver.currentVersion(citySlug);
        if (existing.isPresent()
                && geoHash.equals(existing.get().getGeoHash())
                && version != null
                && version.equals(existing.get().getGeoReferenceVersion())) {
            ctx.geo = existing.get();
            String label = existing.get().getDistrictLabel();
            if (label != null && !label.isBlank()) {
                String cleaned = placeNormalizationService.cleanCanonicalName(
                        ctx.place.getCanonicalName(), label, ctx.place.getCityCode());
                if (!cleaned.equals(ctx.place.getCanonicalName())) {
                    ctx.place.setCanonicalName(cleaned);
                    catalogPlaceService.savePlace(ctx.place);
                }
            }
            completeStep(step, true, "unchanged_geo_hash_version", details(
                    "districtCode", existing.get().getDistrictCode(),
                    "method", existing.get().getMethod()
            ));
            return;
        }

        String addressText = ctx.place.getAddress() == null ? null :
                String.join(" ",
                        nullToEmpty(ctx.place.getAddress().line1()),
                        nullToEmpty(ctx.place.getAddress().district()),
                        nullToEmpty(ctx.place.getAddress().cityLabel()));
        DistrictResolution resolution = districtResolver.resolve(
                citySlug,
                ctx.place.getGeo().lat(),
                ctx.place.getGeo().lng(),
                addressText
        );

        CatalogPlaceGeoResolutionEntity entity = existing.orElseGet(CatalogPlaceGeoResolutionEntity::new);
        entity.setCatalogPlaceId(ctx.place.getId());
        entity.setDistrictCode(resolution.districtCode());
        entity.setDistrictLabel(resolution.districtLabel());
        entity.setMethod(resolution.method().name());
        entity.setConfidence(resolution.confidence());
        entity.setGeoReferenceVersion(resolution.geoReferenceVersion());
        entity.setGeoHash(geoHash);
        entity.setNeedsReview(resolution.needsReview());
        entity.setNotes(resolution.notes());
        ctx.geo = geoRepository.save(entity);

        boolean dirty = false;
        // Project district onto address for operator visibility without changing REVIEWED status.
        if (resolution.districtLabel() != null && ctx.place.getAddress() != null
                && ctx.place.getStatus() != PlaceStatus.REVIEWED) {
            var address = ctx.place.getAddress();
            ctx.place.setAddress(new ma.nafura.venuecatalog.place.domain.model.PlaceModels.Address(
                    address.line1(),
                    resolution.districtLabel(),
                    address.postalCode(),
                    address.cityLabel(),
                    address.countryCode()
            ));
            dirty = true;
        }
        // Keep brand · district naming in sync when geo resolves a district.
        if (resolution.districtLabel() != null && !resolution.districtLabel().isBlank()) {
            String cleaned = placeNormalizationService.cleanCanonicalName(
                    ctx.place.getCanonicalName(),
                    resolution.districtLabel(),
                    ctx.place.getCityCode()
            );
            if (!cleaned.equals(ctx.place.getCanonicalName())) {
                ctx.place.setCanonicalName(cleaned);
                dirty = true;
            }
        }
        if (dirty) {
            catalogPlaceService.savePlace(ctx.place);
        }

        completeStep(step, false, null, details(
                "districtCode", resolution.districtCode(),
                "method", resolution.method().name(),
                "confidence", resolution.confidence(),
                "needsReview", resolution.needsReview()
        ));
    }

    private void applyHardFilters(UUID jobId, PlaceContext ctx) {
        CatalogJobStepEntity step = beginStep(jobId, ctx.place.getId(), EnrichmentStepType.APPLY_HARD_FILTERS);
        List<String> reasons = new ArrayList<>();
        FilterDecision decision = FilterDecision.CONTINUE;

        var rating = ctx.place.getProviderRating();
        if (rating != null && rating.businessStatus() != null
                && "CLOSED_PERMANENTLY".equalsIgnoreCase(rating.businessStatus())) {
            decision = FilterDecision.DROP_SUGGESTED;
            reasons.add("closed_permanently");
        }
        if (ctx.place.getGeo() == null) {
            decision = FilterDecision.NEEDS_DATA;
            reasons.add("missing_geo");
        }
        if (ctx.geo != null && ctx.geo.getDistrictCode() == null) {
            decision = worse(decision, FilterDecision.REVIEW);
            reasons.add("unresolved_district");
        }
        if (ctx.place.getQuality() != null
                && ctx.place.getQuality().duplicateCandidateIds() != null
                && !ctx.place.getQuality().duplicateCandidateIds().isEmpty()) {
            decision = worse(decision, FilterDecision.REVIEW);
            reasons.add("strong_duplicate_candidates");
        }
        if (ctx.place.getCanonicalName() == null || ctx.place.getCanonicalName().isBlank()) {
            decision = worse(decision, FilterDecision.NEEDS_DATA);
            reasons.add("missing_name");
        }

        ctx.filterDecision = decision;
        completeStep(step, false, null, Map.of(
                "decision", decision.name(),
                "reasons", reasons,
                "shadowMode", properties.isShadowMode()
        ));
    }

    private void aiClassify(UUID jobId, PlaceContext ctx) {
        CatalogJobStepEntity step = beginStep(jobId, ctx.place.getId(), EnrichmentStepType.AI_CLASSIFY);
        if (ctx.filterDecision == FilterDecision.DROP_SUGGESTED || ctx.filterDecision == FilterDecision.NEEDS_DATA) {
            ctx.classification = new EnrichmentModels.VenueClassification(
                    List.of("UNKNOWN"),
                    List.of(),
                    List.of(),
                    List.of(),
                    List.of(),
                    List.of(),
                    List.of(),
                    0.2,
                    0.2,
                    List.of(),
                    List.of("skipped_by_hard_filter"),
                    "DROP_SUGGESTED"
            );
            completeStep(step, true, "hard_filter_" + ctx.filterDecision.name(), Map.of(
                    "filterDecision", ctx.filterDecision.name()
            ));
            return;
        }

        Optional<CatalogPlaceAiEnrichmentEntity> existing = aiRepository.findByCatalogPlaceId(ctx.place.getId());
        if (existing.isPresent()
                && existing.get().isManualOverride()
                && !ctx.forceAiOverwrite
                && hasVenueTypes(existing.get())) {
            ctx.classification = toClassification(existing.get());
            ctx.usageRequestId = existing.get().getUsageRequestId();
            ctx.inputHash = existing.get().getInputHash();
            ctx.preserveManualOverride = true;
            completeStep(step, true, "manual_override_preserved", Map.of(
                    "venueTypes", existing.get().getVenueTypes(),
                    "manualOverrideBy", nullToEmpty(existing.get().getManualOverrideBy())
            ));
            return;
        }

        String inputHash = sha256(geminiClassifier.writeJsonSafe(geminiClassifier.buildMinimalInput(ctx.place)));
        if (existing.isPresent()
                && inputHash.equals(existing.get().getInputHash())
                && VenueMaTaxonomyV0.VERSION.equals(existing.get().getTaxonomyVersion())
                && properties.getPromptVersion().equals(existing.get().getPromptVersion())
                && hasVenueTypes(existing.get())
                && !ctx.forceAiOverwrite) {
            ctx.classification = toClassification(existing.get());
            ctx.usageRequestId = existing.get().getUsageRequestId();
            ctx.inputHash = inputHash;
            ctx.preserveManualOverride = existing.get().isManualOverride();
            completeStep(step, true, "unchanged_input_hash", Map.of(
                    "venueTypes", existing.get().getVenueTypes(),
                    "inputHash", inputHash
            ));
            return;
        }

        VenueGeminiClassifier.ClassificationResult result = geminiClassifier.classify(ctx.place, inputHash);
        ctx.classification = result.classification();
        ctx.usageRequestId = result.usageRequestId();
        ctx.inputHash = inputHash;
        ctx.structuredOutput = readMap(result.structuredJson());
        ctx.preserveManualOverride = false;
        completeStep(step, false, null, Map.of(
                "venueTypes", ctx.classification.venueTypes(),
                "confidence", ctx.classification.confidence(),
                "selectionSuggestion", ctx.classification.selectionSuggestion()
        ));
    }

    private void computeUsefulness(UUID jobId, PlaceContext ctx) {
        CatalogJobStepEntity step = beginStep(jobId, ctx.place.getId(), EnrichmentStepType.COMPUTE_USEFULNESS);
        int mediaCount = (int) catalogPlaceService.countActiveMedia(ctx.place.getId());
        ctx.appScores = scoreCalculator.compute(ctx.place, ctx.classification, mediaCount);
        ctx.verdict = scoreCalculator.globalVerdict(ctx.appScores);
        if (ctx.filterDecision == FilterDecision.DROP_SUGGESTED) {
            ctx.verdict = UsefulnessDecision.DROP_SUGGESTED;
        } else if (ctx.filterDecision == FilterDecision.NEEDS_DATA || ctx.filterDecision == FilterDecision.REVIEW) {
            if (ctx.verdict == UsefulnessDecision.KEEP) {
                ctx.verdict = UsefulnessDecision.REVIEW;
            }
        }
        completeStep(step, false, null, Map.of(
                "verdict", ctx.verdict.name(),
                "scores", ctx.appScores.stream().map(s -> Map.of(
                        "appId", s.appId().name(),
                        "score", s.score(),
                        "decision", s.decision().name()
                )).toList()
        ));
    }

    private void persistEnrichment(UUID jobId, PlaceContext ctx) {
        CatalogJobStepEntity step = beginStep(jobId, ctx.place.getId(), EnrichmentStepType.PERSIST_ENRICHMENT);
        CatalogPlaceAiEnrichmentEntity ai = aiRepository.findByCatalogPlaceId(ctx.place.getId())
                .orElseGet(CatalogPlaceAiEnrichmentEntity::new);
        ai.setCatalogPlaceId(ctx.place.getId());
        ai.setTaxonomyVersion(VenueMaTaxonomyV0.VERSION);
        ai.setPromptVersion(properties.getPromptVersion());
        ai.setInputHash(ctx.inputHash == null ? "n/a" : ctx.inputHash);
        if (ctx.classification != null) {
            List<String> settings = ctx.classification.settings();
            if (settings == null || settings.isEmpty()) {
                settings = List.of("INDOOR");
            }
            ai.setVenueTypes(ctx.classification.venueTypes());
            ai.setSettings(settings);
            ai.setOffers(ctx.classification.offers());
            ai.setExperiences(ctx.classification.experiences());
            ai.setSuitableFor(ctx.classification.suitableFor());
            ai.setActivities(ctx.classification.activities());
            ai.setExperienceTags(ctx.classification.experiences());
            ai.setAudienceTags(ctx.classification.suitableFor());
            ai.setMusicStyles(ctx.classification.musicStyles());
            ai.setCuisines(ctx.classification.cuisines());
            ai.setCategoryFitScore(ctx.classification.categoryFitScore());
            ai.setConfidence(ctx.classification.confidence());
            ai.setEvidenceFields(ctx.classification.evidenceFields());
            ai.setWarnings(ctx.classification.warnings());
            ai.setSelectionSuggestion(ctx.classification.selectionSuggestion());
        }
        if (ctx.structuredOutput != null) {
            ai.setStructuredOutput(ctx.structuredOutput);
        }
        ai.setFilterDecision(ctx.filterDecision == null ? null : ctx.filterDecision.name());
        ai.setVerdict(ctx.verdict == null ? null : ctx.verdict.name());
        ai.setUsageRequestId(ctx.usageRequestId);
        if (!ctx.preserveManualOverride) {
            ai.setManualOverride(false);
            ai.setManualOverrideAt(null);
            ai.setManualOverrideBy(null);
        }
        aiRepository.save(ai);

        Map<String, CatalogPlaceAppScoreEntity> existingScores = new HashMap<>();
        for (CatalogPlaceAppScoreEntity score : scoreRepository.findByCatalogPlaceId(ctx.place.getId())) {
            existingScores.put(score.getAppId(), score);
        }
        if (ctx.appScores != null) {
            for (EnrichmentModels.AppScore score : ctx.appScores) {
                CatalogPlaceAppScoreEntity entity = existingScores.getOrDefault(score.appId().name(), new CatalogPlaceAppScoreEntity());
                entity.setCatalogPlaceId(ctx.place.getId());
                entity.setAppId(score.appId().name());
                entity.setScore(score.score());
                entity.setDecision(score.decision().name());
                entity.setReasons(score.reasons());
                if (score.breakdown() != null) {
                    entity.setScoreBreakdown(objectMapper.convertValue(score.breakdown(), Map.class));
                }
                scoreRepository.save(entity);
            }
        }

        // Shadow mode: never auto-archive / never change REVIEWED.
        completeStep(step, false, null, Map.of(
                "persisted", true,
                "shadowMode", properties.isShadowMode(),
                "statusUnchanged", ctx.place.getStatus().name()
        ));
    }

    private CatalogJobStepEntity beginStep(UUID jobId, UUID placeId, EnrichmentStepType type) {
        CatalogJobStepEntity step = stepRepository
                .findFirstByJobIdAndCatalogPlaceIdAndStepTypeOrderByAttemptCountDesc(jobId, placeId, type.name())
                .orElseGet(CatalogJobStepEntity::new);
        if (step.getId() == null) {
            step.setJobId(jobId);
            step.setCatalogPlaceId(placeId);
            step.setStepType(type.name());
            step.setAttemptCount(0);
        }
        step.setAttemptCount(step.getAttemptCount() + 1);
        step.setStatus(JobStatus.RUNNING.name());
        step.setSkipped(false);
        step.setSkipReason(null);
        step.setErrorCode(null);
        step.setErrorMessage(null);
        step.setRetryable(null);
        step.setStartedAt(java.time.OffsetDateTime.now());
        step.setFinishedAt(null);
        return stepRepository.save(step);
    }

    private void completeStep(CatalogJobStepEntity step, boolean skipped, String skipReason, Map<String, Object> details) {
        step.setSkipped(skipped);
        step.setSkipReason(skipReason);
        step.setDetails(details);
        step.setStatus(JobStatus.SUCCEEDED.name());
        step.setFinishedAt(java.time.OffsetDateTime.now());
        stepRepository.save(step);
    }

    private void markStepFailed(
            UUID jobId,
            UUID placeId,
            EnrichmentStepType type,
            String code,
            String message,
            boolean retryable
    ) {
        if (type == null) {
            return;
        }
        CatalogJobStepEntity step = beginStep(jobId, placeId, type);
        step.setStatus(JobStatus.FAILED.name());
        step.setErrorCode(code);
        step.setErrorMessage(message);
        step.setRetryable(retryable);
        step.setFinishedAt(java.time.OffsetDateTime.now());
        stepRepository.save(step);
    }

    private static List<EnrichmentStepType> orderedSteps(EnrichmentStepType resumeFrom) {
        List<EnrichmentStepType> all = List.of(
                EnrichmentStepType.RESOLVE_DISTRICT,
                EnrichmentStepType.APPLY_HARD_FILTERS,
                EnrichmentStepType.AI_CLASSIFY,
                EnrichmentStepType.COMPUTE_USEFULNESS,
                EnrichmentStepType.PERSIST_ENRICHMENT
        );
        if (resumeFrom == null) {
            return all;
        }
        int idx = all.indexOf(resumeFrom);
        if (idx < 0) {
            return all;
        }
        return all.subList(idx, all.size());
    }

    private static FilterDecision worse(FilterDecision current, FilterDecision candidate) {
        return rank(candidate) > rank(current) ? candidate : current;
    }

    private static int rank(FilterDecision decision) {
        return switch (decision) {
            case CONTINUE -> 0;
            case REVIEW -> 1;
            case NEEDS_DATA -> 2;
            case DROP_SUGGESTED -> 3;
        };
    }

    private static String citySlug(CatalogPlaceEntity place) {
        return place.getCityCode().name().toLowerCase(Locale.ROOT).replace('_', '-');
    }

    private static String geoHash(CatalogPlaceEntity place) {
        return sha256(place.getGeo().lat() + "|" + place.getGeo().lng());
    }

    private static String sha256(String value) {
        try {
            MessageDigest digest = MessageDigest.getInstance("SHA-256");
            return HexFormat.of().formatHex(digest.digest(value.getBytes(StandardCharsets.UTF_8)));
        } catch (Exception e) {
            throw new IllegalStateException(e);
        }
    }

    private static String nullToEmpty(String value) {
        return value == null ? "" : value;
    }

    /** Map.of forbids null values; enrichment details often include optional fields. */
    private static Map<String, Object> details(Object... keyValues) {
        Map<String, Object> map = new LinkedHashMap<>();
        if (keyValues == null) {
            return map;
        }
        if (keyValues.length % 2 != 0) {
            throw new IllegalArgumentException("details requires even key/value count");
        }
        for (int i = 0; i < keyValues.length; i += 2) {
            Object key = keyValues[i];
            Object value = keyValues[i + 1];
            if (key != null && value != null) {
                map.put(String.valueOf(key), value);
            }
        }
        return map;
    }

    private EnrichmentModels.VenueClassification toClassification(CatalogPlaceAiEnrichmentEntity entity) {
        List<String> venueTypes = entity.getVenueTypes() == null || entity.getVenueTypes().isEmpty()
                ? List.of("UNKNOWN")
                : entity.getVenueTypes();
        List<String> offers = entity.getOffers();
        List<String> experiences = entity.getExperiences();
        if ((offers == null || offers.isEmpty()) && (experiences == null || experiences.isEmpty())
                && entity.getActivities() != null && !entity.getActivities().isEmpty()) {
            VenueMaTaxonomyV0.MigratedFacets migrated = VenueMaTaxonomyV0.migrateLegacyActivities(entity.getActivities());
            offers = migrated.offers();
            experiences = migrated.experiences();
        }
        if (experiences == null || experiences.isEmpty()) {
            experiences = VenueMaTaxonomyV0.filterAllowed(entity.getExperienceTags(), VenueMaTaxonomyV0.experienceValues());
        }
        List<String> suitableFor = entity.getSuitableFor();
        if (suitableFor == null || suitableFor.isEmpty()) {
            suitableFor = VenueMaTaxonomyV0.filterAllowed(entity.getAudienceTags(), VenueMaTaxonomyV0.suitableForValues());
        }
        return new EnrichmentModels.VenueClassification(
                venueTypes,
                entity.getSettings() == null ? List.of() : entity.getSettings(),
                offers == null ? List.of() : offers,
                experiences == null ? List.of() : experiences,
                suitableFor == null ? List.of() : suitableFor,
                entity.getMusicStyles() == null ? List.of() : entity.getMusicStyles(),
                entity.getCuisines() == null ? List.of() : entity.getCuisines(),
                entity.getCategoryFitScore() == null ? 0.4 : entity.getCategoryFitScore(),
                entity.getConfidence() == null ? 0.4 : entity.getConfidence(),
                entity.getEvidenceFields() == null ? List.of() : entity.getEvidenceFields(),
                entity.getWarnings() == null ? List.of() : entity.getWarnings(),
                entity.getSelectionSuggestion() == null ? "REVIEW" : entity.getSelectionSuggestion()
        );
    }

    private static boolean hasVenueTypes(CatalogPlaceAiEnrichmentEntity entity) {
        return entity.getVenueTypes() != null && !entity.getVenueTypes().isEmpty();
    }

    private static List<String> normalizeVenueTypes(List<String> requested, List<String> fallback) {
        List<String> source = requested != null ? requested : fallback;
        Set<String> allowed = new LinkedHashSet<>(VenueMaTaxonomyV0.venueTypeValues());
        LinkedHashSet<String> out = new LinkedHashSet<>();
        if (source != null) {
            for (String type : source) {
                if (type == null || type.isBlank()) {
                    continue;
                }
                String normalized = type.trim().toUpperCase(Locale.ROOT);
                if ("RESTO_BAR".equals(normalized)) {
                    out.add("RESTAURANT");
                    out.add("BAR");
                    continue;
                }
                if (!allowed.contains(normalized)) {
                    throw new IllegalArgumentException("invalid_venue_type:" + normalized);
                }
                out.add(normalized);
            }
        }
        if (out.isEmpty()) {
            return List.of("UNKNOWN");
        }
        return new ArrayList<>(out);
    }

    private static List<String> normalizeOffers(List<String> offers, Boolean servesAlcohol) {
        LinkedHashSet<String> out = new LinkedHashSet<>(normalizeFacet(offers, VenueMaTaxonomyV0.offerValues(), "invalid_offer"));
        if (Boolean.TRUE.equals(servesAlcohol)) {
            out.add("ALCOHOL");
        } else if (Boolean.FALSE.equals(servesAlcohol)) {
            out.remove("ALCOHOL");
        }
        return List.copyOf(out);
    }

    private static List<String> normalizeFacet(List<String> values, List<String> allowed, String errorPrefix) {
        LinkedHashSet<String> out = new LinkedHashSet<>();
        if (values != null) {
            Set<String> allow = new LinkedHashSet<>(allowed);
            for (String value : values) {
                if (value == null || value.isBlank()) {
                    continue;
                }
                String normalized = value.trim().toUpperCase(Locale.ROOT);
                if (!allow.contains(normalized)) {
                    throw new IllegalArgumentException(errorPrefix + ":" + normalized);
                }
                out.add(normalized);
            }
        }
        return List.copyOf(out);
    }

    private static List<String> sanitizeList(List<String> values) {
        if (values == null) {
            return List.of();
        }
        return values.stream()
                .filter(v -> v != null && !v.isBlank())
                .map(String::trim)
                .distinct()
                .collect(Collectors.toList());
    }

    private Map<String, Object> readMap(String json) {
        try {
            return objectMapper.readValue(json, Map.class);
        } catch (Exception e) {
            return new LinkedHashMap<>();
        }
    }

    private static final class PlaceContext {
        private final CatalogPlaceEntity place;
        private CatalogPlaceGeoResolutionEntity geo;
        private FilterDecision filterDecision = FilterDecision.CONTINUE;
        private EnrichmentModels.VenueClassification classification;
        private List<EnrichmentModels.AppScore> appScores;
        private UsefulnessDecision verdict;
        private String inputHash;
        private String usageRequestId;
        private Map<String, Object> structuredOutput;
        private boolean forceAiOverwrite;
        private boolean preserveManualOverride;

        private PlaceContext(CatalogPlaceEntity place) {
            this.place = place;
        }
    }
}
