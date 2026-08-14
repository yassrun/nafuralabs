package ma.nafura.etudes.service;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.util.ArrayList;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.UUID;
import ma.nafura.etudes.domain.OrigineCout;
import ma.nafura.etudes.domain.model.ComposantDpu;
import ma.nafura.etudes.domain.model.DpgfNoeud;
import ma.nafura.etudes.domain.model.PrixDpu;
import ma.nafura.etudes.repository.PrixDpuRepository;
import ma.nafura.etudes.service.port.ChainageAvalPort.BudgetRubrique;
import ma.nafura.catalogue.api.CatalogNatureMapping;
import ma.nafura.platform.framework.context.TenantContext;
import org.springframework.stereotype.Service;
import org.springframework.util.StringUtils;

/**
 * L13 — ventilation budget chantier depuis le chiffrage étude.
 *
 * <p>Budget = déboursé ({@code cout_unitaire × quantité}), jamais vente / revient.
 */
@Service
public class BudgetVentilationService {

    public static final String RUBRIQUE_NON_VENTILE = "NON_VENTILE";
    public static final String RUBRIQUE_SOUS_TRAITANCE = "SOUS_TRAITANCE";
    public static final String RUBRIQUE_MATERIAUX = "MATERIAUX";
    public static final String RUBRIQUE_MO = "MO";
    public static final String RUBRIQUE_MATERIEL = "MATERIEL";

    private final PrixDpuRepository prixDpuRepository;

    public BudgetVentilationService(PrixDpuRepository prixDpuRepository) {
        this.prixDpuRepository = prixDpuRepository;
    }

    public List<BudgetRubrique> ventiler(List<DpgfNoeud> noeuds) {
        Map<String, Acc> byRubrique = new LinkedHashMap<>();
        UUID tenantId = TenantContext.getTenantId();

        for (DpgfNoeud noeud : noeuds) {
            if (!DpgfNoeud.TYPE_ARTICLE.equals(noeud.getType())) {
                continue;
            }
            BigDecimal qte = noeud.getQuantite() != null ? noeud.getQuantite() : BigDecimal.ZERO;
            OrigineCout origine = noeud.origineCoutEnum();
            if (origine == null) {
                origine = OrigineCout.ESTIME;
            }

            switch (origine) {
                case DECOMPOSE -> ventilerDecompose(noeud, qte, tenantId, byRubrique);
                case FORFAIT -> add(
                        byRubrique,
                        RUBRIQUE_SOUS_TRAITANCE,
                        "Sous-traitance (forfait)",
                        lineDebourse(noeud, qte),
                        false,
                        "FORFAIT");
                case ESTIME -> add(
                        byRubrique,
                        RUBRIQUE_NON_VENTILE,
                        Boolean.TRUE.equals(noeud.getCoutDeduit())
                                ? "Non ventilé (coût déduit — non fiable)"
                                : "Non ventilé (estimé)",
                        lineDebourse(noeud, qte),
                        Boolean.TRUE.equals(noeud.getCoutDeduit()),
                        Boolean.TRUE.equals(noeud.getCoutDeduit()) ? "DEDUIT" : "ESTIME");
            }
        }

        List<BudgetRubrique> out = new ArrayList<>();
        for (Acc acc : byRubrique.values()) {
            out.add(new BudgetRubrique(
                    acc.rubrique,
                    acc.label,
                    acc.montant.setScale(2, RoundingMode.HALF_UP),
                    acc.nonFiable,
                    acc.sourceOrigine));
        }
        return out;
    }

    /** Contrôle croisé AC : Σ budget == Σ (cout_unitaire × qté). */
    public BigDecimal sommeDebourseArticles(List<DpgfNoeud> noeuds) {
        BigDecimal sum = BigDecimal.ZERO;
        for (DpgfNoeud noeud : noeuds) {
            if (!DpgfNoeud.TYPE_ARTICLE.equals(noeud.getType())) {
                continue;
            }
            BigDecimal qte = noeud.getQuantite() != null ? noeud.getQuantite() : BigDecimal.ZERO;
            sum = sum.add(lineDebourse(noeud, qte));
        }
        return sum.setScale(2, RoundingMode.HALF_UP);
    }

    private void ventilerDecompose(
            DpgfNoeud noeud, BigDecimal qte, UUID tenantId, Map<String, Acc> byRubrique) {
        var dpuOpt = prixDpuRepository.findByDpgfNoeudIdAndTenantId(noeud.getId(), tenantId);
        if (dpuOpt.isEmpty() || dpuOpt.get().getComposants() == null || dpuOpt.get().getComposants().isEmpty()) {
            add(
                    byRubrique,
                    RUBRIQUE_NON_VENTILE,
                    "Non ventilé (décomposé sans composants)",
                    lineDebourse(noeud, qte),
                    false,
                    "DECOMPOSE");
            return;
        }
        PrixDpu dpu = dpuOpt.get();
        for (ComposantDpu c : dpu.getComposants()) {
            BigDecimal line = lineComposant(c).multiply(qte);
            String rubrique = rubriqueFromDpuType(c.getType());
            add(byRubrique, rubrique, labelRubrique(rubrique), line, false, "DECOMPOSE");
        }
    }

    private static BigDecimal lineDebourse(DpgfNoeud noeud, BigDecimal qte) {
        BigDecimal cout = noeud.getCoutUnitaire();
        if (cout == null) {
            // repli : ne jamais utiliser prix_unitaire vente
            cout = BigDecimal.ZERO;
        }
        return cout.multiply(qte);
    }

    private static BigDecimal lineComposant(ComposantDpu c) {
        if (c.getTotal() != null) {
            return c.getTotal();
        }
        BigDecimal r = c.getRendement() != null ? c.getRendement() : BigDecimal.ZERO;
        BigDecimal pu = c.getPrixUnitaire() != null ? c.getPrixUnitaire() : BigDecimal.ZERO;
        return r.multiply(pu);
    }

    static String rubriqueFromDpuType(String dpuType) {
        if (!StringUtils.hasText(dpuType)) {
            return RUBRIQUE_MATERIAUX;
        }
        return switch (dpuType.trim().toUpperCase()) {
            case CatalogNatureMapping.DPU_MAIN_DOEUVRE -> RUBRIQUE_MO;
            case CatalogNatureMapping.DPU_MATERIEL -> RUBRIQUE_MATERIEL;
            case CatalogNatureMapping.DPU_SOUS_TRAITANCE -> RUBRIQUE_SOUS_TRAITANCE;
            default -> RUBRIQUE_MATERIAUX;
        };
    }

    private static String labelRubrique(String rubrique) {
        return switch (rubrique) {
            case RUBRIQUE_MO -> "Main d'œuvre";
            case RUBRIQUE_MATERIEL -> "Matériel";
            case RUBRIQUE_SOUS_TRAITANCE -> "Sous-traitance";
            case RUBRIQUE_NON_VENTILE -> "Non ventilé";
            default -> "Matériaux";
        };
    }

    private static void add(
            Map<String, Acc> map,
            String rubrique,
            String label,
            BigDecimal montant,
            boolean nonFiable,
            String source) {
        Acc acc = map.computeIfAbsent(rubrique, k -> new Acc(rubrique, label, source));
        acc.montant = acc.montant.add(montant != null ? montant : BigDecimal.ZERO);
        if (nonFiable) {
            acc.nonFiable = true;
            acc.label = label;
            acc.sourceOrigine = source;
        }
    }

    private static final class Acc {
        final String rubrique;
        String label;
        BigDecimal montant = BigDecimal.ZERO;
        boolean nonFiable;
        String sourceOrigine;

        Acc(String rubrique, String label, String sourceOrigine) {
            this.rubrique = rubrique;
            this.label = label;
            this.sourceOrigine = sourceOrigine;
        }
    }
}
