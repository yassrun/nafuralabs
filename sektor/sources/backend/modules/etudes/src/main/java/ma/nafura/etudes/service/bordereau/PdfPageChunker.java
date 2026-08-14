package ma.nafura.etudes.service.bordereau;

import java.io.ByteArrayOutputStream;
import java.io.IOException;
import java.util.ArrayList;
import java.util.List;
import org.apache.pdfbox.Loader;
import org.apache.pdfbox.pdmodel.PDDocument;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Component;

/**
 * Découpe un PDF en sous-documents page-range pour réparation LLM / vision.
 */
@Component
public class PdfPageChunker {

    private static final Logger log = LoggerFactory.getLogger(PdfPageChunker.class);

    public record PageChunk(int startPage, int endPage, byte[] pdfBytes) {}

    /**
     * Construit des chunks contigus à partir de pages faibles, max {@code maxPagesPerChunk}.
     */
    public List<PageChunk> chunksForPages(byte[] pdfBytes, List<Integer> pages, int maxPagesPerChunk) {
        if (pdfBytes == null || pages == null || pages.isEmpty()) {
            return List.of();
        }
        List<Integer> sorted = pages.stream().distinct().sorted().toList();
        List<PageChunk> chunks = new ArrayList<>();
        int i = 0;
        while (i < sorted.size()) {
            int start = sorted.get(i);
            int end = start;
            int count = 1;
            i++;
            while (i < sorted.size() && count < maxPagesPerChunk) {
                int next = sorted.get(i);
                if (next > end + 1 && count >= 1) {
                    // gap — close chunk unless we allow joining nearby pages within +1
                    break;
                }
                if (next > end + 2) {
                    break;
                }
                end = next;
                count++;
                i++;
            }
            // Fill contiguous range start..end for cleaner subset PDF
            byte[] subset = extractPages(pdfBytes, start, end);
            if (subset != null && subset.length > 0) {
                chunks.add(new PageChunk(start, end, subset));
            }
        }
        return chunks;
    }

    public byte[] extractPages(byte[] pdfBytes, int startPageInclusive, int endPageInclusive) {
        if (pdfBytes == null || startPageInclusive < 1 || endPageInclusive < startPageInclusive) {
            return null;
        }
        try (PDDocument source = Loader.loadPDF(pdfBytes);
                PDDocument subset = new PDDocument()) {
            int pages = source.getNumberOfPages();
            int from = Math.min(startPageInclusive, pages);
            int to = Math.min(endPageInclusive, pages);
            for (int p = from; p <= to; p++) {
                subset.importPage(source.getPage(p - 1));
            }
            ByteArrayOutputStream out = new ByteArrayOutputStream();
            subset.save(out);
            return out.toByteArray();
        } catch (IOException | RuntimeException ex) {
            log.warn("Failed to extract PDF pages {}-{}: {}", startPageInclusive, endPageInclusive, ex.getMessage());
            return null;
        }
    }
}
