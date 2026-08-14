package ma.nafura.etudes.service;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.util.ArrayList;
import java.util.Collection;
import java.util.HashSet;
import java.util.LinkedHashSet;
import java.util.List;
import java.util.Set;
import java.util.UUID;
import ma.nafura.etudes.domain.appeloffre.ReferenceType;
import ma.nafura.etudes.domain.ouvrage.ComposantOuvrage;
import ma.nafura.etudes.domain.ouvrage.Ouvrage;
import ma.nafura.etudes.repository.OuvrageRepository;
import ma.nafura.catalogue.api.CatalogUsageLot;
import ma.nafura.platform.framework.context.TenantContext;
import org.springframework.stereotype.Service;
import org.springframework.util.StringUtils;

/**
 * L10 — récursion déboursé ouvrage + garde anti-cycle à l'écriture.
 *
 * <p>FG / marge uniquement au sommet, sauf {@code inclure_frais_et_marge} (sous-traitance).
 */
@Service
public class OuvrageCompositeService {

    public static final int MAX_DEPTH = 5;
    private static final int MONEY_SCALE = 2;
    private static final String DEFAULT_LOT = CatalogUsageLot.GROS_OEUVRE;
    private static final String DEFAULT_FAMILLE = "DIVERS";

    private final OuvrageRepository ouvrageRepository;
    private final DpuCalculator calculator;

    public OuvrageCompositeService(OuvrageRepository ouvrageRepository, DpuCalculator calculator) {
        this.ouvrageRepository = ouvrageRepository;
        this.calculator = calculator;
    }

    public String normalizeCodeLot(String raw) {
        if (!StringUtils.hasText(raw)) {
            return DEFAULT_LOT;
        }
        return CatalogUsageLot.parse(raw);
    }

    public String normalizeCodeFamille(String raw) {
        if (!StringUtils.hasText(raw)) {
            return DEFAULT_FAMILLE;
        }
        String value = raw.trim().toUpperCase().replace('-', '_').replace(' ', '_');
        if (value.length() > 30) {
            value = value.substring(0, 30);
        }
        return value;
    }

    /**
     * Refuse un cycle ou une profondeur &gt; {@link #MAX_DEPTH} avant persistance.
     *
     * @param parentOuvrageId ouvrage en cours d'écriture (null à la création avant id)
     * @param directChildren refs OUVRAGE directes des composants
     */
    public void assertAcyclic(UUID parentOuvrageId, Collection<UUID> directChildren) {
        if (directChildren == null || directChildren.isEmpty()) {
            return;
        }
        UUID tenantId = tenantId();
        for (UUID childId : directChildren) {
            if (childId == null) {
                continue;
            }
            if (parentOuvrageId != null && parentOuvrageId.equals(childId)) {
                Ouvrage self = require(childId, tenantId);
                throw new IllegalArgumentException(cycleMessage(List.of(label(self), label(self))));
            }
            LinkedHashSet<UUID> path = new LinkedHashSet<>();
            if (parentOuvrageId != null) {
                path.add(parentOuvrageId);
            }
            dfsWrite(parentOuvrageId, childId, path, 1, tenantId);
        }
    }

    /**
     * Prix unitaire effectif d'une ligne OUVRAGE : déboursé du sous-ouvrage, ou prix vente
     * si {@code inclureFraisEtMarge}.
     */
    public BigDecimal prixUnitaireEffectif(UUID refOuvrageId, boolean inclureFraisEtMarge, int depth) {
        Ouvrage child = require(refOuvrageId, tenantId());
        BigDecimal debourse = computeDebourse(child, depth);
        if (inclureFraisEtMarge) {
            return calculator.computePrixVenteHt(
                    debourse, child.getFraisGenerauxPercent(), child.getBeneficePercent());
        }
        return debourse;
    }

    /** Déboursé sec d'un ouvrage (composants + MO), récursif sur refs OUVRAGE. */
    public BigDecimal computeDebourse(Ouvrage ouvrage, int depth) {
        if (ouvrage == null) {
            return BigDecimal.ZERO.setScale(MONEY_SCALE, RoundingMode.HALF_UP);
        }
        if (depth > MAX_DEPTH) {
            throw new IllegalStateException(
                    "etudes.ouvrage.profondeur.max: profondeur max " + MAX_DEPTH + " dépassée");
        }
        BigDecimal sum = BigDecimal.ZERO;
        if (ouvrage.getComposants() != null) {
            for (ComposantOuvrage composant : ouvrage.getComposants()) {
                sum = sum.add(lineTotal(composant, depth));
            }
        }
        BigDecimal mo = ouvrage.getUniteMain() != null && ouvrage.getUniteMain().getTotal() != null
                ? ouvrage.getUniteMain().getTotal()
                : BigDecimal.ZERO;
        return sum.add(mo).setScale(MONEY_SCALE, RoundingMode.HALF_UP);
    }

    private BigDecimal lineTotal(ComposantOuvrage composant, int depth) {
        if (ReferenceType.OUVRAGE.name().equals(composant.getReferenceType())
                && composant.getRefOuvrageId() != null) {
            BigDecimal pu = prixUnitaireEffectif(
                    composant.getRefOuvrageId(),
                    Boolean.TRUE.equals(composant.getInclureFraisEtMarge()),
                    depth + 1);
            BigDecimal rendement =
                    composant.getRendement() != null ? composant.getRendement() : BigDecimal.ZERO;
            return calculator.computeLineTotal(rendement, pu);
        }
        if (composant.getTotal() != null) {
            return composant.getTotal();
        }
        return calculator.computeLineTotal(composant.getRendement(), composant.getPrixUnitaire());
    }

    private void dfsWrite(UUID rootId, UUID currentId, LinkedHashSet<UUID> path, int depth, UUID tenantId) {
        if (depth > MAX_DEPTH) {
            List<String> names = new ArrayList<>();
            for (UUID id : path) {
                names.add(label(require(id, tenantId)));
            }
            names.add(label(require(currentId, tenantId)));
            throw new IllegalArgumentException(
                    "etudes.ouvrage.profondeur.max: profondeur max "
                            + MAX_DEPTH
                            + " dépassée ("
                            + String.join(" → ", names)
                            + ")");
        }
        if (path.contains(currentId) || (rootId != null && rootId.equals(currentId))) {
            List<String> names = new ArrayList<>();
            for (UUID id : path) {
                names.add(label(require(id, tenantId)));
            }
            names.add(label(require(currentId, tenantId)));
            throw new IllegalArgumentException(cycleMessage(names));
        }
        Ouvrage current = require(currentId, tenantId);
        path.add(currentId);
        for (UUID child : childOuvrageIds(current)) {
            dfsWrite(rootId, child, path, depth + 1, tenantId);
        }
        path.remove(currentId);
    }

    private Set<UUID> childOuvrageIds(Ouvrage ouvrage) {
        Set<UUID> children = new HashSet<>();
        if (ouvrage.getComposants() == null) {
            return children;
        }
        for (ComposantOuvrage composant : ouvrage.getComposants()) {
            if (ReferenceType.OUVRAGE.name().equals(composant.getReferenceType())
                    && composant.getRefOuvrageId() != null) {
                children.add(composant.getRefOuvrageId());
            }
        }
        return children;
    }

    private Ouvrage require(UUID id, UUID tenantId) {
        return ouvrageRepository
                .findByIdAndTenantId(id, tenantId)
                .orElseThrow(() -> new IllegalArgumentException(
                        "etudes.ouvrage.introuvable: " + id));
    }

    private static String label(Ouvrage ouvrage) {
        return ouvrage.getCode() + " — " + ouvrage.getDesignation();
    }

    private static String cycleMessage(List<String> names) {
        return "etudes.ouvrage.cycle: " + String.join(" → ", names);
    }

    private UUID tenantId() {
        return TenantContext.getTenantId();
    }
}
