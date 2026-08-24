package ma.nafura.chantiers.service;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.UUID;
import ma.nafura.chantiers.domain.avancement.AvancementPhysique;
import ma.nafura.chantiers.domain.budget.PosteBudgetaire;
import ma.nafura.chantiers.domain.chantier.ChantierLot;
import ma.nafura.chantiers.domain.chantier.NatureLigne;
import ma.nafura.chantiers.repository.AvancementPhysiqueRepository;
import ma.nafura.chantiers.repository.ChantierLotRepository;
import ma.nafura.chantiers.repository.PosteBudgetaireRepository;
import ma.nafura.platform.framework.context.TenantContext;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.util.StringUtils;

/**
 * Source unique du pourcentage d'avancement — contrat {@code avancement-et-attachement}, AC-2 à
 * AC-4.
 *
 * <p>Le pourcentage n'est plus écrit nulle part (ni sur la ligne d'avancement, ni sur le lot, ni
 * sur le chantier) : il se calcule ici, à chaque lecture, {@code fait / prévu}. Un nœud avec
 * enfants se pondère au **montant vendu** de ses enfants (AC-4) — jamais à leur quantité, les
 * unités d'un lot ne s'additionnent pas. Un nœud interne ne pèse rien ; un lot sans aucun enfant
 * vendu ne rend pas 0 %, il rend {@code null} — « aucun avancement affiché », pas un mensonge.
 *
 * <p>Sert deux usages : la garde d'écriture d'{@link AvancementPhysiqueService} (quantité prévue /
 * quantité faite d'**un** nœud) et l'hydratation en lecture des entités {@code Chantier} /
 * {@code ChantierLot}, dont le champ {@code avancementPercent} est désormais {@code @Transient}.
 */
@Service
public class AvancementLectureService {

    private static final BigDecimal CENT = new BigDecimal("100");
    private static final int PERCENT_SCALE = 4;

    private final AvancementPhysiqueRepository avancementRepository;
    private final ChantierLotRepository lotRepository;
    private final PosteBudgetaireRepository posteRepository;

    public AvancementLectureService(
            AvancementPhysiqueRepository avancementRepository,
            ChantierLotRepository lotRepository,
            PosteBudgetaireRepository posteRepository) {
        this.avancementRepository = avancementRepository;
        this.lotRepository = lotRepository;
        this.posteRepository = posteRepository;
    }

    /** AC-3 — quantité faite cumulée sur un poste : somme de toutes ses déclarations. */
    @Transactional(readOnly = true)
    public BigDecimal quantiteFaiteCumuleePoste(String posteId) {
        return avancementRepository
                .findByTenantIdAndPosteIdOrderByDateSaisieAscCreatedAtAsc(tenantId(), posteId)
                .stream()
                .map(AvancementPhysique::getQuantiteRealisee)
                .reduce(BigDecimal.ZERO, BigDecimal::add);
    }

    /** AC-3 — quantité faite cumulée sur un lot déclaré en direct (lot-feuille, sans poste). */
    @Transactional(readOnly = true)
    public BigDecimal quantiteFaiteCumuleeLotFeuille(String lotId) {
        return avancementRepository
                .findByTenantIdAndLotIdAndPosteIdIsNullOrderByDateSaisieAscCreatedAtAsc(tenantId(), lotId)
                .stream()
                .map(AvancementPhysique::getQuantiteRealisee)
                .reduce(BigDecimal.ZERO, BigDecimal::add);
    }

    /** AC-3 — {@code fait / prévu} ; {@code null} si aucune quantité prévue (AC-6). */
    public static BigDecimal pourcentage(BigDecimal quantitePrevue, BigDecimal quantiteFaite) {
        if (quantitePrevue == null || quantitePrevue.signum() <= 0) {
            return null;
        }
        BigDecimal faite = quantiteFaite != null ? quantiteFaite : BigDecimal.ZERO;
        return faite.multiply(CENT).divide(quantitePrevue, PERCENT_SCALE, RoundingMode.HALF_UP);
    }

    /**
     * Hydrate l'arbre entier d'un chantier : pose {@code avancementPercent} (transitoire) sur
     * chaque {@link ChantierLot} et rend l'avancement du chantier (AC-4). N'écrit rien en base —
     * {@code repository.save} n'est jamais appelé ici.
     */
    @Transactional(readOnly = true)
    public BigDecimal hydrateArbre(String chantierId) {
        UUID tenantId = tenantId();
        List<ChantierLot> lots = lotRepository.findByTenantIdAndChantierIdOrderByOrdreAscCodeAsc(tenantId, chantierId);
        return hydrate(lots);
    }

    /** Variante quand l'appelant a déjà chargé les lots (évite un second aller-retour). */
    @Transactional(readOnly = true)
    public BigDecimal hydrate(List<ChantierLot> lots) {
        Map<String, ChantierLot> lotById = new HashMap<>();
        Map<String, List<ChantierLot>> childrenByParent = new HashMap<>();
        for (ChantierLot lot : lots) {
            lotById.put(lot.getId(), lot);
            if (StringUtils.hasText(lot.getParentLotId())) {
                childrenByParent.computeIfAbsent(lot.getParentLotId(), key -> new ArrayList<>()).add(lot);
            }
        }

        Map<String, List<PosteBudgetaire>> postesByLotId = new HashMap<>();
        for (ChantierLot lot : lots) {
            postesByLotId.put(
                    lot.getId(),
                    posteRepository.findByTenantIdAndLotIdOrderByOrdreAscCodeAsc(tenantId(), lot.getId()));
        }

        Map<String, BigDecimal> percentByLotId = new HashMap<>();
        Map<String, BigDecimal> poidsByLotId = new HashMap<>();
        for (ChantierLot lot : lots) {
            resoudre(lot, lotById, childrenByParent, postesByLotId, percentByLotId, poidsByLotId);
        }
        for (ChantierLot lot : lots) {
            lot.setAvancementPercent(percentByLotId.get(lot.getId()));
        }

        BigDecimal totalPoids = BigDecimal.ZERO;
        BigDecimal totalPondere = BigDecimal.ZERO;
        for (ChantierLot lot : lots) {
            if (StringUtils.hasText(lot.getParentLotId())) {
                continue;
            }
            BigDecimal poids = poidsByLotId.getOrDefault(lot.getId(), BigDecimal.ZERO);
            BigDecimal percent = percentByLotId.get(lot.getId());
            if (poids.signum() > 0 && percent != null) {
                totalPoids = totalPoids.add(poids);
                totalPondere = totalPondere.add(poids.multiply(percent));
            }
        }
        return totalPoids.signum() > 0
                ? totalPondere.divide(totalPoids, PERCENT_SCALE, RoundingMode.HALF_UP)
                : null;
    }

    /** Résout récursivement pourcentage + poids-vendu d'un lot, mémoïsés dans les deux maps. */
    private void resoudre(
            ChantierLot lot,
            Map<String, ChantierLot> lotById,
            Map<String, List<ChantierLot>> childrenByParent,
            Map<String, List<PosteBudgetaire>> postesByLotId,
            Map<String, BigDecimal> percentByLotId,
            Map<String, BigDecimal> poidsByLotId) {
        if (poidsByLotId.containsKey(lot.getId())) {
            return;
        }
        // Marqueur anti-cycle défensif (l'arbre n'en a pas, mais on ne veut jamais boucler).
        poidsByLotId.put(lot.getId(), BigDecimal.ZERO);

        List<PosteBudgetaire> postes = postesByLotId.getOrDefault(lot.getId(), List.of());
        List<ChantierLot> children = childrenByParent.getOrDefault(lot.getId(), List.of());

        if (!postes.isEmpty()) {
            BigDecimal totalPoids = BigDecimal.ZERO;
            BigDecimal totalPondere = BigDecimal.ZERO;
            BigDecimal poidsSubtree = BigDecimal.ZERO;
            for (PosteBudgetaire poste : postes) {
                BigDecimal poidsVendu = poidsVenduPoste(poste);
                poidsSubtree = poidsSubtree.add(poidsVendu);
                BigDecimal faite = quantiteFaiteCumuleePoste(poste.getId());
                BigDecimal percent = pourcentage(poste.getQuantite(), faite);
                if (poidsVendu.signum() > 0 && percent != null) {
                    totalPoids = totalPoids.add(poidsVendu);
                    totalPondere = totalPondere.add(poidsVendu.multiply(percent));
                }
            }
            percentByLotId.put(
                    lot.getId(),
                    totalPoids.signum() > 0 ? totalPondere.divide(totalPoids, PERCENT_SCALE, RoundingMode.HALF_UP) : null);
            poidsByLotId.put(lot.getId(), poidsSubtree);
            return;
        }

        if (!children.isEmpty()) {
            BigDecimal totalPoids = BigDecimal.ZERO;
            BigDecimal totalPondere = BigDecimal.ZERO;
            BigDecimal poidsSubtree = BigDecimal.ZERO;
            for (ChantierLot child : children) {
                resoudre(child, lotById, childrenByParent, postesByLotId, percentByLotId, poidsByLotId);
                BigDecimal poidsEnfant = poidsByLotId.getOrDefault(child.getId(), BigDecimal.ZERO);
                BigDecimal percentEnfant = percentByLotId.get(child.getId());
                poidsSubtree = poidsSubtree.add(poidsEnfant);
                if (poidsEnfant.signum() > 0 && percentEnfant != null) {
                    totalPoids = totalPoids.add(poidsEnfant);
                    totalPondere = totalPondere.add(poidsEnfant.multiply(percentEnfant));
                }
            }
            percentByLotId.put(
                    lot.getId(),
                    totalPoids.signum() > 0 ? totalPondere.divide(totalPoids, PERCENT_SCALE, RoundingMode.HALF_UP) : null);
            poidsByLotId.put(lot.getId(), poidsSubtree);
            return;
        }

        // Lot-feuille : se comporte comme un poste, déclaré en direct (AC-1).
        BigDecimal faite = quantiteFaiteCumuleeLotFeuille(lot.getId());
        BigDecimal percent = pourcentage(lot.getQuantite(), faite);
        percentByLotId.put(lot.getId(), percent);
        poidsByLotId.put(lot.getId(), poidsVenduLot(lot));
    }

    /** AC-4 — un interne ne pèse rien ; un vendu sans montant non plus. */
    private static BigDecimal poidsVenduPoste(PosteBudgetaire poste) {
        if (poste.getNature() != NatureLigne.VENDU || poste.getMontantHt() == null) {
            return BigDecimal.ZERO;
        }
        return poste.getMontantHt();
    }

    private static BigDecimal poidsVenduLot(ChantierLot lot) {
        if (lot.getNature() != NatureLigne.VENDU || lot.getMontantHt() == null) {
            return BigDecimal.ZERO;
        }
        return lot.getMontantHt();
    }

    private static UUID tenantId() {
        return TenantContext.getTenantId();
    }
}
