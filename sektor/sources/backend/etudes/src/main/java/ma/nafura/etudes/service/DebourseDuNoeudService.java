package ma.nafura.etudes.service;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.util.ArrayList;
import java.util.EnumMap;
import java.util.List;
import java.util.Map;
import java.util.UUID;
import ma.nafura.chantiers.domain.budget.OrigineDebourse;
import ma.nafura.chantiers.domain.budget.RubriqueDebourse;
import ma.nafura.etudes.domain.dpgf.DpgfNoeud;
import ma.nafura.etudes.domain.dpu.ComposantDpu;
import ma.nafura.etudes.domain.dpu.OrigineCout;
import ma.nafura.etudes.domain.dpu.PrixDpu;
import ma.nafura.etudes.repository.PrixDpuRepository;
import ma.nafura.etudes.service.port.bc.ChainageAvalPort.DebourseProjection;
import ma.nafura.etudes.service.port.bc.ChainageAvalPort.PartRubrique;
import ma.nafura.platform.framework.context.TenantContext;
import org.springframework.stereotype.Service;

/**
 * L13 / budget-et-marge — le déboursé d'un poste du devis, décomposé, prêt à descendre sur le
 * nœud du chantier (AC-1 à AC-4).
 *
 * <p>Remplace l'ancienne ventilation par rubrique <b>au niveau chantier</b> : le calcul est le
 * même, le niveau ne l'est pas. On ne sait plus seulement que le chantier coûte trop cher, on
 * sait quel poste coûte trop cher.
 *
 * <p>Budget = <b>déboursé</b> ({@code coût unitaire × quantité}), jamais vente ni revient :
 * frais généraux et marge n'entrent pas dans le budget.
 */
@Service
public class DebourseDuNoeudService {

    private static final int MONEY_SCALE = 2;
    /** Précision de travail des parts unitaires — on n'arrondit qu'au montant final. */
    private static final int WORK_SCALE = 8;
    /** Bruit d'arrondi maximal imputable à une part : un centime par part. */
    private static final BigDecimal TOLERANCE_PAR_PART = new BigDecimal("0.01");

    private final PrixDpuRepository prixDpuRepository;

    public DebourseDuNoeudService(PrixDpuRepository prixDpuRepository) {
        this.prixDpuRepository = prixDpuRepository;
    }

    /**
     * Le déboursé d'un article du bordereau, décomposé.
     *
     * @return {@code null} si le nœud n'est pas un article — un lot vaut la somme de ses enfants
     *     et ne porte pas de déboursé propre (AC-1)
     */
    public DebourseProjection debourseDuNoeud(DpgfNoeud noeud) {
        if (noeud == null || !DpgfNoeud.TYPE_ARTICLE.equals(noeud.getType())) {
            return null;
        }
        BigDecimal qte = noeud.getQuantite() != null ? noeud.getQuantite() : BigDecimal.ZERO;
        BigDecimal cible = debourseDeLaLigne(noeud, qte);
        boolean nonFiable = Boolean.TRUE.equals(noeud.getCoutDeduit());

        OrigineCout origine = noeud.origineCoutEnum();
        if (origine == null) {
            origine = OrigineCout.ESTIME;
        }

        return switch (origine) {
            case DECOMPOSE -> decompose(noeud, qte, cible, nonFiable);
            // Un forfait n'a pas de sous-détail : il est tout entier de la sous-traitance (AC-3).
            case FORFAIT -> projection(
                    OrigineDebourse.FORFAIT,
                    nonFiable,
                    null,
                    null,
                    uneSeulePart(RubriqueDebourse.SOUS_TRAITANCE, cible));
            // Un estimé n'a rien à décomposer : il pose son déboursé en non ventilé (AC-3).
            case ESTIME -> projection(
                    OrigineDebourse.ESTIME,
                    nonFiable,
                    null,
                    null,
                    uneSeulePart(RubriqueDebourse.NON_VENTILE, cible));
        };
    }

    /**
     * Contrôle croisé AC-4 : Σ déboursés des nœuds == Σ (coût unitaire × quantité) des articles
     * du devis. Le même {@code debourseDeLaLigne} sert de cible à chaque poste, donc l'égalité
     * est vraie par construction — cette somme permet de le vérifier de l'extérieur.
     */
    public BigDecimal sommeDebourseArticles(List<DpgfNoeud> noeuds) {
        BigDecimal sum = BigDecimal.ZERO;
        for (DpgfNoeud noeud : noeuds) {
            if (!DpgfNoeud.TYPE_ARTICLE.equals(noeud.getType())) {
                continue;
            }
            BigDecimal qte = noeud.getQuantite() != null ? noeud.getQuantite() : BigDecimal.ZERO;
            sum = sum.add(debourseDeLaLigne(noeud, qte));
        }
        return sum.setScale(MONEY_SCALE, RoundingMode.HALF_UP);
    }

    // ── Décomposé ────────────────────────────────────────────────────────────

    private DebourseProjection decompose(
            DpgfNoeud noeud, BigDecimal qte, BigDecimal cible, boolean nonFiable) {
        PrixDpu dpu = prixDpuRepository
                .findByDpgfNoeudIdAndTenantId(noeud.getId(), TenantContext.getTenantId())
                .orElse(null);

        if (dpu == null || dpu.getComposants() == null || dpu.getComposants().isEmpty()) {
            // Décomposé sur le papier, sans sous-détail derrière : le déboursé existe quand
            // même et tombe en non ventilé. L'absence de DPU ne bloque jamais la conversion.
            return projection(
                    OrigineDebourse.DECOMPOSE,
                    nonFiable,
                    dpu != null ? dpu.getId() : null,
                    dpu != null ? dpu.getVersion() : null,
                    uneSeulePart(RubriqueDebourse.NON_VENTILE, cible));
        }

        // Chaque composant contribue à la rubrique de son type, pour son rendement ramené à
        // l'unité d'ouvrage, multiplié par la quantité du poste (AC-2).
        Map<RubriqueDebourse, BigDecimal> parUnite = new EnumMap<>(RubriqueDebourse.class);
        for (ComposantDpu composant : dpu.getComposants()) {
            BigDecimal part = partUnitaire(composant, dpu.getRendementJournalier());
            if (part.signum() == 0) {
                continue;
            }
            parUnite.merge(RubriqueDebourse.duTypeDpu(composant.getType()), part, BigDecimal::add);
        }

        Map<RubriqueDebourse, BigDecimal> montants = new EnumMap<>(RubriqueDebourse.class);
        for (Map.Entry<RubriqueDebourse, BigDecimal> entry : parUnite.entrySet()) {
            montants.put(
                    entry.getKey(),
                    entry.getValue().multiply(qte).setScale(MONEY_SCALE, RoundingMode.HALF_UP));
        }
        reconcilier(montants, cible);

        return projection(
                OrigineDebourse.DECOMPOSE, nonFiable, dpu.getId(), dpu.getVersion(), montants);
    }

    /**
     * Coût d'un composant pour <b>une</b> unité d'ouvrage, base mixte.
     *
     * <p>Un composant chiffré à la journée est ramené à l'unité en divisant par le rendement
     * journalier de l'ouvrage — même règle que {@code DpuCalculator}, qui produit le déboursé
     * sec de l'étude. Sans rendement journalier, il est ignoré : le compter tel quel
     * mélangerait un coût de journée à des coûts unitaires et gonflerait le déboursé d'un
     * facteur égal à la production journalière. La part manquante retombe en non ventilé par
     * {@link #reconcilier}, donc rien ne disparaît.
     */
    private static BigDecimal partUnitaire(ComposantDpu composant, BigDecimal rendementJournalier) {
        BigDecimal total = composant.getTotal();
        if (total == null) {
            BigDecimal rendement =
                    composant.getRendement() != null ? composant.getRendement() : BigDecimal.ZERO;
            BigDecimal prix =
                    composant.getPrixUnitaire() != null ? composant.getPrixUnitaire() : BigDecimal.ZERO;
            total = rendement.multiply(prix);
        }
        if (!composant.estJournalier()) {
            return total;
        }
        if (rendementJournalier == null || rendementJournalier.signum() <= 0) {
            return BigDecimal.ZERO;
        }
        return total.divide(rendementJournalier, WORK_SCALE, RoundingMode.HALF_UP);
    }

    /**
     * AC-4 — la copie ne perd rien : la somme des parts vaut exactement le déboursé de la ligne.
     *
     * <p>Deux écarts possibles, traités différemment parce qu'ils ne disent pas la même chose :
     *
     * <ul>
     *   <li>quelques centimes — c'est du bruit d'arrondi. Il est absorbé par la plus grosse
     *       part, là où il est le moins visible et le moins faux ;
     *   <li>davantage — le sous-détail ne couvre pas le coût du devis (composants journaliers
     *       sans rendement journalier, DPU en retard sur le bordereau). Ce n'est pas un arrondi,
     *       donc ça ne se cache pas dans une rubrique : la différence tombe en <b>non ventilé</b>,
     *       où elle se voit.
     * </ul>
     */
    private static void reconcilier(Map<RubriqueDebourse, BigDecimal> montants, BigDecimal cible) {
        BigDecimal somme = montants.values().stream().reduce(BigDecimal.ZERO, BigDecimal::add);
        BigDecimal residu = cible.subtract(somme).setScale(MONEY_SCALE, RoundingMode.HALF_UP);
        if (residu.signum() == 0) {
            return;
        }
        BigDecimal tolerance = TOLERANCE_PAR_PART.multiply(BigDecimal.valueOf(montants.size()));
        if (residu.abs().compareTo(tolerance) <= 0) {
            RubriqueDebourse plusGrosse = montants.entrySet().stream()
                    .max(Map.Entry.comparingByValue())
                    .map(Map.Entry::getKey)
                    .orElse(RubriqueDebourse.NON_VENTILE);
            montants.merge(plusGrosse, residu, BigDecimal::add);
            return;
        }
        montants.merge(RubriqueDebourse.NON_VENTILE, residu, BigDecimal::add);
    }

    // ── Fabrique ─────────────────────────────────────────────────────────────

    private static Map<RubriqueDebourse, BigDecimal> uneSeulePart(
            RubriqueDebourse rubrique, BigDecimal montant) {
        Map<RubriqueDebourse, BigDecimal> parts = new EnumMap<>(RubriqueDebourse.class);
        if (montant.signum() != 0) {
            parts.put(rubrique, montant);
        }
        return parts;
    }

    private static DebourseProjection projection(
            OrigineDebourse origine,
            boolean nonFiable,
            UUID prixDpuId,
            Long prixDpuVersion,
            Map<RubriqueDebourse, BigDecimal> montants) {
        List<PartRubrique> parts = new ArrayList<>();
        // Ordre d'affichage stable : les quatre rubriques, puis la part non ventilée.
        for (RubriqueDebourse rubrique : RubriqueDebourse.AFFICHAGE) {
            BigDecimal montant = montants.get(rubrique);
            if (montant != null && montant.signum() != 0) {
                parts.add(new PartRubrique(
                        rubrique.name(), montant.setScale(MONEY_SCALE, RoundingMode.HALF_UP)));
            }
        }
        return new DebourseProjection(origine.name(), nonFiable, prixDpuId, prixDpuVersion, parts);
    }

    /** Le déboursé de la ligne : coût unitaire × quantité. Jamais le prix de vente. */
    private static BigDecimal debourseDeLaLigne(DpgfNoeud noeud, BigDecimal qte) {
        BigDecimal cout = noeud.getCoutUnitaire();
        if (cout == null) {
            cout = BigDecimal.ZERO;
        }
        return cout.multiply(qte).setScale(MONEY_SCALE, RoundingMode.HALF_UP);
    }
}
