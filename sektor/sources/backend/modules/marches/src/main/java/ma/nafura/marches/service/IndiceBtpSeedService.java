package ma.nafura.marches.service;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import java.io.InputStream;
import java.math.BigDecimal;
import java.util.UUID;
import ma.nafura.marches.domain.model.IndiceBtp;
import ma.nafura.marches.repository.IndiceBtpRepository;
import ma.nafura.platform.framework.context.TenantContext;
import org.springframework.core.io.ClassPathResource;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class IndiceBtpSeedService {

    private final IndiceBtpRepository indiceRepository;
    private final ObjectMapper objectMapper;

    public IndiceBtpSeedService(IndiceBtpRepository indiceRepository, ObjectMapper objectMapper) {
        this.indiceRepository = indiceRepository;
        this.objectMapper = objectMapper;
    }

    @Transactional
    public void seedIfEmpty() {
        UUID tenantId = TenantContext.getTenantId();
        if (indiceRepository.countByTenantId(tenantId) > 0) {
            return;
        }
        try (InputStream in = new ClassPathResource("seed/indices-btp-seed.json").getInputStream()) {
            JsonNode root = objectMapper.readTree(in);
            for (JsonNode node : root.get("indices")) {
                String code = node.get("code").asText();
                String periode = node.get("periode").asText();
                IndiceBtp entity = IndiceBtp.builder()
                        .id(indiceId(code, periode))
                        .tenantId(tenantId)
                        .code(code)
                        .periode(periode)
                        .valeur(new BigDecimal(node.get("valeur").asText()))
                        .build();
                indiceRepository.save(entity);
            }
        } catch (Exception ex) {
            throw new IllegalStateException("Failed to seed indices BTP demo data", ex);
        }
    }

    static String indiceId(String code, String periode) {
        return "ibtp-" + code.toLowerCase() + "-" + periode;
    }
}
