package ma.nafura.hse.service;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import java.io.InputStream;
import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.UUID;
import ma.nafura.hse.domain.model.AuditHse;
import ma.nafura.hse.domain.model.AuditHseLigne;
import ma.nafura.hse.repository.AuditHseLigneRepository;
import ma.nafura.hse.repository.AuditHseRepository;
import ma.nafura.platform.framework.context.TenantContext;
import org.springframework.core.io.ClassPathResource;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class AuditHseSeedService {

    private final AuditHseRepository auditRepository;
    private final AuditHseLigneRepository ligneRepository;
    private final ObjectMapper objectMapper;

    public AuditHseSeedService(
            AuditHseRepository auditRepository,
            AuditHseLigneRepository ligneRepository,
            ObjectMapper objectMapper) {
        this.auditRepository = auditRepository;
        this.ligneRepository = ligneRepository;
        this.objectMapper = objectMapper;
    }

    @Transactional
    public void seedIfEmpty() {
        UUID tenantId = TenantContext.getTenantId();
        if (auditRepository.countByTenantId(tenantId) > 0) {
            return;
        }
        try (InputStream in = new ClassPathResource("seed/inspections-audits-seed.json").getInputStream()) {
            JsonNode root = objectMapper.readTree(in);
            if (!root.has("audits")) {
                return;
            }
            for (JsonNode node : root.get("audits")) {
                AuditHse entity = AuditHse.builder()
                        .id(node.get("id").asText())
                        .tenantId(tenantId)
                        .numero(node.get("numero").asText())
                        .chantierId(textOrNull(node, "chantierId"))
                        .chantierCode(textOrNull(node, "chantierCode"))
                        .templateCode(textOrNull(node, "templateCode"))
                        .titre(node.get("titre").asText())
                        .auditeurNom(node.get("auditeurNom").asText())
                        .dateAudit(LocalDate.parse(node.get("dateAudit").asText()))
                        .status(node.path("status").asText(AuditHse.STATUS_BROUILLON))
                        .scoreGlobal(
                                node.hasNonNull("scoreGlobal")
                                        ? new BigDecimal(node.get("scoreGlobal").asText())
                                        : null)
                        .notes(textOrNull(node, "notes"))
                        .build();
                auditRepository.save(entity);

                if (node.has("lignes") && node.get("lignes").isArray()) {
                    for (JsonNode ligneNode : node.get("lignes")) {
                        AuditHseLigne ligne = AuditHseLigne.builder()
                                .id(ligneNode.get("id").asText())
                                .tenantId(tenantId)
                                .auditId(entity.getId())
                                .ordre(ligneNode.path("ordre").asInt(0))
                                .code(ligneNode.get("code").asText())
                                .libelle(ligneNode.get("libelle").asText())
                                .categorie(textOrNull(ligneNode, "categorie"))
                                .reponse(textOrNull(ligneNode, "reponse"))
                                .commentaire(textOrNull(ligneNode, "commentaire"))
                                .ncId(textOrNull(ligneNode, "ncId"))
                                .ncNumero(textOrNull(ligneNode, "ncNumero"))
                                .build();
                        ligneRepository.save(ligne);
                    }
                }
            }
        } catch (Exception ex) {
            throw new IllegalStateException("Failed to seed audits HSE", ex);
        }
    }

    private static String textOrNull(JsonNode node, String field) {
        return node.hasNonNull(field) ? node.get(field).asText() : null;
    }
}
