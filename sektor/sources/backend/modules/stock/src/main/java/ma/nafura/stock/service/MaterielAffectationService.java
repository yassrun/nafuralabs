package ma.nafura.stock.service;

import java.time.LocalDate;
import java.util.List;
import java.util.UUID;
import ma.nafura.item.domain.model.Materiel;
import ma.nafura.item.repository.MaterielRepository;
import ma.nafura.platform.framework.context.TenantContext;
import ma.nafura.stock.api.request.MaterielAffectationCloreDto;
import ma.nafura.stock.api.request.MaterielAffectationCreateDto;
import ma.nafura.stock.api.request.MaterielAffectationUpdateDto;
import ma.nafura.stock.domain.model.MaterielAffectation;
import ma.nafura.stock.repository.MaterielAffectationRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.util.StringUtils;

@Service
public class MaterielAffectationService {

    private final MaterielAffectationRepository repository;
    private final MaterielRepository materielRepository;

    public MaterielAffectationService(
            MaterielAffectationRepository repository, MaterielRepository materielRepository) {
        this.repository = repository;
        this.materielRepository = materielRepository;
    }

    @Transactional(readOnly = true)
    public List<MaterielAffectation> list(String materielId, String status) {
        UUID tenantId = tenantId();
        if (StringUtils.hasText(materielId)) {
            UUID mid = UUID.fromString(materielId.trim());
            if (StringUtils.hasText(status)) {
                return repository.findByTenantIdAndMaterielIdOrderByDateDebutDesc(tenantId, mid).stream()
                        .filter(a -> status.trim().equalsIgnoreCase(a.getStatus()))
                        .toList();
            }
            return repository.findByTenantIdAndMaterielIdOrderByDateDebutDesc(tenantId, mid);
        }
        if (StringUtils.hasText(status)) {
            return repository.findByTenantIdAndStatusOrderByDateDebutDesc(tenantId, status.trim().toUpperCase());
        }
        return repository.findByTenantIdOrderByDateDebutDesc(tenantId);
    }

    @Transactional(readOnly = true)
    public MaterielAffectation getById(UUID id) {
        return repository
                .findByIdAndTenantId(id, tenantId())
                .orElseThrow(() -> new IllegalArgumentException("Materiel affectation not found"));
    }

    @Transactional
    public MaterielAffectation create(MaterielAffectationCreateDto request) {
        UUID tenantId = tenantId();
        Materiel materiel = materielRepository
                .findByIdAndTenantId(request.getMaterielId(), tenantId)
                .orElseThrow(() -> new IllegalArgumentException("Materiel not found"));

        MaterielAffectation entity = MaterielAffectation.builder()
                .tenantId(tenantId)
                .materielId(materiel.getId())
                .materielName(materiel.getName())
                .locationId(request.getLocationId())
                .locationName(request.getLocationName())
                .chantierRef(request.getChantierRef().trim())
                .dateDebut(request.getDateDebut())
                .dateFin(request.getDateFin())
                .status(MaterielAffectation.STATUS_ACTIVE)
                .notes(request.getNotes())
                .build();
        MaterielAffectation saved = repository.save(entity);
        syncMaterielChantier(materiel.getId());
        return saved;
    }

    @Transactional
    public MaterielAffectation update(UUID id, MaterielAffectationUpdateDto request) {
        MaterielAffectation entity = getById(id);
        if (request.getLocationId() != null) {
            entity.setLocationId(request.getLocationId());
        }
        if (request.getLocationName() != null) {
            entity.setLocationName(request.getLocationName());
        }
        if (request.getChantierRef() != null) {
            entity.setChantierRef(request.getChantierRef().trim());
        }
        if (request.getDateDebut() != null) {
            entity.setDateDebut(request.getDateDebut());
        }
        if (request.getDateFin() != null) {
            entity.setDateFin(request.getDateFin());
        }
        if (request.getNotes() != null) {
            entity.setNotes(request.getNotes());
        }
        MaterielAffectation saved = repository.save(entity);
        syncMaterielChantier(entity.getMaterielId());
        return saved;
    }

    @Transactional
    public MaterielAffectation clore(UUID id, MaterielAffectationCloreDto body) {
        MaterielAffectation entity = getById(id);
        if (!MaterielAffectation.STATUS_ACTIVE.equals(entity.getStatus())) {
            throw new IllegalStateException("Affectation is not active");
        }
        entity.setStatus(MaterielAffectation.STATUS_CLOSED);
        entity.setDateFin(body != null && body.getDateFin() != null ? body.getDateFin() : LocalDate.now());
        MaterielAffectation saved = repository.save(entity);
        syncMaterielChantier(entity.getMaterielId());
        return saved;
    }

    @Transactional
    public void delete(UUID id) {
        MaterielAffectation entity = getById(id);
        UUID materielId = entity.getMaterielId();
        repository.delete(entity);
        syncMaterielChantier(materielId);
    }

    private void syncMaterielChantier(UUID materielId) {
        UUID tenantId = tenantId();
        Materiel materiel = materielRepository
                .findByIdAndTenantId(materielId, tenantId)
                .orElseThrow(() -> new IllegalArgumentException("Materiel not found"));

        repository
                .findFirstByTenantIdAndMaterielIdAndStatusOrderByDateDebutDesc(
                        tenantId, materielId, MaterielAffectation.STATUS_ACTIVE)
                .ifPresentOrElse(
                        active -> {
                            materiel.setStatus("AFFECTE");
                            materiel.setChantierActuelId(
                                    active.getLocationId() != null
                                            ? active.getLocationId().toString()
                                            : active.getChantierRef());
                            materiel.setChantierActuelName(
                                    active.getLocationName() != null
                                            ? active.getLocationName()
                                            : active.getChantierRef());
                        },
                        () -> {
                            materiel.setStatus("DISPONIBLE");
                            materiel.setChantierActuelId(null);
                            materiel.setChantierActuelName(null);
                        });
        materielRepository.save(materiel);
    }

    private static UUID tenantId() {
        return TenantContext.getTenantId();
    }
}
