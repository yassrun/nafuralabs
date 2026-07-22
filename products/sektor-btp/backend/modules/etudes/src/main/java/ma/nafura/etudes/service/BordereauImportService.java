package ma.nafura.etudes.service;

import java.math.BigDecimal;
import java.util.List;
import java.util.UUID;
import ma.nafura.etudes.api.request.ImportNoeudDto;
import ma.nafura.etudes.api.request.ImportTreeRequest;
import ma.nafura.etudes.api.response.BordereauValidationResult;
import ma.nafura.etudes.domain.model.DossierDocument;
import ma.nafura.etudes.domain.model.DossierEtude;
import ma.nafura.etudes.domain.model.Dpgf;
import ma.nafura.etudes.repository.DossierEtudeRepository;
import ma.nafura.etudes.service.port.BordereauExtractionPort;
import ma.nafura.platform.framework.context.TenantContext;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.util.StringUtils;

/**
 * Étape 2 — construction du bordereau.
 *
 * <p>Mode auto : prévisualisation (sans persistance) puis validation explicite. Mode manuel :
 * DPGF vide + édition nœuds.
 */
@Service
public class BordereauImportService {

    private final BordereauExtractionPort extractionPort;
    private final DpgfService dpgfService;
    private final DossierEtudeRepository dossierRepository;
    private final DossierDocumentService documentService;
    private final ParametresEtudeService parametres;

    public BordereauImportService(
            BordereauExtractionPort extractionPort,
            DpgfService dpgfService,
            DossierEtudeRepository dossierRepository,
            DossierDocumentService documentService,
            ParametresEtudeService parametres) {
        this.extractionPort = extractionPort;
        this.dpgfService = dpgfService;
        this.dossierRepository = dossierRepository;
        this.documentService = documentService;
        this.parametres = parametres;
    }

    /**
     * Extraction LLM sans persistance — pour revue utilisateur avant validation.
     */
    @Transactional(readOnly = true)
    public ImportTreeRequest previsualiserDepuisPiece(UUID dossierId, UUID pieceId) {
        return extraireArbre(dossierId, pieceId).arbre();
    }

    /**
     * Persiste un arbre déjà revu (remplace le DPGF existant du dossier si présent).
     *
     * @param pieceId optionnel — pour mémoriser le document source
     */
    @Transactional
    public BordereauValidationResult validerImport(UUID dossierId, ImportTreeRequest arbre, UUID pieceId) {
        DossierEtude dossier = requireDossier(dossierId);
        String documentId = null;
        if (pieceId != null) {
            DossierDocument piece = documentService.lister(dossierId).stream()
                    .filter(p -> p.getId().equals(pieceId))
                    .findFirst()
                    .orElseThrow(() -> new IllegalArgumentException("etudes.document.introuvable"));
            documentId = piece.getDocumentId();
        }
        return rattacherArbre(dossier, arbre, documentId);
    }

    /**
     * Extraction + persistance immédiate (compat). Préférer prévisualiser → valider.
     */
    @Transactional
    public Dpgf extraireDepuisPiece(UUID dossierId, UUID pieceId) {
        ExtractionBrute brute = extraireArbre(dossierId, pieceId);
        BordereauValidationResult result =
                rattacherArbre(brute.dossier(), brute.arbre(), brute.piece().getDocumentId());
        return dpgfService.getArbre(result.dpgfId());
    }

    @Transactional
    public Dpgf extraireDepuisDocumentsStockes(UUID dossierId) {
        List<DossierDocument> bordereaux = documentService.listerBordereaux(dossierId);
        if (bordereaux.isEmpty()) {
            throw new IllegalArgumentException("etudes.bordereau.aucune_piece_stockee");
        }
        return extraireDepuisPiece(dossierId, bordereaux.get(0).getId());
    }

    @Transactional
    public Dpgf assurerBordereauManuel(UUID dossierId) {
        DossierEtude dossier = requireDossier(dossierId);
        if (dossier.getDpgfId() != null) {
            return dpgfService.getArbre(dossier.getDpgfId());
        }
        BigDecimal tva = dossier.getTvaTauxDefaut() != null
                ? dossier.getTvaTauxDefaut()
                : parametres.tvaTauxDefaut();
        Dpgf dpgf = dpgfService.createEmpty(dossier.getObjet(), tva);
        dossier.setDpgfId(dpgf.getId());
        dossierRepository.save(dossier);
        return dpgf;
    }

    private ExtractionBrute extraireArbre(UUID dossierId, UUID pieceId) {
        if (!extractionPort.isAvailable()) {
            throw new IllegalStateException("etudes.bordereau.extraction_indisponible");
        }

        DossierEtude dossier = requireDossier(dossierId);
        DossierDocument piece = documentService.lister(dossierId).stream()
                .filter(p -> p.getId().equals(pieceId))
                .findFirst()
                .orElseThrow(() -> new IllegalArgumentException("etudes.document.introuvable"));

        if (!piece.contientBordereau()) {
            throw new IllegalArgumentException("etudes.bordereau.piece_sans_bordereau");
        }

        byte[] contenu = documentService.chargerContenu(piece);
        String mime = guessMime(piece.getNomFichier());
        ImportTreeRequest arbre = extractionPort.extract(contenu, piece.getNomFichier(), mime);
        if (arbre == null || arbre.getArbre() == null || arbre.getArbre().isEmpty()) {
            throw new IllegalArgumentException("etudes.bordereau.arbre_vide");
        }
        return new ExtractionBrute(dossier, piece, arbre);
    }

    private BordereauValidationResult rattacherArbre(
            DossierEtude dossier, ImportTreeRequest arbre, String documentId) {
        BigDecimal tva = dossier.getTvaTauxDefaut() != null
                ? dossier.getTvaTauxDefaut()
                : parametres.tvaTauxDefaut();

        DpgfService.ImportResult imported;
        if (dossier.getDpgfId() == null) {
            imported = dpgfService.createFromImport(arbre, dossier.getObjet(), tva);
            dossier.setDpgfId(imported.dpgf().getId());
        } else {
            imported = dpgfService.remplacerParImport(dossier.getDpgfId(), arbre);
        }

        if (StringUtils.hasText(documentId)) {
            dossier.setBordereauDocumentId(documentId);
        }
        dossierRepository.save(dossier);
        return new BordereauValidationResult(
                imported.dpgf().getId(),
                imported.dpgf().getNumero(),
                imported.articlesAcceptes(),
                imported.articlesIgnores());
    }

    private DossierEtude requireDossier(UUID dossierId) {
        return dossierRepository
                .findByIdAndTenantId(dossierId, tenantId())
                .orElseThrow(() -> new IllegalArgumentException("etudes.dossier.introuvable"));
    }

    /** Compte les nœuds ARTICLE (aperçu UI) — y compris sans unité/qté. */
    public static int compterArticles(List<ImportNoeudDto> noeuds) {
        if (noeuds == null) {
            return 0;
        }
        int n = 0;
        for (ImportNoeudDto noeud : noeuds) {
            if (noeud == null) {
                continue;
            }
            String type = noeud.getType() != null ? noeud.getType().trim().toUpperCase() : "ARTICLE";
            if ("ARTICLE".equals(type)) {
                n++;
            }
            n += compterArticles(noeud.getEnfants());
        }
        return n;
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

    private record ExtractionBrute(DossierEtude dossier, DossierDocument piece, ImportTreeRequest arbre) {}
}
