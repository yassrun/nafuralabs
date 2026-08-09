package ma.nafura.etudes.service.bordereau;

import java.util.ArrayList;
import java.util.Comparator;
import java.util.LinkedHashMap;
import java.util.LinkedHashSet;
import java.util.List;
import java.util.Map;
import java.util.Set;
import org.springframework.stereotype.Component;

/**
 * Fusionne et déduplique des candidats multi-sources (PDFBox + réparation LLM / vision).
 */
@Component
public class BordereauCandidateMerger {

    public BordereauParseResult merge(BordereauParseResult base, List<BordereauRowCandidate> extras) {
        if (base == null) {
            return BordereauParseResult.failed("null_base");
        }
        if (extras == null || extras.isEmpty()) {
            return dedupe(base);
        }
        List<BordereauRowCandidate> combined = new ArrayList<>(base.rows());
        combined.addAll(extras);
        BordereauParseResult merged = new BordereauParseResult(
                base.pageCount(),
                base.textDensityPerPage(),
                combined,
                unionPages(base.pagesWithCandidates(), extras),
                base.quality(),
                base.rejectReason());
        return dedupe(merged);
    }

    public BordereauParseResult dedupe(BordereauParseResult parse) {
        if (parse == null || parse.rows().isEmpty()) {
            return parse;
        }
        Map<String, BordereauRowCandidate> byId = new LinkedHashMap<>();
        Map<String, BordereauRowCandidate> byKey = new LinkedHashMap<>();
        Map<String, BordereauRowCandidate> byCode = new LinkedHashMap<>();

        List<BordereauRowCandidate> sorted = new ArrayList<>(parse.rows());
        sorted.sort(Comparator
                .comparingInt(BordereauRowCandidate::page)
                .thenComparingInt(BordereauRowCandidate::order)
                .thenComparing(BordereauRowCandidate::rowId, Comparator.nullsLast(String::compareTo)));

        List<BordereauRowCandidate> out = new ArrayList<>();
        for (BordereauRowCandidate row : sorted) {
            if (row == null || row.rowId() == null) {
                continue;
            }
            if (byId.containsKey(row.rowId())) {
                BordereauRowCandidate merged = byId.get(row.rowId()).mergePreferringLocal(row);
                byId.put(row.rowId(), merged);
                replaceInList(out, row.rowId(), merged);
                continue;
            }
            if (row.looksLikeArticle()) {
                String key = row.dedupeKey();
                String codeKey = codeDedupeKey(row);
                BordereauRowCandidate existing = null;
                if (byKey.containsKey(key)) {
                    existing = byKey.get(key);
                } else if (codeKey != null && byCode.containsKey(codeKey)) {
                    existing = byCode.get(codeKey);
                }
                if (existing != null) {
                    BordereauRowCandidate merged = existing.mergePreferringLocal(row);
                    byKey.remove(existing.dedupeKey());
                    byKey.put(merged.dedupeKey(), merged);
                    String codeKeyMerged = codeDedupeKey(merged);
                    if (codeKeyMerged != null) {
                        byCode.put(codeKeyMerged, merged);
                    }
                    byId.put(existing.rowId(), merged);
                    replaceInList(out, existing.rowId(), merged);
                    continue;
                }
                byKey.put(key, row);
                if (codeKey != null) {
                    byCode.put(codeKey, row);
                }
            }
            byId.put(row.rowId(), row);
            out.add(row);
        }

        Set<Integer> pages = new LinkedHashSet<>();
        for (BordereauRowCandidate row : out) {
            if (row.looksLikeArticle()) {
                pages.add(row.page());
            }
        }
        BordereauParseResult.Quality quality = parse.quality();
        if (!out.isEmpty() && quality == BordereauParseResult.Quality.INSUFFICIENT
                && out.stream().anyMatch(BordereauRowCandidate::looksLikeArticle)) {
            quality = BordereauParseResult.Quality.USABLE;
        }
        return new BordereauParseResult(
                parse.pageCount(),
                parse.textDensityPerPage(),
                List.copyOf(out),
                Set.copyOf(pages),
                quality,
                parse.rejectReason());
    }

    /** Same article code on same page → merge even if libellés diverge (truncated vs full). */
    private static String codeDedupeKey(BordereauRowCandidate row) {
        if (row == null || row.code() == null || row.code().isBlank()) {
            return null;
        }
        String c = row.code().trim().toUpperCase().replaceAll("\\s+", "");
        if (c.length() < 2) {
            return null;
        }
        return row.page() + "|" + c;
    }

    private static void replaceInList(
            List<BordereauRowCandidate> list, String rowId, BordereauRowCandidate replacement) {
        for (int i = 0; i < list.size(); i++) {
            if (rowId.equals(list.get(i).rowId())) {
                list.set(i, replacement);
                return;
            }
        }
        list.add(replacement);
    }

    private static Set<Integer> unionPages(
            Set<Integer> base, List<BordereauRowCandidate> extras) {
        Set<Integer> pages = new LinkedHashSet<>();
        if (base != null) {
            pages.addAll(base);
        }
        if (extras != null) {
            for (BordereauRowCandidate row : extras) {
                if (row != null && row.looksLikeArticle()) {
                    pages.add(row.page());
                }
            }
        }
        return pages;
    }
}
