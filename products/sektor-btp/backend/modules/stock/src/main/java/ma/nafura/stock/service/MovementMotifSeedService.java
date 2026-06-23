package ma.nafura.stock.service;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import java.io.InputStream;
import java.util.UUID;
import ma.nafura.platform.framework.context.TenantContext;
import ma.nafura.stock.domain.model.MovementMotif;
import ma.nafura.stock.repository.MovementMotifRepository;
import org.springframework.core.io.ClassPathResource;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class MovementMotifSeedService {

    private final MovementMotifRepository repository;
    private final ObjectMapper objectMapper;

    public MovementMotifSeedService(MovementMotifRepository repository, ObjectMapper objectMapper) {
        this.repository = repository;
        this.objectMapper = objectMapper;
    }

    @Transactional
    public void seedIfEmpty() {
        UUID tenantId = TenantContext.getTenantId();
        if (repository.countByTenantId(tenantId) > 0) {
            return;
        }
        try (InputStream in = new ClassPathResource("seed/movement-motifs-seed.json").getInputStream()) {
            JsonNode root = objectMapper.readTree(in);
            for (JsonNode node : root.get("motifs")) {
                repository.save(MovementMotif.builder()
                        .tenantId(tenantId)
                        .code(node.get("code").asText())
                        .name(node.get("name").asText())
                        .txType(node.get("txType").asText())
                        .isActive(true)
                        .build());
            }
        } catch (Exception ex) {
            throw new IllegalStateException("Failed to seed movement motifs", ex);
        }
    }
}
