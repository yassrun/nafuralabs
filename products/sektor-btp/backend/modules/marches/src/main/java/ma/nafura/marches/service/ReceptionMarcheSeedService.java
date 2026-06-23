package ma.nafura.marches.service;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import java.io.InputStream;
import java.time.LocalDate;
import java.util.UUID;
import ma.nafura.marches.domain.model.ReceptionMarche;
import ma.nafura.marches.domain.model.ReserveReception;
import ma.nafura.marches.repository.ContratMarcheRepository;
import ma.nafura.marches.repository.ReceptionMarcheRepository;
import ma.nafura.marches.repository.ReserveReceptionRepository;
import ma.nafura.platform.framework.context.TenantContext;
import org.springframework.core.io.ClassPathResource;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class ReceptionMarcheSeedService {

    private final ReceptionMarcheRepository receptionRepository;
    private final ReserveReceptionRepository reserveRepository;
    private final ContratMarcheRepository contratRepository;
    private final ObjectMapper objectMapper;

    public ReceptionMarcheSeedService(
            ReceptionMarcheRepository receptionRepository,
            ReserveReceptionRepository reserveRepository,
            ContratMarcheRepository contratRepository,
            ObjectMapper objectMapper) {
        this.receptionRepository = receptionRepository;
        this.reserveRepository = reserveRepository;
        this.contratRepository = contratRepository;
        this.objectMapper = objectMapper;
    }

    @Transactional
    public void seedIfEmpty() {
        UUID tenantId = TenantContext.getTenantId();
        if (receptionRepository.countByTenantId(tenantId) > 0) {
            return;
        }
        seedReceptions(tenantId);
        seedReserves(tenantId);
    }

    private void seedReceptions(UUID tenantId) {
        try (InputStream in = new ClassPathResource("seed/receptions-marche-seed.json").getInputStream()) {
            JsonNode root = objectMapper.readTree(in);
            for (JsonNode node : root.get("receptions")) {
                String contratId = node.get("contratMarcheId").asText();
                if (contratRepository.findByIdAndTenantId(contratId, tenantId).isEmpty()) {
                    continue;
                }
                ReceptionMarche entity = ReceptionMarche.builder()
                        .id(node.get("id").asText())
                        .tenantId(tenantId)
                        .contratMarcheId(contratId)
                        .type(node.path("type").asText(ReceptionMarche.TYPE_PROVISOIRE))
                        .dateReception(LocalDate.parse(node.get("dateReception").asText()))
                        .pvReference(textOrNull(node, "pvReference"))
                        .status(node.path("status").asText(ReceptionMarche.STATUS_VALIDE))
                        .build();
                receptionRepository.save(entity);
            }
        } catch (Exception ex) {
            throw new IllegalStateException("Failed to seed receptions marche demo data", ex);
        }
    }

    private void seedReserves(UUID tenantId) {
        try (InputStream in = new ClassPathResource("seed/reserves-reception-seed.json").getInputStream()) {
            JsonNode root = objectMapper.readTree(in);
            for (JsonNode node : root.get("reserves")) {
                String receptionId = node.get("receptionId").asText();
                if (receptionRepository.findByIdAndTenantId(receptionId, tenantId).isEmpty()) {
                    continue;
                }
                ReserveReception entity = ReserveReception.builder()
                        .id(node.get("id").asText())
                        .tenantId(tenantId)
                        .receptionId(receptionId)
                        .libelle(node.get("libelle").asText())
                        .dateLimiteLevee(
                                node.hasNonNull("dateLimiteLevee")
                                        ? LocalDate.parse(node.get("dateLimiteLevee").asText())
                                        : null)
                        .status(node.path("status").asText(ReserveReception.STATUS_OUVERTE))
                        .build();
                reserveRepository.save(entity);
            }
        } catch (Exception ex) {
            throw new IllegalStateException("Failed to seed reserves reception demo data", ex);
        }
    }

    private static String textOrNull(JsonNode node, String field) {
        return node.hasNonNull(field) ? node.get(field).asText() : null;
    }
}
