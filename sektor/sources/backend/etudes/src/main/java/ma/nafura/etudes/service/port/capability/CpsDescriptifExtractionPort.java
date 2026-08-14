package ma.nafura.etudes.service.port.capability;

import java.util.List;

/**
 * Second extraction pass: given an uploaded CPS / CCTP and the postes already
 * present in a DPGF (built by the lighter bordereau pass), extract the
 * technical descriptif of each poste and return it keyed by poste code.
 *
 * <p>Kept separate from {@link BordereauExtractionPort} on purpose: the
 * bordereau pass must stay light and fast, while descriptif extraction is a
 * heavier, on-demand pass over the full CPS body. The real adapter lives in the
 * product app and batches postes so a single LLM call never exceeds its timeout.
 */
public interface CpsDescriptifExtractionPort {

    boolean isAvailable();

    List<DescriptifResult> extractDescriptifs(
            byte[] fileBytes, String fileName, String mimeType, List<PosteRef> postes);

    /** A poste the model must find a descriptif for. */
    record PosteRef(String code, String libelle) {}

    /** A descriptif returned for a poste, matched back by {@code code}. */
    record DescriptifResult(String code, String descriptif) {}
}
