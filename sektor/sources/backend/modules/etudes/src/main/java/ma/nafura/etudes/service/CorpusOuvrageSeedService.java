package ma.nafura.etudes.service;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import java.io.InputStream;
import java.math.BigDecimal;
import java.math.RoundingMode;
import java.text.Normalizer;
import java.time.LocalDate;
import java.util.ArrayList;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Locale;
import java.util.Map;
import java.util.UUID;
import ma.nafura.etudes.domain.OuvrageOrigine;
import ma.nafura.etudes.domain.ReferenceType;
import ma.nafura.etudes.domain.model.ComposantDpu;
import ma.nafura.etudes.domain.model.ComposantOuvrage;
import ma.nafura.etudes.domain.model.Ouvrage;
import ma.nafura.etudes.domain.model.UniteMain;
import ma.nafura.etudes.repository.OuvrageRepository;
import ma.nafura.item.domain.UsageLot;
import ma.nafura.platform.framework.context.TenantContext;
import org.springframework.core.io.ClassPathResource;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.util.StringUtils;

/**
 * L12 — charge le corpus réel (84 ouvrages) en bibliothèque d'un tenant demo.
 *
 * <p>Distinct de {@link OuvrageSeedService} (12 ouvrages légers). N'écrit pas dans
 * {@link ParametresEtudeService}.
 */
@Service
public class CorpusOuvrageSeedService {

    public static final String CORPUS_RESOURCE = "corpus/sous-details-gros-oeuvre.json";

    private static final Map<String, String> FAMILLE_TO_CODE = buildFamilleMap();

    private final OuvrageRepository repository;
    private final ObjectMapper objectMapper;
    private final DpuCalculator calculator;

    public CorpusOuvrageSeedService(
            OuvrageRepository repository, ObjectMapper objectMapper, DpuCalculator calculator) {
        this.repository = repository;
        this.objectMapper = objectMapper;
        this.calculator = calculator;
    }

    /**
     * Charge le corpus si le tenant n'a pas encore de lignes {@code origine=CATALOGUE}
     * avec {@code catalog_cle_stable} corpus.
     *
     * @return nombre d'ouvrages créés
     */
    @Transactional
    public int seedCorpusIfAbsent() {
        UUID tenantId = TenantContext.getTenantId();
        long existing = repository.findByTenantIdOrderByCodeAsc(tenantId).stream()
                .filter(o -> OuvrageOrigine.CATALOGUE.name().equals(o.getOrigine())
                        && o.getCatalogCleStable() != null
                        && o.getCatalogCleStable().startsWith("corpus:"))
                .count();
        if (existing > 0) {
            return 0;
        }
        return loadAll(tenantId);
    }

    /** Force le chargement (tests / reset lab). */
    @Transactional
    public int loadAll(UUID tenantId) {
        try (InputStream in = new ClassPathResource(CORPUS_RESOURCE).getInputStream()) {
            JsonNode root = objectMapper.readTree(in);
            int created = 0;
            for (JsonNode node : root.get("ouvrages")) {
                String famille = node.path("famille").asText("DIVERS");
                String codeFamille = mapFamille(famille);
                String slug = slugify(node.path("designation").asText(node.path("code").asText("x")));
                String shortCode = node.path("code").asText(slug);
                String code = UsageLot.GROS_OEUVRE.name() + "." + codeFamille + "." + slugify(shortCode);
                if (code.length() > 50) {
                    code = code.substring(0, 50);
                }
                if (repository.existsByTenantIdAndCode(tenantId, code)) {
                    continue;
                }
                String catalogCle = "corpus:" + famille + ":" + shortCode;

                Ouvrage entity = Ouvrage.builder()
                        .tenantId(tenantId)
                        .code(code)
                        .designation(node.path("designation").asText())
                        .codeLot(UsageLot.GROS_OEUVRE.name())
                        .codeFamille(codeFamille)
                        .category(codeFamille)
                        .origine(OuvrageOrigine.CATALOGUE.name())
                        .catalogCleStable(catalogCle)
                        .unite(node.path("unite").asText("u"))
                        .uniteMain(UniteMain.builder()
                                .heures(BigDecimal.ZERO)
                                .tauxHoraire(BigDecimal.ZERO)
                                .total(BigDecimal.ZERO)
                                .build())
                        .fraisGenerauxPercent(ParametresEtudeService.DEFAULT_FRAIS_GENERAUX_PERCENT)
                        .beneficePercent(ParametresEtudeService.DEFAULT_MARGE_PERCENT)
                        .isActive(true)
                        .derniereMaj(LocalDate.now())
                        .composants(new ArrayList<>())
                        .build();

                List<ComposantDpu> forCalc = new ArrayList<>();
                if (node.has("composants") && node.get("composants").isArray()) {
                    for (JsonNode comp : node.get("composants")) {
                        BigDecimal rendement = decimal(comp, "rendement", "0");
                        BigDecimal pu = decimal(comp, "prixUnitaire", "0");
                        BigDecimal total = comp.hasNonNull("total")
                                ? decimal(comp, "total", "0")
                                : rendement.multiply(pu).setScale(4, RoundingMode.HALF_UP);
                        String libelle = comp.hasNonNull("designation")
                                ? comp.get("designation").asText()
                                : comp.path("code").asText("composant");
                        String unite = StringUtils.hasText(comp.path("unite").asText(null))
                                ? comp.get("unite").asText()
                                : "u";
                        entity.getComposants()
                                .add(ComposantOuvrage.builder()
                                        .tenantId(tenantId)
                                        .ouvrage(entity)
                                        .type(ComposantOuvrage.TYPE_MATERIAU)
                                        .referenceType(ReferenceType.LIBRE.name())
                                        .libelle(libelle)
                                        .unite(unite)
                                        .rendement(rendement)
                                        .prixUnitaire(pu)
                                        .total(total)
                                        .inclureFraisEtMarge(false)
                                        .build());
                        forCalc.add(ComposantDpu.builder()
                                .rendement(rendement)
                                .prixUnitaire(pu)
                                .total(total)
                                .baseRendement(comp.path("baseRendement").asText(ComposantDpu.BASE_PAR_UNITE))
                                .libelle(libelle)
                                .unite(unite)
                                .type(ComposantDpu.TYPE_MATIERE)
                                .referenceType(ReferenceType.LIBRE.name())
                                .build());
                    }
                }

                BigDecimal rendementJ = node.hasNonNull("rendementJournalier")
                        ? decimal(node, "rendementJournalier", "0")
                        : null;
                if (rendementJ != null && rendementJ.signum() <= 0) {
                    rendementJ = null;
                }
                BigDecimal debourse = calculator.computeDeboursSec(forCalc, rendementJ);
                entity.setSousTotalDebourse(debourse);
                entity.setPrixUnitaireHt(calculator.computePrixVenteHt(
                        debourse,
                        entity.getFraisGenerauxPercent(),
                        entity.getBeneficePercent()));
                repository.save(entity);
                created++;
            }
            return created;
        } catch (Exception ex) {
            throw new IllegalStateException("Failed to seed corpus ouvrages", ex);
        }
    }

    static String mapFamille(String famille) {
        if (!StringUtils.hasText(famille)) {
            return "DIVERS";
        }
        String key = normalizeKey(famille);
        return FAMILLE_TO_CODE.getOrDefault(key, "DIVERS");
    }

    private static String normalizeKey(String raw) {
        return Normalizer.normalize(raw, Normalizer.Form.NFD)
                .replaceAll("\\p{M}+", "")
                .toUpperCase(Locale.ROOT)
                .replaceAll("[^A-Z0-9]+", " ")
                .trim()
                .replaceAll("\\s+", " ");
    }

    private static String slugify(String raw) {
        String n = Normalizer.normalize(raw, Normalizer.Form.NFD)
                .replaceAll("\\p{M}+", "")
                .toLowerCase(Locale.ROOT)
                .replaceAll("[^a-z0-9]+", "-")
                .replaceAll("^-+|-+$", "");
        if (n.isBlank()) {
            return "x";
        }
        return n.length() > 30 ? n.substring(0, 30).replaceAll("-+$", "") : n;
    }

    private static BigDecimal decimal(JsonNode node, String field, String fallback) {
        return new BigDecimal(node.path(field).asText(fallback));
    }

    private static Map<String, String> buildFamilleMap() {
        Map<String, String> m = new LinkedHashMap<>();
        m.put("TERRASSEMENTS GENERAUX", "TER_GEN");
        m.put("TERRASSEMENTS FONDATIONS", "TER_FOND");
        m.put("MACONNERIE EN FONDATION", "MAC_FOND");
        m.put("MACONNERIE EN ELEVATION", "MAC_ELEV");
        m.put("BETONS ARMES EN FONDATION", "BA_FOND");
        m.put("BETON SUR CHANTIER", "BET_CHANT");
        m.put("CANALISATIONS EN TUBES PVC", "CAN_PVC");
        m.put("REGARDS POUR EU EV EP", "REG_EU");
        m.put("ENDUITS", "ENDUIT");
        m.put("CARRELAGE SOLS ET MURS", "CARREL");
        m.put("M A R B R E S GRANIT", "MARBRE");
        m.put("DIVERS ET ETANCHEITE", "DIV_ETAN");
        m.put("G1", "GO_G1");
        m.put("G2", "GO_G2");
        m.put("G3", "GO_G3");
        m.put("G4", "GO_G4");
        return m;
    }
}
