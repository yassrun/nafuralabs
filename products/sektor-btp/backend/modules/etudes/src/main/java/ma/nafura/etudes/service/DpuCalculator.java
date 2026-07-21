package ma.nafura.etudes.service;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.util.List;
import ma.nafura.etudes.domain.model.ComposantDpu;
import org.springframework.stereotype.Service;

@Service
public class DpuCalculator {

    private static final int MONEY_SCALE = 2;

    public BigDecimal computeLineTotal(BigDecimal rendement, BigDecimal prixUnitaire) {
        BigDecimal q = rendement != null ? rendement.max(BigDecimal.ZERO) : BigDecimal.ZERO;
        BigDecimal pu = prixUnitaire != null ? prixUnitaire.max(BigDecimal.ZERO) : BigDecimal.ZERO;
        return q.multiply(pu).setScale(MONEY_SCALE, RoundingMode.HALF_UP);
    }

    /**
     * Deboursé sec unitaire, base mixte.
     *
     * <p>Constate sur le sous-detail reel de l'entreprise : un meme ouvrage melange des
     * composants deja rapportes a l'unite et des composants chiffres a la journee.
     *
     * <pre>
     *   deboursé = Σ(composants PAR_UNITE) + Σ(composants PAR_JOUR) / rendementJournalier
     * </pre>
     *
     * <p>Exemple reel, « Deblais en masse » : tractopelle 1500/j et pannes 200/j pour
     * 100 m3/jour, plus gasoil 10 DH deja au m3 → (1500 + 200)/100 + 10 = 27 DH/m3.
     *
     * <p>Sans rendement journalier, les composants journaliers sont ignores : les compter tels
     * quels melangerait un cout de journee a des couts unitaires et gonflerait le deboursé
     * d'un facteur egal a la production journaliere.
     */
    public BigDecimal computeDeboursSec(List<ComposantDpu> composants, BigDecimal rendementJournalier) {
        if (composants == null || composants.isEmpty()) {
            return BigDecimal.ZERO.setScale(MONEY_SCALE, RoundingMode.HALF_UP);
        }
        BigDecimal parUnite = BigDecimal.ZERO;
        BigDecimal parJour = BigDecimal.ZERO;
        for (ComposantDpu c : composants) {
            BigDecimal total = totalDe(c);
            if (c.estJournalier()) {
                parJour = parJour.add(total);
            } else {
                parUnite = parUnite.add(total);
            }
        }
        if (parJour.signum() != 0) {
            if (rendementJournalier == null || rendementJournalier.signum() <= 0) {
                parJour = BigDecimal.ZERO;
            } else {
                parJour = parJour.divide(rendementJournalier, MONEY_SCALE, RoundingMode.HALF_UP);
            }
        }
        return parUnite.add(parJour).setScale(MONEY_SCALE, RoundingMode.HALF_UP);
    }

    private BigDecimal totalDe(ComposantDpu composant) {
        BigDecimal total = composant.getTotal();
        if (total == null) {
            total = computeLineTotal(composant.getRendement(), composant.getPrixUnitaire());
        }
        return total;
    }

    /** @deprecated preferer la surcharge avec rendement journalier — base mixte. */
    @Deprecated(since = "lot-3")
    public BigDecimal computeDeboursSec(List<ComposantDpu> composants) {
        if (composants == null || composants.isEmpty()) {
            return BigDecimal.ZERO.setScale(MONEY_SCALE, RoundingMode.HALF_UP);
        }
        BigDecimal sum = BigDecimal.ZERO;
        for (ComposantDpu composant : composants) {
            BigDecimal total = composant.getTotal();
            if (total == null) {
                total = computeLineTotal(composant.getRendement(), composant.getPrixUnitaire());
            }
            sum = sum.add(total);
        }
        return sum.setScale(MONEY_SCALE, RoundingMode.HALF_UP);
    }

    /**
     * Prix de vente HT = déboursé × (1 + FG% + marge%), appliqué une seule fois au sommet du poste.
     *
     * <p>Les taux ne sont jamais portés par un sous-détail. Formule additive validée pour le
     * parcours d'étude manuel : {@code total = debourse × (1 + fg/100 + marge/100)}.
     */
    public BigDecimal computePrixVenteHt(
            BigDecimal deboursSec, BigDecimal fraisGenerauxPercent, BigDecimal margeBeneficiairePercent) {
        BigDecimal debourse = deboursSec != null ? deboursSec.max(BigDecimal.ZERO) : BigDecimal.ZERO;
        BigDecimal fg = fraisGenerauxPercent != null ? fraisGenerauxPercent.max(BigDecimal.ZERO) : BigDecimal.ZERO;
        BigDecimal marge =
                margeBeneficiairePercent != null ? margeBeneficiairePercent.max(BigDecimal.ZERO) : BigDecimal.ZERO;
        BigDecimal coef = BigDecimal.ONE.add(fg.movePointLeft(2)).add(marge.movePointLeft(2));
        return debourse.multiply(coef).setScale(MONEY_SCALE, RoundingMode.HALF_UP);
    }

    public BigDecimal computePrixVenteTtc(BigDecimal prixVenteHt, BigDecimal tvaTaux) {
        BigDecimal ht = prixVenteHt != null ? prixVenteHt.max(BigDecimal.ZERO) : BigDecimal.ZERO;
        BigDecimal tva = tvaTaux != null ? tvaTaux.max(BigDecimal.ZERO) : BigDecimal.ZERO;
        return ht.multiply(BigDecimal.ONE.add(tva.movePointLeft(2)))
                .setScale(MONEY_SCALE, RoundingMode.HALF_UP);
    }

    public void recomputeLineTotals(List<ComposantDpu> composants) {
        if (composants == null) {
            return;
        }
        for (ComposantDpu composant : composants) {
            composant.setTotal(computeLineTotal(composant.getRendement(), composant.getPrixUnitaire()));
        }
    }
}
