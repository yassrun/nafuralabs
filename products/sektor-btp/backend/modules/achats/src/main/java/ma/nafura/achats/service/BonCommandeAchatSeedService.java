package ma.nafura.achats.service;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import java.io.InputStream;
import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.ArrayList;
import java.util.UUID;
import ma.nafura.achats.domain.model.BonCommandeAchat;
import ma.nafura.achats.domain.model.BonCommandeAchatLigne;
import ma.nafura.achats.repository.BonCommandeAchatRepository;
import ma.nafura.platform.framework.context.TenantContext;
import org.springframework.core.io.ClassPathResource;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class BonCommandeAchatSeedService {

    private final BonCommandeAchatRepository repository;
    private final ObjectMapper objectMapper;

    public BonCommandeAchatSeedService(BonCommandeAchatRepository repository, ObjectMapper objectMapper) {
        this.repository = repository;
        this.objectMapper = objectMapper;
    }

    @Transactional
    public void seedIfEmpty() {
        UUID tenantId = TenantContext.getTenantId();
        if (repository.countByTenantId(tenantId) > 0) {
            return;
        }
        try (InputStream in = new ClassPathResource("seed/bons-commande-achat-seed.json").getInputStream()) {
            JsonNode root = objectMapper.readTree(in);
            for (JsonNode node : root.get("bonsCommande")) {
                BonCommandeAchat entity = BonCommandeAchat.builder()
                        .tenantId(tenantId)
                        .numero(node.get("numero").asText())
                        .fournisseurId(node.get("fournisseurId").asText())
                        .fournisseurName(textOrNull(node, "fournisseurName"))
                        .chantierId(textOrNull(node, "chantierId"))
                        .chantierCode(textOrNull(node, "chantierCode"))
                        .chantierName(textOrNull(node, "chantierName"))
                        .daId(textOrNull(node, "daId"))
                        .daNumero(textOrNull(node, "daNumero"))
                        .aoId(textOrNull(node, "aoId"))
                        .aoNumero(textOrNull(node, "aoNumero"))
                        .contratId(textOrNull(node, "contratId"))
                        .contratNumero(textOrNull(node, "contratNumero"))
                        .rubrique(textOrNull(node, "rubrique"))
                        .dateCreation(LocalDate.parse(node.get("dateCreation").asText()))
                        .dateLivraisonPrevue(LocalDate.parse(node.get("dateLivraisonPrevue").asText()))
                        .conditionsPaiement(node.get("conditionsPaiement").asText())
                        .modeReglement(textOrNull(node, "modeReglement"))
                        .tvaTaux(new BigDecimal(node.path("tvaTaux").asText("20")))
                        .status(node.path("status").asText(BonCommandeAchat.STATUS_BROUILLON))
                        .validateurId(textOrNull(node, "validateurId"))
                        .validateurName(textOrNull(node, "validateurName"))
                        .validationDate(
                                node.hasNonNull("validationDate")
                                        ? LocalDate.parse(node.get("validationDate").asText())
                                        : null)
                        .totalLivreHt(new BigDecimal(node.path("totalLivreHt").asText("0")))
                        .totalFactureHt(new BigDecimal(node.path("totalFactureHt").asText("0")))
                        .notes(textOrNull(node, "notes"))
                        .lignes(new ArrayList<>())
                        .build();
                if (node.has("lignes") && node.get("lignes").isArray()) {
                    for (JsonNode line : node.get("lignes")) {
                        BigDecimal qty = new BigDecimal(line.get("quantite").asText());
                        BigDecimal unit = new BigDecimal(line.get("prixUnitaireHt").asText());
                        BigDecimal total = line.hasNonNull("totalHt")
                                ? new BigDecimal(line.get("totalHt").asText())
                                : unit.multiply(qty);
                        entity.getLignes()
                                .add(BonCommandeAchatLigne.builder()
                                        .tenantId(tenantId)
                                        .bonCommande(entity)
                                        .articleId(line.get("articleId").asText())
                                        .articleCode(textOrNull(line, "articleCode"))
                                        .articleName(textOrNull(line, "articleName"))
                                        .quantite(qty)
                                        .quantiteLivree(new BigDecimal(
                                                line.path("quantiteLivree").asText("0")))
                                        .quantiteFacturee(new BigDecimal(
                                                line.path("quantiteFacturee").asText("0")))
                                        .uomCode(textOrNull(line, "uomCode"))
                                        .prixUnitaireHt(unit)
                                        .totalHt(total)
                                        .notes(textOrNull(line, "notes"))
                                        .build());
                    }
                }
                entity.setTotalHt(computeTotal(entity.getLignes()));
                entity.setTotalTtc(computeTtc(entity.getTotalHt(), entity.getTvaTaux()));
                repository.save(entity);
            }
        } catch (Exception ex) {
            throw new IllegalStateException("Failed to seed bons commande achat", ex);
        }
    }

    private static BigDecimal computeTotal(java.util.List<BonCommandeAchatLigne> lignes) {
        return lignes.stream()
                .map(l -> l.getTotalHt() != null ? l.getTotalHt() : BigDecimal.ZERO)
                .reduce(BigDecimal.ZERO, BigDecimal::add);
    }

    private static BigDecimal computeTtc(BigDecimal totalHt, BigDecimal tvaTaux) {
        if (totalHt == null) {
            return BigDecimal.ZERO;
        }
        BigDecimal rate = tvaTaux != null ? tvaTaux : BigDecimal.ZERO;
        return totalHt.multiply(BigDecimal.ONE.add(rate.divide(new BigDecimal("100"))));
    }

    private static String textOrNull(JsonNode node, String field) {
        return node.hasNonNull(field) ? node.get(field).asText() : null;
    }
}
