package ma.nafura.etudes.service;

import java.math.BigDecimal;
import java.util.UUID;
import ma.nafura.etudes.api.request.ImportTreeRequest;
import ma.nafura.etudes.domain.model.DossierEtude;
import ma.nafura.etudes.domain.model.Dpgf;
import ma.nafura.etudes.repository.DossierEtudeRepository;
import ma.nafura.etudes.service.port.BordereauExtractionPort;
import ma.nafura.platform.framework.context.TenantContext;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.util.StringUtils;

/**
 * Structure le bordereau d'un dossier à partir d'un fichier déposé.
 *
 * <p>v1 : premier import (ou remplacement intégral). Le diff non destructif du lot 3 viendra
 * ensuite — ici l'objectif est que le gate étape 2 puisse passer après un dépôt.
 */
@Service
public class BordereauImportService {

    private final BordereauExtractionPort extractionPort;
    private final DpgfService dpgfService;
    private final DossierEtudeRepository dossierRepository;
    private final ParametresEtudeService parametres;

    public BordereauImportService(
            BordereauExtractionPort extractionPort,
            DpgfService dpgfService,
            DossierEtudeRepository dossierRepository,
            ParametresEtudeService parametres) {
        this.extractionPort = extractionPort;
        this.dpgfService = dpgfService;
        this.dossierRepository = dossierRepository;
        this.parametres = parametres;
    }

    @Transactional
    public Dpgf importerDepuisFichier(
            UUID dossierId, byte[] contenu, String nomFichier, String mimeType, String documentId) {
        if (!extractionPort.isAvailable()) {
            throw new IllegalStateException("etudes.bordereau.extraction_indisponible");
        }
        if (contenu == null || contenu.length == 0) {
            throw new IllegalArgumentException("etudes.bordereau.fichier_vide");
        }

        DossierEtude dossier = dossierRepository
                .findByIdAndTenantId(dossierId, tenantId())
                .orElseThrow(() -> new IllegalArgumentException("etudes.dossier.introuvable"));

        String mime = StringUtils.hasText(mimeType) ? mimeType : guessMime(nomFichier);
        ImportTreeRequest arbre = extractionPort.extract(contenu, nomFichier, mime);

        BigDecimal tva = dossier.getTvaTauxDefaut() != null
                ? dossier.getTvaTauxDefaut()
                : parametres.tvaTauxDefaut();

        Dpgf dpgf;
        if (dossier.getDpgfId() == null) {
            dpgf = dpgfService.createFromImport(arbre, dossier.getObjet(), tva);
            dossier.setDpgfId(dpgf.getId());
        } else {
            dpgf = dpgfService.remplacerParImport(dossier.getDpgfId(), arbre);
        }

        if (StringUtils.hasText(documentId)) {
            dossier.setBordereauDocumentId(documentId);
        }
        dossierRepository.save(dossier);
        return dpgf;
    }

    private static String guessMime(String nomFichier) {
        if (nomFichier == null) {
            return "application/octet-stream";
        }
        String lower = nomFichier.toLowerCase();
        if (lower.endsWith(".pdf")) {
            return "application/pdf";
        }
        if (lower.endsWith(".xlsx")) {
            return "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet";
        }
        if (lower.endsWith(".xls")) {
            return "application/vnd.ms-excel";
        }
        if (lower.endsWith(".csv")) {
            return "text/csv";
        }
        return "application/octet-stream";
    }

    private static UUID tenantId() {
        return TenantContext.getTenantId();
    }
}
