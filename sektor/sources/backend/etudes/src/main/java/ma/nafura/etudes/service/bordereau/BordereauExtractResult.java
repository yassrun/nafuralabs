package ma.nafura.etudes.service.bordereau;

import ma.nafura.etudes.api.request.ImportTreeRequest;

/**
 * Résultat d'une extraction : arbre + diagnostics du <em>même</em> appel.
 * Pas d'état partagé sur l'orchestrateur.
 */
public record BordereauExtractResult(
        ImportTreeRequest tree, BordereauExtractionDiagnostics diagnostics) {

    public BordereauExtractResult {
        tree = tree == null ? new ImportTreeRequest() : tree;
        diagnostics = diagnostics == null ? BordereauExtractionDiagnostics.empty() : diagnostics;
    }
}
