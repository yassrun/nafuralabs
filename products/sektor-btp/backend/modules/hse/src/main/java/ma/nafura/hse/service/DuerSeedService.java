package ma.nafura.hse.service;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import java.io.InputStream;
import java.time.LocalDate;
import java.util.UUID;
import ma.nafura.hse.domain.model.Duer;
import ma.nafura.hse.domain.model.DuerRisque;
import ma.nafura.hse.repository.DuerRepository;
import ma.nafura.hse.repository.DuerRisqueRepository;
import ma.nafura.platform.framework.context.TenantContext;
import org.springframework.core.io.ClassPathResource;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class DuerSeedService {

    private final DuerRepository duerRepository;
    private final DuerRisqueRepository risqueRepository;
    private final ObjectMapper objectMapper;

    public DuerSeedService(
            DuerRepository duerRepository,
            DuerRisqueRepository risqueRepository,
            ObjectMapper objectMapper) {
        this.duerRepository = duerRepository;
        this.risqueRepository = risqueRepository;
        this.objectMapper = objectMapper;
    }

    @Transactional
    public void seedIfEmpty() {
        UUID tenantId = TenantContext.getTenantId();
        if (duerRepository.countByTenantId(tenantId) > 0) {
            return;
        }
        try (InputStream in = new ClassPathResource("seed/duer-seed.json").getInputStream()) {
            JsonNode root = objectMapper.readTree(in);
            for (JsonNode node : root.get("duer")) {
                Duer duer = Duer.builder()
                        .id(node.get("id").asText())
                        .tenantId(tenantId)
                        .numero(node.get("numero").asText())
                        .chantierId(textOrNull(node, "chantierId"))
                        .chantierCode(textOrNull(node, "chantierCode"))
                        .chantierNom(textOrNull(node, "chantierName"))
                        .version(node.get("version").asText())
                        .dateRevision(LocalDate.parse(node.get("dateRevision").asText()))
                        .auteurId(textOrNull(node, "auteurId"))
                        .auteurNom(textOrNull(node, "auteurNom"))
                        .risquesIdentifies(node.path("risquesIdentifies").asInt(0))
                        .actionsCorrectives(node.path("actionsCorrectives").asInt(0))
                        .observations(textOrNull(node, "observations"))
                        .status(node.path("status").asText(Duer.STATUS_BROUILLON))
                        .build();
                duerRepository.save(duer);

                if (node.has("risques") && node.get("risques").isArray()) {
                    for (JsonNode risqueNode : node.get("risques")) {
                        DuerRisque risque = DuerRisque.builder()
                                .id(risqueNode.get("id").asText())
                                .tenantId(tenantId)
                                .duerId(duer.getId())
                                .libelle(risqueNode.get("libelle").asText())
                                .probabilite(risqueNode.get("probabilite").asInt())
                                .gravite(risqueNode.get("gravite").asInt())
                                .codeActivite(textOrNull(risqueNode, "codeActivite"))
                                .mesures(textOrNull(risqueNode, "mesures"))
                                .ordre(risqueNode.path("ordre").asInt(0))
                                .build();
                        risqueRepository.save(risque);
                    }
                }
            }
        } catch (Exception ex) {
            throw new IllegalStateException("Failed to seed DUER", ex);
        }
    }

    private static String textOrNull(JsonNode node, String field) {
        return node.hasNonNull(field) ? node.get(field).asText() : null;
    }
}
