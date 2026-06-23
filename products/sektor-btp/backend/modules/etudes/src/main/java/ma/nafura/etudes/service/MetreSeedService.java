package ma.nafura.etudes.service;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import java.io.InputStream;
import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.ArrayList;
import java.util.UUID;
import ma.nafura.etudes.domain.model.Metre;
import ma.nafura.etudes.domain.model.MetreLigne;
import ma.nafura.etudes.domain.model.Ouvrage;
import ma.nafura.etudes.repository.MetreRepository;
import ma.nafura.etudes.repository.OuvrageRepository;
import ma.nafura.platform.framework.context.TenantContext;
import org.springframework.core.io.ClassPathResource;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class MetreSeedService {

    private final MetreRepository metreRepository;
    private final OuvrageRepository ouvrageRepository;
    private final OuvrageSeedService ouvrageSeedService;
    private final ObjectMapper objectMapper;

    public MetreSeedService(
            MetreRepository metreRepository,
            OuvrageRepository ouvrageRepository,
            OuvrageSeedService ouvrageSeedService,
            ObjectMapper objectMapper) {
        this.metreRepository = metreRepository;
        this.ouvrageRepository = ouvrageRepository;
        this.ouvrageSeedService = ouvrageSeedService;
        this.objectMapper = objectMapper;
    }

    @Transactional
    public void seedIfEmpty() {
        UUID tenantId = TenantContext.getTenantId();
        if (metreRepository.countByTenantId(tenantId) > 0) {
            return;
        }
        ouvrageSeedService.seedIfEmpty();
        try (InputStream in = new ClassPathResource("seed/metres-seed.json").getInputStream()) {
            JsonNode root = objectMapper.readTree(in);
            for (JsonNode node : root.get("metres")) {
                Metre entity = Metre.builder()
                        .tenantId(tenantId)
                        .numero(node.get("numero").asText())
                        .projetNom(node.get("projetNom").asText())
                        .ville(textOrNull(node, "ville"))
                        .dateMetre(LocalDate.parse(node.get("dateMetre").asText()))
                        .metreurId(node.get("metreurId").asText())
                        .metreurName(textOrNull(node, "metreurName"))
                        .notes(textOrNull(node, "notes"))
                        .status(node.path("status").asText(Metre.STATUS_BROUILLON))
                        .lignes(new ArrayList<>())
                        .build();
                if (node.has("lignes") && node.get("lignes").isArray()) {
                    for (JsonNode line : node.get("lignes")) {
                        entity.getLignes().add(buildLigne(line, entity, tenantId));
                    }
                }
                metreRepository.save(entity);
            }
        } catch (Exception ex) {
            throw new IllegalStateException("Failed to seed metres", ex);
        }
    }

    private MetreLigne buildLigne(JsonNode line, Metre metre, UUID tenantId) {
        String ouvrageCode = textOrNull(line, "ouvrageCode");
        UUID ouvrageRefId = resolveOuvrageId(tenantId, ouvrageCode, textOrNull(line, "ouvrageId"));
        return MetreLigne.builder()
                .tenantId(tenantId)
                .metre(metre)
                .ouvrageRefId(ouvrageRefId)
                .ouvrageCode(ouvrageCode)
                .designationLibre(textOrNull(line, "designationLibre"))
                .unite(line.get("unite").asText())
                .lotCode(textOrNull(line, "lotCode"))
                .sousLotCode(textOrNull(line, "sousLotCode"))
                .lotLibelle(textOrNull(line, "lotLibelle"))
                .sousLotLibelle(textOrNull(line, "sousLotLibelle"))
                .longueur(decimalOrNull(line, "longueur"))
                .largeur(decimalOrNull(line, "largeur"))
                .hauteur(decimalOrNull(line, "hauteur"))
                .nombre(decimalOrNull(line, "nombre"))
                .formule(textOrNull(line, "formule"))
                .quantiteCalculee(new BigDecimal(line.get("quantiteCalculee").asText()))
                .notes(textOrNull(line, "notes"))
                .build();
    }

    private UUID resolveOuvrageId(UUID tenantId, String ouvrageCode, String ouvrageId) {
        if (ouvrageId != null && !ouvrageId.isBlank()) {
            try {
                return UUID.fromString(ouvrageId.trim());
            } catch (IllegalArgumentException ignored) {
                // fall through to code lookup
            }
        }
        if (ouvrageCode == null || ouvrageCode.isBlank()) {
            return null;
        }
        return ouvrageRepository
                .findByTenantIdAndCode(tenantId, ouvrageCode.trim())
                .map(Ouvrage::getId)
                .orElse(null);
    }

    private static BigDecimal decimalOrNull(JsonNode node, String field) {
        return node.hasNonNull(field) ? new BigDecimal(node.get(field).asText()) : null;
    }

    private static String textOrNull(JsonNode node, String field) {
        return node.hasNonNull(field) ? node.get(field).asText() : null;
    }
}
