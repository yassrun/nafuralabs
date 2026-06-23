package ma.nafura.rh.service;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import java.io.InputStream;
import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.UUID;
import ma.nafura.platform.framework.context.TenantContext;
import ma.nafura.rh.domain.model.Pointage;
import ma.nafura.rh.domain.model.PointageBatch;
import ma.nafura.rh.repository.PointageBatchRepository;
import ma.nafura.rh.repository.PointageRepository;
import org.springframework.core.io.ClassPathResource;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class PointageSeedService {

    private final PointageBatchRepository batchRepository;
    private final PointageRepository pointageRepository;
    private final EmployeSeedService employeSeedService;
    private final ObjectMapper objectMapper;

    public PointageSeedService(
            PointageBatchRepository batchRepository,
            PointageRepository pointageRepository,
            EmployeSeedService employeSeedService,
            ObjectMapper objectMapper) {
        this.batchRepository = batchRepository;
        this.pointageRepository = pointageRepository;
        this.employeSeedService = employeSeedService;
        this.objectMapper = objectMapper;
    }

    @Transactional
    public void seedIfEmpty() {
        employeSeedService.seedIfEmpty();
        UUID tenantId = TenantContext.getTenantId();
        if (pointageRepository.countByTenantId(tenantId) > 0) {
            return;
        }
        try (InputStream in = new ClassPathResource("seed/pointages-seed.json").getInputStream()) {
            JsonNode root = objectMapper.readTree(in);
            for (JsonNode batchNode : root.get("batches")) {
                String batchId = batchNode.get("id").asText();
                PointageBatch batch = PointageBatch.builder()
                        .id(batchId)
                        .tenantId(tenantId)
                        .clientId(UUID.fromString(batchNode.get("clientId").asText()))
                        .chefEmployeId(batchNode.get("chefEmployeId").asText())
                        .chantierId(batchNode.get("chantierId").asText())
                        .datePointage(LocalDate.parse(batchNode.get("datePointage").asText()))
                        .status(batchNode.path("status").asText(PointageBatch.STATUS_BROUILLON))
                        .build();
                batchRepository.save(batch);

                for (JsonNode ptNode : batchNode.get("pointages")) {
                    Pointage pointage = Pointage.builder()
                            .id(ptNode.get("id").asText())
                            .tenantId(tenantId)
                            .batchId(batchId)
                            .employeId(ptNode.get("employeId").asText())
                            .chantierId(batchNode.get("chantierId").asText())
                            .date(LocalDate.parse(ptNode.get("date").asText()))
                            .mode(ptNode.get("mode").asText())
                            .heureArrivee(textOrNull(ptNode, "heureArrivee"))
                            .heureDepart(textOrNull(ptNode, "heureDepart"))
                            .heuresNormales(decimalOrZero(ptNode, "heuresNormales"))
                            .heuresSup(decimalOrZero(ptNode, "heuresSup"))
                            .status(ptNode.path("status").asText(Pointage.STATUS_BROUILLON))
                            .build();
                    pointageRepository.save(pointage);
                }
            }
        } catch (Exception ex) {
            throw new IllegalStateException("Failed to seed pointages", ex);
        }
    }

    private static String textOrNull(JsonNode node, String field) {
        return node.hasNonNull(field) ? node.get(field).asText() : null;
    }

    private static BigDecimal decimalOrZero(JsonNode node, String field) {
        return node.hasNonNull(field) ? new BigDecimal(node.get(field).asText()) : BigDecimal.ZERO;
    }
}
