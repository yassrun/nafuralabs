package ma.nafura.etudes.service;

import java.util.ArrayList;
import java.util.List;
import java.util.Locale;
import java.util.UUID;
import ma.nafura.etudes.api.dto.MarcheProposeDto;
import ma.nafura.etudes.api.request.DossierPieceAttendueCreateDto;
import ma.nafura.etudes.api.request.DossierPieceAttendueUpdateDto;
import ma.nafura.etudes.api.request.MarcheProposeApplyDto;
import ma.nafura.etudes.domain.appeloffre.AppelOffreClient;
import ma.nafura.etudes.domain.dossier.DossierDocument;
import ma.nafura.etudes.domain.dossier.DossierEtude;
import ma.nafura.etudes.domain.dossier.DossierPieceAttendue;
import ma.nafura.etudes.repository.AppelOffreClientRepository;
import ma.nafura.etudes.repository.DossierDocumentRepository;
import ma.nafura.etudes.repository.DossierEtudeRepository;
import ma.nafura.etudes.repository.DossierPieceAttendueRepository;
import ma.nafura.platform.framework.context.TenantContext;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.util.StringUtils;

@Service
public class DossierPieceAttendueService {

    private final DossierPieceAttendueRepository repository;
    private final DossierEtudeRepository dossierRepository;
    private final DossierDocumentRepository documentRepository;
    private final AppelOffreClientRepository aocRepository;

    public DossierPieceAttendueService(
            DossierPieceAttendueRepository repository,
            DossierEtudeRepository dossierRepository,
            DossierDocumentRepository documentRepository,
            AppelOffreClientRepository aocRepository) {
        this.repository = repository;
        this.dossierRepository = dossierRepository;
        this.documentRepository = documentRepository;
        this.aocRepository = aocRepository;
    }

    @Transactional
    public List<DossierPieceAttendue> lister(UUID dossierId) {
        requireDossier(dossierId);
        seedMinimalSiAbsent(dossierId);
        return repository.findByTenantIdAndDossierEtudeIdOrderByCreatedAtAsc(tenantId(), dossierId);
    }

    @Transactional
    public void seedMinimalSiAbsent(UUID dossierId) {
        UUID tenant = tenantId();
        requireDossier(dossierId);
        if (!repository.existsByTenantIdAndDossierEtudeIdAndType(
                tenant, dossierId, DossierDocument.TYPE_BORDEREAU)) {
            repository.save(slot(
                    tenant,
                    dossierId,
                    DossierDocument.TYPE_BORDEREAU,
                    "Bordereau des prix",
                    true,
                    DossierPieceAttendue.SOURCE_MANUEL));
        }
        if (!repository.existsByTenantIdAndDossierEtudeIdAndType(
                tenant, dossierId, DossierDocument.TYPE_CPS)) {
            repository.save(slot(
                    tenant,
                    dossierId,
                    DossierDocument.TYPE_CPS,
                    "Cahier des clauses (CPS / CCTP)",
                    true,
                    DossierPieceAttendue.SOURCE_MANUEL));
        }
    }

    @Transactional
    public DossierPieceAttendue creer(UUID dossierId, DossierPieceAttendueCreateDto dto) {
        requireDossier(dossierId);
        String type = dto.getType().trim().toUpperCase(Locale.ROOT);
        if (DossierDocument.TYPE_BORDEREAU.equals(type) || DossierDocument.TYPE_CPS.equals(type)) {
            if (repository.existsByTenantIdAndDossierEtudeIdAndType(tenantId(), dossierId, type)) {
                throw new IllegalArgumentException("etudes.piece_attendue.type_existe");
            }
        }
        return repository.save(slot(
                tenantId(),
                dossierId,
                type,
                dto.getLibelle().trim(),
                dto.getObligatoire() == null || dto.getObligatoire(),
                DossierPieceAttendue.SOURCE_MANUEL));
    }

    @Transactional
    public DossierPieceAttendue update(UUID dossierId, UUID pieceId, DossierPieceAttendueUpdateDto dto) {
        DossierPieceAttendue piece = requirePiece(dossierId, pieceId);
        if (StringUtils.hasText(dto.getLibelle())) {
            piece.setLibelle(dto.getLibelle().trim());
        }
        if (dto.getObligatoire() != null) {
            piece.setObligatoire(dto.getObligatoire());
        }
        return repository.save(piece);
    }

    @Transactional
    public void supprimer(UUID dossierId, UUID pieceId) {
        DossierPieceAttendue piece = requirePiece(dossierId, pieceId);
        String type = piece.getType();
        if (DossierDocument.TYPE_BORDEREAU.equals(type) || DossierDocument.TYPE_CPS.equals(type)) {
            throw new IllegalStateException("etudes.piece_attendue.seed_protege");
        }
        repository.delete(piece);
    }

    @Transactional
    public DossierPieceAttendue lier(UUID dossierId, UUID pieceId, UUID dossierDocumentId) {
        DossierPieceAttendue piece = requirePiece(dossierId, pieceId);
        DossierDocument doc = documentRepository
                .findByIdAndTenantId(dossierDocumentId, tenantId())
                .orElseThrow(() -> new IllegalArgumentException("etudes.document.introuvable"));
        if (!dossierId.equals(doc.getDossierEtudeId())) {
            throw new IllegalArgumentException("etudes.piece_attendue.document_autre_dossier");
        }
        piece.setDossierDocumentId(doc.getId());
        return repository.save(piece);
    }

    /** Après dépôt : rattache le document au slot du même type s'il est encore vide. */
    @Transactional
    public void lierApresDepot(DossierDocument doc) {
        if (doc == null || doc.getId() == null) {
            return;
        }
        UUID tenant = tenantId();
        List<String> types = new ArrayList<>();
        if (doc.contientBordereau()) {
            types.add(DossierDocument.TYPE_BORDEREAU);
        }
        if (doc.contientCps()) {
            types.add(DossierDocument.TYPE_CPS);
        }
        if (types.isEmpty() && StringUtils.hasText(doc.getType())) {
            types.add(doc.getType().trim().toUpperCase(Locale.ROOT));
        }
        for (String type : types) {
            repository
                    .findByTenantIdAndDossierEtudeIdAndType(tenant, doc.getDossierEtudeId(), type)
                    .filter(p -> p.getDossierDocumentId() == null)
                    .ifPresent(p -> {
                        p.setDossierDocumentId(doc.getId());
                        repository.save(p);
                    });
        }
    }

    /** Après suppression document : détache les slots liés. */
    @Transactional
    public void detacherDocument(UUID dossierDocumentId) {
        List<DossierPieceAttendue> lies =
                repository.findByTenantIdAndDossierDocumentId(tenantId(), dossierDocumentId);
        for (DossierPieceAttendue p : lies) {
            p.setDossierDocumentId(null);
            repository.save(p);
        }
    }

    /**
     * Applique une proposition CPS : métadonnées dossier/AOC + upsert pièces sans écraser PJ.
     */
    @Transactional
    public DossierEtude appliquerProposition(UUID dossierId, MarcheProposeApplyDto dto) {
        DossierEtude dossier = requireDossier(dossierId);
        if (!dossier.getStatus().estModifiable()) {
            throw new IllegalStateException("etudes.dossier.verrouille");
        }
        if (dto.getMetadonnees() != null) {
            appliquerMetadonnees(dossier, dto.getMetadonnees());
        }
        if (dto.getPiecesAttendues() != null) {
            for (MarcheProposeDto.PieceProposee prop : dto.getPiecesAttendues()) {
                upsertDepuisIa(dossierId, prop);
            }
        }
        return dossierRepository.save(dossier);
    }

    private void appliquerMetadonnees(DossierEtude dossier, MarcheProposeApplyDto.Metadonnees meta) {
        if (StringUtils.hasText(meta.getObjet())) {
            dossier.setObjet(meta.getObjet().trim());
        }
        if (StringUtils.hasText(meta.getDonneurOrdre()) && !StringUtils.hasText(dossier.getClientId())) {
            dossier.setClientNom(meta.getDonneurOrdre().trim());
        }
        AppelOffreClient aoc = null;
        if (dossier.getAppelOffreClientId() != null) {
            aoc = aocRepository
                    .findByIdAndTenantId(dossier.getAppelOffreClientId(), tenantId())
                    .orElse(null);
        }
        if (aoc == null) {
            return;
        }
        if (StringUtils.hasText(meta.getObjet())) {
            aoc.setObjet(meta.getObjet().trim());
        }
        if (StringUtils.hasText(meta.getReference())) {
            aoc.setReference(meta.getReference().trim());
        }
        if (StringUtils.hasText(meta.getType())) {
            String t = meta.getType().trim().toUpperCase(Locale.ROOT);
            if (AppelOffreClient.TYPE_PUBLIC.equals(t) || AppelOffreClient.TYPE_PRIVE.equals(t)) {
                aoc.setType(t);
            }
        }
        if (meta.getDateLimiteDepot() != null) {
            aoc.setDateLimiteDepot(meta.getDateLimiteDepot());
        }
        if (StringUtils.hasText(meta.getDonneurOrdre())) {
            aoc.setDonneurOrdre(meta.getDonneurOrdre().trim());
        }
        if (meta.getVille() != null) {
            aoc.setVille(StringUtils.hasText(meta.getVille()) ? meta.getVille().trim() : null);
        }
        if (meta.getDelaiExecutionJours() != null) {
            aoc.setDelaiExecutionJours(meta.getDelaiExecutionJours());
        }
        if (meta.getEstimationMoaHt() != null) {
            aoc.setEstimationMoaHt(meta.getEstimationMoaHt());
        }
        if (meta.getDateOuverturePlis() != null) {
            aoc.setDateOuverturePlis(meta.getDateOuverturePlis());
        }
        if (meta.getCautionProvisoire() != null) {
            aoc.setCautionProvisoire(meta.getCautionProvisoire());
        }
        if (meta.getCautionDefinitive() != null) {
            aoc.setCautionDefinitive(meta.getCautionDefinitive());
        }
        aocRepository.save(aoc);
    }

    private void upsertDepuisIa(UUID dossierId, MarcheProposeDto.PieceProposee prop) {
        if (prop == null || !StringUtils.hasText(prop.getType())) {
            return;
        }
        String type = prop.getType().trim().toUpperCase(Locale.ROOT);
        String libelle = StringUtils.hasText(prop.getLibelle())
                ? prop.getLibelle().trim()
                : type;
        repository
                .findByTenantIdAndDossierEtudeIdAndType(tenantId(), dossierId, type)
                .ifPresentOrElse(
                        existing -> {
                            // Ne jamais détacher une PJ déjà jointe.
                            if (!existing.estLiee() && StringUtils.hasText(libelle)) {
                                existing.setLibelle(libelle);
                            }
                            if (!existing.estLiee()) {
                                existing.setObligatoire(prop.isObligatoire());
                            }
                            if (DossierPieceAttendue.SOURCE_IA.equals(existing.getSource())
                                    || !existing.estLiee()) {
                                existing.setSource(DossierPieceAttendue.SOURCE_IA);
                            }
                            repository.save(existing);
                        },
                        () -> repository.save(slot(
                                tenantId(),
                                dossierId,
                                type,
                                libelle,
                                prop.isObligatoire(),
                                DossierPieceAttendue.SOURCE_IA)));
    }

    private static DossierPieceAttendue slot(
            UUID tenant,
            UUID dossierId,
            String type,
            String libelle,
            boolean obligatoire,
            String source) {
        return DossierPieceAttendue.builder()
                .tenantId(tenant)
                .dossierEtudeId(dossierId)
                .type(type)
                .libelle(libelle)
                .obligatoire(obligatoire)
                .source(source)
                .build();
    }

    private DossierEtude requireDossier(UUID dossierId) {
        return dossierRepository
                .findByIdAndTenantId(dossierId, tenantId())
                .orElseThrow(() -> new IllegalArgumentException("etudes.dossier.introuvable"));
    }

    private DossierPieceAttendue requirePiece(UUID dossierId, UUID pieceId) {
        DossierPieceAttendue piece = repository
                .findByIdAndTenantId(pieceId, tenantId())
                .orElseThrow(() -> new IllegalArgumentException("etudes.piece_attendue.introuvable"));
        if (!dossierId.equals(piece.getDossierEtudeId())) {
            throw new IllegalArgumentException("etudes.piece_attendue.introuvable");
        }
        return piece;
    }

    private static UUID tenantId() {
        return TenantContext.getTenantId();
    }
}
