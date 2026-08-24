package ma.nafura.chantiers.service;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.OffsetDateTime;
import java.util.ArrayList;
import java.util.EnumMap;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.UUID;
import ma.nafura.chantiers.api.dto.DebourseNoeudDto;
import ma.nafura.chantiers.api.request.DebourseNoeudSaisieDto;
import ma.nafura.chantiers.domain.budget.DebourseNoeud;
import ma.nafura.chantiers.domain.budget.OrigineDebourse;
import ma.nafura.chantiers.domain.budget.PosteBudgetaire;
import ma.nafura.chantiers.domain.budget.RubriqueDebourse;
import ma.nafura.chantiers.repository.DebourseNoeudRepository;
import ma.nafura.chantiers.repository.PosteBudgetaireRepository;
import ma.nafura.platform.framework.context.TenantContext;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

/**
 * Le déboursé d'un nœud de l'arbre : la copie du DPU, la saisie sur un interne, la révision.
 *
 * <p>Trois gestes, trois règles qui ne se croisent jamais :
 *
 * <ul>
 *   <li>{@link #copierDepuisLEtude} — une fois, à la conversion. Écrit le prévu <b>et</b> le
 *       révisé, pose la date et l'origine. Refuse de s'exécuter deux fois : l'instantané ne se
 *       resynchronise pas, ni automatiquement ni à la demande (AC-5) ;
 *   <li>{@link #saisirSurNoeudInterne} — un nœud interne n'a aucun DPU derrière lui, son
 *       déboursé se saisit et son origine vaut {@code SAISI} (AC-6) ;
 *   <li>{@link #reviser} — une correction ne réécrit jamais la copie : elle se pose à côté, sur
 *       le même nœud et par rubrique (AC-7).
 * </ul>
 *
 * <p>Le porteur est <b>toujours un poste</b>. Un lot vaut la somme de ses enfants et ne se
 * saisit pas (AC-1) : il n'y a qu'un seul endroit où un montant est écrit, donc aucun total ne
 * peut diverger de ses composantes (AC-9).
 */
@Service
public class DebourseNoeudService {

    private static final int MONEY_SCALE = 2;

    private final DebourseNoeudRepository repository;
    private final PosteBudgetaireRepository posteRepository;

    public DebourseNoeudService(
            DebourseNoeudRepository repository, PosteBudgetaireRepository posteRepository) {
        this.repository = repository;
        this.posteRepository = posteRepository;
    }

    /** Une part du déboursé telle que la conversion la livre. */
    public record PartCopiee(RubriqueDebourse rubrique, BigDecimal montantHt) {}

    // ── Copie depuis l'étude (AC-2, AC-3, AC-5) ──────────────────────────────

    /**
     * Copie le déboursé décomposé du DPU sur un nœud, une fois pour toutes.
     *
     * <p>L'appel est <b>idempotent par refus</b> : un nœud dont le déboursé a déjà été copié
     * n'est pas recopié. C'est ce qui rend AC-5 vérifiable — après la conversion, plus rien
     * venant de l'étude n'atteint le budget.
     */
    @Transactional
    public void copierDepuisLEtude(
            String posteId,
            OrigineDebourse origine,
            boolean nonFiable,
            UUID prixDpuId,
            Long prixDpuVersion,
            List<PartCopiee> parts) {
        UUID tenantId = tenantId();
        PosteBudgetaire poste = requirePoste(tenantId, posteId);
        if (poste.getDebourseCopieLe() != null) {
            throw new IllegalStateException("chantiers.debourse.copie_deja_faite: " + posteId);
        }
        if (origine == null || !origine.vientDeLEtude()) {
            throw new IllegalArgumentException("chantiers.debourse.copie_origine_invalide");
        }

        poste.setDebourseOrigine(origine);
        poste.setDebourseNonFiable(nonFiable);
        poste.setDeboursePrixDpuId(prixDpuId);
        poste.setDeboursePrixDpuVersion(prixDpuVersion);
        // La date est posée ici, au moment de l'écriture : c'est elle qui date l'instantané.
        poste.setDebourseCopieLe(OffsetDateTime.now());
        posteRepository.save(poste);

        for (PartCopiee part : parts != null ? parts : List.<PartCopiee>of()) {
            if (part == null || part.rubrique() == null || estNul(part.montantHt())) {
                continue;
            }
            BigDecimal montant = arrondi(part.montantHt());
            repository.save(DebourseNoeud.builder()
                    .id(DebourseNoeud.buildId(posteId, part.rubrique()))
                    .tenantId(tenantId)
                    .posteId(posteId)
                    .rubrique(part.rubrique())
                    // Le révisé part de la copie : corriger est un geste, pas un état par défaut.
                    .prevuHt(montant)
                    .reviseHt(montant)
                    .build());
        }
    }

    // ── Saisie sur un nœud interne (AC-6) ────────────────────────────────────

    /**
     * Saisit le déboursé des quatre rubriques d'un nœud interne.
     *
     * <p>Un interne n'a pas de vendu mais il a un déboursé : il pèse sur le budget, la marge et
     * l'écart de son lot et du chantier. Refusé sur un nœud vendu — là, le prévu est une copie
     * et ne se réécrit pas (AC-7) ; la correction passe par {@link #reviser}.
     */
    @Transactional
    public DebourseNoeudDto saisirSurNoeudInterne(String posteId, DebourseNoeudSaisieDto request) {
        UUID tenantId = tenantId();
        PosteBudgetaire poste = requirePoste(tenantId, posteId);
        if (poste.getNature() != null && poste.getNature().estVendu()) {
            throw new IllegalArgumentException("chantiers.debourse.prevu_vendu_non_modifiable");
        }

        Map<RubriqueDebourse, BigDecimal> montants = lireLesQuatre(request);
        poste.setDebourseOrigine(OrigineDebourse.SAISI);
        poste.setDebourseNonFiable(false);
        posteRepository.save(poste);

        appliquer(tenantId, posteId, montants, true);
        return lire(posteId);
    }

    // ── Révision (AC-7) ──────────────────────────────────────────────────────

    /**
     * Corrige le déboursé d'un nœud sans toucher au prévu.
     *
     * <p>Les deux restent lisibles côte à côte et l'écart entre eux est visible : c'est la seule
     * façon de corriger un budget tout en gardant la preuve de ce que l'étude avait dit.
     */
    @Transactional
    public DebourseNoeudDto reviser(String posteId, DebourseNoeudSaisieDto request) {
        UUID tenantId = tenantId();
        requirePoste(tenantId, posteId);
        appliquer(tenantId, posteId, lireLesQuatre(request), false);
        return lire(posteId);
    }

    // ── Lecture ──────────────────────────────────────────────────────────────

    @Transactional(readOnly = true)
    public DebourseNoeudDto lire(String posteId) {
        UUID tenantId = tenantId();
        PosteBudgetaire poste = requirePoste(tenantId, posteId);
        List<DebourseNoeud> lignes =
                repository.findByTenantIdAndPosteIdOrderByRubriqueAsc(tenantId, posteId);
        return toDto(poste, lignes);
    }

    /** Les lignes de plusieurs nœuds en une passe — le rollup n'a pas à requêter poste par poste. */
    @Transactional(readOnly = true)
    public Map<String, List<DebourseNoeud>> lignesParPoste(List<String> posteIds) {
        Map<String, List<DebourseNoeud>> out = new LinkedHashMap<>();
        if (posteIds == null || posteIds.isEmpty()) {
            return out;
        }
        for (DebourseNoeud ligne : repository.findByTenantIdAndPosteIdIn(tenantId(), posteIds)) {
            out.computeIfAbsent(ligne.getPosteId(), k -> new ArrayList<>()).add(ligne);
        }
        return out;
    }

    public static DebourseNoeudDto toDto(PosteBudgetaire poste, List<DebourseNoeud> lignes) {
        Map<RubriqueDebourse, DebourseNoeud> parRubrique = new EnumMap<>(RubriqueDebourse.class);
        for (DebourseNoeud ligne : lignes) {
            parRubrique.put(ligne.getRubrique(), ligne);
        }

        List<DebourseNoeudDto.DebourseRubriqueDto> rubriques = new ArrayList<>();
        BigDecimal totalPrevu = BigDecimal.ZERO;
        BigDecimal totalRevise = BigDecimal.ZERO;
        for (RubriqueDebourse rubrique : RubriqueDebourse.AFFICHAGE) {
            DebourseNoeud ligne = parRubrique.get(rubrique);
            BigDecimal prevu = ligne != null ? ligne.getPrevuHt() : BigDecimal.ZERO;
            BigDecimal revise = ligne != null ? ligne.getReviseHt() : BigDecimal.ZERO;
            totalPrevu = totalPrevu.add(prevu);
            totalRevise = totalRevise.add(revise);
            // Les quatre rubriques sont toujours là ; le non ventilé ne s'affiche que s'il existe.
            if (rubrique.estVentilee() || ligne != null) {
                rubriques.add(DebourseNoeudDto.DebourseRubriqueDto.builder()
                        .rubrique(rubrique.name())
                        .label(rubrique.libelle())
                        .prevuHt(arrondi(prevu))
                        .reviseHt(arrondi(revise))
                        .ecartRevisionHt(arrondi(revise.subtract(prevu)))
                        .build());
            }
        }

        return DebourseNoeudDto.builder()
                .noeudId(poste.getId())
                .lotId(poste.getLotId())
                .code(poste.getCode())
                .designation(poste.getDesignation())
                .nature(poste.getNature())
                .origine(poste.getDebourseOrigine())
                .nonFiable(Boolean.TRUE.equals(poste.getDebourseNonFiable()))
                .copieLe(poste.getDebourseCopieLe())
                .prixDpuId(poste.getDeboursePrixDpuId())
                .prixDpuVersion(poste.getDeboursePrixDpuVersion())
                .dpgfNoeudId(poste.getDpgfNoeudId())
                .rubriques(rubriques)
                .prevuHt(arrondi(totalPrevu))
                .reviseHt(arrondi(totalRevise))
                .ecartRevisionHt(arrondi(totalRevise.subtract(totalPrevu)))
                .build();
    }

    // ── Interne ──────────────────────────────────────────────────────────────

    /**
     * Écrit les montants demandés.
     *
     * @param touchePrevu {@code true} pour une saisie initiale sur un interne (prévu et révisé
     *     partent ensemble), {@code false} pour une révision — auquel cas le prévu est intouché,
     *     même sur un interne : une fois posé, il devient la référence de l'écart.
     */
    private void appliquer(
            UUID tenantId,
            String posteId,
            Map<RubriqueDebourse, BigDecimal> montants,
            boolean touchePrevu) {
        for (Map.Entry<RubriqueDebourse, BigDecimal> entry : montants.entrySet()) {
            RubriqueDebourse rubrique = entry.getKey();
            BigDecimal montant = arrondi(entry.getValue());
            DebourseNoeud ligne = repository
                    .findByTenantIdAndPosteIdAndRubrique(tenantId, posteId, rubrique)
                    .orElseGet(() -> DebourseNoeud.builder()
                            .id(DebourseNoeud.buildId(posteId, rubrique))
                            .tenantId(tenantId)
                            .posteId(posteId)
                            .rubrique(rubrique)
                            .prevuHt(BigDecimal.ZERO)
                            .reviseHt(BigDecimal.ZERO)
                            .build());
            if (touchePrevu) {
                ligne.setPrevuHt(montant);
            }
            ligne.setReviseHt(montant);
            repository.save(ligne);
        }
    }

    /**
     * Lit les quatre rubriques d'une saisie. Une rubrique absente vaut zéro : l'écran envoie ce
     * qu'il montre, et ce qu'il montre est toujours les quatre.
     */
    private static Map<RubriqueDebourse, BigDecimal> lireLesQuatre(DebourseNoeudSaisieDto request) {
        Map<RubriqueDebourse, BigDecimal> montants = new EnumMap<>(RubriqueDebourse.class);
        for (RubriqueDebourse rubrique : RubriqueDebourse.LES_QUATRE) {
            montants.put(rubrique, BigDecimal.ZERO);
        }
        if (request == null || request.getRubriques() == null) {
            return montants;
        }
        for (DebourseNoeudSaisieDto.LigneDto ligne : request.getRubriques()) {
            if (ligne == null) {
                continue;
            }
            RubriqueDebourse rubrique = RubriqueDebourse.parse(ligne.getRubrique());
            if (rubrique == null) {
                continue;
            }
            // Le non ventilé n'est pas une rubrique de saisie : c'est le constat d'un chiffrage
            // qu'on n'a pas su décomposer, pas une case où poser un montant.
            if (!rubrique.estVentilee()) {
                throw new IllegalArgumentException("chantiers.debourse.non_ventile_non_saisissable");
            }
            BigDecimal montant = ligne.getMontantHt() != null ? ligne.getMontantHt() : BigDecimal.ZERO;
            if (montant.signum() < 0) {
                throw new IllegalArgumentException(
                        "chantiers.debourse.montant_negatif: " + rubrique.name());
            }
            montants.put(rubrique, montant);
        }
        return montants;
    }

    private PosteBudgetaire requirePoste(UUID tenantId, String posteId) {
        return posteRepository
                .findByIdAndTenantId(posteId, tenantId)
                .orElseThrow(() -> new IllegalArgumentException("Poste budgetaire not found: " + posteId));
    }

    private static boolean estNul(BigDecimal value) {
        return value == null || value.signum() == 0;
    }

    private static BigDecimal arrondi(BigDecimal value) {
        return (value != null ? value : BigDecimal.ZERO).setScale(MONEY_SCALE, RoundingMode.HALF_UP);
    }

    private static UUID tenantId() {
        return TenantContext.getTenantId();
    }
}
