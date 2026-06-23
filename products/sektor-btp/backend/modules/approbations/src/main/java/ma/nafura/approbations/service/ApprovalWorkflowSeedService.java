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
        try (InputStream in = new ClassPathResource("seed/approval-workflows-seed.json").getInputStream()) {
            JsonNode root = objectMapper.readTree(in);
            for (JsonNode node : root.get("workflows")) {
                ApprovalWorkflow entity = ApprovalWorkflow.builder()
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
                repository.save(entity);
            }
        } catch (Exception ex) {
            throw new IllegalStateException("Failed to seed approval workflows", ex);
        }
    }

    private static String textOrNull(JsonNode node, String field) {
        return node.hasNonNull(field) ? node.get(field).asText() : null;
    }
}
