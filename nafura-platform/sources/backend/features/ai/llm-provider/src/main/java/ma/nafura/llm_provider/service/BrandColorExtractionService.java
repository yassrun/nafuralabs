package ma.nafura.platform.ai.llm.service;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import java.util.ArrayList;
import java.util.Base64;
import java.util.LinkedHashSet;
import java.util.List;
import java.util.Set;
import java.util.UUID;
import java.util.concurrent.TimeUnit;
import ma.nafura.platform.ai.llm.model.LlmCallContext;
import ma.nafura.platform.ai.llm.model.LlmMode;
import ma.nafura.platform.ai.llm.model.LlmRequest;
import ma.nafura.platform.ai.llm.model.LlmResponse;
import ma.nafura.platform.ai.llm.model.ScopeType;
import ma.nafura.platform.appsettings.api.response.BrandColorExtractionResponse;
import ma.nafura.platform.appsettings.domain.model.TenantAsset;
import ma.nafura.platform.appsettings.repository.TenantAssetRepository;
import ma.nafura.platform.appsettings.service.BrandColors;
import ma.nafura.platform.framework.context.TenantContext;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.web.server.ResponseStatusException;

/**
 * Deduce a brand palette from the tenant logo via vision LLM (Gemini).
 * Lives in {@code cap.ai} so {@code cap.app-settings} stays free of an LLM classpath pull.
 */
@Service
public class BrandColorExtractionService {

    private static final Logger log = LoggerFactory.getLogger(BrandColorExtractionService.class);

    private static final String RESPONSE_SCHEMA = """
        {
          "type": "object",
          "properties": {
            "candidates": {
              "type": "array",
              "items": { "type": "string" },
              "minItems": 3
            },
            "suggested": {
              "type": "object",
              "properties": {
                "primary": { "type": "string" },
                "secondary": { "type": "string" },
                "accent": { "type": "string" }
              },
              "required": ["primary", "secondary", "accent"]
            }
          },
          "required": ["candidates", "suggested"]
        }
        """;

    private static final String SYSTEM = """
        You extract brand colours from a company logo image.
        Return JSON only matching the schema.
        candidates: at least 5 distinct hex colours (#RRGGBB) present or strongly implied by the logo
        (ignore pure white/near-white and pure black unless the logo is monochrome).
        suggested.primary: main brand colour (most distinctive, good for buttons/headers).
        suggested.secondary: supporting colour.
        suggested.accent: contrast / highlight colour.
        All hex values must be #RRGGBB.
        """;

    private final TenantAssetRepository tenantAssetRepository;
    private final ObjectMapper objectMapper;
    private final LlmService llmService;

    public BrandColorExtractionService(
            TenantAssetRepository tenantAssetRepository,
            ObjectMapper objectMapper,
            LlmService llmService) {
        this.tenantAssetRepository = tenantAssetRepository;
        this.objectMapper = objectMapper;
        this.llmService = llmService;
    }

    public BrandColorExtractionResponse extractFromLogo() {
        UUID tenantId = TenantContext.getTenantId();
        TenantAsset logo = tenantAssetRepository
            .findByTenantIdAndAssetType(tenantId, "logo")
            .orElseThrow(() -> new ResponseStatusException(
                HttpStatus.BAD_REQUEST, "Upload a logo before extracting brand colours"));
        byte[] data = logo.getData();
        if (data == null || data.length == 0) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Logo file is empty");
        }
        String mime = logo.getContentType() != null && !logo.getContentType().isBlank()
            ? logo.getContentType()
            : "image/png";
        if (mime.contains("svg")) {
            throw new ResponseStatusException(
                HttpStatus.BAD_REQUEST,
                "Colour extraction requires a raster logo (PNG or JPG), not SVG");
        }

        LlmRequest request = new LlmRequest();
        request.setSystemInstruction(SYSTEM);
        request.setPrompt("Extract the brand colour palette from this logo.");
        request.setResponseSchema(RESPONSE_SCHEMA);
        LlmRequest.MediaContent media = new LlmRequest.MediaContent();
        media.setContentBase64(Base64.getEncoder().encodeToString(data));
        media.setMimeType(mime);
        media.setType(LlmRequest.MediaType.IMAGE);
        request.setMediaContents(List.of(media));

        LlmCallContext ctx = LlmCallContext.builder()
            .applicationId("app-settings")
            .domainKey("branding")
            .featureKey("extract-colors")
            .resourceKey("logo")
            .actionKey("extract")
            .mode(LlmMode.ASK)
            .scopeType(ScopeType.TENANT)
            .tenantId(tenantId.toString())
            .build();

        try {
            LlmResponse response = llmService.callLlm(request, ctx).get(60, TimeUnit.SECONDS);
            return parse(response.getContent());
        } catch (ResponseStatusException e) {
            throw e;
        } catch (Exception e) {
            log.warn("Brand colour extraction failed for tenant {}: {}", tenantId, e.toString());
            Throwable cause = e.getCause() != null ? e.getCause() : e;
            throw new ResponseStatusException(
                HttpStatus.BAD_GATEWAY,
                "Could not extract colours from logo: " + cause.getMessage(),
                e);
        }
    }

    BrandColorExtractionResponse parse(String content) throws Exception {
        if (content == null || content.isBlank()) {
            throw new ResponseStatusException(HttpStatus.BAD_GATEWAY, "Empty AI response");
        }
        String json = content.trim();
        if (json.startsWith("```")) {
            int start = json.indexOf('{');
            int end = json.lastIndexOf('}');
            if (start >= 0 && end > start) {
                json = json.substring(start, end + 1);
            }
        }
        JsonNode root = objectMapper.readTree(json);
        Set<String> candidates = new LinkedHashSet<>();
        JsonNode candidatesNode = root.path("candidates");
        if (candidatesNode.isArray()) {
            for (JsonNode n : candidatesNode) {
                String c = BrandColors.normalizeOrNull(n.asText(null));
                if (c != null) {
                    candidates.add(c);
                }
            }
        }
        JsonNode suggestedNode = root.path("suggested");
        String primary = BrandColors.normalize(
            text(suggestedNode, "primary"), BrandColors.DEFAULT_PRIMARY);
        String secondary = BrandColors.normalize(
            text(suggestedNode, "secondary"), BrandColors.DEFAULT_SECONDARY);
        String accent = BrandColors.normalize(
            text(suggestedNode, "accent"), BrandColors.DEFAULT_ACCENT);
        candidates.add(primary);
        candidates.add(secondary);
        candidates.add(accent);
        if (candidates.size() < 3) {
            throw new ResponseStatusException(
                HttpStatus.BAD_GATEWAY, "AI returned fewer than 3 valid colours");
        }
        return new BrandColorExtractionResponse(
            new ArrayList<>(candidates),
            new BrandColorExtractionResponse.Suggested(primary, secondary, accent));
    }

    private static String text(JsonNode parent, String field) {
        if (parent == null || parent.isMissingNode()) {
            return null;
        }
        JsonNode n = parent.get(field);
        return n == null || n.isNull() ? null : n.asText(null);
    }
}
