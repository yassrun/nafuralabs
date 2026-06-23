package ma.nafura.approbations.service;

import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.ObjectMapper;
import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.security.NoSuchAlgorithmException;
import java.time.OffsetDateTime;
import java.util.HexFormat;
import java.util.List;
import java.util.UUID;
import ma.nafura.approbations.api.dto.ApprovalEventDto;
import ma.nafura.approbations.api.dto.ApprovalIntegrityResultDto;
import ma.nafura.approbations.domain.model.ApprovalEvent;
import ma.nafura.approbations.repository.ApprovalEventRepository;
import ma.nafura.platform.framework.context.TenantContext;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.util.StringUtils;

@Service
public class ApprovalEventService {

    private final ApprovalEventRepository repository;
    private final ObjectMapper objectMapper;

    public ApprovalEventService(ApprovalEventRepository repository, ObjectMapper objectMapper) {
        this.repository = repository;
        this.objectMapper = objectMapper;
    }

    @Transactional
    public ApprovalEvent appendEvent(
            String requestId,
            String action,
            String userId,
            String userNom,
            String commentaire,
            String payloadJson) {
        UUID tenantId = tenantId();
        List<ApprovalEvent> existing =
                repository.findByTenantIdAndRequestIdOrderByCreatedAtAsc(tenantId, requestId);
        String previousHash = existing.isEmpty() ? "" : existing.get(existing.size() - 1).getEventHash();
        OffsetDateTime timestamp = OffsetDateTime.now();
        String payload = payloadJson != null ? payloadJson : "";
        String eventHash = computeHash(previousHash, action, userId, timestamp, payload);

        ApprovalEvent event = ApprovalEvent.builder()
                .tenantId(tenantId)
                .requestId(requestId)
                .action(action)
                .userId(userId)
                .userNom(userNom)
                .commentaire(commentaire)
                .payloadJson(StringUtils.hasText(payloadJson) ? payloadJson : null)
                .previousHash(StringUtils.hasText(previousHash) ? previousHash : null)
                .eventHash(eventHash)
                .createdAt(timestamp)
                .build();
        return repository.save(event);
    }

    @Transactional(readOnly = true)
    public List<ApprovalEventDto> listEvents(String requestId) {
        return repository.findByTenantIdAndRequestIdOrderByCreatedAtAsc(tenantId(), requestId).stream()
                .map(this::toDto)
                .toList();
    }

    @Transactional(readOnly = true)
    public ApprovalIntegrityResultDto verifyIntegrity(String requestId) {
        List<ApprovalEvent> events =
                repository.findByTenantIdAndRequestIdOrderByCreatedAtAsc(tenantId(), requestId);
        String previousHash = "";
        for (ApprovalEvent event : events) {
            String payload = event.getPayloadJson() != null ? event.getPayloadJson() : "";
            String expected = computeHash(previousHash, event.getAction(), event.getUserId(), event.getCreatedAt(), payload);
            String storedPrevious = event.getPreviousHash() != null ? event.getPreviousHash() : "";
            if (!storedPrevious.equals(previousHash) || !expected.equals(event.getEventHash())) {
                return ApprovalIntegrityResultDto.builder()
                        .valid(false)
                        .eventCount(events.size())
                        .message("Hash mismatch at event " + event.getId())
                        .build();
            }
            previousHash = event.getEventHash();
        }
        return ApprovalIntegrityResultDto.builder()
                .valid(true)
                .eventCount(events.size())
                .message("Chain integrity verified")
                .build();
    }

    static String computeHash(
            String previousHash, String action, String userId, OffsetDateTime timestamp, String payload) {
        String base = (previousHash != null ? previousHash : "")
                + action
                + userId
                + timestamp.toString()
                + (payload != null ? payload : "");
        try {
            MessageDigest digest = MessageDigest.getInstance("SHA-256");
            byte[] hash = digest.digest(base.getBytes(StandardCharsets.UTF_8));
            return HexFormat.of().formatHex(hash);
        } catch (NoSuchAlgorithmException ex) {
            throw new IllegalStateException("SHA-256 not available", ex);
        }
    }

    String serializePayload(Object payload) {
        if (payload == null) {
            return null;
        }
        try {
            return objectMapper.writeValueAsString(payload);
        } catch (JsonProcessingException ex) {
            throw new IllegalArgumentException("Invalid payload", ex);
        }
    }

    private ApprovalEventDto toDto(ApprovalEvent event) {
        return ApprovalEventDto.builder()
                .id(event.getId())
                .action(event.getAction())
                .userId(event.getUserId())
                .userNom(event.getUserNom())
                .commentaire(event.getCommentaire())
                .payloadJson(event.getPayloadJson())
                .previousHash(event.getPreviousHash())
                .eventHash(event.getEventHash())
                .createdAt(event.getCreatedAt())
                .build();
    }

    private UUID tenantId() {
        return TenantContext.getTenantId();
    }
}
