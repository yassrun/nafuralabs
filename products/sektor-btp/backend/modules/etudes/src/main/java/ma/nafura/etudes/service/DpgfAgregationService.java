package ma.nafura.etudes.service;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.util.ArrayList;
import java.util.List;
import ma.nafura.etudes.api.dto.DpgfLotTotalDto;
import ma.nafura.etudes.domain.model.DpgfNoeud;
import org.springframework.stereotype.Service;

@Service
public class DpgfAgregationService {

    private static final int MONEY_SCALE = 2;

    public BigDecimal sumArticles(List<DpgfNoeud> nodes) {
        if (nodes == null || nodes.isEmpty()) {
            return BigDecimal.ZERO.setScale(MONEY_SCALE, RoundingMode.HALF_UP);
        }
        BigDecimal sum = BigDecimal.ZERO;
        for (DpgfNoeud node : nodes) {
            sum = sum.add(sumNode(node));
        }
        return sum.setScale(MONEY_SCALE, RoundingMode.HALF_UP);
    }

    public List<DpgfLotTotalDto> totauxByLot(List<DpgfNoeud> lotNodes) {
        List<DpgfLotTotalDto> rows = new ArrayList<>();
        if (lotNodes == null) {
            return rows;
        }
        for (DpgfNoeud lot : lotNodes) {
            if (!DpgfNoeud.TYPE_LOT.equals(lot.getType())) {
                continue;
            }
            BigDecimal lotTotal = BigDecimal.ZERO;
            List<DpgfNoeud> sousLots = lot.getEnfants() != null ? lot.getEnfants() : List.of();
            for (DpgfNoeud sousLot : sousLots) {
                List<DpgfNoeud> articles = sousLot.getEnfants() != null ? sousLot.getEnfants() : List.of();
                for (DpgfNoeud article : articles) {
                    if (DpgfNoeud.TYPE_ARTICLE.equals(article.getType()) && article.getTotal() != null) {
                        lotTotal = lotTotal.add(article.getTotal());
                    }
                }
            }
            rows.add(new DpgfLotTotalDto(
                    lot.getCode(),
                    lot.getLibelle(),
                    lotTotal.setScale(MONEY_SCALE, RoundingMode.HALF_UP)));
        }
        return rows;
    }

    public void applyHeaderTotals(
            ma.nafura.etudes.domain.model.Dpgf dpgf, List<DpgfNoeud> hierarchie) {
        BigDecimal totalHt = sumArticles(hierarchie);
        BigDecimal tvaTaux = dpgf.getTvaTaux() != null ? dpgf.getTvaTaux() : new BigDecimal("20");
        BigDecimal totalTva = totalHt
                .multiply(tvaTaux)
                .divide(new BigDecimal("100"), MONEY_SCALE, RoundingMode.HALF_UP);
        BigDecimal totalTtc = totalHt.add(totalTva).setScale(MONEY_SCALE, RoundingMode.HALF_UP);
        dpgf.setTotalHt(totalHt);
        dpgf.setTotalTva(totalTva);
        dpgf.setTotalTtc(totalTtc);
    }

    private BigDecimal sumNode(DpgfNoeud node) {
        BigDecimal sum = BigDecimal.ZERO;
        if (DpgfNoeud.TYPE_ARTICLE.equals(node.getType()) && node.getTotal() != null) {
            sum = sum.add(node.getTotal());
        }
        if (node.getEnfants() != null && !node.getEnfants().isEmpty()) {
            sum = sum.add(sumArticles(node.getEnfants()));
        }
        return sum;
    }
}
