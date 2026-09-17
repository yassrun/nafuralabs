package ma.nafura.chantiers.service;

import java.util.ArrayList;
import java.util.List;
import ma.nafura.chantiers.domain.chantier.Chantier;

/**
 * P1-5 — règle unique de préparation/démarrage, partagée par la checklist du cockpit
 * ({@code CockpitChantierService.preparation}) et la commande de démarrage
 * ({@code ChantierService.demarrerAvecOs}). Aucune contradiction possible : les deux
 * consomment exactement cette liste de codes bloquants (hors OS).
 *
 * <ul>
 *   <li>{@code reference_vente} ne bloque que si le chantier est issu d'étude
 *       ({@code sourceVente == DEVIS}) — en création directe il est {@code NON_APPLICABLE}
 *       (AC-17) ;</li>
 *   <li>{@code budget_initial} bloque dans tous les cas (déboursé initial absent) ;</li>
 *   <li>{@code delai_execution} exige un délai d'exécution retenu au cadrage ;</li>
 *   <li>{@code dates_prevues} exige une fin <b>strictement postérieure</b> au début (AC-5) et,
 *       quand un délai est retenu, une fin égale au début plus ce délai.</li>
 * </ul>
 */
public final class PreparationRegles {

    private PreparationRegles() {}

    public static List<String> bloquants(
            Chantier chantier, long nbLots, boolean aConducteur, boolean aChefChantier) {
        List<String> out = new ArrayList<>();
        if (chantier.getClientId() == null || chantier.getClientName() == null) {
            out.add("identite_client");
        }
        boolean issuEtude = "DEVIS".equals(chantier.getSourceVente());
        if (issuEtude
                && (chantier.getDevisId() == null || chantier.getMontantVenteInitialHt() == null)) {
            out.add("reference_vente");
        }
        if (nbLots == 0) {
            out.add("arbre");
        }
        if (chantier.getDebourseInitialHt() == null) {
            out.add("budget_initial");
        }
        if (!aConducteur || !aChefChantier) {
            out.add("responsables");
        }
        Integer delai = chantier.getDureeMois();
        if (delai == null || delai <= 0) {
            out.add("delai_execution");
        }
        boolean datesManquantes = chantier.getDateDemarrage() == null || chantier.getDateFinPrevue() == null;
        boolean datesIncoherentes = !datesManquantes
                && !chantier.getDateFinPrevue().isAfter(chantier.getDateDemarrage());
        if (!datesManquantes && delai != null && delai > 0) {
            datesIncoherentes = datesIncoherentes
                    || !chantier.getDateFinPrevue().equals(chantier.getDateDemarrage().plusMonths(delai));
        }
        if (datesManquantes || datesIncoherentes) {
            out.add("dates_prevues");
        }
        return out;
    }
}
