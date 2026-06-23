package ma.nafura.rh.service;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import java.io.InputStream;
import java.math.BigDecimal;
import java.time.LocalDate;
import ma.nafura.platform.framework.context.TenantContext;
import ma.nafura.rh.domain.model.FraisDeplacement;
import ma.nafura.rh.repository.FraisDeplacementRepository;
import org.springframework.core.io.ClassPathResource;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class FraisDeplacementSeedService {

    private final FraisDeplacementRepository repository;
    private final EmployeSeedService employeSeedService;
    private final ObjectMapper objectMapper;

    public FraisDeplacementSeedService(
            FraisDeplacementRepository repository,
            EmployeSeedService employeSeedService,
            ObjectMapper objectMapper) {
        this.repository = repository;
        this.employeSeedService = employeSeedService;
        this.objectMapper = objectMapper;
    }

    @Transactional
    public void seedIfEmpty() {
        employeSeedService.seedIfEmpty();
        if (repository.countByTenantId(TenantContext.getTenantId()) > 0) {
            return;
        }
        seedFrais();
    }

    private void seedFrais() {
        try (InputStream in = new ClassPathResource("seed/frais-deplacement-seed.json").getInputStream()) {
            JsonNode root = objectMapper.readTree(in);
            for (JsonNode node : root.get("fraisDeplacement")) {
                FraisDeplacement entity = FraisDeplacement.builder()
                        .id(node.get("id").asText())
                        .tenantId(TenantContext.getTenantId())
                        .employeId(node.get("employeId").asText())
                        .employeNom(textOrNull(node, "employeNom"))
                        .type(node.get("type").asText())
                        .date(LocalDate.parse(node.get("date").asText()))
                        .montant(new BigDecimal(node.get("montant").asText()))
                        .km(node.hasNonNull("km") ? new BigDecimal(node.get("km").asText()) : null)
                        .status(node.path("status").asText(FraisDeplacement.STATUS_BROUILLON))
                        .motifRejet(textOrNull(node, "motifRejet"))
                        .build();
                repository.save(entity);
            }
        } catch (Exception ex) {
            throw new IllegalStateException("Failed to seed frais deplacement", ex);
        }
    }

    private static String textOrNull(JsonNode node, String field) {
        return node.hasNonNull(field) ? node.get(field).asText() : null;
    }
}
