package ma.nafura.etudes.service.gate;

import java.util.List;
import ma.nafura.etudes.domain.dossier.DossierPieceAttendue;
import ma.nafura.etudes.domain.dpgf.DpgfNoeud;

/**
 * Ce sur quoi une règle d'étape se prononce.
 *
 * @param articles articles du bordereau, déjà filtrés
 * @param noeuds tous les nœuds (lots / sous-lots / articles) pour les contrôles structurels
 * @param nombreDocuments pièces déposées sur le dossier
 * @param hasBordereau au moins une pièce de type bordereau (ou CPS+bordereau)
 * @param hasCps au moins une pièce de type CPS (ou CPS+bordereau)
 * @param piecesAttendues checklist des pièces attendues (peut être vide sur dossiers legacy)
 * @param hasClientId un clientId est renseigné sur le dossier (info ; Partner exigé au devis)
 * @param clientValide the clientId résout un Partner CLIENT du tenant (info ; Partner exigé au devis)
 * @param avisOuverts nombre d'avis OUVERT (L8 — informatif)
 * @param avisEcartes nombre d'avis ECARTE (L8 — informatif)
 * @param devisConsultationRecus nombre de devis consultation reçus (fournisseurs distincts)
 * @param consultationObligatoire paramètre tenant — si faux, la gate 4 reste informative
 * @param consultationMinimum entier ≥ 1 ; ne compte que si obligatoire
 */
public record ContexteGate(
        List<DpgfNoeud> articles,
        List<DpgfNoeud> noeuds,
        long nombreDocuments,
        boolean hasBordereau,
        boolean hasCps,
        List<DossierPieceAttendue> piecesAttendues,
        boolean hasClientId,
        boolean clientValide,
        long avisOuverts,
        long avisEcartes,
        long devisConsultationRecus,
        boolean consultationObligatoire,
        int consultationMinimum) {

    /** Factories de tests : client considéré valide pour ne pas polluer les autres gates. */
    public static ContexteGate deArticles(List<DpgfNoeud> articles) {
        return new ContexteGate(
                articles, articles, 0L, false, false, List.of(), true, true, 0L, 0L, 0L, false, 1);
    }

    public static ContexteGate deNoeuds(List<DpgfNoeud> noeuds) {
        List<DpgfNoeud> articles = noeuds.stream()
                .filter(n -> DpgfNoeud.TYPE_ARTICLE.equals(n.getType()))
                .toList();
        return new ContexteGate(
                articles, noeuds, 0L, false, false, List.of(), true, true, 0L, 0L, 0L, false, 1);
    }

    public static ContexteGate documents(boolean hasBordereau, boolean hasCps) {
        long n = (hasBordereau ? 1 : 0) + (hasCps ? 1 : 0);
        return new ContexteGate(
                List.of(), List.of(), n, hasBordereau, hasCps, List.of(), true, true, 0L, 0L, 0L, false, 1);
    }

    public static ContexteGate documents(
            boolean hasBordereau, boolean hasCps, List<DossierPieceAttendue> piecesAttendues) {
        long n = (hasBordereau ? 1 : 0) + (hasCps ? 1 : 0);
        return new ContexteGate(
                List.of(),
                List.of(),
                n,
                hasBordereau,
                hasCps,
                piecesAttendues != null ? piecesAttendues : List.of(),
                true,
                true,
                0L,
                0L,
                0L,
                false,
                1);
    }

    public static ContexteGate avecClient(
            ContexteGate base, boolean hasClientId, boolean clientValide) {
        return new ContexteGate(
                base.articles(),
                base.noeuds(),
                base.nombreDocuments(),
                base.hasBordereau(),
                base.hasCps(),
                base.piecesAttendues(),
                hasClientId,
                clientValide,
                base.avisOuverts(),
                base.avisEcartes(),
                base.devisConsultationRecus(),
                base.consultationObligatoire(),
                base.consultationMinimum());
    }

    public static ContexteGate avecAvis(ContexteGate base, long ouverts, long ecartes) {
        return new ContexteGate(
                base.articles(),
                base.noeuds(),
                base.nombreDocuments(),
                base.hasBordereau(),
                base.hasCps(),
                base.piecesAttendues(),
                base.hasClientId(),
                base.clientValide(),
                ouverts,
                ecartes,
                base.devisConsultationRecus(),
                base.consultationObligatoire(),
                base.consultationMinimum());
    }

    public static ContexteGate avecConsultation(
            ContexteGate base, long recus, boolean obligatoire, int minimum) {
        return new ContexteGate(
                base.articles(),
                base.noeuds(),
                base.nombreDocuments(),
                base.hasBordereau(),
                base.hasCps(),
                base.piecesAttendues(),
                base.hasClientId(),
                base.clientValide(),
                base.avisOuverts(),
                base.avisEcartes(),
                recus,
                obligatoire,
                minimum);
    }
}
