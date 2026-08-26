package ma.nafura.chantiers.service;

import java.math.BigDecimal;
import java.math.RoundingMode;
import ma.nafura.chantiers.api.dto.BudgetChantierDto;
import ma.nafura.chantiers.api.dto.ChantierSummaryDto;
import ma.nafura.chantiers.domain.chantier.Chantier;
import ma.nafura.chantiers.repository.ChantierLotRepository;
import ma.nafura.platform.framework.context.TenantContext;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

/**
 * Read model de la fiche chantier — dictionnaire financier canonique
 * (continuite-etude-devis-chantier AC-10, AC-12, AC-13, AC-14).
 *
 * <p>Tous les montants viennent des mêmes agrégats : le snapshot commercial posé à la conversion
 * (vente initiale, déboursé initial) et l'arbre (budget révisé). Les marges sont dérivées par
 * les formules du dictionnaire — jamais saisies, jamais stockées à côté.
 *
 * <p>Une valeur non calculable est {@code null} (affichage « Non disponible »), jamais zéro.
 * Le statut renvoyé est le statut chantier réel, identique sur toutes les lectures (AC-14).
 */
@Service
public class ChantierSummaryReadService {

    private static final int MONEY_SCALE = 2;
    private static final int PERCENT_SCALE = 2;

    private final ChantierService chantierService;
    private final BudgetChantierService budgetChantierService;
    private final ChantierLotRepository lotRepository;
    private final SituationTravauxService situationTravauxService;

    public ChantierSummaryReadService(
            ChantierService chantierService,
            BudgetChantierService budgetChantierService,
            ChantierLotRepository lotRepository,
            SituationTravauxService situationTravauxService) {
        this.chantierService = chantierService;
        this.budgetChantierService = budgetChantierService;
        this.lotRepository = lotRepository;
        this.situationTravauxService = situationTravauxService;
    }

    @Transactional(readOnly = true)
    public ChantierSummaryDto getSummary(String chantierId) {
        Chantier chantier = chantierService.getById(chantierId);
        BudgetChantierDto budget = budgetChantierService.getByChantierId(chantier.getId());
        long lotsCount = lotRepository.countByTenantIdAndChantierId(tenantId(), chantier.getId());

        BigDecimal avancement = chantier.getAvancementPercent() != null
                ? chantier.getAvancementPercent().setScale(1, RoundingMode.HALF_UP)
                : null;

        BigDecimal budgetRevise = scale(budget.getReviseHt());
        return ChantierSummaryDto.builder()
                .chantier(chantier)
                .budget(ChantierSummaryDto.BudgetTotals.builder()
                        .prevuHt(scale(budget.getPrevisionnelHt()))
                        .reviseHt(budgetRevise)
                        .realiseHt(scale(budget.getRealiseHt()))
                        .margeHt(null)
                        .build())
                .avancementPercent(avancement)
                .lotsCount(lotsCount)
                .openSituationsCount(situationTravauxService.countOpenByChantier(chantier.getId()))
                .montantVenteInitialHt(scale(chantier.getMontantVenteInitialHt()))
                .montantVenteActifHt(venteActive(chantier))
                .debourseInitialHt(scale(chantier.getDebourseInitialHt()))
                .budgetReviseHt(budgetRevise)
                .margeInitialeHt(margeInitialeHt(chantier))
                .margeInitialePct(margeInitialePct(chantier))
                .margeProjeteeHt(margeProjeteeHt(chantier, budgetRevise))
                .margeProjeteePct(margeProjeteePct(chantier, budgetRevise))
                .sourceVente(chantier.getSourceVente())
                .status(chantier.getStatus())
                .build();
    }

    /**
     * AC-11 — la vente active est le devis accepté tant qu'aucun marché n'est notifié. Aucun
     * fallback ne choisit un plus grand montant ; sans source (création directe), elle reste
     * absente (AC-17).
     */
    private static BigDecimal venteActive(Chantier chantier) {
        return scale(chantier.getMontantVenteInitialHt());
    }

    /** Marge initiale = vente initiale − déboursé initial ; absente si l'un des deux manque. */
    private static BigDecimal margeInitialeHt(Chantier chantier) {
        BigDecimal vente = chantier.getMontantVenteInitialHt();
        BigDecimal debourse = chantier.getDebourseInitialHt();
        if (vente == null || debourse == null) {
            return null;
        }
        return scale(vente.subtract(debourse));
    }

    /** Taux = marge / vente × 100 ; indisponible si le dénominateur est nul ou absent. */
    private static BigDecimal margeInitialePct(Chantier chantier) {
        BigDecimal vente = chantier.getMontantVenteInitialHt();
        BigDecimal marge = margeInitialeHt(chantier);
        if (vente == null || vente.signum() == 0 || marge == null) {
            return null;
        }
        return percent(marge, vente);
    }

    /** Marge projetée = vente active − budget révisé ; absente si l'un des deux manque. */
    private static BigDecimal margeProjeteeHt(Chantier chantier, BigDecimal budgetRevise) {
        BigDecimal vente = chantier.getMontantVenteInitialHt();
        if (vente == null || budgetRevise == null) {
            return null;
        }
        return scale(vente.subtract(budgetRevise));
    }

    private static BigDecimal margeProjeteePct(Chantier chantier, BigDecimal budgetRevise) {
        BigDecimal vente = chantier.getMontantVenteInitialHt();
        BigDecimal marge = margeProjeteeHt(chantier, budgetRevise);
        if (vente == null || vente.signum() == 0 || marge == null) {
            return null;
        }
        return percent(marge, vente);
    }

    private static BigDecimal percent(BigDecimal valeur, BigDecimal base) {
        return valeur
                .multiply(BigDecimal.valueOf(100))
                .divide(base, PERCENT_SCALE, RoundingMode.HALF_UP);
    }

    /** Échelle d'affichage seulement — jamais d'arrondi avant le calcul (AC-10). */
    private static BigDecimal scale(BigDecimal value) {
        if (value == null) {
            return null;
        }
        return value.setScale(MONEY_SCALE, RoundingMode.HALF_UP);
    }

    private static java.util.UUID tenantId() {
        return TenantContext.getTenantId();
    }
}
