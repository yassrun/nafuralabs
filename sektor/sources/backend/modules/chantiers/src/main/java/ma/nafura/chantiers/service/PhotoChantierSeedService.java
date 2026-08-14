package ma.nafura.chantiers.service;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import java.io.InputStream;
import java.time.OffsetDateTime;
import ma.nafura.chantiers.domain.model.PhotoChantier;
import ma.nafura.chantiers.repository.PhotoChantierRepository;
import ma.nafura.platform.framework.context.TenantContext;
import org.springframework.core.io.ClassPathResource;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class PhotoChantierSeedService {

    private final PhotoChantierRepository repository;
    private final ObjectMapper objectMapper;

    public PhotoChantierSeedService(PhotoChantierRepository repository, ObjectMapper objectMapper) {
        this.repository = repository;
        this.objectMapper = objectMapper;
    }

    @Transactional
    public void seedIfEmpty() {
        if (repository.countByTenantId(TenantContext.getTenantId()) > 0) {
            return;
        }
        try (InputStream in = new ClassPathResource("seed/photos-chantier-seed.json").getInputStream()) {
            JsonNode root = objectMapper.readTree(in);
            for (JsonNode node : root.get("photos")) {
                repository.save(PhotoChantier.builder()
                        .id(node.get("id").asText())
                        .tenantId(TenantContext.getTenantId())
                        .chantierId(node.get("chantierId").asText())
                        .filename(node.get("filename").asText())
                        .contentType(node.get("contentType").asText())
                        .storagePath(node.get("storagePath").asText())
                        .lat(node.hasNonNull("lat") ? node.get("lat").asDouble() : null)
                        .lng(node.hasNonNull("lng") ? node.get("lng").asDouble() : null)
                        .zone(textOrNull(node, "zone"))
                        .takenAt(OffsetDateTime.parse(node.get("takenAt").asText()))
                        .exifJson(textOrNull(node, "exifJson"))
                        .uploadedBy(node.get("uploadedBy").asText())
                        .build());
            }
        } catch (Exception ex) {
            throw new IllegalStateException("Failed to seed photos chantier demo data", ex);
        }
    }

    private static String textOrNull(JsonNode node, String field) {
        return node.hasNonNull(field) ? node.get(field).asText() : null;
    }
}
