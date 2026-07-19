package ma.nafura.erp.consultation;

import com.fasterxml.jackson.databind.JsonNode;
import java.util.ArrayList;
import java.util.List;
import ma.nafura.consultation.service.port.CpsDescriptifExtractionPort;
import ma.nafura.platform.documents.docextractor.api.response.StatelessExtractionResponse;
import ma.nafura.platform.documents.docextractor.service.StatelessExtractionService;
import ma.nafura.platform.framework.context.TenantContext;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.context.annotation.Primary;
import org.springframework.stereotype.Component;

/**
 * Second extraction pass (CPS / CCTP descriptifs). The bordereau pass already
 * built the poste tree; this adapter re-reads the (long, prose) CPS to pull the
 * technical descriptif of each poste.
 *
 * <p>To stay under the LLM per-call timeout on 80-90 page CPS documents, postes
 * are processed in small batches: each call asks only for the descriptifs of the
 * postes in the batch, so both processing time and output size stay bounded.
 * Presence of this bean disables the No-Op default ({@code @Primary}).
 */
@Component
@Primary
public class DocExtractorCpsDescriptifAdapter implements CpsDescriptifExtractionPort {

    private static final Logger log = LoggerFactory.getLogger(DocExtractorCpsDescriptifAdapter.class);

    /** Small enough that one LLM call over the full CPS stays well under the 120s cap. */
    private static final int BATCH_SIZE = 8;

    private static final String RESPONSE_SCHEMA = """
            {
              "type": "object",
              "properties": {
                "postes": {
                  "type": "array",
                  "items": {
                    "type": "object",
                    "properties": {
                      "code": { "type": "string" },
                      "descriptif": { "type": "string" }
                    },
                    "required": ["code"]
                  }
                }
              },
              "required": ["postes"]
            }
            """;

    private final StatelessExtractionService extractionService;

    public DocExtractorCpsDescriptifAdapter(StatelessExtractionService extractionService) {
        this.extractionService = extractionService;
    }

    @Override
    public boolean isAvailable() {
        return true;
    }

    @Override
    public List<DescriptifResult> extractDescriptifs(
            byte[] fileBytes, String fileName, String mimeType, List<PosteRef> postes) {
        String tenantId = TenantContext.getTenantId() != null ? TenantContext.getTenantId().toString() : null;
        List<DescriptifResult> results = new ArrayList<>();
        int batchCount = (postes.size() + BATCH_SIZE - 1) / BATCH_SIZE;
        log.info("CPS descriptif extraction start: file='{}' ({} bytes, {}), {} postes, {} batches of {}",
                fileName, fileBytes != null ? fileBytes.length : 0, mimeType, postes.size(), batchCount, BATCH_SIZE);

        int batchIndex = 0;
        for (int start = 0; start < postes.size(); start += BATCH_SIZE) {
            batchIndex++;
            List<PosteRef> batch = postes.subList(start, Math.min(start + BATCH_SIZE, postes.size()));
            long t0 = System.currentTimeMillis();
            try {
                List<DescriptifResult> found = extractBatch(fileBytes, fileName, mimeType, batch, tenantId);
                results.addAll(found);
                log.info("CPS descriptif batch {}/{} [{} postes] → {} descriptifs in {} ms",
                        batchIndex, batchCount, batch.size(), found.size(), System.currentTimeMillis() - t0);
            } catch (RuntimeException ex) {
                // One failed batch must not lose the descriptifs already collected.
                log.warn("CPS descriptif batch {}/{} [{} postes] FAILED after {} ms: {}",
                        batchIndex, batchCount, batch.size(), System.currentTimeMillis() - t0, ex.getMessage());
            }
        }
        log.info("CPS descriptif extraction done: {} descriptifs returned for {} postes", results.size(), postes.size());
        return results;
    }

    private List<DescriptifResult> extractBatch(
            byte[] fileBytes, String fileName, String mimeType, List<PosteRef> batch, String tenantId) {
        StatelessExtractionResponse response = extractionService.process(
                fileBytes, fileName, mimeType, RESPONSE_SCHEMA, null, buildInstructions(batch), tenantId);

        if (response.outcome() == StatelessExtractionResponse.Outcome.REJECTED
                || response.outcome() == StatelessExtractionResponse.Outcome.TECHNICAL_FAILURE) {
            throw new IllegalStateException("CPS_DESCRIPTIF_EXTRACTION_FAILED: " + response.outcome());
        }
        log.debug("CPS descriptif batch outcome={} data={}",
                response.outcome(), response.data() != null ? "present" : "null");
        return parse(response.data());
    }

    private String buildInstructions(List<PosteRef> batch) {
        StringBuilder sb = new StringBuilder();
        sb.append("Ce document est un CPS / CCTP de marché BTP contenant les descriptifs ")
          .append("techniques des ouvrages (sections « DESCRIPTION DES OUVRAGES »).\n")
          .append("Pour CHACUN des postes ci-dessous, retrouve dans le document son descriptif ")
          .append("technique et recopie-le VERBATIM (sans le résumer) dans le champ \"descriptif\", ")
          .append("avec le même \"code\" que celui fourni.\n")
          .append("Fais la correspondance par numéro de poste — les séparateurs peuvent différer ")
          .append("(ex. « 1.1.3 » dans le CPS = « 1-1-3 » ici) — et/ou par libellé.\n")
          .append("Le descriptif contient des éléments essentiels au chiffrage : type et dosage de ")
          .append("béton, armatures, normes (NM, DTU), mode de mise en œuvre, tolérances.\n")
          .append("Si un poste est introuvable, laisse son \"descriptif\" vide. N'invente rien.\n\n")
          .append("Postes à traiter :\n");
        for (PosteRef poste : batch) {
            sb.append("- code=").append(poste.code() != null ? poste.code() : "?")
              .append(" | ").append(poste.libelle() != null ? poste.libelle() : "")
              .append('\n');
        }
        return sb.toString();
    }

    private List<DescriptifResult> parse(JsonNode data) {
        List<DescriptifResult> out = new ArrayList<>();
        if (data == null || !data.has("postes") || !data.get("postes").isArray()) {
            return out;
        }
        for (JsonNode node : data.get("postes")) {
            JsonNode codeNode = node.get("code");
            JsonNode descNode = node.get("descriptif");
            if (codeNode == null || !codeNode.isTextual() || codeNode.asText().isBlank()) {
                continue;
            }
            String descriptif = descNode != null && descNode.isTextual() ? descNode.asText().trim() : null;
            if (descriptif == null || descriptif.isBlank()) {
                continue;
            }
            out.add(new DescriptifResult(codeNode.asText().trim(), descriptif));
        }
        return out;
    }
}
