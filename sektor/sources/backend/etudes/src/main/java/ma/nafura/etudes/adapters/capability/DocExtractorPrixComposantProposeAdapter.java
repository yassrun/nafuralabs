package ma.nafura.etudes.adapters.capability;

import com.fasterxml.jackson.databind.JsonNode;
import java.math.BigDecimal;
import java.util.Optional;
import ma.nafura.etudes.service.port.capability.PrixComposantProposePort;
import ma.nafura.platform.documents.docextractor.api.response.StatelessExtractionResponse;
import ma.nafura.platform.documents.docextractor.service.StatelessExtractionService;
import ma.nafura.platform.framework.context.TenantContext;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.context.annotation.Primary;
import org.springframework.stereotype.Component;
import org.springframework.util.StringUtils;

/**
 * Estimation de PU HT MAD — marché BTP Maroc. Pas un devis, pas un scraping live.
 */
@Component
@Primary
public class DocExtractorPrixComposantProposeAdapter implements PrixComposantProposePort {

    private static final Logger log = LoggerFactory.getLogger(DocExtractorPrixComposantProposeAdapter.class);

    private static final String RESPONSE_SCHEMA = """
            {
              "type": "object",
              "properties": {
                "prixUnitaire": { "type": "number" },
                "unite": { "type": "string" },
                "confiance": { "type": "number" },
                "justification": { "type": "string" }
              }
            }
            """;

    private final StatelessExtractionService extractionService;

    public DocExtractorPrixComposantProposeAdapter(StatelessExtractionService extractionService) {
        this.extractionService = extractionService;
    }

    @Override
    public boolean isAvailable() {
        return true;
    }

    @Override
    public Optional<Estimation> estimer(Contexte contexte) {
        if (contexte == null || !StringUtils.hasText(contexte.designation())) {
            return Optional.empty();
        }
        String tenantId = TenantContext.getTenantId() != null
                ? TenantContext.getTenantId().toString()
                : null;
        StatelessExtractionResponse response = extractionService.process(
                buildPrompt(contexte).getBytes(java.nio.charset.StandardCharsets.UTF_8),
                "prix-composant.txt",
                "text/plain",
                RESPONSE_SCHEMA,
                null,
                """
                Tu estimes un prix d'achat unitaire HT en dirhams marocains (MAD) pour un
                composant de décomposition BTP au Maroc. Base-toi sur des ordres de grandeur
                de marché (fournitures, main-d'œuvre, location matériel). Ce n'est PAS un
                devis fournisseur.                 Si tu n'as pas d'ordre de grandeur fiable, omets
                prixUnitaire. confiance entre 0 et 1. justification en une phrase courte.
                """,
                tenantId,
                20_000);

        if (response.outcome() == StatelessExtractionResponse.Outcome.REJECTED
                || response.outcome() == StatelessExtractionResponse.Outcome.TECHNICAL_FAILURE) {
            log.warn("Prix composant estimation failed: {}", response.outcome());
            return Optional.empty();
        }
        return parse(response.data(), contexte.unite());
    }

    private static String buildPrompt(Contexte c) {
        StringBuilder sb = new StringBuilder();
        sb.append("Composant à estimer (marché BTP Maroc, MAD HT) :\n");
        sb.append("- designation=").append(c.designation()).append('\n');
        sb.append("- type=").append(nullToEmpty(c.type())).append('\n');
        sb.append("- unite=").append(nullToEmpty(c.unite())).append('\n');
        if (StringUtils.hasText(c.articleCode()) || StringUtils.hasText(c.articleLibelle())) {
            sb.append("- poste=").append(nullToEmpty(c.articleCode())).append(' ')
                    .append(nullToEmpty(c.articleLibelle())).append('\n');
        }
        if (StringUtils.hasText(c.objetMarche())) {
            sb.append("- marche=").append(c.objetMarche()).append('\n');
        }
        if (StringUtils.hasText(c.ville())) {
            sb.append("- ville=").append(c.ville()).append('\n');
        }
        if (StringUtils.hasText(c.typeAo())) {
            sb.append("- typeAo=").append(c.typeAo()).append('\n');
        }
        return sb.toString();
    }

    private static Optional<Estimation> parse(JsonNode data, String uniteFallback) {
        if (data == null || !data.has("prixUnitaire") || !data.get("prixUnitaire").isNumber()) {
            return Optional.empty();
        }
        BigDecimal pu = BigDecimal.valueOf(data.get("prixUnitaire").asDouble());
        if (pu.signum() <= 0) {
            return Optional.empty();
        }
        String unite = data.has("unite") && StringUtils.hasText(data.get("unite").asText())
                ? data.get("unite").asText().trim()
                : uniteFallback;
        double confiance = data.has("confiance") && data.get("confiance").isNumber()
                ? Math.max(0, Math.min(1, data.get("confiance").asDouble(0.45)))
                : 0.45;
        String justification = data.has("justification")
                ? data.get("justification").asText("").trim()
                : "";
        return Optional.of(new Estimation(pu, unite, confiance, justification));
    }

    private static String nullToEmpty(String value) {
        return value != null ? value : "";
    }
}
