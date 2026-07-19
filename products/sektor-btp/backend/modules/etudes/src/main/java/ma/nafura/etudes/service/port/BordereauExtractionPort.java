package ma.nafura.etudes.service.port;

/**
 * Extraction bordereau → arbre. Conservé en NoOp dans etudes.
 * Les adaptateurs app (doc-extractor) restent branchés sur le port consultation
 * tant que {@code ImportTreeRequest} n'a pas migré (lot 8 / lot 3).
 */
public interface BordereauExtractionPort {

    boolean isAvailable();
}
