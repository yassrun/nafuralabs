package ma.nafura.venuecatalog.enrichment.application.gemini;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import ma.nafura.platform.ai.llm.model.LlmCallContext;
import ma.nafura.platform.ai.llm.model.LlmMode;
import ma.nafura.platform.ai.llm.model.LlmRequest;
import ma.nafura.platform.ai.llm.model.LlmResponse;
import ma.nafura.platform.ai.llm.model.ScopeType;
import ma.nafura.platform.ai.llm.service.LlmService;
import ma.nafura.venuecatalog.enrichment.application.VenueCatalogEnrichmentProperties;
import ma.nafura.venuecatalog.enrichment.domain.EnrichmentModels;
import ma.nafura.venuecatalog.place.adapter.persistence.CatalogPlaceEntity;
import ma.nafura.venuecatalog.place.domain.taxonomy.VenueMaTaxonomyV0;
import org.springframework.stereotype.Component;

import java.util.ArrayList;
import java.util.Iterator;
import java.util.LinkedHashMap;
import java.util.LinkedHashSet;
import java.util.List;
import java.util.Map;
import java.util.concurrent.TimeUnit;

@Component
public class VenueGeminiClassifier {

    public static final String RESPONSE_SCHEMA = """
            {
              "type": "object",
              "properties": {
                "venueTypes": { "type": "array", "items": { "type": "string" } },
                "settings": { "type": "array", "items": { "type": "string" } },
                "offers": { "type": "array", "items": { "type": "string" } },
                "experiences": { "type": "array", "items": { "type": "string" } },
                "suitableFor": { "type": "array", "items": { "type": "string" } },
                "musicStyles": { "type": "array", "items": { "type": "string" } },
                "cuisines": { "type": "array", "items": { "type": "string" } },
                "categoryFitScore": { "type": "number" },
                "confidence": { "type": "number" },
                "evidenceFields": { "type": "array", "items": { "type": "string" } },
                "warnings": { "type": "array", "items": { "type": "string" } },
                "selectionSuggestion": { "type": "string" }
              },
              "required": ["venueTypes", "settings", "offers", "experiences", "suitableFor", "categoryFitScore", "confidence", "evidenceFields", "warnings", "selectionSuggestion"]
            }
            """;

    private final LlmService llmService;
    private final ObjectMapper objectMapper;
    private final VenueCatalogEnrichmentProperties properties;

    public VenueGeminiClassifier(
            LlmService llmService,
            ObjectMapper objectMapper,
            VenueCatalogEnrichmentProperties properties
    ) {
        this.llmService = llmService;
        this.objectMapper = objectMapper;
        this.properties = properties;
    }

    public ClassificationResult classify(CatalogPlaceEntity place, String inputHash) {
        Map<String, Object> input = buildMinimalInput(place);
        String prompt = """
                Classify this Morocco venue for catalog enrichment.
                Use taxonomy version %s only.
                Allowed venueTypes: %s
                Allowed settings: %s
                Allowed offers: %s
                Allowed experiences: %s
                Allowed suitableFor: %s
                venueTypes is a non-empty array: primary format first, then secondary hybrids
                (e.g. ["CAFE","RESTAURANT"], ["RESTAURANT","BAR"]). Never use RESTO_BAR.
                Beauty places use SALON, BARBERSHOP, or SPA.
                settings = physical context (ROOFTOP, TERRACE, INDOOR…).
                offers = what is consumed (FOOD, ALCOHOL, COFFEE_TEA…).
                experiences = what guests do (DANCE, DJ, LIVE_MUSIC…).
                suitableFor = occasions/audiences (DATE, FRIENDS_GROUP…).
                Prefer INDOOR in settings when the venue is enclosed and no outdoor evidence is present.
                Prefer empty arrays over guesses for other facets. Prefer ["UNKNOWN"] venueTypes when insufficient evidence.
                Do NOT invent music styles without evidence.
                categoryFitScore and confidence are 0..1.
                selectionSuggestion one of KEEP, REVIEW, DROP_SUGGESTED.
                Return JSON only matching the schema.

                Venue input:
                %s
                """.formatted(
                VenueMaTaxonomyV0.VERSION,
                String.join(", ", VenueMaTaxonomyV0.venueTypeValues()),
                String.join(", ", VenueMaTaxonomyV0.settingValues()),
                String.join(", ", VenueMaTaxonomyV0.offerValues()),
                String.join(", ", VenueMaTaxonomyV0.experienceValues()),
                String.join(", ", VenueMaTaxonomyV0.suitableForValues()),
                writeJson(input)
        );

        LlmRequest request = new LlmRequest();
        request.setPrompt(prompt);
        request.setSystemInstruction(
                "You are a strict venue taxonomy classifier for Morocco nightlife/dining/beauty catalogs. "
                        + "Never hallucinate. Prefer UNKNOWN / empty facets when unsure."
        );
        request.setResponseSchema(RESPONSE_SCHEMA);
        request.setMode(LlmMode.ASK);

        LlmCallContext context = LlmCallContext.builder()
                .applicationId("venue-catalog")
                .domainKey("catalog")
                .featureKey("enrichment")
                .resourceKey(place.getId().toString())
                .actionKey("ai-classify")
                .scopeType(ScopeType.GLOBAL)
                .mode(LlmMode.ASK)
                .idempotencyKey("venue-classify:" + place.getId() + ":" + inputHash + ":"
                        + VenueMaTaxonomyV0.VERSION + ":" + properties.getPromptVersion())
                .build();

        try {
            LlmResponse response = llmService.callLlm(request, context).get(90, TimeUnit.SECONDS);
            EnrichmentModels.VenueClassification classification = parse(response == null ? null : response.getContent());
            return new ClassificationResult(classification, response == null ? null : response.getRequestId(), writeJson(classification));
        } catch (Exception ex) {
            throw new IllegalStateException("Gemini classification failed for place " + place.getId() + ": " + ex.getMessage(), ex);
        }
    }

    public Map<String, Object> buildMinimalInput(CatalogPlaceEntity place) {
        Map<String, Object> input = new LinkedHashMap<>();
        input.put("name", place.getCanonicalName());
        input.put("primaryCategory", place.getPrimaryCategory() == null ? null : place.getPrimaryCategory().name());
        input.put("providerTypes", place.getProviderTypes());
        input.put("address", place.getAddress());
        input.put("openingHours", place.getOpeningHours());
        input.put("providerRating", place.getProviderRating());
        input.put("attributes", place.getAttributes());
        if (place.getContact() != null) {
            Map<String, Object> contact = new LinkedHashMap<>();
            contact.put("websiteUrl", place.getContact().websiteUrl());
            contact.put("mapUrl", place.getContact().mapUrl());
            input.put("contact", contact);
        }
        return input;
    }

    private EnrichmentModels.VenueClassification parse(String content) throws Exception {
        if (content == null || content.isBlank()) {
            return unknown("empty_llm_response");
        }
        JsonNode root = objectMapper.readTree(content);
        List<String> venueTypes = parseVenueTypes(root);
        List<String> settings = VenueMaTaxonomyV0.filterAllowed(stringList(root.get("settings")), VenueMaTaxonomyV0.settingValues());
        if (settings.isEmpty()) {
            settings = List.of("INDOOR");
        }
        List<String> offers = VenueMaTaxonomyV0.filterAllowed(stringList(root.get("offers")), VenueMaTaxonomyV0.offerValues());
        List<String> experiences = VenueMaTaxonomyV0.filterAllowed(stringList(root.get("experiences")), VenueMaTaxonomyV0.experienceValues());
        List<String> suitableFor = VenueMaTaxonomyV0.filterAllowed(stringList(root.get("suitableFor")), VenueMaTaxonomyV0.suitableForValues());

        // Legacy activities field still accepted from older prompts/cache
        if (offers.isEmpty() && experiences.isEmpty() && root.has("activities")) {
            VenueMaTaxonomyV0.MigratedFacets migrated =
                    VenueMaTaxonomyV0.migrateLegacyActivities(stringList(root.get("activities")));
            offers = migrated.offers();
            experiences = migrated.experiences();
        }
        if (experiences.isEmpty() && root.has("experienceTags")) {
            experiences = VenueMaTaxonomyV0.filterAllowed(stringList(root.get("experienceTags")), VenueMaTaxonomyV0.experienceValues());
        }
        if (suitableFor.isEmpty() && root.has("audienceTags")) {
            suitableFor = VenueMaTaxonomyV0.filterAllowed(stringList(root.get("audienceTags")), VenueMaTaxonomyV0.suitableForValues());
        }

        return new EnrichmentModels.VenueClassification(
                venueTypes,
                settings,
                offers,
                experiences,
                suitableFor,
                stringList(root.get("musicStyles")),
                stringList(root.get("cuisines")),
                clamp01(root.path("categoryFitScore").asDouble(0.4)),
                clamp01(root.path("confidence").asDouble(0.4)),
                stringList(root.get("evidenceFields")),
                stringList(root.get("warnings")),
                text(root, "selectionSuggestion", "REVIEW")
        );
    }

    private static List<String> parseVenueTypes(JsonNode root) {
        List<String> fromArray = expandLegacyTypes(stringList(root.get("venueTypes")));
        fromArray = VenueMaTaxonomyV0.filterAllowed(fromArray, VenueMaTaxonomyV0.venueTypeValues());
        if (!fromArray.isEmpty()) {
            return dedupe(fromArray);
        }
        String legacy = text(root, "venueType", null);
        if (legacy != null) {
            List<String> expanded = expandLegacyTypes(List.of(legacy));
            expanded = VenueMaTaxonomyV0.filterAllowed(expanded, VenueMaTaxonomyV0.venueTypeValues());
            if (!expanded.isEmpty()) {
                return dedupe(expanded);
            }
        }
        return List.of("UNKNOWN");
    }

    private static List<String> expandLegacyTypes(List<String> values) {
        List<String> out = new ArrayList<>();
        for (String value : values) {
            if ("RESTO_BAR".equals(value)) {
                out.add("RESTAURANT");
                out.add("BAR");
            } else {
                out.add(value);
            }
        }
        return out;
    }

    private static List<String> dedupe(List<String> values) {
        return new ArrayList<>(new LinkedHashSet<>(values));
    }

    private static EnrichmentModels.VenueClassification unknown(String warning) {
        return new EnrichmentModels.VenueClassification(
                List.of("UNKNOWN"),
                List.of(),
                List.of(),
                List.of(),
                List.of(),
                List.of(),
                List.of(),
                0.3,
                0.2,
                List.of(),
                List.of(warning),
                "REVIEW"
        );
    }

    private static List<String> stringList(JsonNode node) {
        List<String> out = new ArrayList<>();
        if (node == null || !node.isArray()) {
            return out;
        }
        Iterator<JsonNode> it = node.elements();
        while (it.hasNext()) {
            String value = it.next().asText(null);
            if (value != null && !value.isBlank()) {
                out.add(value.trim());
            }
        }
        return out;
    }

    private static String text(JsonNode root, String field, String defaultValue) {
        String value = root.path(field).asText(null);
        return value == null || value.isBlank() ? defaultValue : value.trim();
    }

    private static double clamp01(double value) {
        if (value < 0) return 0;
        if (value > 1) return 1;
        return value;
    }

    private String writeJson(Object value) {
        try {
            return objectMapper.writeValueAsString(value);
        } catch (Exception e) {
            throw new IllegalStateException(e);
        }
    }

    public String writeJsonSafe(Object value) {
        return writeJson(value);
    }

    public record ClassificationResult(
            EnrichmentModels.VenueClassification classification,
            String usageRequestId,
            String structuredJson
    ) {}
}
