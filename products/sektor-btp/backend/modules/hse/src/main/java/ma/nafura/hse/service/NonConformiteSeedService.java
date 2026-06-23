package ma.nafura.hse.service;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import java.io.InputStream;
import java.time.LocalDate;
import java.util.UUID;
import ma.nafura.hse.domain.model.NonConformite;
import ma.nafura.hse.repository.NonConformiteRepository;
import ma.nafura.platform.framework.context.TenantContext;
import org.springframework.core.io.ClassPathResource;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class NonConformiteSeedService {

    private final NonConformiteRepository repository;
    private final ObjectMapper objectMapper;

    public NonConformiteSeedService(NonConformiteRepository repository, ObjectMapper objectMapper) {
        this.repository = repository;
        this.objectMapper = objectMapper;
    }

    @Transactional
    public void seedIfEmpty() {
        UUID tenantId = TenantContext.getTenantId();
        if (repository.countByTenantId(tenantId) > 0) {
            return;
        }
        try (InputStream in = new ClassPathResource("seed/non-conformites-seed.json").getInputStream()) {
            JsonNode root = objectMapper.readTree(in);
            for (JsonNode node : root.get("nonConformites")) {
                NonConformite entity = NonConformite.builder()
                        .id(node.get("id").asText())
                        .tenantId(tenantId)
                        .numero(node.get("numero").asText())
                        .dateNc(LocalDate.parse(node.get("dateNc").asText()))
                        .chantierId(textOrNull(node, "chantierId"))
                        .chantierCode(textOrNull(node, "chantierCode"))
                        .zoneChantier(textOrNull(node, "zoneChantier"))
                        .typeNc(node.get("typeNc").asText())
                        .description(node.get("description").asText())
                        .causesRacines(textOrNull(node, "causesRacines"))
                        .actionCorrective(textOrNull(node, "actionCorrective"))
                        .actionPreventive(textOrNull(node, "actionPreventive"))
                        .verificationEfficacite(textOrNull(node, "verificationEfficacite"))
                        .dateVerificationEfficacite(
                                node.hasNonNull("dateVerificationEfficacite")
                                        ? LocalDate.parse(node.get("dateVerificationEfficacite").asText())
                                        : null)
                        .responsableId(textOrNull(node, "responsableId"))
                        .responsableNom(textOrNull(node, "responsableNom"))
                        .dateEcheance(
                                node.hasNonNull("dateEcheance")
                                        ? LocalDate.parse(node.get("dateEcheance").asText())
                                        : null)
                        .sourceInspectionId(textOrNull(node, "sourceInspectionId"))
                        .sourceInspectionNumero(textOrNull(node, "sourceInspectionNumero"))
                        .cnssOuInspectionReference(textOrNull(node, "cnssOuInspectionReference"))
                        .registreLegalNumero(textOrNull(node, "registreLegalNumero"))
                        .status(normalizeSeedStatus(node.path("status").asText(NonConformite.STATUS_OUVERTE)))
                        .notes(textOrNull(node, "notes"))
                        .build();
                repository.save(entity);
            }
        } catch (Exception ex) {
            throw new IllegalStateException("Failed to seed non-conformités", ex);
        }
    }

    private static String normalizeSeedStatus(String raw) {
        return switch (raw.trim().toUpperCase()) {
            case "EN_COURS" -> NonConformite.STATUS_EN_TRAITEMENT;
            case "CLOTUREE" -> NonConformite.STATUS_CLOTUREE;
            case "VERIFIEE" -> NonConformite.STATUS_VERIFIEE;
            case "ASSIGNEE" -> NonConformite.STATUS_ASSIGNEE;
            default -> raw.trim().toUpperCase();
        };
    }

    private static String textOrNull(JsonNode node, String field) {
        return node.hasNonNull(field) ? node.get(field).asText() : null;
    }
}
