package ma.nafura.achats.service;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.util.ArrayList;
import java.util.List;
import java.util.Objects;
import java.util.UUID;
import java.util.stream.Collectors;
import ma.nafura.achats.api.dto.MatchingLigneDto;
import ma.nafura.achats.api.dto.MatchingReceptionDto;
import ma.nafura.achats.api.dto.MatchingToleranceDto;
import ma.nafura.achats.domain.model.BonCommandeAchat;
import ma.nafura.achats.domain.model.BonCommandeAchatLigne;
import ma.nafura.achats.domain.model.FactureFournisseur;
import ma.nafura.achats.domain.model.FactureFournisseurLigne;
import ma.nafura.achats.domain.model.ReceptionAchat;
import ma.nafura.achats.domain.model.ReceptionAchatLigne;
import org.springframework.stereotype.Service;

@Service
public class MatchingThreeWayService {

    public static final MatchingToleranceDto DEFAULT_TOLERANCE = MatchingToleranceDto.builder()
            .pricePct(new BigDecimal("2"))
            .qtyPct(new BigDecimal("5"))
            .build();

    public MatchingReceptionDto compute(
            BonCommandeAchat bc,
            List<ReceptionAchat> receptions,
            FactureFournisseur facture,
            MatchingToleranceDto tolerance) {
        MatchingToleranceDto tol = tolerance != null ? tolerance : DEFAULT_TOLERANCE;
        BigDecimal pricePct = tol.getPricePct() != null ? tol.getPricePct() : DEFAULT_TOLERANCE.getPricePct();
        BigDecimal qtyPct = tol.getQtyPct() != null ? tol.getQtyPct() : DEFAULT_TOLERANCE.getQtyPct();

        List<ReceptionAchat> recs = receptions.stream()
                .filter(r -> Objects.equals(r.getBonCommandeAchatId(), bc.getId()))
                .toList();

        ReceptionAchat primaryRec = recs.isEmpty() ? null : recs.get(0);
        String receptionId = primaryRec != null ? primaryRec.getId().toString() : "";
        String receptionNumero = recs.stream()
                .map(ReceptionAchat::getNumero)
                .filter(n -> n != null && !n.isBlank())
                .collect(Collectors.joining(" · "));
        if (receptionNumero.isBlank()) {
            receptionNumero = "—";
        }

        List<MatchingLigneDto> lignes = new ArrayList<>();
        int ecartsQ = 0;
        int ecartsP = 0;

        List<BonCommandeAchatLigne> bcLignes =
                bc.getLignes() != null ? bc.getLignes() : List.of();
        for (BonCommandeAchatLigne bl : bcLignes) {
            BigDecimal qteCommandee = bl.getQuantite() != null ? bl.getQuantite() : BigDecimal.ZERO;
            BigDecimal qteRecue = sumQtyForBcLine(recs, bl);
            FactureAggregate agg = aggregateFactureForBcLine(facture, bl);
            BigDecimal qteFacturee = agg.qte();
            BigDecimal pxFacture = agg.pxMoyen();
            BigDecimal pxUnitaireBC = bl.getPrixUnitaireHt();

            BigDecimal ecartQte = pctDiff(
                    qteFacturee.compareTo(BigDecimal.ZERO) > 0 ? qteFacturee : qteRecue, qteCommandee);
            BigDecimal ecartPx = BigDecimal.ZERO;
            if (qteFacturee.compareTo(BigDecimal.ZERO) > 0
                    && pxFacture.compareTo(BigDecimal.ZERO) > 0
                    && pxUnitaireBC != null
                    && pxUnitaireBC.compareTo(BigDecimal.ZERO) > 0) {
                ecartPx = pctDiff(pxFacture, pxUnitaireBC);
            }

            boolean qtyTol = qteCommandee.compareTo(BigDecimal.ZERO) > 0
                    ? pctDiff(qteRecue, qteCommandee).compareTo(qtyPct) > 0
                    : qteRecue.compareTo(BigDecimal.ZERO) > 0;
            boolean qtyTolFf = qteFacturee.compareTo(BigDecimal.ZERO) > 0
                    && qteRecue.compareTo(BigDecimal.ZERO) > 0
                    && pctDiff(qteFacturee, qteRecue).compareTo(qtyPct) > 0;
            boolean pxBloquant = qteFacturee.compareTo(BigDecimal.ZERO) > 0
                    && pxFacture.compareTo(BigDecimal.ZERO) > 0
                    && pxUnitaireBC != null
                    && pxUnitaireBC.compareTo(BigDecimal.ZERO) > 0
                    && ecartPx.compareTo(pricePct) > 0;
            boolean bloquant = pxBloquant || qtyTol || qtyTolFf;

            if (qtyTol || qtyTolFf) {
                ecartsQ++;
            }
            if (pxBloquant) {
                ecartsP++;
            }

            lignes.add(MatchingLigneDto.builder()
                    .articleId(bl.getArticleId())
                    .qteCommandee(qteCommandee)
                    .qteRecue(qteRecue)
                    .qteFacturee(qteFacturee)
                    .pxUnitaireBC(pxUnitaireBC)
                    .pxUnitaireFacture(pxFacture)
                    .ecartQte(ecartQte)
                    .ecartPx(ecartPx)
                    .bloquant(bloquant)
                    .build());
        }

        boolean hasBloquant = lignes.stream().anyMatch(MatchingLigneDto::isBloquant);
        boolean allRecu = lignes.stream()
                .allMatch(l -> l.getQteRecue()
                        .compareTo(l.getQteCommandee()
                                .multiply(BigDecimal.ONE.subtract(
                                        qtyPct.divide(new BigDecimal("100"), 8, RoundingMode.HALF_UP)))
                                .setScale(4, RoundingMode.HALF_UP)) >= 0);
        boolean someRecu = lignes.stream().anyMatch(l -> l.getQteRecue().compareTo(BigDecimal.ZERO) > 0);
        boolean hasFacture = facture != null && facture.getLignes() != null && !facture.getLignes().isEmpty();

        String status = "NON_RECU";
        if (hasBloquant) {
            status = "ECART_BLOQUE";
        } else if (hasFacture) {
            boolean ffComplete = lignes.stream()
                    .allMatch(l -> l.getQteFacturee()
                                    .compareTo(l.getQteCommandee()
                                            .multiply(BigDecimal.ONE.subtract(qtyPct.divide(
                                                    new BigDecimal("100"), 8, RoundingMode.HALF_UP)))
                                            .setScale(4, RoundingMode.HALF_UP))
                            >= 0);
            status = ffComplete ? "FACTURE_COMPLET" : "FACTURE_PARTIEL";
        } else if (allRecu) {
            status = "RECU_COMPLET";
        } else if (someRecu) {
            status = "RECU_PARTIEL";
        }

        boolean matched3Way = !hasBloquant
                && hasFacture
                && "FACTURE_COMPLET".equals(status)
                && lignes.stream()
                        .allMatch(l -> l.getQteRecue().compareTo(BigDecimal.ZERO) > 0
                                && l.getQteFacturee().compareTo(BigDecimal.ZERO) > 0);

        return MatchingReceptionDto.builder()
                .id("match-" + bc.getId())
                .bcId(bc.getId().toString())
                .bcNumero(bc.getNumero())
                .receptionId(receptionId)
                .receptionNumero(receptionNumero)
                .factureFournisseurId(facture != null ? facture.getId().toString() : null)
                .factureNumero(facture != null ? facture.getNumeroInterne() : null)
                .lignes(lignes)
                .ecartsQuantite(ecartsQ)
                .ecartsPrix(ecartsP)
                .status(status)
                .matched3Way(matched3Way)
                .build();
    }

    private BigDecimal sumQtyForBcLine(List<ReceptionAchat> receptions, BonCommandeAchatLigne bcLigne) {
        BigDecimal sum = BigDecimal.ZERO;
        for (ReceptionAchat tx : receptions) {
            if (ReceptionAchat.STATUS_ANNULE.equals(tx.getStatus())) {
                continue;
            }
            if (tx.getLignes() == null) {
                continue;
            }
            for (ReceptionAchatLigne ln : tx.getLignes()) {
                if (ln.getBonCommandeLigneId() != null && ln.getBonCommandeLigneId().equals(bcLigne.getId())) {
                    sum = sum.add(ln.getQuantiteRecue() != null ? ln.getQuantiteRecue() : BigDecimal.ZERO);
                } else if (ln.getBonCommandeLigneId() == null
                        && ln.getArticleId() != null
                        && ln.getArticleId().equals(bcLigne.getArticleId())) {
                    sum = sum.add(ln.getQuantiteRecue() != null ? ln.getQuantiteRecue() : BigDecimal.ZERO);
                }
            }
        }
        return sum;
    }

    private FactureAggregate aggregateFactureForBcLine(FactureFournisseur facture, BonCommandeAchatLigne bcLigne) {
        if (facture == null || facture.getLignes() == null || facture.getLignes().isEmpty()) {
            return new FactureAggregate(BigDecimal.ZERO, BigDecimal.ZERO);
        }
        List<FactureFournisseurLigne> lignes = facture.getLignes().stream()
                .filter(l -> bcLigne.getId() != null && bcLigne.getId().equals(l.getBcLigneId()))
                .toList();
        if (lignes.isEmpty()) {
            return new FactureAggregate(BigDecimal.ZERO, BigDecimal.ZERO);
        }
        BigDecimal qte = BigDecimal.ZERO;
        BigDecimal ht = BigDecimal.ZERO;
        for (FactureFournisseurLigne l : lignes) {
            BigDecimal q = l.getQuantite();
            if (q == null
                    && l.getPrixUnitaireHt() != null
                    && l.getPrixUnitaireHt().compareTo(BigDecimal.ZERO) > 0
                    && l.getTotalHt() != null) {
                q = l.getTotalHt().divide(l.getPrixUnitaireHt(), 8, RoundingMode.HALF_UP);
            }
            if (q == null) {
                q = BigDecimal.ZERO;
            }
            qte = qte.add(q);
            ht = ht.add(l.getTotalHt() != null ? l.getTotalHt() : BigDecimal.ZERO);
        }
        BigDecimal pxMoyen = qte.compareTo(BigDecimal.ZERO) > 0
                ? ht.divide(qte, 8, RoundingMode.HALF_UP)
                : BigDecimal.ZERO;
        return new FactureAggregate(qte, pxMoyen);
    }

    private BigDecimal pctDiff(BigDecimal a, BigDecimal b) {
        if (b.compareTo(BigDecimal.ZERO) == 0) {
            return a.compareTo(BigDecimal.ZERO) == 0 ? BigDecimal.ZERO : new BigDecimal("100");
        }
        return a.subtract(b)
                .abs()
                .divide(b, 8, RoundingMode.HALF_UP)
                .multiply(new BigDecimal("100"));
    }

    private record FactureAggregate(BigDecimal qte, BigDecimal pxMoyen) {}
}
