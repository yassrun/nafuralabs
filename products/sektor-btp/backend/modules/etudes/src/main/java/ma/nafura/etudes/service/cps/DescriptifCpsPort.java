package ma.nafura.etudes.service.cps;

import java.util.List;
import java.util.Optional;
import ma.nafura.etudes.domain.model.CpsSection;
import ma.nafura.etudes.domain.model.DpgfNoeud;

/**
 * Redige le descriptif technique d'un article a partir des sections du CPS deja retrouvees.
 *
 * <p>C'est le SEUL point du parcours CPS qui consomme des tokens. La recherche est faite en
 * amont par Postgres ({@code tsvector}) et ne coute rien ; le modele ne voit que les quelques
 * sections retenues, jamais le CPS entier. C'est ce qui fait passer le cout d'un CPS complet
 * par article a quelques milliers de tokens.
 *
 * <p>Contrat impose a toute implementation : la suggestion n'est <b>jamais</b> persistee
 * directement. Elle est proposee, l'utilisateur valide, et la validation est tracee
 * ({@code descriptifSource}, {@code descriptifSuggereParIa}, section d'origine).
 */
public interface DescriptifCpsPort {

    /** Faux tant qu'aucune implementation n'est cablee : l'UI masque alors l'action. */
    boolean isAvailable();

    /**
     * @param article article a decrire
     * @param sections sections candidates, deja classees par pertinence
     * @return descriptif propose, ou vide si les sections ne permettent pas de conclure
     */
    Optional<DescriptifPropose> proposer(DpgfNoeud article, List<CpsSection> sections);

    /**
     * @param texte le descriptif redige
     * @param sectionSourceId la section dont il est tire — sert au bouton « voir dans le CPS »
     * @param confiance 0..1, pour signaler une proposition fragile plutot que la masquer
     */
    record DescriptifPropose(String texte, java.util.UUID sectionSourceId, double confiance) {}
}
