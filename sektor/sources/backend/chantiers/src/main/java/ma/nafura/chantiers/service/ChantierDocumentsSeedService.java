package ma.nafura.chantiers.service;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import java.io.InputStream;
import java.math.BigDecimal;
import java.time.LocalDate;
import ma.nafura.chantiers.domain.model.AttachementChantier;
import ma.nafura.chantiers.domain.model.AttachementLigne;
import ma.nafura.chantiers.domain.model.DocumentChantier;
import ma.nafura.chantiers.repository.AttachementChantierRepository;
import ma.nafura.chantiers.repository.AttachementLigneRepository;
import ma.nafura.chantiers.repository.DocumentChantierRepository;
import ma.nafura.platform.framework.context.TenantContext;
import org.springframework.core.io.ClassPathResource;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class ChantierDocumentsSeedService {

    private final DocumentChantierRepository documentRepository;
    private final AttachementChantierRepository attachementRepository;
    private final AttachementLigneRepository ligneRepository;
    private final ObjectMapper objectMapper;

    public ChantierDocumentsSeedService(
            DocumentChantierRepository documentRepository,
            AttachementChantierRepository attachementRepository,
            AttachementLigneRepository ligneRepository,
            ObjectMapper objectMapper) {
        this.documentRepository = documentRepository;
        this.attachementRepository = attachementRepository;
        this.ligneRepository = ligneRepository;
        this.objectMapper = objectMapper;
    }

    @Transactional
    public void seedIfEmpty() {
        if (documentRepository.countByTenantId(TenantContext.getTenantId()) > 0) {
            return;
        }
        try (InputStream in = new ClassPathResource("seed/chantier-documents-seed.json").getInputStream()) {
            JsonNode root = objectMapper.readTree(in);
            for (JsonNode node : root.get("documents")) {
                documentRepository.save(DocumentChantier.builder()
                        .id(node.get("id").asText())
                        .tenantId(TenantContext.getTenantId())
                        .chantierId(node.get("chantierId").asText())
                        .type(node.get("type").asText())
                        .titre(node.get("titre").asText())
                        .fichier(node.get("fichier").asText())
                        .taille(node.get("taille").asLong())
                        .uploadedAt(LocalDate.parse(node.get("uploadedAt").asText()))
                        .uploadedPar(node.get("uploadedPar").asText())
                        .tags(node.has("tags") ? node.get("tags").toString() : null)
                        .build());
            }
            for (JsonNode node : root.get("attachements")) {
                attachementRepository.save(AttachementChantier.builder()
                        .id(node.get("id").asText())
                        .tenantId(TenantContext.getTenantId())
                        .chantierId(node.get("chantierId").asText())
                        .numero(node.get("numero").asText())
                        .date(LocalDate.parse(node.get("date").asText()))
                        .meteoCode(textOrNull(node, "meteoCode"))
                        .temperatureC(node.hasNonNull("temperatureC") ? node.get("temperatureC").asInt() : null)
                        .effectifPresent(node.get("effectifPresent").asInt())
                        .status(node.get("status").asText())
                        .build());
                int ordre = 0;
                for (JsonNode ligne : node.get("lignes")) {
                    ligneRepository.save(AttachementLigne.builder()
                            .id(node.get("id").asText() + "-l-" + ordre)
                            .tenantId(TenantContext.getTenantId())
                            .attachementId(node.get("id").asText())
                            .posteCode(ligne.get("posteCode").asText())
                            .designation(ligne.get("designation").asText())
                            .quantiteExecutee(new BigDecimal(ligne.get("quantiteExecutee").asText()))
                            .unite(ligne.get("unite").asText())
                            .zone(textOrNull(ligne, "zone"))
                            .ordre(ordre++)
                            .build());
                }
            }
        } catch (Exception ex) {
            throw new IllegalStateException("Failed to seed chantier documents demo data", ex);
        }
    }

    private static String textOrNull(JsonNode node, String field) {
        return node.hasNonNull(field) ? node.get(field).asText() : null;
    }
}
