package ma.nafura.chantiers.service;

import java.util.List;
import java.util.UUID;
import ma.nafura.chantiers.api.dto.ZoneChantierDto;
import ma.nafura.chantiers.api.request.ZoneChantierCreateDto;
import ma.nafura.chantiers.domain.chantier.ZoneChantier;
import ma.nafura.chantiers.repository.ZoneChantierRepository;
import ma.nafura.platform.framework.context.TenantContext;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.util.StringUtils;

/**
 * AC-14 — le référentiel de zones du chantier. Arborescent, tenu au chantier, vide par défaut.
 * Premier consommateur : la zone facultative d'une ligne d'attachement.
 */
@Service
public class ZoneChantierService {

    private final ZoneChantierRepository repository;
    private final ChantierService chantierService;

    public ZoneChantierService(ZoneChantierRepository repository, ChantierService chantierService) {
        this.repository = repository;
        this.chantierService = chantierService;
    }

    @Transactional(readOnly = true)
    public List<ZoneChantierDto> listByChantier(String chantierId) {
        chantierService.getById(chantierId);
        return repository
                .findByTenantIdAndChantierIdOrderByOrdreAscDesignationAsc(tenantId(), chantierId)
                .stream()
                .map(ZoneChantierService::toDto)
                .toList();
    }

    @Transactional
    public ZoneChantierDto create(String chantierId, ZoneChantierCreateDto request) {
        chantierService.getById(chantierId);
        UUID tenantId = tenantId();
        String parentZoneId = trimOrNull(request.getParentZoneId());
        if (parentZoneId != null) {
            repository
                    .findByIdAndTenantId(parentZoneId, tenantId)
                    .filter(zone -> chantierId.equals(zone.getChantierId()))
                    .orElseThrow(() -> new IllegalArgumentException("Zone parente introuvable : " + parentZoneId));
        }
        int ordre = request.getOrdre() != null
                ? request.getOrdre()
                : (int) repository.countByTenantIdAndChantierId(tenantId, chantierId) + 1;
        ZoneChantier entity = ZoneChantier.builder()
                .id(chantierId + "-zone-" + UUID.randomUUID())
                .tenantId(tenantId)
                .chantierId(chantierId)
                .designation(request.getDesignation().trim())
                .parentZoneId(parentZoneId)
                .ordre(ordre)
                .build();
        return toDto(repository.save(entity));
    }

    @Transactional
    public void delete(String chantierId, String zoneId) {
        chantierService.getById(chantierId);
        UUID tenantId = tenantId();
        ZoneChantier zone = repository
                .findByIdAndTenantId(zoneId, tenantId)
                .filter(item -> chantierId.equals(item.getChantierId()))
                .orElseThrow(() -> new IllegalArgumentException("Zone introuvable : " + zoneId));
        repository.delete(zone);
    }

    private static ZoneChantierDto toDto(ZoneChantier zone) {
        return ZoneChantierDto.builder()
                .id(zone.getId())
                .chantierId(zone.getChantierId())
                .designation(zone.getDesignation())
                .parentZoneId(zone.getParentZoneId())
                .ordre(zone.getOrdre())
                .build();
    }

    private static String trimOrNull(String value) {
        if (!StringUtils.hasText(value)) {
            return null;
        }
        return value.trim();
    }

    private static UUID tenantId() {
        return TenantContext.getTenantId();
    }
}
