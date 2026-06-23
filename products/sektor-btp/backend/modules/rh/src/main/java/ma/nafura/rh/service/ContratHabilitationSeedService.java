package ma.nafura.rh.service;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import java.io.InputStream;
import java.math.BigDecimal;
import java.time.LocalDate;
import ma.nafura.platform.framework.context.TenantContext;
import ma.nafura.rh.domain.model.Contrat;
import ma.nafura.rh.domain.model.Habilitation;
import ma.nafura.rh.repository.ContratRepository;
import ma.nafura.rh.repository.HabilitationRepository;
import org.springframework.core.io.ClassPathResource;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class ContratHabilitationSeedService {

    private final ContratRepository contratRepository;
    private final HabilitationRepository habilitationRepository;
    private final EmployeSeedService employeSeedService;
    private final ObjectMapper objectMapper;

    public ContratHabilitationSeedService(
            ContratRepository contratRepository,
            HabilitationRepository habilitationRepository,
            EmployeSeedService employeSeedService,
            ObjectMapper objectMapper) {
        this.contratRepository = contratRepository;
        this.habilitationRepository = habilitationRepository;
        this.employeSeedService = employeSeedService;
        this.objectMapper = objectMapper;
    }

    @Transactional
    public void seedIfEmpty() {
        employeSeedService.seedIfEmpty();
        if (contratRepository.countByTenantId(TenantContext.getTenantId()) > 0) {
            return;
        }
        seedFromJson();
    }

    private void seedFromJson() {
        try (InputStream in = new ClassPathResource("seed/contrats-habilitations-seed.json").getInputStream()) {
            JsonNode root = objectMapper.readTree(in);
            for (JsonNode node : root.get("contrats")) {
                Contrat entity = Contrat.builder()
                        .id(node.get("id").asText())
                        .tenantId(TenantContext.getTenantId())
                        .employeId(node.get("employeId").asText())
                        .typeContrat(node.get("typeContrat").asText())
                        .dateDebut(LocalDate.parse(node.get("dateDebut").asText()))
                        .dateFin(textDateOrNull(node, "dateFin"))
                        .salaireBase(new BigDecimal(node.get("salaireBase").asText()))
                        .status(node.path("status").asText(Contrat.STATUS_BROUILLON))
                        .signatureDataUrl(textOrNull(node, "signatureDataUrl"))
                        .build();
                contratRepository.save(entity);
            }
            for (JsonNode node : root.get("habilitations")) {
                Habilitation entity = Habilitation.builder()
                        .id(node.get("id").asText())
                        .tenantId(TenantContext.getTenantId())
                        .employeId(node.get("employeId").asText())
                        .code(node.get("code").asText())
                        .libelle(node.get("libelle").asText())
                        .dateObtention(LocalDate.parse(node.get("dateObtention").asText()))
                        .dateExpiration(textDateOrNull(node, "dateExpiration"))
                        .build();
                habilitationRepository.save(entity);
            }
        } catch (Exception ex) {
            throw new IllegalStateException("Failed to seed contrats and habilitations", ex);
        }
    }

    private static String textOrNull(JsonNode node, String field) {
        return node.hasNonNull(field) ? node.get(field).asText() : null;
    }

    private static LocalDate textDateOrNull(JsonNode node, String field) {
        return node.hasNonNull(field) ? LocalDate.parse(node.get(field).asText()) : null;
    }
}
