package ma.nafura.etudes.service.bordereau;

import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;

/**
 * Diagnostics rétrocompatibles attachés au résultat d'extraction (job result_json).
 */
public record BordereauExtractionDiagnostics(
        String strategy,
        String path,
        double qualityScore,
        int pagesProcessed,
        int repairedChunks,
        int articleCount,
        int pricedCount,
        List<String> warnings,
        long parseMs,
        long classifyMs,
        long repairMs,
        Double costUsd
) {
    public static BordereauExtractionDiagnostics empty() {
        return new BordereauExtractionDiagnostics(
                "none", "none", 0, 0, 0, 0, 0, List.of(), 0, 0, 0, null);
    }

    public Map<String, Object> toMap() {
        Map<String, Object> map = new LinkedHashMap<>();
        map.put("strategy", strategy);
        map.put("path", path);
        map.put("qualityScore", qualityScore);
        map.put("pagesProcessed", pagesProcessed);
        map.put("repairedChunks", repairedChunks);
        map.put("articleCount", articleCount);
        map.put("pricedCount", pricedCount);
        map.put("warnings", warnings);
        map.put("parseMs", parseMs);
        map.put("classifyMs", classifyMs);
        map.put("repairMs", repairMs);
        if (costUsd != null) {
            map.put("costUsd", costUsd);
        }
        return map;
    }
}
