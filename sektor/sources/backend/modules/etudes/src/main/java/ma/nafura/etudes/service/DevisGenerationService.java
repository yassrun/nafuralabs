package ma.nafura.etudes.service;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.util.ArrayList;
import java.util.List;
import java.util.UUID;
import ma.nafura.etudes.domain.model.DevisLigne;
import ma.nafura.etudes.domain.model.Dpgf;
import ma.nafura.etudes.domain.model.DpgfNoeud;
import org.springframework.stereotype.Service;
import org.springframework.util.StringUtils;

@Service
public class DevisGenerationService {

    private static final int MONEY_SCALE = 2;

    /**
     * Port of frontend {@code DpgfService.toDevisLignes}: one CHAPITRE root + OUVRAGE lines from ARTICLE nodes.
     */
    public List<DevisLigne> toDevisLignes(Dpgf dpgf, UUID devisId, UUID tenantId) {
        List<DevisLigne> lines = new ArrayList<>();
        int ordre = 1;

        String chapitreDesignation = "DPGF " + dpgf.getNumero();
        if (StringUtils.hasText(dpgf.getProjetNom())) {
            chapitreDesignation += " — " + dpgf.getProjetNom();
        }

        lines.add(DevisLigne.builder()
                .tenantId(tenantId)
                .ordre(ordre)
                .type(DevisLigne.TYPE_CHAPITRE)
                .code(dpgf.getNumero())
                .designation(chapitreDesignation)
                .build());

        List<DpgfNoeud> hierarchie = dpgf.getHierarchie() != null ? dpgf.getHierarchie() : List.of();
        walkNodes(hierarchie, List.of(), devisId, tenantId, lines, new int[] {ordre});
        return lines;
    }

    private void walkNodes(
            List<DpgfNoeud> nodes,
            List<String> path,
            UUID devisId,
            UUID tenantId,
            List<DevisLigne> lines,
            int[] ordreRef) {
        if (nodes == null) {
            return;
        }
        for (DpgfNoeud node : nodes) {
            if (DpgfNoeud.TYPE_ARTICLE.equals(node.getType())) {
                ordreRef[0] += 1;
                BigDecimal qty = node.getQuantite() != null ? node.getQuantite() : BigDecimal.ZERO;
                BigDecimal pu = node.getPrixUnitaire() != null ? node.getPrixUnitaire() : BigDecimal.ZERO;
                BigDecimal totalHt = node.getTotal() != null
                        ? node.getTotal().setScale(MONEY_SCALE, RoundingMode.HALF_UP)
                        : qty.multiply(pu).setScale(MONEY_SCALE, RoundingMode.HALF_UP);

                List<String> designationParts = new ArrayList<>(path);
                if (StringUtils.hasText(node.getLibelle())) {
                    designationParts.add(node.getLibelle());
                }
                String designation = String.join(" — ", designationParts);

                lines.add(DevisLigne.builder()
                        .tenantId(tenantId)
                        .ordre(ordreRef[0])
                        .type(DevisLigne.TYPE_OUVRAGE)
                        .code(node.getCode())
                        .designation(designation)
                        .ouvrageId(node.getArticleId())
                        .unite(node.getUnite())
                        .quantite(qty)
                        .prixUnitaireHt(pu)
                        .totalHt(totalHt)
                        .build());
            } else if (node.getEnfants() != null && !node.getEnfants().isEmpty()) {
                List<String> nextPath = new ArrayList<>(path);
                if (StringUtils.hasText(node.getLibelle())) {
                    nextPath.add(node.getLibelle());
                }
                walkNodes(node.getEnfants(), nextPath, devisId, tenantId, lines, ordreRef);
            }
        }
    }
}
