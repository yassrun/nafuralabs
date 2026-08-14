package ma.nafura.etudes.service.port;

import ma.nafura.etudes.domain.dpgf.DpgfNoeud;

/**
 * Résout le descriptif technique d'un ARTICLE depuis le CPS.
 * v1 = No-Op ; adaptateur futur (RAG).
 */
public interface DescriptifResolverPort {

    boolean isAvailable();

    String resolveDescriptif(DpgfNoeud article);
}
