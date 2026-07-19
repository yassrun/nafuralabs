package ma.nafura.consultation.service.port;

import ma.nafura.consultation.domain.model.ConsultationNoeud;

/**
 * Resolves the technical descriptif of a POSTE from the CPS. v1 default is a
 * No-Op (expert types it); a future adapter uses RAG over the chunked CPS so
 * the full document is never sent to the LLM.
 */
public interface DescriptifResolverPort {

    boolean isAvailable();

    String resolveDescriptif(ConsultationNoeud poste);
}
