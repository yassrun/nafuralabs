package ma.nafura.hse.service;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import java.io.InputStream;
import java.time.LocalDate;
import java.util.UUID;
import ma.nafura.hse.domain.model.VisiteMedicale;
import ma.nafura.hse.repository.VisiteMedicaleRepository;
import ma.nafura.platform.framework.context.TenantContext;
import org.springframework.core.io.ClassPathResource;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class VisiteMedicaleSeedService {

    private final VisiteMedicaleRepository repository;
    private final ObjectMapper objectMapper;

    public VisiteMedicaleSeedService(VisiteMedicaleRepository repository, ObjectMapper objectMapper) {
        this.repository = repository;
        this.objectMapper = objectMapper;
    }

    @Transactional
    public void seedIfEmpty() {
        UUID tenantId = TenantContext.getTenantId();
        if (repository.countByTenantId(tenantId) > 0) {
            return;
        }
        try (InputStream in = new ClassPathResource("seed/visites-medicales-seed.json").getInputStream()) {
            JsonNode root = objectMapper.readTree(in);
            for (JsonNode node : root.get("visitesMedicales")) {
                VisiteMedicale entity = VisiteMedicale.builder()
                        .id(node.get("id").asText())
                        .tenantId(tenantId)
                        .employeId(node.get("employeId").asText())
                        .employeMatricule(node.get("employeMatricule").asText())
                        .employeNom(node.get("employeNom").asText())
                        .posteOccupe(node.get("posteOccupe").asText())
                        .type(node.get("type").asText())
                        .date(LocalDate.parse(node.get("date").asText()))
                        .aptitude(node.get("aptitude").asText())
                        .medecinNom(node.get("medecinNom").asText())
                        .restrictions(textOrNull(node, "restrictions"))
                        .prochaineEcheance(LocalDate.parse(node.get("prochaineEcheance").asText()))
                        .build();
                repository.save(entity);
            }
        } catch (Exception ex) {
            throw new IllegalStateException("Failed to seed visites médicales", ex);
        }
    }

    private static String textOrNull(JsonNode node, String field) {
        return node.hasNonNull(field) ? node.get(field).asText() : null;
    }
}
