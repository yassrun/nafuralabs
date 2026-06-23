package ma.nafura.achats.service;

import java.time.OffsetDateTime;
import java.time.Year;
import java.util.List;
import java.util.Locale;
import java.util.UUID;
import ma.nafura.achats.api.request.ContratFournisseurCreateDto;
import ma.nafura.achats.api.request.ContratFournisseurUpdateDto;
import ma.nafura.achats.domain.model.ContratFournisseur;
import ma.nafura.achats.repository.ContratFournisseurRepository;
import ma.nafura.platform.framework.context.TenantContext;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.util.StringUtils;

@Service
public class ContratFournisseurService {

    private final ContratFournisseurRepository repository;

    public ContratFournisseurService(ContratFournisseurRepository repository) {
        this.repository = repository;
    }

    @Transactional(readOnly = true)
    public List<ContratFournisseur> list(
            String type, String status, String fournisseurId, String chantierId, String search) {
        UUID tenantId = tenantId();
        List<ContratFournisseur> rows = loadRows(tenantId, type, status, fournisseurId, chantierId);
        if (StringUtils.hasText(search)) {
            String term = search.trim().toLowerCase(Locale.ROOT);
            rows = rows.stream().filter(c -> matchesSearch(c, term)).toList();
        }
        return rows;
    }

    @Transactional(readOnly = true)
    public ContratFournisseur getById(UUID id) {
        return repository
                .findByIdAndTenantId(id, tenantId())
                .orElseThrow(() -> new IllegalArgumentException("Contrat fournisseur not found"));
    }

    @Transactional
    public ContratFournisseur create(ContratFournisseurCreateDto request) {
        UUID tenantId = tenantId();
        ContratFournisseur entity = ContratFournisseur.builder()
                .tenantId(tenantId)
                .numero(nextNumero(tenantId))
                .type(resolveType(request.getType(), ContratFournisseur.TYPE_FOURNISSEUR))
                .fournisseurId(request.getFournisseurId().trim())
                .chantierId(trimOrNull(request.getChantierId()))
                .dateDebut(request.getDateDebut())
                .dateFin(request.getDateFin())
                .status(resolveStatus(request.getStatus(), ContratFournisseur.STATUS_BROUILLON))
                .montantHt(request.getMontantHt())
                .art187Declare(request.getArt187Declare())
                .art187ValideMoa(request.getArt187ValideMoa())
                .retenueGarantieTaux(request.getRetenueGarantieTaux())
                .paiementDirectMoa(request.getPaiementDirectMoa())
                .notes(trimOrNull(request.getNotes()))
                .build();
        return repository.save(entity);
    }

    @Transactional
    public ContratFournisseur update(UUID id, ContratFournisseurUpdateDto request) {
        ContratFournisseur entity = getById(id);
        if (request.getType() != null) {
            entity.setType(resolveType(request.getType(), entity.getType()));
        }
        if (request.getFournisseurId() != null) {
            entity.setFournisseurId(request.getFournisseurId().trim());
        }
        if (request.getChantierId() != null) {
            entity.setChantierId(trimOrNull(request.getChantierId()));
        }
        if (request.getDateDebut() != null) {
            entity.setDateDebut(request.getDateDebut());
        }
        if (request.getDateFin() != null) {
            entity.setDateFin(request.getDateFin());
        }
        if (request.getStatus() != null) {
            entity.setStatus(resolveStatus(request.getStatus(), entity.getStatus()));
        }
        if (request.getMontantHt() != null) {
            entity.setMontantHt(request.getMontantHt());
        }
        if (request.getArt187Declare() != null) {
            entity.setArt187Declare(request.getArt187Declare());
        }
        if (request.getArt187ValideMoa() != null) {
            entity.setArt187ValideMoa(request.getArt187ValideMoa());
        }
        if (request.getRetenueGarantieTaux() != null) {
            entity.setRetenueGarantieTaux(request.getRetenueGarantieTaux());
        }
        if (request.getPaiementDirectMoa() != null) {
            entity.setPaiementDirectMoa(request.getPaiementDirectMoa());
        }
        if (request.getNotes() != null) {
            entity.setNotes(trimOrNull(request.getNotes()));
        }
        entity.setUpdatedAt(OffsetDateTime.now());
        return repository.save(entity);
    }

    @Transactional
    public void delete(UUID id) {
        ContratFournisseur entity = getById(id);
        repository.delete(entity);
    }

    @Transactional
    public ContratFournisseur sign(UUID id) {
        ContratFournisseur entity = getById(id);
        if (!ContratFournisseur.STATUS_BROUILLON.equals(entity.getStatus())) {
            throw new IllegalStateException("Only draft contracts can be signed");
        }
        entity.setStatus(ContratFournisseur.STATUS_SIGNE);
        entity.setUpdatedAt(OffsetDateTime.now());
        return repository.save(entity);
    }

    @Transactional
    public ContratFournisseur terminate(UUID id) {
        ContratFournisseur entity = getById(id);
        if (ContratFournisseur.STATUS_RESILIE.equals(entity.getStatus())) {
            throw new IllegalStateException("Contract is already terminated");
        }
        entity.setStatus(ContratFournisseur.STATUS_RESILIE);
        entity.setUpdatedAt(OffsetDateTime.now());
        return repository.save(entity);
    }

    private List<ContratFournisseur> loadRows(
            UUID tenantId, String type, String status, String fournisseurId, String chantierId) {
        boolean hasType = StringUtils.hasText(type);
        boolean hasStatus = StringUtils.hasText(status);
        boolean hasFournisseur = StringUtils.hasText(fournisseurId);
        boolean hasChantier = StringUtils.hasText(chantierId);

        List<ContratFournisseur> rows;
        if (hasStatus && hasType && hasFournisseur) {
            rows = repository.findByTenantIdAndStatusAndTypeAndFournisseurIdOrderByCreatedAtDesc(
                    tenantId, status.trim(), type.trim(), fournisseurId.trim());
        } else if (hasStatus && hasType) {
            rows = repository.findByTenantIdAndStatusAndTypeOrderByCreatedAtDesc(
                    tenantId, status.trim(), type.trim());
        } else if (hasStatus && hasFournisseur) {
            rows = repository.findByTenantIdAndStatusAndFournisseurIdOrderByCreatedAtDesc(
                    tenantId, status.trim(), fournisseurId.trim());
        } else if (hasType && hasFournisseur) {
            rows = repository.findByTenantIdAndTypeAndFournisseurIdOrderByCreatedAtDesc(
                    tenantId, type.trim(), fournisseurId.trim());
        } else if (hasStatus) {
            rows = repository.findByTenantIdAndStatusOrderByCreatedAtDesc(tenantId, status.trim());
        } else if (hasType) {
            rows = repository.findByTenantIdAndTypeOrderByCreatedAtDesc(tenantId, type.trim());
        } else if (hasFournisseur) {
            rows = repository.findByTenantIdAndFournisseurIdOrderByCreatedAtDesc(tenantId, fournisseurId.trim());
        } else if (hasChantier && hasType) {
            rows = repository.findByTenantIdAndChantierIdAndTypeOrderByCreatedAtDesc(
                    tenantId, chantierId.trim(), type.trim());
        } else if (hasChantier) {
            rows = repository.findByTenantIdAndChantierIdOrderByCreatedAtDesc(tenantId, chantierId.trim());
        } else {
            rows = repository.findByTenantIdOrderByCreatedAtDesc(tenantId);
        }

        if (hasChantier && !hasType) {
            String chantier = chantierId.trim();
            rows = rows.stream()
                    .filter(c -> chantier.equals(c.getChantierId()))
                    .toList();
        }
        return rows;
    }

    private String nextNumero(UUID tenantId) {
        long count = repository.countByTenantId(tenantId) + 1;
        return "CONTRAT-" + Year.now().getValue() + "-" + String.format("%04d", count);
    }

    private String resolveType(String requested, String fallback) {
        if (!StringUtils.hasText(requested)) {
            return fallback;
        }
        String normalized = requested.trim().toUpperCase(Locale.ROOT);
        return switch (normalized) {
            case ContratFournisseur.TYPE_FOURNISSEUR, ContratFournisseur.TYPE_SOUS_TRAITANCE -> normalized;
            default -> fallback;
        };
    }

    private String resolveStatus(String requested, String fallback) {
        if (!StringUtils.hasText(requested)) {
            return fallback;
        }
        String normalized = requested.trim().toUpperCase(Locale.ROOT);
        return switch (normalized) {
            case ContratFournisseur.STATUS_BROUILLON,
                    ContratFournisseur.STATUS_SIGNE,
                    ContratFournisseur.STATUS_EN_COURS,
                    ContratFournisseur.STATUS_ECHU,
                    ContratFournisseur.STATUS_RESILIE -> normalized;
            default -> fallback;
        };
    }

    private boolean matchesSearch(ContratFournisseur c, String term) {
        return contains(c.getNumero(), term) || contains(c.getNotes(), term) || contains(c.getFournisseurId(), term);
    }

    private boolean contains(String value, String term) {
        return value != null && value.toLowerCase(Locale.ROOT).contains(term);
    }

    private String trimOrNull(String value) {
        if (!StringUtils.hasText(value)) {
            return null;
        }
        return value.trim();
    }

    private UUID tenantId() {
        return TenantContext.getTenantId();
    }
}
