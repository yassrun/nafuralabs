package ma.nafura.hse.service;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import java.io.InputStream;
import java.time.LocalDate;
import java.util.UUID;
import ma.nafura.hse.domain.model.Phs;
import ma.nafura.hse.repository.PhsRepository;
import ma.nafura.platform.framework.context.TenantContext;
import org.springframework.core.io.ClassPathResource;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class PhsSeedService {

    private final PhsRepository repository;
    private final ObjectMapper objectMapper;

    public PhsSeedService(PhsRepository repository, ObjectMapper objectMapper) {
        this.repository = repository;
        this.objectMapper = objectMapper;
    }

    @Transactional
    public void seedIfEmpty() {
        UUID tenantId = TenantContext.getTenantId();
        if (repository.countByTenantId(tenantId) > 0) {
            return;
        }
        try (InputStream in = new ClassPathResource("seed/phs-seed.json").getInputStream()) {
            JsonNode root = objectMapper.readTree(in);
            for (JsonNode node : root.get("phs")) {
                Phs entity = Phs.builder()
                        .id(node.get("id").asText())
                        .tenantId(tenantId)
                        .numero(node.get("numero").asText())
                        .titre(node.path("titre").asText(node.get("numero").asText()))
                        .version(node.path("version").asInt(1))
                        .dateRevision(LocalDate.parse(node.get("dateRevision").asText()))
                        .auteurNom(node.get("auteurNom").asText())
                        .contenu(textOrNull(node, "contenu"))
                        .status(node.path("status").asText(Phs.STATUS_BROUILLON))
                        .build();
                repository.save(entity);
            }
        } catch (Exception ex) {
            throw new IllegalStateException("Failed to seed PHS", ex);
        }
    }

    private static String textOrNull(JsonNode node, String field) {
        return node.hasNonNull(field) ? node.get(field).asText() : null;
    }
}
