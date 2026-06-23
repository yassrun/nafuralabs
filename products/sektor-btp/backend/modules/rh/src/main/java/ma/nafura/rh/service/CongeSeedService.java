package ma.nafura.rh.service;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import java.io.InputStream;
import java.math.BigDecimal;
import java.time.LocalDate;
import ma.nafura.platform.framework.context.TenantContext;
import ma.nafura.rh.domain.model.Conge;
import ma.nafura.rh.domain.model.CongeSolde;
import ma.nafura.rh.domain.model.Employe;
import ma.nafura.rh.repository.CongeRepository;
import ma.nafura.rh.repository.CongeSoldeRepository;
import ma.nafura.rh.repository.EmployeRepository;
import org.springframework.core.io.ClassPathResource;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class CongeSeedService {

    private static final BigDecimal DEFAULT_SOLDE = new BigDecimal("18.00");

    private final CongeRepository congeRepository;
    private final CongeSoldeRepository soldeRepository;
    private final EmployeRepository employeRepository;
    private final EmployeSeedService employeSeedService;
    private final ObjectMapper objectMapper;

    public CongeSeedService(
            CongeRepository congeRepository,
            CongeSoldeRepository soldeRepository,
            EmployeRepository employeRepository,
            EmployeSeedService employeSeedService,
            ObjectMapper objectMapper) {
        this.congeRepository = congeRepository;
        this.soldeRepository = soldeRepository;
        this.employeRepository = employeRepository;
        this.employeSeedService = employeSeedService;
        this.objectMapper = objectMapper;
    }

    @Transactional
    public void seedIfEmpty() {
        employeSeedService.seedIfEmpty();
        if (congeRepository.countByTenantId(TenantContext.getTenantId()) > 0) {
            return;
        }
        seedConges();
        seedSoldes();
    }

    private void seedConges() {
        try (InputStream in = new ClassPathResource("seed/conges-seed.json").getInputStream()) {
            JsonNode root = objectMapper.readTree(in);
            for (JsonNode node : root.get("conges")) {
                Conge entity = Conge.builder()
                        .id(node.get("id").asText())
                        .tenantId(TenantContext.getTenantId())
                        .numero(node.get("numero").asText())
                        .employeId(node.get("employeId").asText())
                        .employeNom(textOrNull(node, "employeNom"))
                        .type(node.get("type").asText())
                        .dateDebut(LocalDate.parse(node.get("dateDebut").asText()))
                        .dateFin(LocalDate.parse(node.get("dateFin").asText()))
                        .nombreJours(new BigDecimal(node.get("nombreJours").asText()))
                        .status(node.path("status").asText(Conge.STATUS_BROUILLON))
                        .motif(textOrNull(node, "motif"))
                        .motifRefus(textOrNull(node, "motifRefus"))
                        .notes(textOrNull(node, "notes"))
                        .build();
                congeRepository.save(entity);
            }
        } catch (Exception ex) {
            throw new IllegalStateException("Failed to seed conges", ex);
        }
    }

    private void seedSoldes() {
        for (Employe employe : employeRepository.findByTenantIdOrderByNomAscPrenomAsc(TenantContext.getTenantId())) {
            if (Employe.STATUT_ACTIF.equals(employe.getStatut())) {
                soldeRepository.save(CongeSolde.builder()
                        .id("solde-" + employe.getId())
                        .tenantId(TenantContext.getTenantId())
                        .employeId(employe.getId())
                        .soldeJours(DEFAULT_SOLDE)
                        .crediteAnnuel(DEFAULT_SOLDE)
                        .prisAnnuel(BigDecimal.ZERO)
                        .build());
            }
        }
    }

    private static String textOrNull(JsonNode node, String field) {
        return node.hasNonNull(field) ? node.get(field).asText() : null;
    }
}
