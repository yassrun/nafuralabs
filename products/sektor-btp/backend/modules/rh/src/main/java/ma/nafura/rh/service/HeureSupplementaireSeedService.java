package ma.nafura.rh.service;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import java.io.InputStream;
import java.math.BigDecimal;
import java.time.LocalDate;
import ma.nafura.platform.framework.context.TenantContext;
import ma.nafura.rh.domain.model.HeureSupplementaire;
import ma.nafura.rh.repository.HeureSupplementaireRepository;
import org.springframework.core.io.ClassPathResource;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class HeureSupplementaireSeedService {

    private final HeureSupplementaireRepository repository;
    private final EmployeSeedService employeSeedService;
    private final PointageSeedService pointageSeedService;
    private final ObjectMapper objectMapper;

    public HeureSupplementaireSeedService(
            HeureSupplementaireRepository repository,
            EmployeSeedService employeSeedService,
            PointageSeedService pointageSeedService,
            ObjectMapper objectMapper) {
        this.repository = repository;
        this.employeSeedService = employeSeedService;
        this.pointageSeedService = pointageSeedService;
        this.objectMapper = objectMapper;
    }

    @Transactional
    public void seedIfEmpty() {
        employeSeedService.seedIfEmpty();
        pointageSeedService.seedIfEmpty();
        if (repository.countByTenantId(TenantContext.getTenantId()) > 0) {
            return;
        }
        seedHeuresSupplementaires();
    }

    private void seedHeuresSupplementaires() {
        try (InputStream in = new ClassPathResource("seed/heures-supplementaires-seed.json").getInputStream()) {
            JsonNode root = objectMapper.readTree(in);
            for (JsonNode node : root.get("heuresSupplementaires")) {
                String type = node.get("type").asText();
                BigDecimal heures = new BigDecimal(node.get("heures").asText());
                BigDecimal tauxMajoration = HeureSupplementaireService.tauxForType(type);
                BigDecimal montant = node.hasNonNull("montant")
                        ? new BigDecimal(node.get("montant").asText())
                        : BigDecimal.ZERO;

                HeureSupplementaire entity = HeureSupplementaire.builder()
                        .id(node.get("id").asText())
                        .tenantId(TenantContext.getTenantId())
                        .employeId(node.get("employeId").asText())
                        .date(LocalDate.parse(node.get("date").asText()))
                        .type(type)
                        .heures(heures)
                        .tauxMajoration(tauxMajoration)
                        .montant(montant)
                        .status(node.path("status").asText(HeureSupplementaire.STATUS_BROUILLON))
                        .pointageId(textOrNull(node, "pointageId"))
                        .build();
                repository.save(entity);
            }
        } catch (Exception ex) {
            throw new IllegalStateException("Failed to seed heures supplementaires", ex);
        }
    }

    private static String textOrNull(JsonNode node, String field) {
        return node.hasNonNull(field) ? node.get(field).asText() : null;
    }
}
