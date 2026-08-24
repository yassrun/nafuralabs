package ma.nafura.chantiers.seeders;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import java.io.InputStream;
import java.time.LocalDate;
import ma.nafura.chantiers.domain.chantier.DocumentChantier;
import ma.nafura.chantiers.repository.DocumentChantierRepository;
import ma.nafura.platform.framework.context.TenantContext;
import org.springframework.core.io.ClassPathResource;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class ChantierDocumentsSeedService {

    private final DocumentChantierRepository documentRepository;
    private final ObjectMapper objectMapper;

    public ChantierDocumentsSeedService(DocumentChantierRepository documentRepository, ObjectMapper objectMapper) {
        this.documentRepository = documentRepository;
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
            // Les attachements de démo au posteCode libre ne sont plus repris (lab métier, schéma
            // clean + re-seed — contrat avancement-et-attachement, § Hors périmètre). Un
            // attachement se monte désormais depuis les déclarations réelles d'une période
            // (AttachementChantierService.create), pas depuis une ligne fabriquée à la main.
        } catch (Exception ex) {
            throw new IllegalStateException("Failed to seed chantier documents demo data", ex);
        }
    }
}
