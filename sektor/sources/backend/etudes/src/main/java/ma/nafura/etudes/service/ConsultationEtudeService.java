package ma.nafura.etudes.service;

import java.math.BigDecimal;
import java.time.OffsetDateTime;
import java.util.ArrayList;
import java.util.LinkedHashMap;
import java.util.LinkedHashSet;
import java.util.List;
import java.util.Locale;
import java.util.Map;
import java.util.Set;
import java.util.UUID;
import ma.nafura.achats.api.request.CatalogueFournisseurLigneCreateDto;
import ma.nafura.achats.domain.contrat.CatalogueSource;
import ma.nafura.achats.service.CatalogueFournisseurLigneService;
import ma.nafura.achats.service.ConsultationAchatService;
import ma.nafura.catalogue.api.CatalogItemSnapshot;
import ma.nafura.catalogue.api.CatalogLookupApi;
import ma.nafura.etudes.api.dto.ConsultationEtudeDto;
import ma.nafura.etudes.api.request.ConsultationEtudeOpenDto;
import ma.nafura.etudes.api.request.ConsultationIdentifierDto;
import ma.nafura.etudes.api.request.ConsultationInviteDto;
import ma.nafura.etudes.api.request.ConsultationPaquetDto;
import ma.nafura.etudes.api.request.DevisConsultationCreateDto;
import ma.nafura.etudes.domain.consultation.ConsultationEtude;
import ma.nafura.etudes.domain.consultation.ConsultationIdentiteCouverte;
import ma.nafura.etudes.domain.consultation.DevisConsultation;
import ma.nafura.etudes.domain.consultation.DevisConsultationLigne;
import ma.nafura.etudes.domain.dossier.DossierDocument;
import ma.nafura.etudes.domain.dossier.DossierEtude;
import ma.nafura.etudes.repository.ConsultationEtudeRepository;
import ma.nafura.etudes.repository.ConsultationIdentiteCouverteRepository;
import ma.nafura.etudes.repository.DevisConsultationRepository;
import ma.nafura.etudes.repository.DossierDocumentRepository;
import ma.nafura.etudes.repository.DossierEtudeRepository;
import ma.nafura.etudes.service.port.bc.EtudeFournisseurPort;
import ma.nafura.platform.framework.context.TenantContext;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.context.annotation.Lazy;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.util.StringUtils;

/**
 * Consultation études du dossier + devis reçus. Inviter ≠ consulté.
 * Un PDF {@code DEVIS_FOURNISSEUR} orphelin n'incrémente pas le compteur.
 * Identification = lignes de devis seulement ; fichier lié compte pour le min N.
 */
@Service
public class ConsultationEtudeService {

    private static final Logger log = LoggerFactory.getLogger(ConsultationEtudeService.class);

    private final ConsultationEtudeRepository consultationRepository;
    private final DevisConsultationRepository devisRepository;
    private final ConsultationIdentiteCouverteRepository identificationRepository;
    private final DossierEtudeRepository dossierRepository;
    private final DossierDocumentRepository documentRepository;
    private final EtudeFournisseurPort fournisseurPort;
    private final CatalogLookupApi catalogLookupApi;
    private final DpuService dpuService;
    private final CatalogueFournisseurLigneService catalogueFournisseurLigneService;
    private final ConsultationAchatService consultationAchatService;

    public ConsultationEtudeService(
            ConsultationEtudeRepository consultationRepository,
            DevisConsultationRepository devisRepository,
            ConsultationIdentiteCouverteRepository identificationRepository,
            DossierEtudeRepository dossierRepository,
            DossierDocumentRepository documentRepository,
            EtudeFournisseurPort fournisseurPort,
            CatalogLookupApi catalogLookupApi,
            @Lazy DpuService dpuService,
            CatalogueFournisseurLigneService catalogueFournisseurLigneService,
            @Lazy ConsultationAchatService consultationAchatService) {
        this.consultationRepository = consultationRepository;
        this.devisRepository = devisRepository;
        this.identificationRepository = identificationRepository;
        this.dossierRepository = dossierRepository;
        this.documentRepository = documentRepository;
        this.fournisseurPort = fournisseurPort;
        this.catalogLookupApi = catalogLookupApi;
        this.dpuService = dpuService;
        this.catalogueFournisseurLigneService = catalogueFournisseurLigneService;
        this.consultationAchatService = consultationAchatService;
    }

    @Transactional(readOnly = true)
    public ConsultationEtudeDto get(UUID dossierId) {
        ConsultationEtude consultation = requireConsultation(dossierId);
        return toDto(consultation);
    }

    @Transactional
    public ConsultationEtudeDto ouvrir(UUID dossierId, ConsultationEtudeOpenDto dto) {
        requireDossier(dossierId);
        UUID tenant = tenantId();
        ConsultationEtude consultation = consultationRepository
                .findByTenantIdAndDossierEtudeId(tenant, dossierId)
                .orElseGet(() -> consultationRepository.save(ConsultationEtude.builder()
                        .tenantId(tenant)
                        .dossierEtudeId(dossierId)
                        .statut(ConsultationEtude.STATUT_OUVERTE)
                        .paquetCleStables(new LinkedHashSet<>())
                        .partenaireIds(new LinkedHashSet<>())
                        .build()));
        if (dto != null) {
            if (dto.getCleStables() != null && !dto.getCleStables().isEmpty()) {
                appliquerPaquet(consultation, dto.getCleStables());
            }
            if (dto.getPartenaireIds() != null) {
                for (UUID partenaireId : dto.getPartenaireIds()) {
                    inviterSur(consultation, partenaireId);
                }
            }
        }
        return toDto(consultationRepository.save(consultation));
    }

    @Transactional
    public ConsultationEtudeDto remplacerPaquet(UUID dossierId, ConsultationPaquetDto dto) {
        ConsultationEtude consultation = requireConsultation(dossierId);
        appliquerPaquet(consultation, dto.getCleStables());
        return toDto(consultationRepository.save(consultation));
    }

    @Transactional
    public ConsultationEtudeDto inviter(UUID dossierId, ConsultationInviteDto dto) {
        ConsultationEtude consultation = requireConsultation(dossierId);
        inviterSur(consultation, dto.getPartenaireId());
        return toDto(consultationRepository.save(consultation));
    }

    @Transactional
    public ConsultationEtudeDto recevoirDevis(UUID dossierId, DevisConsultationCreateDto dto) {
        ConsultationEtude consultation = requireConsultation(dossierId);
        UUID partenaireId = dto.getPartenaireId();
        fournisseurPort.requireFournisseur(partenaireId);
        if (devisRepository.existsByConsultationIdAndPartenaireId(consultation.getId(), partenaireId)) {
            throw new IllegalStateException("etudes.consultation.devis.deja_recu");
        }
        consultation.getPartenaireIds().add(partenaireId);

        UUID documentId = dto.getDocumentId();
        if (documentId != null) {
            DossierDocument piece = documentRepository
                    .findByIdAndTenantId(documentId, tenantId())
                    .orElseThrow(() -> new IllegalArgumentException("etudes.document.introuvable"));
            if (!dossierId.equals(piece.getDossierEtudeId())) {
                throw new IllegalArgumentException("etudes.consultation.document.autre_dossier");
            }
        }

        DevisConsultation devis = DevisConsultation.builder()
                .tenantId(tenantId())
                .consultationId(consultation.getId())
                .partenaireId(partenaireId)
                .documentId(documentId)
                .recuAt(OffsetDateTime.now())
                .lignes(new ArrayList<>())
                .build();
        int ordre = 0;
        if (dto.getLignes() != null) {
            for (DevisConsultationCreateDto.Ligne ligne : dto.getLignes()) {
                if (ligne == null || !StringUtils.hasText(ligne.getCleStable()) || ligne.getPrixUnitaire() == null) {
                    continue;
                }
                devis.getLignes()
                        .add(DevisConsultationLigne.builder()
                                .tenantId(tenantId())
                                .cleStable(normalizeCle(ligne.getCleStable()))
                                .designation(trimOrNull(ligne.getDesignation()))
                                .quantite(ligne.getQuantite())
                                .unite(trimOrNull(ligne.getUnite()))
                                .prixUnitaire(ligne.getPrixUnitaire())
                                .ordre(ordre++)
                                .build());
            }
        }
        devisRepository.save(devis);
        consultationRepository.save(consultation);
        return toDto(consultation);
    }

    /**
     * Identifie les identités présentes sur des <b>lignes</b> de devis (pas le fichier seul)
     * et applique CONSULTE uniquement à celles-ci. Même {@code cle_stable} = une identification.
     * Décision : plusieurs devis sur la même identité → PU le plus bas.
     */
    @Transactional
    public ConsultationEtudeDto identifier(UUID dossierId, ConsultationIdentifierDto dto) {
        DossierEtude dossier = requireDossier(dossierId);
        ConsultationEtude consultation = requireConsultation(dossierId);
        List<DevisConsultation> devis = devisRepository.findByTenantIdAndConsultationIdOrderByRecuAtAsc(
                tenantId(), consultation.getId());
        Map<String, OffreLigne> eligible = offresEligibles(devis);

        Set<String> demandees = new LinkedHashSet<>();
        if (dto != null && dto.getCleStables() != null) {
            for (String raw : dto.getCleStables()) {
                if (StringUtils.hasText(raw)) {
                    demandees.add(normalizeCle(raw));
                }
            }
        }
        if (demandees.isEmpty()) {
            return toDto(consultation);
        }

        for (String cle : demandees) {
            OffreLigne offre = eligible.get(cle);
            if (offre == null) {
                continue;
            }
            ConsultationIdentiteCouverte.Pk pk = new ConsultationIdentiteCouverte.Pk(consultation.getId(), cle);
            ConsultationIdentiteCouverte row = identificationRepository
                    .findById(pk)
                    .orElseGet(() -> ConsultationIdentiteCouverte.builder()
                            .consultationId(consultation.getId())
                            .cleStable(cle)
                            .build());
            row.setDevisConsultationId(offre.devisId());
            row.setPrixUnitaire(offre.prixUnitaire());
            identificationRepository.save(row);

            CatalogItemSnapshot item = catalogLookupApi.findByCleStable(cle).orElse(null);
            if (item == null || !StringUtils.hasText(item.itemId())) {
                log.info("etudes.consultation.identite.sans_item cle={}", cle);
                continue;
            }
            UUID itemId = UUID.fromString(item.itemId());
            if (dossier.getDpgfId() != null) {
                dpuService.appliquerPrixConsulte(
                        dossier.getDpgfId(),
                        itemId,
                        offre.prixUnitaire(),
                        offre.devisId(),
                        "Consultation — " + cle);
            }
            try {
                alimenterCatalogue(offre, item, itemId);
            } catch (RuntimeException ex) {
                log.warn("etudes.consultation.catalogue_echec cle={} {}", cle, ex.getMessage());
            }
        }
        return toDto(consultation);
    }

    @Transactional(readOnly = true)
    public long countDevisRecus(UUID dossierId) {
        return consultationAchatService.countDevisExtraitsLies(dossierId);
    }

    private void alimenterCatalogue(OffreLigne offre, CatalogItemSnapshot item, UUID itemId) {
        CatalogueFournisseurLigneCreateDto ligne = new CatalogueFournisseurLigneCreateDto();
        ligne.setFournisseurId(offre.partenaireId());
        ligne.setArticleId(itemId);
        ligne.setDesignation(StringUtils.hasText(offre.designation()) ? offre.designation() : item.name());
        ligne.setPrixUnitaireHt(offre.prixUnitaire());
        ligne.setSource(CatalogueSource.CONSULTATION_ETUDES);
        ligne.setSourceRefId(offre.devisId());
        catalogueFournisseurLigneService.create(ligne);
    }

    private static Map<String, OffreLigne> offresEligibles(List<DevisConsultation> devis) {
        Map<String, OffreLigne> best = new LinkedHashMap<>();
        for (DevisConsultation recu : devis) {
            if (recu.getLignes() == null) {
                continue;
            }
            for (DevisConsultationLigne ligne : recu.getLignes()) {
                if (ligne == null || !StringUtils.hasText(ligne.getCleStable()) || ligne.getPrixUnitaire() == null) {
                    continue;
                }
                String cle = normalizeCle(ligne.getCleStable());
                OffreLigne candidate = new OffreLigne(
                        recu.getId(),
                        recu.getPartenaireId(),
                        ligne.getPrixUnitaire(),
                        ligne.getDesignation());
                OffreLigne current = best.get(cle);
                if (current == null || candidate.prixUnitaire().compareTo(current.prixUnitaire()) < 0) {
                    best.put(cle, candidate);
                }
            }
        }
        return best;
    }

    private void appliquerPaquet(ConsultationEtude consultation, List<String> cles) {
        Set<String> next = new LinkedHashSet<>();
        if (cles != null) {
            for (String raw : cles) {
                if (StringUtils.hasText(raw)) {
                    next.add(normalizeCle(raw));
                }
            }
        }
        consultation.setPaquetCleStables(next);
    }

    private void inviterSur(ConsultationEtude consultation, UUID partenaireId) {
        fournisseurPort.requireFournisseur(partenaireId);
        consultation.getPartenaireIds().add(partenaireId);
    }

    private ConsultationEtude requireConsultation(UUID dossierId) {
        requireDossier(dossierId);
        return consultationRepository
                .findByTenantIdAndDossierEtudeId(tenantId(), dossierId)
                .orElseThrow(() -> new IllegalArgumentException("etudes.consultation.introuvable"));
    }

    private DossierEtude requireDossier(UUID dossierId) {
        return dossierRepository
                .findByIdAndTenantId(dossierId, tenantId())
                .orElseThrow(() -> new IllegalArgumentException("etudes.dossier.introuvable"));
    }

    private ConsultationEtudeDto toDto(ConsultationEtude consultation) {
        List<DevisConsultation> devis = devisRepository.findByTenantIdAndConsultationIdOrderByRecuAtAsc(
                tenantId(), consultation.getId());
        List<ConsultationIdentiteCouverte> couvertes =
                identificationRepository.findByConsultationId(consultation.getId());
        long recus = devis.size();
        return ConsultationEtudeDto.builder()
                .id(consultation.getId())
                .dossierEtudeId(consultation.getDossierEtudeId())
                .statut(consultation.getStatut())
                .paquetCleStables(new ArrayList<>(
                        consultation.getPaquetCleStables() != null
                                ? consultation.getPaquetCleStables()
                                : Set.of()))
                .partenaireIds(new ArrayList<>(
                        consultation.getPartenaireIds() != null
                                ? consultation.getPartenaireIds()
                                : Set.of()))
                .devis(devis.stream().map(this::toDevisDto).toList())
                .identitesCouvertes(couvertes.stream()
                        .map(c -> ConsultationEtudeDto.IdentiteCouverte.builder()
                                .cleStable(c.getCleStable())
                                .devisConsultationId(c.getDevisConsultationId())
                                .prixUnitaire(c.getPrixUnitaire())
                                .build())
                        .toList())
                .devisRecus(recus)
                .fournisseursDistincts(recus)
                .build();
    }

    private ConsultationEtudeDto.Devis toDevisDto(DevisConsultation devis) {
        List<DevisConsultationLigne> lignes =
                devis.getLignes() != null ? devis.getLignes() : List.of();
        return ConsultationEtudeDto.Devis.builder()
                .id(devis.getId())
                .partenaireId(devis.getPartenaireId())
                .documentId(devis.getDocumentId())
                .recuAt(devis.getRecuAt())
                .hasLignes(!lignes.isEmpty())
                .lignes(lignes.stream()
                        .map(l -> ConsultationEtudeDto.Ligne.builder()
                                .id(l.getId())
                                .cleStable(l.getCleStable())
                                .designation(l.getDesignation())
                                .quantite(l.getQuantite())
                                .unite(l.getUnite())
                                .prixUnitaire(l.getPrixUnitaire())
                                .itemId(l.getItemId())
                                .build())
                        .toList())
                .build();
    }

    private static String normalizeCle(String raw) {
        return raw.trim().toLowerCase(Locale.ROOT);
    }

    private static String trimOrNull(String raw) {
        return StringUtils.hasText(raw) ? raw.trim() : null;
    }

    private static UUID tenantId() {
        return TenantContext.getTenantId();
    }

    private record OffreLigne(UUID devisId, UUID partenaireId, BigDecimal prixUnitaire, String designation) {}
}
