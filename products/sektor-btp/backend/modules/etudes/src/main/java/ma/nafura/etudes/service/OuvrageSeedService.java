package ma.nafura.etudes.service;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import java.io.InputStream;
import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.LocalDate;
import java.util.ArrayList;
import java.util.UUID;
import ma.nafura.etudes.domain.model.ComposantOuvrage;
import ma.nafura.etudes.domain.model.Ouvrage;
import ma.nafura.etudes.domain.model.UniteMain;
import ma.nafura.etudes.repository.OuvrageRepository;
import ma.nafura.platform.framework.context.TenantContext;
import org.springframework.core.io.ClassPathResource;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class OuvrageSeedService {

    private final OuvrageRepository repository;
    private final ObjectMapper objectMapper;

    public OuvrageSeedService(OuvrageRepository repository, ObjectMapper objectMapper) {
        this.repository = repository;
        this.objectMapper = objectMapper;
    }

    @Transactional
    public void seedIfEmpty() {
        UUID tenantId = TenantContext.getTenantId();
        if (repository.countByTenantId(tenantId) > 0) {
            return;
        }
        try (InputStream in = new ClassPathResource("seed/ouvrages-seed.json").getInputStream()) {
            JsonNode root = objectMapper.readTree(in);
            for (JsonNode node : root.get("ouvrages")) {
                Ouvrage entity = Ouvrage.builder()
                        .tenantId(tenantId)
                        .code(node.get("code").asText())
                        .designation(node.get("designation").asText())
                        .category(node.get("category").asText())
                        .unite(node.get("unite").asText())
                        .uniteMain(readUniteMain(node.get("uniteMain")))
                        .fraisGenerauxPercent(decimal(node, "fraisGenerauxPercent", "8"))
                        .beneficePercent(decimal(node, "beneficePercent", "7"))
                        .isActive(!node.has("isActive") || node.get("isActive").asBoolean(true))
                        .notes(textOrNull(node, "notes"))
                        .derniereMaj(LocalDate.parse(node.path("derniereMaj").asText("2026-04-15")))
                        .composants(new ArrayList<>())
                        .build();
                if (node.has("composants") && node.get("composants").isArray()) {
                    for (JsonNode comp : node.get("composants")) {
                        BigDecimal rendement = new BigDecimal(comp.get("rendement").asText());
                        BigDecimal prixUnitaire = new BigDecimal(comp.get("prixUnitaire").asText());
                        BigDecimal total = comp.hasNonNull("total")
                                ? new BigDecimal(comp.get("total").asText())
                                : rendement.multiply(prixUnitaire).setScale(4, RoundingMode.HALF_UP);
                        entity.getComposants()
                                .add(ComposantOuvrage.builder()
                                        .tenantId(tenantId)
                                        .ouvrage(entity)
                                        .type(comp.path("type").asText(ComposantOuvrage.TYPE_MATERIAU))
                                        .articleId(textOrNull(comp, "articleId"))
                                        .designation(comp.get("designation").asText())
                                        .unite(comp.get("unite").asText())
                                        .rendement(rendement)
                                        .prixUnitaire(prixUnitaire)
                                        .total(total)
                                        .build());
                    }
                }
                recomputeTotals(entity);
                repository.save(entity);
            }
        } catch (Exception ex) {
            throw new IllegalStateException("Failed to seed ouvrages", ex);
        }
    }

    private UniteMain readUniteMain(JsonNode node) {
        if (node == null || node.isNull()) {
            return UniteMain.builder()
                    .heures(BigDecimal.ZERO)
                    .tauxHoraire(BigDecimal.ZERO)
                    .total(BigDecimal.ZERO)
                    .build();
        }
        BigDecimal heures = new BigDecimal(node.path("heures").asText("0"));
        BigDecimal taux = new BigDecimal(node.path("tauxHoraire").asText("0"));
        BigDecimal total = node.hasNonNull("total")
                ? new BigDecimal(node.get("total").asText())
                : heures.multiply(taux).setScale(4, RoundingMode.HALF_UP);
        return UniteMain.builder().heures(heures).tauxHoraire(taux).total(total).build();
    }

    private void recomputeTotals(Ouvrage entity) {
        BigDecimal composantsTotal = entity.getComposants().stream()
                .map(ComposantOuvrage::getTotal)
                .reduce(BigDecimal.ZERO, BigDecimal::add);
        BigDecimal moTotal = entity.getUniteMain() != null && entity.getUniteMain().getTotal() != null
                ? entity.getUniteMain().getTotal()
                : BigDecimal.ZERO;
        BigDecimal sousTotal = composantsTotal.add(moTotal).setScale(4, RoundingMode.HALF_UP);
        BigDecimal fg = entity.getFraisGenerauxPercent() != null
                ? entity.getFraisGenerauxPercent()
                : new BigDecimal("8");
        BigDecimal benef = entity.getBeneficePercent() != null
                ? entity.getBeneficePercent()
                : new BigDecimal("7");
        BigDecimal prix = sousTotal
                .multiply(BigDecimal.ONE.add(fg.movePointLeft(2)))
                .multiply(BigDecimal.ONE.add(benef.movePointLeft(2)))
                .setScale(2, RoundingMode.HALF_UP);
        entity.setSousTotalDebourse(sousTotal);
        entity.setPrixUnitaireHt(prix);
    }

    private static BigDecimal decimal(JsonNode node, String field, String fallback) {
        return new BigDecimal(node.path(field).asText(fallback));
    }

    private static String textOrNull(JsonNode node, String field) {
        return node.hasNonNull(field) ? node.get(field).asText() : null;
    }
}
