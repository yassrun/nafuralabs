package ma.nafura.achats.service;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.LocalDate;
import java.time.OffsetDateTime;
import java.util.List;
import java.util.Locale;
import java.util.UUID;
import ma.nafura.achats.api.dto.ContratSousTraitanceDto;
import ma.nafura.achats.api.dto.SousTraitanceSyntheseDto;
import ma.nafura.achats.api.request.ContratFournisseurCreateDto;
import ma.nafura.achats.api.request.ContratSousTraitanceCreateDto;
import ma.nafura.achats.domain.model.ContratFournisseur;
import ma.nafura.achats.repository.ContratFournisseurRepository;
import ma.nafura.platform.framework.context.TenantContext;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.util.StringUtils;

@Service
public class ChantierSousTraitanceService {

    private static final BigDecimal ZERO = BigDecimal.ZERO;

    private final ContratFournisseurRepository repository;
    private final ContratFournisseurService contratFournisseurService;
    private final ContratFournisseurSousTraitanceSeedService seedService;
    private final ContratSousTraitanceNotes notesCodec;

    public ChantierSousTraitanceService(
            ContratFournisseurRepository repository,
            ContratFournisseurService contratFournisseurService,
            ContratFournisseurSousTraitanceSeedService seedService,
            ContratSousTraitanceNotes notesCodec) {
        this.repository = repository;
        this.contratFournisseurService = contratFournisseurService;
        this.seedService = seedService;
        this.notesCodec = notesCodec;
    }

    @Transactional(readOnly = true)
    public List<ContratSousTraitanceDto> listAll() {
        seedService.seedIfEmpty();
        UUID tenantId = tenantId();
        return repository
                .findByTenantIdAndTypeOrderByCreatedAtDesc(tenantId, ContratFournisseur.TYPE_SOUS_TRAITANCE)
                .stream()
                .map(this::toDto)
                .toList();
    }

    @Transactional(readOnly = true)
    public List<ContratSousTraitanceDto> listByChantier(String chantierId) {
        seedService.seedIfEmpty();
        UUID tenantId = tenantId();
        return repository
                .findByTenantIdAndChantierIdAndTypeOrderByCreatedAtDesc(
                        tenantId, chantierId.trim(), ContratFournisseur.TYPE_SOUS_TRAITANCE)
                .stream()
                .map(this::toDto)
                .toList();
    }

    @Transactional
    public ContratSousTraitanceDto create(String chantierId, ContratSousTraitanceCreateDto request) {
        seedService.seedIfEmpty();
        String normalizedChantierId = chantierId.trim();

        ContratFournisseur entity;
        if (request.getContratId() != null) {
            entity = contratFournisseurService.getById(request.getContratId());
            if (!ContratFournisseur.TYPE_SOUS_TRAITANCE.equals(entity.getType())) {
                throw new IllegalArgumentException("Contract is not a sous-traitance contract");
            }
            entity.setChantierId(normalizedChantierId);
            entity.setNotes(notesCodec.build(
                    request.getObjet(),
                    request.getSousTraitantNom(),
                    request.getIce(),
                    null,
                    null,
                    request.getAvancementPercent()));
            entity.setUpdatedAt(OffsetDateTime.now());
            entity = repository.save(entity);
        } else {
            ContratFournisseurCreateDto createDto = new ContratFournisseurCreateDto();
            createDto.setType(ContratFournisseur.TYPE_SOUS_TRAITANCE);
            createDto.setFournisseurId(request.getSousTraitantId());
            createDto.setChantierId(normalizedChantierId);
            createDto.setDateDebut(request.getDateDebut());
            createDto.setDateFin(request.getDateFin());
            createDto.setStatus(mapStatusToBackend(request.getStatus(), ContratFournisseur.STATUS_BROUILLON));
            createDto.setMontantHt(request.getMontantHt());
            createDto.setArt187Declare(Boolean.TRUE.equals(request.getDeclarationArt187()));
            createDto.setRetenueGarantieTaux(request.getRetenueGarantieTaux());
            createDto.setNotes(notesCodec.build(
                    request.getObjet(),
                    request.getSousTraitantNom(),
                    request.getIce(),
                    null,
                    null,
                    request.getAvancementPercent()));
            entity = contratFournisseurService.create(createDto);
            if (StringUtils.hasText(request.getStatus()) || request.getDateSignature() != null) {
                entity.setStatus(mapStatusToBackend(request.getStatus(), entity.getStatus()));
                entity.setUpdatedAt(OffsetDateTime.now());
                entity = repository.save(entity);
            }
        }
        return toDto(entity);
    }

    @Transactional(readOnly = true)
    public SousTraitanceSyntheseDto synthese(String chantierId) {
        List<ContratSousTraitanceDto> rows = listByChantier(chantierId);
        BigDecimal montantTotal = rows.stream()
                .map(ContratSousTraitanceDto::getMontantHt)
                .filter(v -> v != null)
                .reduce(ZERO, BigDecimal::add);
        BigDecimal cumulRg = rows.stream()
                .map(row -> computeRetenueGarantie(row.getMontantHt(), row.getRetenueGarantieTaux()))
                .reduce(ZERO, BigDecimal::add);
        return SousTraitanceSyntheseDto.builder()
                .count(rows.size())
                .montantTotalHt(montantTotal)
                .cumulRetenueGarantie(cumulRg)
                .build();
    }

    private ContratSousTraitanceDto toDto(ContratFournisseur entity) {
        ContratSousTraitanceNotes.Parsed meta = notesCodec.parse(entity.getNotes());
        String sousTraitantNom = StringUtils.hasText(meta.sousTraitantNom())
                ? meta.sousTraitantNom()
                : entity.getFournisseurId();
        String chantierCode = StringUtils.hasText(meta.chantierCode()) ? meta.chantierCode() : entity.getChantierId();
        String chantierNom = StringUtils.hasText(meta.chantierNom()) ? meta.chantierNom() : "";
        LocalDate dateSignature = null;
        if (ContratFournisseur.STATUS_SIGNE.equals(entity.getStatus())
                || ContratFournisseur.STATUS_EN_COURS.equals(entity.getStatus())) {
            dateSignature = entity.getCreatedAt() != null ? entity.getCreatedAt().toLocalDate() : null;
        }
        return ContratSousTraitanceDto.builder()
                .id(entity.getId().toString())
                .numero(entity.getNumero())
                .sousTraitantId(entity.getFournisseurId())
                .sousTraitantNom(sousTraitantNom)
                .ice(meta.ice())
                .chantierId(entity.getChantierId())
                .chantierCode(chantierCode)
                .chantierNom(chantierNom)
                .objet(meta.objet())
                .montantHt(entity.getMontantHt())
                .retenueGarantieTaux(entity.getRetenueGarantieTaux())
                .dateSignature(dateSignature)
                .dateDebut(entity.getDateDebut())
                .dateFin(entity.getDateFin())
                .avancementPercent(meta.avancementPercent() != null ? meta.avancementPercent() : ZERO)
                .status(mapStatusToFrontend(entity.getStatus()))
                .declarationArt187(Boolean.TRUE.equals(entity.getArt187Declare()))
                .build();
    }

    private BigDecimal computeRetenueGarantie(BigDecimal montantHt, BigDecimal taux) {
        if (montantHt == null || taux == null) {
            return ZERO;
        }
        return montantHt.multiply(taux).divide(new BigDecimal("100"), 4, RoundingMode.HALF_UP);
    }

    private String mapStatusToFrontend(String backendStatus) {
        if (ContratFournisseur.STATUS_ECHU.equals(backendStatus)) {
            return "TERMINE";
        }
        return backendStatus;
    }

    private String mapStatusToBackend(String requested, String fallback) {
        if (!StringUtils.hasText(requested)) {
            return fallback;
        }
        String normalized = requested.trim().toUpperCase(Locale.ROOT);
        return switch (normalized) {
            case "TERMINE" -> ContratFournisseur.STATUS_ECHU;
            case ContratFournisseur.STATUS_BROUILLON,
                    ContratFournisseur.STATUS_SIGNE,
                    ContratFournisseur.STATUS_EN_COURS,
                    ContratFournisseur.STATUS_RESILIE -> normalized;
            default -> fallback;
        };
    }

    private UUID tenantId() {
        return TenantContext.getTenantId();
    }
}
