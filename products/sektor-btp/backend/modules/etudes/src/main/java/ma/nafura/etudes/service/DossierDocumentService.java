package ma.nafura.etudes.service;

import java.util.List;
import java.util.UUID;
import ma.nafura.etudes.domain.model.DossierDocument;
import ma.nafura.etudes.repository.DossierDocumentRepository;
import ma.nafura.etudes.service.cps.CpsService;
import ma.nafura.platform.framework.context.TenantContext;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.util.StringUtils;

/**
 * Dépôt des pièces du marché — première étape du parcours.
 *
 * <p>Le CPS est indexé immédiatement. Un bordereau déclenche l'extraction → DPGF rattaché au
 * dossier, pour que le gate d'étape 2 puisse s'appuyer sur de vrais articles.
 */
@Service
public class DossierDocumentService {

    private static final Logger log = LoggerFactory.getLogger(DossierDocumentService.class);

    private final DossierDocumentRepository repository;
    private final CpsService cpsService;
    private final BordereauImportService bordereauImportService;

    public DossierDocumentService(
            DossierDocumentRepository repository,
            CpsService cpsService,
            BordereauImportService bordereauImportService) {
        this.repository = repository;
        this.cpsService = cpsService;
        this.bordereauImportService = bordereauImportService;
    }

    @Transactional(readOnly = true)
    public List<DossierDocument> lister(UUID dossierEtudeId) {
        return repository.findByTenantIdAndDossierEtudeIdOrderByOrdreAsc(tenantId(), dossierEtudeId);
    }

    /**
     * Enregistre une pièce ; indexe le CPS et/ou structure le bordereau selon le type.
     *
     * @param documentId référence doc-manager vers l'original déjà stocké
     * @param contenu octets du fichier, pour extraction — l'original n'est pas altéré
     */
    @Transactional
    public DossierDocument deposer(
            UUID dossierEtudeId,
            String documentId,
            String nomFichier,
            String type,
            byte[] contenu,
            String mimeType) {
        UUID tenant = tenantId();
        String typeNormalise = StringUtils.hasText(type)
                ? type.trim().toUpperCase()
                : DossierDocument.TYPE_AUTRE;

        int ordre = (int) repository.countByTenantIdAndDossierEtudeId(tenant, dossierEtudeId);
        DossierDocument piece = repository.save(DossierDocument.builder()
                .tenantId(tenant)
                .dossierEtudeId(dossierEtudeId)
                .documentId(documentId)
                .nomFichier(nomFichier)
                .type(typeNormalise)
                .ordre(ordre)
                .build());

        if (piece.contientCps() && contenu != null && contenu.length > 0) {
            try {
                cpsService.indexer(piece.getId(), contenu);
            } catch (RuntimeException ex) {
                log.warn("Indexation CPS échouée pour pièce {}: {}", piece.getId(), ex.getMessage());
            }
        }

        if (piece.contientBordereau() && contenu != null && contenu.length > 0) {
            try {
                bordereauImportService.importerDepuisFichier(
                        dossierEtudeId, contenu, nomFichier, mimeType, piece.getDocumentId());
            } catch (RuntimeException ex) {
                // Le dépôt reste : le gate bordereau expliquera l'absence d'articles.
                log.warn(
                        "Extraction bordereau échouée pour dossier {} / pièce {}: {}",
                        dossierEtudeId,
                        piece.getId(),
                        ex.getMessage());
            }
        }
        return piece;
    }

    @Transactional
    public void supprimer(UUID documentId) {
        DossierDocument piece = repository
                .findByIdAndTenantId(documentId, tenantId())
                .orElseThrow(() -> new IllegalArgumentException("etudes.document.introuvable"));
        repository.delete(piece);
    }

    private static UUID tenantId() {
        return TenantContext.getTenantId();
    }
}
