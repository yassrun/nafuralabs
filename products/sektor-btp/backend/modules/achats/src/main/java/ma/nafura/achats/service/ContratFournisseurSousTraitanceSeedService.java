package ma.nafura.achats.service;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import java.io.InputStream;
import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.OffsetDateTime;
import java.util.UUID;
import ma.nafura.achats.domain.model.ContratFournisseur;
import ma.nafura.achats.repository.ContratFournisseurRepository;
import ma.nafura.platform.framework.context.TenantContext;
import org.springframework.core.io.ClassPathResource;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class ContratFournisseurSousTraitanceSeedService {

    private final ContratFournisseurRepository repository;
    private final ObjectMapper objectMapper;
    private final ContratSousTraitanceNotes notesCodec;

    public ContratFournisseurSousTraitanceSeedService(
            ContratFournisseurRepository repository,
            ObjectMapper objectMapper,
            ContratSousTraitanceNotes notesCodec) {
        this.repository = repository;
        this.objectMapper = objectMapper;
        this.notesCodec = notesCodec;
    }

    @Transactional
    public void seedIfEmpty() {
        UUID tenantId = TenantContext.getTenantId();
        if (repository.countByTenantIdAndType(tenantId, ContratFournisseur.TYPE_SOUS_TRAITANCE) > 0) {
            return;
        }
        try (InputStream in = new ClassPathResource("seed/contrats-sous-traitance-seed.json").getInputStream()) {
            JsonNode root = objectMapper.readTree(in);
            for (JsonNode node : root.get("contrats")) {
                BigDecimal avancement = node.hasNonNull("avancementPercent")
                        ? new BigDecimal(node.get("avancementPercent").asText())
                        : BigDecimal.ZERO;
                String notes = notesCodec.build(
                        textOrNull(node, "objet"),
                        textOrNull(node, "sousTraitantNom"),
                        textOrNull(node, "ice"),
                        textOrNull(node, "chantierCode"),
                        textOrNull(node, "chantierNom"),
                        avancement);
                String backendStatus = mapStatus(textOrNull(node, "status"));
                OffsetDateTime now = OffsetDateTime.now();
                ContratFournisseur entity = ContratFournisseur.builder()
                        .tenantId(tenantId)
                        .numero(node.get("numero").asText())
                        .type(ContratFournisseur.TYPE_SOUS_TRAITANCE)
                        .fournisseurId(node.get("sousTraitantId").asText())
                        .chantierId(node.get("chantierId").asText())
                        .dateDebut(LocalDate.parse(node.get("dateDebut").asText()))
                        .dateFin(LocalDate.parse(node.get("dateFin").asText()))
                        .status(backendStatus)
                        .montantHt(new BigDecimal(node.get("montantHt").asText()))
                        .art187Declare(node.path("declarationArt187").asBoolean(false))
                        .art187ValideMoa(node.path("declarationArt187").asBoolean(false))
                        .retenueGarantieTaux(new BigDecimal(node.path("retenueGarantieTaux").asText("7")))
                        .paiementDirectMoa(false)
                        .notes(notes)
                        .createdAt(now)
                        .updatedAt(now)
                        .build();
                repository.save(entity);
            }
        } catch (Exception ex) {
            throw new IllegalStateException("Failed to seed contrats sous-traitance", ex);
        }
    }

    private static String mapStatus(String frontendStatus) {
        if (frontendStatus == null) {
            return ContratFournisseur.STATUS_BROUILLON;
        }
        return switch (frontendStatus.trim().toUpperCase()) {
            case "TERMINE" -> ContratFournisseur.STATUS_ECHU;
            case "SIGNE" -> ContratFournisseur.STATUS_SIGNE;
            case "EN_COURS" -> ContratFournisseur.STATUS_EN_COURS;
            case "RESILIE" -> ContratFournisseur.STATUS_RESILIE;
            default -> ContratFournisseur.STATUS_BROUILLON;
        };
    }

    private static String textOrNull(JsonNode node, String field) {
        return node.hasNonNull(field) ? node.get(field).asText() : null;
    }
}
