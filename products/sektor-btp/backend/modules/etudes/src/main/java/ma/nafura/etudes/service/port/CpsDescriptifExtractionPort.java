package ma.nafura.etudes.service.port;

import java.util.List;

/**
 * Extraction descriptifs CPS. Ancrage IA dans etudes (NoOp).
 * Adaptateur app reste sur le port consultation jusqu'à migration ImportTree (lot 8).
 */
public interface CpsDescriptifExtractionPort {

    boolean isAvailable();

    record PosteRef(String code, String libelle) {}

    record DescriptifResult(String code, String descriptif) {}

    List<DescriptifResult> extractDescriptifs(
            byte[] fileBytes, String fileName, String mimeType, List<PosteRef> postes);
}
