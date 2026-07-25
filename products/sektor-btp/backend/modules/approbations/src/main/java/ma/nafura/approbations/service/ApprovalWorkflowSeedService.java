package ma.nafura.approbations.service;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import java.io.InputStream;
import java.util.UUID;
import ma.nafura.approbations.domain.model.ApprovalWorkflow;
import ma.nafura.approbations.repository.ApprovalWorkflowRepository;
import ma.nafura.platform.framework.context.TenantContext;
import org.springframework.core.io.ClassPathResource;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class ApprovalWorkflowSeedService {

    private final ApprovalWorkflowRepository repository;
    private final ObjectMapper objectMapper;

    public ApprovalWorkflowSeedService(ApprovalWorkflowRepository repository, ObjectMapper objectMapper) {
        this.repository = repository;
        this.objectMapper = objectMapper;
    }

    @Transactional
    public void seedIfEmpty() {
        UUID tenantId = TenantContext.getTenantId();
        if (repository.countByTenantId(tenantId) > 0) {
            return;
        }
        seedAllFromClasspath(tenantId);
    }

    /** Assure la présence du workflow Étude N+1/N+2 même si le tenant a déjà d'autres workflows. */
    @Transactional
    public void ensureEtudePrixWorkflow() {
        UUID tenantId = TenantContext.getTenantId();
        boolean present = !repository
                .findByTenantIdAndEntityTypeAndIsActiveTrueOrderByLabelAsc(tenantId, "ETUDE_PRIX")
                .isEmpty();
        if (present) {
            return;
        }
        try (InputStream in = new ClassPathResource("seed/approval-workflows-seed.json").getInputStream()) {
            JsonNode root = objectMapper.readTree(in);
            for (JsonNode node : root.get("workflows")) {
                if (!"ETUDE_PRIX".equals(node.path("entityType").asText())) {
                    continue;
                }
                if (repository.findByIdAndTenantId(node.get("id").asText(), tenantId).isPresent()) {
                    return;
                }
                repository.save(toEntity(node, tenantId));
                return;
            }
        } catch (Exception ex) {
            throw new IllegalStateException("Failed to ensure ETUDE_PRIX workflow", ex);
        }
    }

    private void seedAllFromClasspath(UUID tenantId) {
        try (InputStream in = new ClassPathResource("seed/approval-workflows-seed.json").getInputStream()) {
            JsonNode root = objectMapper.readTree(in);
            for (JsonNode node : root.get("workflows")) {
                repository.save(toEntity(node, tenantId));
            }
        } catch (Exception ex) {
            throw new IllegalStateException("Failed to seed approval workflows", ex);
        }
    }

    private ApprovalWorkflow toEntity(JsonNode node, UUID tenantId) {
        return ApprovalWorkflow.builder()
                .id(node.get("id").asText())
                .tenantId(tenantId)
                .code(node.get("code").asText())
                .label(node.get("label").asText())
                .entityType(node.get("entityType").asText())
                .conditionsJson(textOrNull(node, "conditionsJson"))
                .etapesJson(node.get("etapesJson").asText())
                .slaJours(node.path("slaJours").asInt(4))
                .escaladeApresJours(
                        node.hasNonNull("escaladeApresJours") ? node.get("escaladeApresJours").asInt() : null)
                .isActive(node.path("isActive").asBoolean(true))
                .build();
    }

    private static String textOrNull(JsonNode node, String field) {
        return node.hasNonNull(field) ? node.get(field).asText() : null;
    }
}
