package ma.nafura.stock.service;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import java.io.InputStream;
import java.util.UUID;
import ma.nafura.platform.framework.context.TenantContext;
import ma.nafura.stock.domain.model.Location;
import ma.nafura.stock.repository.LocationRepository;
import org.springframework.core.io.ClassPathResource;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class LocationSeedService {

    private final LocationRepository repository;
    private final ObjectMapper objectMapper;

    public LocationSeedService(LocationRepository repository, ObjectMapper objectMapper) {
        this.repository = repository;
        this.objectMapper = objectMapper;
    }

    @Transactional
    public void seedIfEmpty() {
        UUID tenantId = TenantContext.getTenantId();
        if (repository.countByTenantId(tenantId) > 0) {
            return;
        }
        try (InputStream in = new ClassPathResource("seed/locations-seed.json").getInputStream()) {
            JsonNode root = objectMapper.readTree(in);
            for (JsonNode node : root.get("locations")) {
                repository.save(Location.builder()
                        .tenantId(tenantId)
                        .code(node.get("code").asText())
                        .name(node.get("name").asText())
                        .type(node.get("type").asText())
                        .isPhysical(node.path("isPhysical").asBoolean(true))
                        .affectsStock(node.path("affectsStock").asBoolean(true))
                        .build());
            }
        } catch (Exception ex) {
            throw new IllegalStateException("Failed to seed locations", ex);
        }
    }
}
