package ma.nafura.achats.service;

import java.math.BigDecimal;
import java.time.Year;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.LinkedHashSet;
import java.util.List;
import java.util.Locale;
import java.util.Map;
import java.util.Set;
import java.util.UUID;
import ma.nafura.achats.api.dto.ConsultationAchatDto;
import ma.nafura.achats.api.dto.ConsultationDevisDto;
import ma.nafura.achats.api.dto.ConsultationDevisLigneDto;
import ma.nafura.achats.api.request.ConsultationAchatCreateDto;
import ma.nafura.achats.api.request.ConsultationAchatPanierDto;
import ma.nafura.achats.api.request.ConsultationDevisImportDto;
import ma.nafura.achats.domain.consultation.ConsultationAchat;
import ma.nafura.achats.domain.consultation.ConsultationAchatDevis;
import ma.nafura.achats.domain.consultation.ConsultationAchatDevisLigne;
import ma.nafura.achats.domain.fournisseur.Partner;
import ma.nafura.achats.domain.fournisseur.PartnerRoleType;
import ma.nafura.achats.repository.ConsultationAchatDevisRepository;
import ma.nafura.achats.repository.ConsultationAchatRepository;
import ma.nafura.achats.repository.PartnerRepository;
import ma.nafura.achats.repository.PartnerRoleRepository;
import ma.nafura.achats.service.port.ConsultationLienEtudePort;
import ma.nafura.platform.framework.context.TenantContext;
import org.springframework.beans.factory.ObjectProvider;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.util.StringUtils;

@Service
public class ConsultationAchatService {

    private final ConsultationAchatRepository repository;
    private final ConsultationAchatDevisRepository devisRepository;
    private final PartnerRepository partnerRepository;
    private final PartnerRoleRepository roleRepository;
    private final ObjectProvider<ConsultationLienEtudePort> lienEtudePort;

    public ConsultationAchatService(
            ConsultationAchatRepository repository,
            ConsultationAchatDevisRepository devisRepository,
            PartnerRepository partnerRepository,
            PartnerRoleRepository roleRepository,
            ObjectProvider<ConsultationLienEtudePort> lienEtudePort) {
        this.repository = repository;
        this.devisRepository = devisRepository;
        this.partnerRepository = partnerRepository;
        this.roleRepository = roleRepository;
        this.lienEtudePort = lienEtudePort;
    }

    @Transactional(readOnly = true)
    public List<ConsultationAchatDto> list(String lien) {
        UUID tenantId = tenantId();
        List<ConsultationAchat> rows = loadRows(tenantId, lien);
        Map<UUID, Integer> counts = countDevis(rows);
        return rows.stream().map(entity -> toDto(entity, counts.getOrDefault(entity.getId(), 0), List.of())).toList();
    }

    @Transactional(readOnly = true)
    public ConsultationAchatDto getById(UUID id) {
        return toDto(require(id), true);
    }

    @Transactional
    public ConsultationAchatDto create(ConsultationAchatCreateDto request) {
        UUID tenantId = tenantId();
        if (request.getFournisseurId() == null) {
            throw new IllegalArgumentException("consultation.fournisseur.obligatoire");
        }
        Partner fournisseur = partnerRepository
                .findByIdAndTenantId(request.getFournisseurId(), tenantId)
                .orElseThrow(() -> new IllegalArgumentException("consultation.fournisseur.introuvable"));
        if (!roleRepository.existsByTenantIdAndPartnerIdAndRole(
                tenantId, fournisseur.getId(), PartnerRoleType.FOURNISSEUR)) {
            throw new IllegalArgumentException("consultation.fournisseur.pas_fiche");
        }

        ConsultationAchat entity = ConsultationAchat.builder()
                .tenantId(tenantId)
                .numero(nextNumero(tenantId))
                .fournisseurId(fournisseur.getId())
                .dossierEtudeId(request.getDossierEtudeId())
                .statut(ConsultationAchat.STATUT_DEMANDE)
                .clesStables(normalizePanier(request.getClesStables()))
                .build();
        return toDto(repository.save(entity), false);
    }

    @Transactional
    public ConsultationAchatDto addToPanier(UUID id, ConsultationAchatPanierDto request) {
        ConsultationAchat entity = require(id);
        Set<String> merged = new LinkedHashSet<>();
        if (entity.getClesStables() != null) {
            merged.addAll(entity.getClesStables());
        }
        merged.addAll(normalizePanier(request != null ? request.getClesStables() : null));
        entity.setClesStables(merged);
        if (entity.getDossierEtudeId() == null
                && request != null
                && request.getDossierEtudeId() != null) {
            entity.setDossierEtudeId(request.getDossierEtudeId());
        }
        ConsultationAchatDto dto = toDto(repository.save(entity), false);
        notifierLienEtude(entity.getDossierEtudeId());
        return dto;
    }

    @Transactional
    public ConsultationAchatDto importDevis(UUID consultationId, ConsultationDevisImportDto request) {
        ConsultationAchat consultation = require(consultationId);
        List<ConsultationAchatDevisLigne> lignes = normalizeLignes(request != null ? request.getLignes() : null);
        if (lignes.isEmpty()) {
            throw new IllegalArgumentException("consultation.devis.lignes.vides");
        }

        ConsultationAchatDevis devis = ConsultationAchatDevis.builder()
                .tenantId(consultation.getTenantId())
                .consultationId(consultation.getId())
                .fichierNom(request != null && StringUtils.hasText(request.getFichierNom())
                        ? request.getFichierNom().trim()
                        : null)
                .lignes(lignes)
                .build();
        devisRepository.save(devis);

        consultation.setStatut(ConsultationAchat.STATUT_DEVIS_RECU);
        repository.save(consultation);
        notifierLienEtude(consultation.getDossierEtudeId());
        return toDto(consultation, true);
    }

    @Transactional(readOnly = true)
    public long countDevisExtraitsLies(UUID dossierEtudeId) {
        if (dossierEtudeId == null) {
            return 0L;
        }
        List<ConsultationAchat> liees =
                repository.findByTenantIdAndDossierEtudeId(tenantId(), dossierEtudeId);
        List<UUID> ids = liees.stream().map(ConsultationAchat::getId).filter(id -> id != null).toList();
        if (ids.isEmpty()) {
            return 0L;
        }
        return devisRepository.countByConsultationIdIn(ids);
    }

    private void notifierLienEtude(UUID dossierEtudeId) {
        if (dossierEtudeId == null) {
            return;
        }
        ConsultationLienEtudePort port = lienEtudePort.getIfAvailable();
        if (port != null) {
            port.appliquerFlagsApresDevis(dossierEtudeId);
        }
    }

    private ConsultationAchat require(UUID id) {
        return repository
                .findByIdAndTenantId(id, tenantId())
                .orElseThrow(() -> new IllegalArgumentException("consultation.introuvable"));
    }

    private List<ConsultationAchatDevisLigne> normalizeLignes(List<ConsultationDevisImportDto.Ligne> input) {
        List<ConsultationAchatDevisLigne> lignes = new ArrayList<>();
        if (input == null) {
            return lignes;
        }
        int ordre = 0;
        for (ConsultationDevisImportDto.Ligne raw : input) {
            if (raw == null) {
                continue;
            }
            String identite = trimToNull(raw.getIdentite());
            String libelle = trimToNull(raw.getLibelle());
            if (libelle == null && identite == null) {
                continue;
            }
            if (libelle == null) {
                libelle = identite;
            }
            lignes.add(ConsultationAchatDevisLigne.builder()
                    .identite(identite)
                    .libelle(libelle)
                    .quantite(finiteOrNull(raw.getQuantite()))
                    .unite(trimToNull(raw.getUnite()))
                    .prixUnitaire(finiteOrNull(raw.getPrixUnitaire()))
                    .ordre(ordre++)
                    .build());
        }
        return lignes;
    }

    private static String trimToNull(String value) {
        if (!StringUtils.hasText(value)) {
            return null;
        }
        return value.trim();
    }

    private static BigDecimal finiteOrNull(BigDecimal value) {
        if (value == null) {
            return null;
        }
        return value;
    }

    private List<ConsultationAchat> loadRows(UUID tenantId, String lien) {
        if (!StringUtils.hasText(lien) || "all".equalsIgnoreCase(lien.trim())) {
            return repository.findByTenantIdOrderByCreatedAtDesc(tenantId);
        }
        String normalized = lien.trim().toLowerCase(Locale.ROOT);
        return switch (normalized) {
            case "hors", "hors-etude" ->
                repository.findByTenantIdAndDossierEtudeIdIsNullOrderByCreatedAtDesc(tenantId);
            case "liee", "liée" ->
                repository.findByTenantIdAndDossierEtudeIdIsNotNullOrderByCreatedAtDesc(tenantId);
            default -> repository.findByTenantIdOrderByCreatedAtDesc(tenantId);
        };
    }

    private Map<UUID, Integer> countDevis(List<ConsultationAchat> rows) {
        Map<UUID, Integer> counts = new HashMap<>();
        List<UUID> ids = rows.stream().map(ConsultationAchat::getId).filter(id -> id != null).toList();
        if (ids.isEmpty()) {
            return counts;
        }
        for (Object[] row : devisRepository.countGroupedByConsultationIds(ids)) {
            counts.put((UUID) row[0], ((Number) row[1]).intValue());
        }
        return counts;
    }

    private Set<String> normalizePanier(List<String> input) {
        Set<String> cles = new LinkedHashSet<>();
        if (input == null) {
            return cles;
        }
        for (String raw : input) {
            if (!StringUtils.hasText(raw)) {
                continue;
            }
            cles.add(raw.trim());
        }
        return cles;
    }

    private String nextNumero(UUID tenantId) {
        long count = repository.countByTenantId(tenantId) + 1;
        return "CS-" + Year.now().getValue() + "-" + String.format("%04d", count);
    }

    private ConsultationAchatDto toDto(ConsultationAchat entity, boolean includeDevis) {
        int count;
        List<ConsultationDevisDto> devis;
        if (includeDevis && entity.getId() != null) {
            List<ConsultationAchatDevis> rows =
                    devisRepository.findByConsultationIdOrderByCreatedAtAsc(entity.getId());
            count = rows.size();
            devis = rows.stream().map(this::toDevisDto).toList();
        } else if (entity.getId() != null) {
            count = (int) devisRepository.countByConsultationId(entity.getId());
            devis = List.of();
        } else {
            count = 0;
            devis = List.of();
        }
        return toDto(entity, count, devis);
    }

    private ConsultationAchatDto toDto(ConsultationAchat entity, int devisRecus, List<ConsultationDevisDto> devis) {
        String nom = partnerRepository
                .findByIdAndTenantId(entity.getFournisseurId(), entity.getTenantId())
                .map(Partner::getRaisonSociale)
                .orElse("");
        List<String> panier = new ArrayList<>();
        if (entity.getClesStables() != null) {
            panier.addAll(entity.getClesStables());
            panier.sort(String.CASE_INSENSITIVE_ORDER);
        }
        return ConsultationAchatDto.builder()
                .id(entity.getId())
                .numero(entity.getNumero())
                .fournisseurId(entity.getFournisseurId())
                .fournisseurNom(nom)
                .clesStables(panier)
                .dossierEtudeId(entity.getDossierEtudeId())
                .statut(entity.getStatut())
                .devisRecus(devisRecus)
                .devis(devis)
                .createdAt(entity.getCreatedAt())
                .build();
    }

    private ConsultationDevisDto toDevisDto(ConsultationAchatDevis entity) {
        List<ConsultationDevisLigneDto> lignes = new ArrayList<>();
        if (entity.getLignes() != null) {
            for (ConsultationAchatDevisLigne ligne : entity.getLignes()) {
                lignes.add(ConsultationDevisLigneDto.builder()
                        .id(ligne.getId())
                        .identite(ligne.getIdentite())
                        .libelle(ligne.getLibelle())
                        .quantite(ligne.getQuantite())
                        .unite(ligne.getUnite())
                        .prixUnitaire(ligne.getPrixUnitaire())
                        .build());
            }
        }
        return ConsultationDevisDto.builder()
                .id(entity.getId())
                .fichierNom(entity.getFichierNom())
                .createdAt(entity.getCreatedAt())
                .lignes(lignes)
                .build();
    }

    private UUID tenantId() {
        return TenantContext.getTenantId();
    }
}
