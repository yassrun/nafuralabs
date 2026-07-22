package ma.nafura.etudes.service;

import java.io.IOException;
import java.io.InputStream;
import java.time.OffsetDateTime;
import java.util.List;
import java.util.UUID;
import ma.nafura.etudes.domain.model.DossierDocument;
import ma.nafura.etudes.repository.DossierDocumentRepository;
import ma.nafura.platform.collaboration.docmanager.domain.enums.DocumentType;
import ma.nafura.platform.collaboration.docmanager.domain.model.Document;
import ma.nafura.platform.collaboration.docmanager.service.DocumentService;
import ma.nafura.platform.framework.context.TenantContext;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.util.StringUtils;
import org.springframework.web.multipart.MultipartFile;

/**
 * Dépôt des pièces du marché — étape 1 du parcours.
 *
 * <p>Étape 1 = stockage seul (BDP + CPS). Aucune extraction synchrone ici : l'indexation
 * CPS est enqueued en job async au dépôt (contrôleur), l'arbre bordereau se construit à
 * l'étape 2 (manuel ou job async), les descriptifs à la demande pendant la décomposition.
 */
@Service
public class DossierDocumentService {

    private static final Logger log = LoggerFactory.getLogger(DossierDocumentService.class);

    private final DossierDocumentRepository repository;
    private final DocumentService documentService;

    public DossierDocumentService(
            DossierDocumentRepository repository, DocumentService documentService) {
        this.repository = repository;
        this.documentService = documentService;
    }

    @Transactional(readOnly = true)
    public List<DossierDocument> lister(UUID dossierEtudeId) {
        return repository.findByTenantIdAndDossierEtudeIdOrderByOrdreAsc(tenantId(), dossierEtudeId);
    }

    @Transactional(readOnly = true)
    public List<DossierDocument> listerBordereaux(UUID dossierEtudeId) {
        return lister(dossierEtudeId).stream().filter(DossierDocument::contientBordereau).toList();
    }

    /**
     * Stocke le fichier dans doc-manager et enregistre la pièce. Pas d'extraction.
     */
    @Transactional
    public DossierDocument deposer(UUID dossierEtudeId, MultipartFile file, String type) {
        UUID tenant = tenantId();
        String typeNormalise = StringUtils.hasText(type)
                ? type.trim().toUpperCase()
                : DossierDocument.TYPE_AUTRE;

        byte[] contenu;
        try {
            contenu = file.getBytes();
        } catch (IOException e) {
            throw new IllegalArgumentException("etudes.document.lecture_impossible", e);
        }

        Document stored = documentService.uploadDocument(
                tenant,
                contenu,
                file.getOriginalFilename(),
                file.getContentType(),
                DocumentType.OTHER,
                OffsetDateTime.now(),
                null);

        int ordre = (int) repository.countByTenantIdAndDossierEtudeId(tenant, dossierEtudeId);
        return repository.save(DossierDocument.builder()
                .tenantId(tenant)
                .dossierEtudeId(dossierEtudeId)
                .documentId(stored.getId().toString())
                .nomFichier(file.getOriginalFilename())
                .type(typeNormalise)
                .ordre(ordre)
                .build());
    }

    /** Relit les octets de l'original stocké (pour extraction étape 2 / 3). */
    @Transactional(readOnly = true)
    public byte[] chargerContenu(DossierDocument piece) {
        try (InputStream in =
                documentService.downloadDocument(UUID.fromString(piece.getDocumentId()), tenantId())) {
            return in.readAllBytes();
        } catch (IOException e) {
            throw new IllegalStateException("etudes.document.telechargement_impossible", e);
        } catch (RuntimeException e) {
            log.warn("Téléchargement impossible pour documentId={}: {}", piece.getDocumentId(), e.getMessage());
            throw new IllegalStateException("etudes.document.telechargement_impossible", e);
        }
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
