package ma.nafura.etudes.service.bordereau;

import com.fasterxml.jackson.databind.JsonNode;
import java.util.ArrayList;
import java.util.HashSet;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.Set;
import ma.nafura.etudes.api.request.ImportNoeudDto;
import ma.nafura.etudes.api.request.ImportTreeRequest;
import ma.nafura.etudes.domain.model.DpgfNoeud;
import org.springframework.stereotype.Component;
import org.springframework.util.StringUtils;

/**
 * Assemble un {@link ImportTreeRequest} à partir des candidats locaux + classification LLM.
 *
 * <p>Les valeurs article (libellé, unité, quantité) restent locales ; le LLM ne fournit que
 * la hiérarchie (lots / sous-lots) et les affectations par {@code rowId}.
 */
@Component
public class BordereauHybridAssembler {

    public ImportTreeRequest assemble(BordereauParseResult parse, JsonNode classification) {
        Map<String, BordereauRowCandidate> byId = new LinkedHashMap<>();
        for (BordereauRowCandidate row : parse.rows()) {
            byId.put(row.rowId(), row);
        }

        ImportTreeRequest tree = new ImportTreeRequest();
        if (classification == null || !classification.has("lots") || !classification.get("lots").isArray()) {
            tree.getArbre().addAll(flatFallback(parse));
            return tree;
        }

        Set<String> assigned = new HashSet<>();
        for (JsonNode lotNode : classification.get("lots")) {
            ImportNoeudDto lot = mapGroup(lotNode, DpgfNoeud.TYPE_LOT, "Lot", byId, assigned);
            if (lot != null) {
                tree.getArbre().add(lot);
            }
        }

        // Articles non classés → lot technique pour ne rien perdre.
        List<ImportNoeudDto> orphans = new ArrayList<>();
        for (BordereauRowCandidate row : parse.articleCandidates()) {
            if (!assigned.contains(row.rowId())) {
                orphans.add(toArticle(row));
            }
        }
        if (!orphans.isEmpty()) {
            ImportNoeudDto orphanLot = new ImportNoeudDto();
            orphanLot.setType(DpgfNoeud.TYPE_LOT);
            orphanLot.setCode(null);
            orphanLot.setLibelle("A classer");
            orphanLot.setEnfants(orphans);
            tree.getArbre().add(orphanLot);
        }

        if (tree.getArbre().isEmpty()) {
            tree.getArbre().addAll(flatFallback(parse));
        }
        return tree;
    }

    /**
     * Reconstruction locale sans LLM : groupes détectés + articles rattachés par ordre/page.
     */
    public ImportTreeRequest assembleLocalOnly(BordereauParseResult parse) {
        ImportTreeRequest tree = new ImportTreeRequest();
        ImportNoeudDto currentLot = null;
        ImportNoeudDto currentSousLot = null;

        for (BordereauRowCandidate row : parse.rows()) {
            if (row.kind() == BordereauRowCandidate.Kind.LOT) {
                currentLot = newGroup(DpgfNoeud.TYPE_LOT, row);
                tree.getArbre().add(currentLot);
                currentSousLot = null;
                continue;
            }
            if (row.kind() == BordereauRowCandidate.Kind.SOUS_LOT
                    || row.kind() == BordereauRowCandidate.Kind.SECTION) {
                if (currentLot == null) {
                    currentLot = newGroup(DpgfNoeud.TYPE_LOT, "1", "Lot 1");
                    tree.getArbre().add(currentLot);
                }
                currentSousLot = newGroup(DpgfNoeud.TYPE_SOUS_LOT, row);
                currentLot.getEnfants().add(currentSousLot);
                continue;
            }
            if (!row.looksLikeArticle()) {
                continue;
            }
            ImportNoeudDto article = toArticle(row);
            if (currentSousLot != null) {
                currentSousLot.getEnfants().add(article);
            } else if (currentLot != null) {
                currentLot.getEnfants().add(article);
            } else {
                currentLot = newGroup(DpgfNoeud.TYPE_LOT, "1", "Lot 1");
                tree.getArbre().add(currentLot);
                currentLot.getEnfants().add(article);
            }
        }

        if (tree.getArbre().isEmpty()) {
            tree.getArbre().addAll(flatFallback(parse));
        }
        return tree;
    }

    private List<ImportNoeudDto> flatFallback(BordereauParseResult parse) {
        ImportNoeudDto lot = newGroup(DpgfNoeud.TYPE_LOT, "1", "Bordereau");
        for (BordereauRowCandidate row : parse.articleCandidates()) {
            lot.getEnfants().add(toArticle(row));
        }
        return lot.getEnfants().isEmpty() ? List.of() : List.of(lot);
    }

    private ImportNoeudDto mapGroup(
            JsonNode node,
            String type,
            String defaultLibelle,
            Map<String, BordereauRowCandidate> byId,
            Set<String> assigned) {
        if (node == null || !node.isObject()) {
            return null;
        }
        ImportNoeudDto group = new ImportNoeudDto();
        group.setType(type);
        group.setCode(text(node, "code"));
        String libelle = text(node, "libelle");
        group.setLibelle(StringUtils.hasText(libelle) ? libelle : defaultLibelle);

        if (node.has("children") && node.get("children").isArray()) {
            for (JsonNode child : node.get("children")) {
                ImportNoeudDto sous = mapGroup(
                        child, DpgfNoeud.TYPE_SOUS_LOT, "Sous-lot", byId, assigned);
                if (sous != null) {
                    group.getEnfants().add(sous);
                }
            }
        }
        if (node.has("articleRowIds") && node.get("articleRowIds").isArray()) {
            for (JsonNode idNode : node.get("articleRowIds")) {
                if (idNode == null || !idNode.isTextual()) {
                    continue;
                }
                String rowId = idNode.asText();
                BordereauRowCandidate row = byId.get(rowId);
                if (row == null || !row.looksLikeArticle() || !assigned.add(rowId)) {
                    continue;
                }
                group.getEnfants().add(toArticle(row));
            }
        }
        // Drop empty groups (no children and no useful label).
        if (group.getEnfants().isEmpty() && !StringUtils.hasText(group.getLibelle())) {
            return null;
        }
        return group;
    }

    private static ImportNoeudDto newGroup(String type, BordereauRowCandidate row) {
        return newGroup(type, row.code(), row.libelle());
    }

    private static ImportNoeudDto newGroup(String type, String code, String libelle) {
        ImportNoeudDto group = new ImportNoeudDto();
        group.setType(type);
        group.setCode(code);
        group.setLibelle(StringUtils.hasText(libelle) ? libelle : type);
        group.setEnfants(new ArrayList<>());
        return group;
    }

    private static ImportNoeudDto toArticle(BordereauRowCandidate row) {
        ImportNoeudDto article = new ImportNoeudDto();
        article.setType(DpgfNoeud.TYPE_ARTICLE);
        article.setCode(row.code());
        article.setLibelle(StringUtils.hasText(row.libelle()) ? row.libelle() : "Poste");
        article.setUnite(row.unite());
        article.setQuantite(row.quantite());
        article.setMode(DpgfNoeud.MODE_FOURNI);
        article.setOrdre(row.order());
        return article;
    }

    private static String text(JsonNode node, String field) {
        JsonNode value = node.get(field);
        if (value == null || value.isNull() || !value.isTextual() || value.asText().isBlank()) {
            return null;
        }
        return value.asText().trim();
    }

    /** Compact prompt payload for the LLM classifier. */
    public String buildClassifierPrompt(BordereauParseResult parse) {
        StringBuilder sb = new StringBuilder();
        sb.append("Candidats extraits localement d'un bordereau BTP (")
                .append(parse.pageCount())
                .append(" pages).\n");
        sb.append("Assigne chaque article à un lot / sous-lot. N'invente aucune valeur article.\n\n");

        sb.append("GROUPES détectés :\n");
        for (BordereauRowCandidate g : parse.groupingCandidates()) {
            sb.append("- ").append(g.rowId())
                    .append(" [").append(g.kind()).append("] page=").append(g.page())
                    .append(" code=").append(nullToEmpty(g.code()))
                    .append(" | ").append(nullToEmpty(g.libelle()))
                    .append('\n');
        }

        sb.append("\nARTICLES :\n");
        for (BordereauRowCandidate a : parse.articleCandidates()) {
            sb.append("- ").append(a.rowId())
                    .append(" page=").append(a.page())
                    .append(" code=").append(nullToEmpty(a.code()))
                    .append(" | ").append(nullToEmpty(a.libelle()))
                    .append(" | unite=").append(nullToEmpty(a.unite()))
                    .append(" | qte=").append(a.quantite() != null ? a.quantite().toPlainString() : "")
                    .append('\n');
        }
        return sb.toString();
    }

    private static String nullToEmpty(String value) {
        return value != null ? value : "";
    }
}
