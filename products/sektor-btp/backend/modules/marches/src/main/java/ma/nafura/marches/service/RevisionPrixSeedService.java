package ma.nafura.marches.service;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import java.io.InputStream;
import java.util.UUID;
import ma.nafura.marches.domain.model.RevisionPrix;
import ma.nafura.marches.repository.ContratMarcheRepository;
import ma.nafura.marches.repository.RevisionPrixRepository;
import ma.nafura.platform.framework.context.TenantContext;
import org.springframework.core.io.ClassPathResource;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class RevisionPrixSeedService {

    private final RevisionPrixRepository revisionRepository;
    private final ContratMarcheRepository contratRepository;
    private final RevisionPrixService revisionPrixService;
    private final IndiceBtpSeedService indiceSeedService;
    private final ObjectMapper objectMapper;

    public RevisionPrixSeedService(
            RevisionPrixRepository revisionRepository,
            ContratMarcheRepository contratRepository,
            RevisionPrixService revisionPrixService,
            IndiceBtpSeedService indiceSeedService,
            ObjectMapper objectMapper) {
        this.revisionRepository = revisionRepository;
        this.contratRepository = contratRepository;
        this.revisionPrixService = revisionPrixService;
        this.indiceSeedService = indiceSeedService;
        this.objectMapper = objectMapper;
    }

    @Transactional
    public void seedIfEmpty() {
        UUID tenantId = TenantContext.getTenantId();
        indiceSeedService.seedIfEmpty();
        if (revisionRepository.countByTenantId(tenantId) > 0) {
            return;
        }
        try (InputStream in = new ClassPathResource("seed/revisions-prix-seed.json").getInputStream()) {
            JsonNode root = objectMapper.readTree(in);
            for (JsonNode node : root.get("revisions")) {
                String contratId = node.get("contratMarcheId").asText();
                if (contratRepository.findByIdAndTenantId(contratId, tenantId).isEmpty()) {
                    continue;
                }
                String periode = node.get("periode").asText();
                revisionPrixService.calculer(contratId, periode, node.get("id").asText());
            }
        } catch (Exception ex) {
            throw new IllegalStateException("Failed to seed revisions prix demo data", ex);
        }
    }
}
