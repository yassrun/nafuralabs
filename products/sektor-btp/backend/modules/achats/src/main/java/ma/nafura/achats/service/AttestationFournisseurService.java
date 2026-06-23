package ma.nafura.achats.service;

import java.time.LocalDate;
import java.time.OffsetDateTime;
import java.util.ArrayList;
import java.util.List;
import java.util.Locale;
import java.util.Map;
import java.util.UUID;
import java.util.function.Function;
import java.util.stream.Collectors;
import ma.nafura.achats.api.dto.AttestationTypeStatusDto;
import ma.nafura.achats.api.dto.PartnerAttestationsStatusDto;
import ma.nafura.achats.api.request.AttestationFournisseurCreateDto;
import ma.nafura.achats.api.request.AttestationFournisseurUpdateDto;
import ma.nafura.achats.domain.model.AttestationFournisseur;
import ma.nafura.achats.repository.AttestationFournisseurRepository;
import ma.nafura.platform.framework.context.TenantContext;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.util.StringUtils;

@Service
public class AttestationFournisseurService {

    private final AttestationFournisseurRepository repository;

    @Value("${achats.attestations.blocage-reglement.enabled:true}")
    private boolean blocageReglementEnabled;

    public AttestationFournisseurService(AttestationFournisseurRepository repository) {
        this.repository = repository;
    }

    @Transactional(readOnly = true)
    public List<AttestationFournisseur> list(String partnerId, String status) {
        recomputeStatusForTenant();
        return loadRows(partnerId, status);
    }

    @Transactional(readOnly = true)
    public AttestationFournisseur getById(UUID id) {
        AttestationFournisseur entity = repository
                .findByIdAndTenantId(id, tenantId())
                .orElseThrow(() -> new IllegalArgumentException("Attestation fournisseur not found"));
        entity.setStatus(computeStatus(entity.getDateExpiration(), LocalDate.now()));
        return entity;
    }

    @Transactional(readOnly = true)
    public PartnerAttestationsStatusDto partnerStatus(String partnerId) {
        recomputeStatusForTenant();
        return buildPartnerStatus(partnerId.trim());
    }

    @Transactional
    public AttestationFournisseur create(AttestationFournisseurCreateDto request) {
        UUID tenantId = tenantId();
        String partner = request.getPartnerId().trim();
        String type = resolveType(request.getType());
        repository.findByTenantIdAndPartnerIdAndType(tenantId, partner, type).ifPresent(existing -> {
            throw new IllegalStateException("Attestation already exists for partner and type");
        });

        AttestationFournisseur entity = AttestationFournisseur.builder()
                .tenantId(tenantId)
                .partnerId(partner)
                .type(type)
                .dateEmission(request.getDateEmission())
                .dateExpiration(request.getDateExpiration())
                .scanUrl(trimOrNull(request.getScanUrl()))
                .build();
        recomputeStatus(entity);
        return repository.save(entity);
    }

    @Transactional
    public AttestationFournisseur update(UUID id, AttestationFournisseurUpdateDto request) {
        AttestationFournisseur entity = getById(id);
        if (request.getPartnerId() != null) {
            entity.setPartnerId(request.getPartnerId().trim());
        }
        if (request.getType() != null) {
            entity.setType(resolveType(request.getType()));
        }
        if (request.getDateEmission() != null) {
            entity.setDateEmission(request.getDateEmission());
        }
        if (request.getDateExpiration() != null) {
            entity.setDateExpiration(request.getDateExpiration());
        }
        if (request.getScanUrl() != null) {
            entity.setScanUrl(trimOrNull(request.getScanUrl()));
        }
        recomputeStatus(entity);
        entity.setUpdatedAt(OffsetDateTime.now());
        return repository.save(entity);
    }

    @Transactional
    public void delete(UUID id) {
        AttestationFournisseur entity = getById(id);
        repository.delete(entity);
    }

    /** Recalculates persisted status for all attestations of the current tenant. */
    @Transactional
    public int recomputeStatusForTenant() {
        UUID tenantId = tenantId();
        List<AttestationFournisseur> rows = repository.findByTenantIdOrderByCreatedAtDesc(tenantId);
        int updated = 0;
        for (AttestationFournisseur row : rows) {
            if (recomputeStatus(row)) {
                repository.save(row);
                updated++;
            }
        }
        return updated;
    }

    public boolean recomputeStatus(AttestationFournisseur entity) {
        String computed = computeStatus(entity.getDateExpiration(), LocalDate.now());
        if (!computed.equals(entity.getStatus())) {
            entity.setStatus(computed);
            entity.setUpdatedAt(OffsetDateTime.now());
            return true;
        }
        return false;
    }

    public static String computeStatus(LocalDate dateExpiration, LocalDate today) {
        if (dateExpiration == null) {
            return AttestationFournisseur.STATUS_EXPIRE;
        }
        if (dateExpiration.isBefore(today)) {
            return AttestationFournisseur.STATUS_EXPIRE;
        }
        if (!dateExpiration.isAfter(today.plusDays(AttestationFournisseur.EXPIRE_BIENTOT_DAYS))) {
            return AttestationFournisseur.STATUS_EXPIRE_BIENTOT;
        }
        return AttestationFournisseur.STATUS_VALIDE;
    }

    public boolean isReglementBloque(String partnerId) {
        if (!blocageReglementEnabled) {
            return false;
        }
        PartnerAttestationsStatusDto status = buildPartnerStatus(partnerId.trim());
        return statusChips(status, AttestationFournisseur.TYPE_CNSS)
                        == AttestationFournisseur.STATUS_EXPIRE
                && statusChips(status, AttestationFournisseur.TYPE_FISCALE)
                        == AttestationFournisseur.STATUS_EXPIRE;
    }

    public void assertReglementAutorise(String partnerId) {
        if (isReglementBloque(partnerId)) {
            throw new IllegalStateException(
                    "Règlement bloqué : attestations CNSS et FISCALE expirées pour le fournisseur");
        }
    }

    private PartnerAttestationsStatusDto buildPartnerStatus(String partnerId) {
        UUID tenantId = tenantId();
        Map<String, AttestationFournisseur> byType =
                repository.findByTenantIdAndPartnerIdOrderByCreatedAtDesc(tenantId, partnerId).stream()
                        .collect(Collectors.toMap(
                                AttestationFournisseur::getType, Function.identity(), (a, b) -> a));

        List<AttestationTypeStatusDto> chips = new ArrayList<>();
        for (String type : AttestationFournisseur.ALL_TYPES) {
            AttestationFournisseur row = byType.get(type);
            if (row == null) {
                chips.add(AttestationTypeStatusDto.builder()
                        .type(type)
                        .status(AttestationFournisseur.STATUS_EXPIRE)
                        .present(false)
                        .build());
            } else {
                chips.add(AttestationTypeStatusDto.builder()
                        .type(type)
                        .status(row.getStatus())
                        .attestationId(row.getId())
                        .dateExpiration(row.getDateExpiration())
                        .present(true)
                        .build());
            }
        }

        boolean bloque = blocageReglementEnabled
                && statusChips(chips, AttestationFournisseur.TYPE_CNSS) == AttestationFournisseur.STATUS_EXPIRE
                && statusChips(chips, AttestationFournisseur.TYPE_FISCALE) == AttestationFournisseur.STATUS_EXPIRE;

        return PartnerAttestationsStatusDto.builder()
                .partnerId(partnerId)
                .chips(chips)
                .reglementBloque(bloque)
                .build();
    }

    private String statusChips(PartnerAttestationsStatusDto status, String type) {
        return statusChips(status.getChips(), type);
    }

    private String statusChips(List<AttestationTypeStatusDto> chips, String type) {
        return chips.stream()
                .filter(c -> type.equals(c.getType()))
                .map(AttestationTypeStatusDto::getStatus)
                .findFirst()
                .orElse(AttestationFournisseur.STATUS_EXPIRE);
    }

    private List<AttestationFournisseur> loadRows(String partnerId, String status) {
        UUID tenantId = tenantId();
        boolean hasPartner = StringUtils.hasText(partnerId);
        boolean hasStatus = StringUtils.hasText(status);

        if (hasPartner && hasStatus) {
            return repository.findByTenantIdAndPartnerIdAndStatusOrderByCreatedAtDesc(
                    tenantId, partnerId.trim(), status.trim());
        }
        if (hasPartner) {
            return repository.findByTenantIdAndPartnerIdOrderByCreatedAtDesc(tenantId, partnerId.trim());
        }
        if (hasStatus) {
            return repository.findByTenantIdAndStatusOrderByCreatedAtDesc(tenantId, status.trim());
        }
        return repository.findByTenantIdOrderByCreatedAtDesc(tenantId);
    }

    private String resolveType(String requested) {
        if (!StringUtils.hasText(requested)) {
            throw new IllegalArgumentException("Attestation type is required");
        }
        String normalized = requested.trim().toUpperCase(Locale.ROOT);
        if (!AttestationFournisseur.ALL_TYPES.contains(normalized)) {
            throw new IllegalArgumentException("Unknown attestation type: " + requested);
        }
        return normalized;
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
