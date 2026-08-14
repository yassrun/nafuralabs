package ma.nafura.marches.service;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import java.io.InputStream;
import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.UUID;
import ma.nafura.marches.domain.model.BpuLigne;
import ma.nafura.marches.domain.model.ContratMarche;
import ma.nafura.marches.repository.BpuLigneRepository;
import ma.nafura.marches.repository.ContratMarcheRepository;
import ma.nafura.platform.framework.context.TenantContext;
import org.springframework.core.io.ClassPathResource;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class ContratMarcheSeedService {

    private final ContratMarcheRepository contratRepository;
    private final BpuLigneRepository ligneRepository;
    private final ObjectMapper objectMapper;

    public ContratMarcheSeedService(
            ContratMarcheRepository contratRepository,
            BpuLigneRepository ligneRepository,
            ObjectMapper objectMapper) {
        this.contratRepository = contratRepository;
        this.ligneRepository = ligneRepository;
        this.objectMapper = objectMapper;
    }

    @Transactional
    public void seedIfEmpty() {
        UUID tenantId = TenantContext.getTenantId();
        if (contratRepository.countByTenantId(tenantId) > 0) {
            return;
        }
        try (InputStream in = new ClassPathResource("seed/contrats-marche-seed.json").getInputStream()) {
            JsonNode root = objectMapper.readTree(in);
            for (JsonNode node : root.get("contrats")) {
                ContratMarche entity = ContratMarche.builder()
                        .id(node.get("id").asText())
                        .tenantId(tenantId)
                        .numero(node.get("numero").asText())
                        .reference(textOrNull(node, "reference"))
                        .intitule(node.get("intitule").asText())
                        .chantierId(node.get("chantierId").asText())
                        .chantierCode(textOrNull(node, "chantierCode"))
                        .chantierNom(textOrNull(node, "chantierNom"))
                        .clientId(node.get("clientId").asText())
                        .clientNom(textOrNull(node, "clientNom"))
                        .typeMarche(node.path("typeMarche").asText(ContratMarche.TYPE_FORFAITAIRE))
                        .typeCcagT(node.path("typeCcagT").asText(ContratMarche.CCAG_TRAVAUX))
                        .natureMarche(textOrNull(node, "natureMarche"))
                        .dateNotification(
                                node.hasNonNull("dateNotification")
                                        ? LocalDate.parse(node.get("dateNotification").asText())
                                        : null)
                        .dateDemarrage(
                                node.hasNonNull("dateDemarrage")
                                        ? LocalDate.parse(node.get("dateDemarrage").asText())
                                        : null)
                        .dureeMois(node.hasNonNull("dureeMois") ? node.get("dureeMois").asInt() : null)
                        .montantHt(new BigDecimal(node.path("montantHt").asText("0")))
                        .tauxTva(new BigDecimal(node.path("tauxTva").asText("20")))
                        .tauxRg(new BigDecimal(node.path("tauxRg").asText("7")))
                        .tauxRas(new BigDecimal(node.path("tauxRas").asText("0")))
                        .tauxAvance(
                                node.hasNonNull("tauxAvance")
                                        ? new BigDecimal(node.get("tauxAvance").asText())
                                        : null)
                        .status(node.path("status").asText(ContratMarche.STATUS_BROUILLON))
                        .build();
                contratRepository.save(entity);

                if (node.has("lignes") && node.get("lignes").isArray()) {
                    for (JsonNode line : node.get("lignes")) {
                        BigDecimal qty = new BigDecimal(line.get("quantite").asText());
                        BigDecimal unit = new BigDecimal(line.get("prixUnitaireHt").asText());
                        BpuLigne ligne = BpuLigne.builder()
                                .id(line.get("id").asText())
                                .tenantId(tenantId)
                                .contratMarcheId(entity.getId())
                                .posteCode(line.get("posteCode").asText())
                                .designation(line.get("designation").asText())
                                .unite(line.get("unite").asText())
                                .quantite(qty)
                                .prixUnitaireHt(unit)
                                .ordre(line.path("ordre").asInt(0))
                                .build();
                        ligne.recomputeMontant();
                        ligneRepository.save(ligne);
                    }
                }
            }
        } catch (Exception ex) {
            throw new IllegalStateException("Failed to seed contrats marche demo data", ex);
        }
    }

    private static String textOrNull(JsonNode node, String field) {
        return node.hasNonNull(field) ? node.get(field).asText() : null;
    }
}
