package ma.nafura.chantiers.service;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.util.ArrayList;
import java.util.List;
import java.util.Locale;
import ma.nafura.chantiers.api.dto.BudgetArbreDto;
import ma.nafura.chantiers.api.dto.BudgetChantierDto;
import ma.nafura.chantiers.api.dto.BudgetLigneDto;
import ma.nafura.chantiers.api.request.BudgetChantierUpsertDto;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

/**
 * Le budget par rubrique d'un chantier — <b>calculé</b>, plus jamais stocké (AC-8).
 *
 * <p>Les tables {@code budget_chantiers} et {@code budget_lignes} n'existent plus. Ce service ne
 * lit pas un agrégat : il additionne l'arbre à la demande. C'est ce qui garantit AC-9 — aucun
 * total ne peut diverger de ses composantes, puisqu'il n'y a plus de second endroit où le
 * stocker.
 *
 * <p>La vue par rubrique reste offerte parce qu'elle répond à une vraie question (« combien de
 * main d'œuvre sur ce chantier ? »). Ce qui disparaît, c'est l'idée qu'elle soit une <b>source</b>.
 */
@Service
public class BudgetChantierService {

    private static final int MONEY_SCALE = 2;

    private final BudgetArbreService arbreService;

    public BudgetChantierService(BudgetArbreService arbreService) {
        this.arbreService = arbreService;
    }

    @Transactional(readOnly = true)
    public BudgetChantierDto getByChantierId(String chantierId) {
        BudgetArbreDto arbre = arbreService.lireArbre(chantierId);
        BudgetArbreDto.TotauxDto totaux = arbre.getTotaux();

        List<BudgetLigneDto> lignes = new ArrayList<>();
        int ordre = 1;
        for (BudgetArbreDto.RubriqueTotalDto rubrique : arbre.getRubriques()) {
            BigDecimal revise = scale(rubrique.getReviseHt());
            BigDecimal reel = scale(rubrique.getReelHt());
            lignes.add(BudgetLigneDto.builder()
                    .id(chantierId + "-" + rubrique.getRubrique().toLowerCase(Locale.ROOT))
                    .rubrique(rubrique.getRubrique())
                    .label(rubrique.getLabel())
                    .previsionnelHt(scale(rubrique.getPrevuHt()))
                    .reviseHt(revise)
                    // L'engagé vient des commandes et contrats d'Achats : personne ne l'alimente
                    // ici. Il vaut zéro et le dit — il n'est pas tenu (hors périmètre nommé).
                    .engageHt(zero())
                    .realiseHt(reel)
                    .resteHt(revise)
                    .ecartHt(scale(rubrique.getEcartHt()))
                    .ecartPercent(pourcent(rubrique.getEcartHt(), revise))
                    .ordre(ordre++)
                    .build());
        }

        BigDecimal revise = scale(totaux.getDebourseReviseHt());
        return BudgetChantierDto.builder()
                .id(chantierId)
                .chantierId(arbre.getChantierId())
                .code(arbre.getCode())
                .name(arbre.getName())
                .client(arbre.getClient())
                .previsionnelHt(scale(totaux.getDeboursePrevuHt()))
                .reviseHt(revise)
                .engageHt(zero())
                .realiseHt(scale(totaux.getDebourseReelHt()))
                .resteAEngagerHt(revise)
                .lignes(lignes)
                .build();
    }

    /**
     * AC-8 — toute tentative d'écrire un budget par rubrique au chantier est refusée.
     *
     * <p>Le refus est explicite plutôt que silencieux : un appelant qui écrivait ici doit savoir
     * où le geste est parti — sur le nœud, par rubrique (AC-7).
     */
    public BudgetChantierDto upsert(String chantierId, BudgetChantierUpsertDto request) {
        throw new IllegalStateException("chantiers.budget.agregat_non_stocke");
    }

    /**
     * AC-14 — un écart en pourcentage sans base (déboursé nul ou absent) est indisponible,
     * jamais « 0 % » par défaut.
     */
    private static BigDecimal pourcent(BigDecimal ecart, BigDecimal base) {
        if (base == null || base.signum() == 0) {
            return null;
        }
        return scale(ecart).multiply(BigDecimal.valueOf(100)).divide(base, 1, RoundingMode.HALF_UP);
    }

    /** Arrondi de présentation uniquement — une absence reste une absence. */
    private static BigDecimal scale(BigDecimal value) {
        if (value == null) {
            return null;
        }
        return value.setScale(MONEY_SCALE, RoundingMode.HALF_UP);
    }

    private static BigDecimal zero() {
        return BigDecimal.ZERO.setScale(MONEY_SCALE);
    }
}
