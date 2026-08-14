package ma.nafura.rh.service;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import java.io.InputStream;
import java.math.BigDecimal;
import java.time.LocalDate;
import ma.nafura.platform.framework.context.TenantContext;
import ma.nafura.rh.domain.model.Employe;
import ma.nafura.rh.repository.EmployeRepository;
import org.springframework.core.io.ClassPathResource;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class EmployeSeedService {

    private final EmployeRepository repository;
    private final ObjectMapper objectMapper;

    public EmployeSeedService(EmployeRepository repository, ObjectMapper objectMapper) {
        this.repository = repository;
        this.objectMapper = objectMapper;
    }

    @Transactional
    public void seedIfEmpty() {
        if (repository.countByTenantId(TenantContext.getTenantId()) > 0) {
            return;
        }
        try (InputStream in = new ClassPathResource("seed/employes-seed.json").getInputStream()) {
            JsonNode root = objectMapper.readTree(in);
            for (JsonNode node : root.get("employes")) {
                Employe entity = Employe.builder()
                        .id(node.get("id").asText())
                        .tenantId(TenantContext.getTenantId())
                        .matricule(node.get("matricule").asText())
                        .nom(node.get("nom").asText())
                        .prenom(node.get("prenom").asText())
                        .cin(node.get("cin").asText())
                        .cnss(textOrNull(node, "cnss"))
                        .dateNaissance(
                                node.hasNonNull("dateNaissance")
                                        ? LocalDate.parse(node.get("dateNaissance").asText())
                                        : null)
                        .adresse(textOrNull(node, "adresse"))
                        .ville(textOrNull(node, "ville"))
                        .telephone(textOrNull(node, "telephone"))
                        .email(textOrNull(node, "email"))
                        .poste(node.get("poste").asText())
                        .departement(textOrNull(node, "departement"))
                        .categorie(node.get("categorie").asText())
                        .typeContrat(node.get("typeContrat").asText())
                        .statut(node.path("statut").asText(Employe.STATUT_ACTIF))
                        .dateEmbauche(LocalDate.parse(node.get("dateEmbauche").asText()))
                        .dateFinContrat(
                                node.hasNonNull("dateFinContrat")
                                        ? LocalDate.parse(node.get("dateFinContrat").asText())
                                        : null)
                        .salaireBase(new BigDecimal(node.get("salaireBase").asText()))
                        .indemniteRepresentation(decimalOrNull(node, "indemniteRepresentation"))
                        .indemniteTransport(decimalOrNull(node, "indemniteTransport"))
                        .rib(textOrNull(node, "rib"))
                        .banque(textOrNull(node, "banque"))
                        .notes(textOrNull(node, "notes"))
                        .ice(textOrNull(node, "ice"))
                        .ifFiscal(textOrNull(node, "ifFiscal"))
                        .rc(textOrNull(node, "rc"))
                        .patente(textOrNull(node, "patente"))
                        .build();
                repository.save(entity);
            }
        } catch (Exception ex) {
            throw new IllegalStateException("Failed to seed employes", ex);
        }
    }

    private static String textOrNull(JsonNode node, String field) {
        return node.hasNonNull(field) ? node.get(field).asText() : null;
    }

    private static BigDecimal decimalOrNull(JsonNode node, String field) {
        return node.hasNonNull(field) ? new BigDecimal(node.get(field).asText()) : null;
    }
}
