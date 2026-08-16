package ma.nafura.etudes.service.bordereau;

import java.util.ArrayList;
import java.util.HashSet;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Locale;
import java.util.Map;
import java.util.Set;
import ma.nafura.etudes.api.request.ImportNoeudDto;
import ma.nafura.etudes.domain.dpgf.DpgfNoeud;

/**
 * DeepSeek réutilise souvent le même n° pour des variantes (deux compteurs,
 * deux diamètres). Le gate bordereau bloque alors. On suffixe a/b/c dans
 * l'ordre du document.
 */
public final class ArticleCodeUniquifier {

    private ArticleCodeUniquifier() {}

    public static void uniquify(List<ImportNoeudDto> arbre) {
        if (arbre == null || arbre.isEmpty()) {
            return;
        }
        List<ImportNoeudDto> articles = new ArrayList<>();
        collectArticles(arbre, articles);

        Map<String, List<ImportNoeudDto>> byKey = new LinkedHashMap<>();
        Set<String> used = new HashSet<>();
        for (ImportNoeudDto article : articles) {
            String code = article.getCode();
            if (code == null || code.isBlank()) {
                continue;
            }
            String key = code.trim().toUpperCase(Locale.ROOT);
            used.add(key);
            byKey.computeIfAbsent(key, k -> new ArrayList<>()).add(article);
        }

        for (List<ImportNoeudDto> group : byKey.values()) {
            if (group.size() < 2) {
                continue;
            }
            String original = group.get(0).getCode().trim();
            for (ImportNoeudDto article : group) {
                used.remove(article.getCode().trim().toUpperCase(Locale.ROOT));
            }
            int index = 0;
            for (ImportNoeudDto article : group) {
                String next = nextAvailable(original, index++, used);
                article.setCode(next);
                used.add(next.toUpperCase(Locale.ROOT));
            }
        }
    }

    static String nextAvailable(String base, int index, Set<String> used) {
        for (int n = index; n < index + 800; n++) {
            String candidate = base + letterSuffix(n);
            if (!used.contains(candidate.toUpperCase(Locale.ROOT))) {
                return candidate;
            }
        }
        return base + "-" + (index + 1);
    }

    /** 0 → a, 25 → z, 26 → aa. */
    static String letterSuffix(int index) {
        StringBuilder sb = new StringBuilder();
        int n = index;
        while (n >= 0) {
            sb.append((char) ('a' + (n % 26)));
            n = n / 26 - 1;
        }
        return sb.reverse().toString();
    }

    private static void collectArticles(List<ImportNoeudDto> noeuds, List<ImportNoeudDto> out) {
        for (ImportNoeudDto noeud : noeuds) {
            if (noeud == null) {
                continue;
            }
            String type = noeud.getType() != null ? noeud.getType() : DpgfNoeud.TYPE_ARTICLE;
            if (DpgfNoeud.TYPE_ARTICLE.equalsIgnoreCase(type)) {
                out.add(noeud);
            }
            if (noeud.getEnfants() != null && !noeud.getEnfants().isEmpty()) {
                collectArticles(noeud.getEnfants(), out);
            }
        }
    }
}
