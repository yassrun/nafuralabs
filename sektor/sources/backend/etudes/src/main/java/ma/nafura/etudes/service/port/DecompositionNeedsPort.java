package ma.nafura.etudes.service.port;

import java.util.List;
import ma.nafura.etudes.domain.cps.CpsSection;
import ma.nafura.etudes.domain.dpgf.DpgfNoeud;

/**
 * Extrait des besoins de composants structurés depuis l'article et les sections CPS.
 * Ne résout jamais le catalogue — c'est le rôle de {@code DecompositionProposeService}.
 */
public interface DecompositionNeedsPort {

    boolean isAvailable();

    List<BesoinComposant> extract(DpgfNoeud article, List<CpsSection> sections);

    record BesoinComposant(
            String designation,
            String type,
            String unite,
            double rendement,
            double confiance) {}
}
