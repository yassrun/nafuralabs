package ma.nafura.approbations.service;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import java.io.InputStream;
import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.OffsetDateTime;
import java.util.UUID;
import ma.nafura.approbations.domain.model.ApprovalEvent;
import ma.nafura.approbations.domain.model.ApprovalRequest;
import ma.nafura.approbations.repository.ApprovalEventRepository;
import ma.nafura.approbations.repository.ErpApprovalRequestRepository;
import ma.nafura.platform.framework.context.TenantContext;
import org.springframework.core.io.ClassPathResource;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class ApprovalRequestSeedService {

    private final ErpApprovalRequestRepository repository;
    private final ApprovalEventRepository eventRepository;
    private final ApprovalWorkflowSeedService workflowSeedService;
    private final ObjectMapper objectMapper;

    public ApprovalRequestSeedService(
            ErpApprovalRequestRepository repository,
            ApprovalEventRepository eventRepository,
            ApprovalWorkflowSeedService workflowSeedService,
            ObjectMapper objectMapper) {
        this.repository = repository;
        this.eventRepository = eventRepository;
        this.workflowSeedService = workflowSeedService;
        this.objectMapper = objectMapper;
    }

    @Transactional
    public void seedIfEmpty() {
        workflowSeedService.seedIfEmpty();
        UUID tenantId = TenantContext.getTenantId();
        if (repository.countByTenantId(tenantId) > 0) {
            return;
        }
        try (InputStream in = new ClassPathResource("seed/approval-requests-seed.json").getInputStream()) {
            JsonNode root = objectMapper.readTree(in);
            for (JsonNode node : root.get("requests")) {
                ApprovalRequest entity = ApprovalRequest.builder()
                        .id(node.get("id").asText())
                        .tenantId(tenantId)
                        .workflowId(node.get("workflowId").asText())
                        .entityType(node.get("entityType").asText())
                        .entityId(node.get("entityId").asText())
                        .entityRef(node.get("entityRef").asText())
                        .entitySummary(node.get("entitySummary").asText())
                        .montantConcerne(
                                node.hasNonNull("montantConcerne")
                                        ? BigDecimal.valueOf(node.get("montantConcerne").asDouble())
                                        : null)
                        .chantierId(textOrNull(node, "chantierId"))
                        .initiateurUserId(node.get("initiateurUserId").asText())
                        .initiateurNom(node.get("initiateurNom").asText())
                        .status(node.get("status").asText())
                        .etapeCouranteIndex(node.path("etapeCouranteIndex").asInt(0))
                        .dateSoumission(LocalDate.parse(node.get("dateSoumission").asText()))
                        .dateCloture(
                                node.hasNonNull("dateCloture")
                                        ? LocalDate.parse(node.get("dateCloture").asText())
                                        : null)
                        .urgence(node.path("urgence").asText("NORMALE"))
                        .build();
                repository.save(entity);

                if (node.has("events") && node.get("events").isArray()) {
                    String previousHash = "";
                    for (JsonNode eventNode : node.get("events")) {
                        seedEvent(tenantId, entity.getId(), eventNode, previousHash);
                        previousHash = ApprovalEventService.computeHash(
                                previousHash,
                                eventNode.get("action").asText(),
                                eventNode.get("userId").asText(),
                                OffsetDateTime.parse(eventNode.get("createdAt").asText()),
                                "");
                    }
                }
            }
        } catch (Exception ex) {
            throw new IllegalStateException("Failed to seed approval requests", ex);
        }
    }

    private void seedEvent(UUID tenantId, String requestId, JsonNode eventNode, String previousHash) {
        String action = eventNode.get("action").asText();
        String userId = eventNode.get("userId").asText();
        String userNom = textOrNull(eventNode, "userNom");
        String commentaire = textOrNull(eventNode, "commentaire");
        OffsetDateTime createdAt = OffsetDateTime.parse(eventNode.get("createdAt").asText());
        String eventHash = ApprovalEventService.computeHash(previousHash, action, userId, createdAt, "");

        ApprovalEvent event = ApprovalEvent.builder()
                .tenantId(tenantId)
                .requestId(requestId)
                .action(action)
                .userId(userId)
                .userNom(userNom)
                .commentaire(commentaire)
                .previousHash(previousHash.isEmpty() ? null : previousHash)
                .eventHash(eventHash)
                .createdAt(createdAt)
                .build();
        eventRepository.save(event);
    }

    private static String textOrNull(JsonNode node, String field) {
        return node.hasNonNull(field) ? node.get(field).asText() : null;
    }
}
