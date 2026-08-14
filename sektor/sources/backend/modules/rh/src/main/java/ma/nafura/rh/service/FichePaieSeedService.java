package ma.nafura.rh.service;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import java.io.InputStream;
import java.math.BigDecimal;
import ma.nafura.platform.framework.context.TenantContext;
import ma.nafura.rh.domain.model.FichePaie;
import ma.nafura.rh.repository.FichePaieRepository;
import org.springframework.core.io.ClassPathResource;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class FichePaieSeedService {

    private final FichePaieRepository repository;
    private final EmployeSeedService employeSeedService;
    private final ObjectMapper objectMapper;

    public FichePaieSeedService(
            FichePaieRepository repository,
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
        seedFiches();
    }

    private void seedFiches() {
        try (InputStream in = new ClassPathResource("seed/fiches-paie-seed.json").getInputStream()) {
            JsonNode root = objectMapper.readTree(in);
            for (JsonNode node : root.get("fichesPaie")) {
                FichePaie entity = FichePaie.builder()
                        .id(node.get("id").asText())
                        .tenantId(TenantContext.getTenantId())
                        .numero(node.get("numero").asText())
                        .employeId(node.get("employeId").asText())
                        .employeNom(textOrNull(node, "employeNom"))
                        .mois(node.get("mois").asText())
                        .salaireBase(decimal(node, "salaireBase"))
                        .indemniteRepresentation(decimal(node, "indemniteRepresentation"))
                        .indemniteTransport(decimal(node, "indemniteTransport"))
                        .montantHeuresSup(decimal(node, "montantHeuresSup"))
                        .salaireBrut(decimal(node, "salaireBrut"))
                        .cotisationCnss(decimal(node, "cotisationCNSS"))
                        .cotisationAmo(decimal(node, "cotisationAMO"))
                        .totalRetenues(decimal(node, "totalRetenues"))
                        .salaireNetImposable(decimal(node, "salaireNetImposable"))
                        .igr(decimal(node, "igr"))
                        .salaireNetAPayer(decimal(node, "salaireNetAPayer"))
                        .status(node.path("status").asText(FichePaie.STATUS_BROUILLON))
                        .notes(textOrNull(node, "notes"))
                        .build();
                repository.save(entity);
            }
        } catch (Exception ex) {
            throw new IllegalStateException("Failed to seed fiches paie", ex);
        }
    }

    private static String textOrNull(JsonNode node, String field) {
        return node.hasNonNull(field) ? node.get(field).asText() : null;
    }

    private static BigDecimal decimal(JsonNode node, String field) {
        return new BigDecimal(node.get(field).asText());
    }
}
