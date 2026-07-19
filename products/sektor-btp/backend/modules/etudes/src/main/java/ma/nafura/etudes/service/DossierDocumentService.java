package ma.nafura.etudes.service;

import java.util.List;
import java.util.UUID;
import ma.nafura.etudes.domain.model.DossierDocument;
import ma.nafura.etudes.domain.model.CpsDocument;
import ma.nafura.etudes.repository.DossierDocumentRepository;
import ma.nafura.etudes.service.cps.CpsService;
import ma.nafura.platform.framework.context.TenantContext;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.util.StringUtils;

/**
 * Depot des pieces du marche — premiere etape du parcours.
 *
 * <p>Le workflow demarre par la : bordereau et CPS arrivent ensemble dans la realite, ils sont
 * deposes ensemble et conserves tels quels. Le CPS est indexe dans la foulee ; le bordereau
 * sera structure a l'etape suivante.
 */
@Service
public class DossierDocumentService {

    private final DossierDocumentRepository repository;
    private final CpsService cpsService;

    public DossierDocumentService(DossierDocumentRepository repository, CpsService cpsService) {
        this.repository = repository;
        this.cpsService = cpsService;
    }

    @Transactional(readOnly = true)
    public List<DossierDocument> lister(UUID dossierEtudeId) {
        return repository.findByTenantIdAndDossierEtudeIdOrderByOrdreAsc(tenantId(), dossierEtudeId);
    }

    /**
     * Enregistre une piece et, si elle contient un CPS, l'indexe immediatement.
     *
     * @param documentId reference doc-manager vers l'original deja stocke
     * @param contenu octets du fichier, pour l'extraction — l'original n'est pas altere
     */
    @Transactional
    public DossierDocument deposer(
            UUID dossierEtudeId, String documentId, String nomFichier, String type, byte[] contenu) {
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
            // L'indexation ne doit pas faire echouer le depot : un CPS illisible est conserve,
            // seule la recherche automatique est indisponible.
            try {
                cpsService.indexer(piece.getId(), contenu);
            } catch (RuntimeException ignored) {
                // statut porte par CpsDocument ; le fichier reste consultable
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
