package ma.nafura.chantiers.service;

import java.time.LocalDate;
import java.util.List;
import java.util.Optional;
import java.util.UUID;
import ma.nafura.chantiers.api.dto.ChantierAffectationDto;
import ma.nafura.chantiers.api.request.ChantierAffectationCreateDto;
import ma.nafura.chantiers.api.request.ChantierAffectationUpdateDto;
import ma.nafura.chantiers.domain.chantier.ChantierRoleCodes;
import ma.nafura.chantiers.domain.chantier.ChantierAffectation;
import ma.nafura.chantiers.repository.ChantierAffectationRepository;
import ma.nafura.chantiers.repository.ChantierRepository;
import ma.nafura.platform.framework.context.TenantContext;
import ma.nafura.rh.domain.employe.Employe;
import ma.nafura.rh.repository.EmployeRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.util.StringUtils;

@Service
public class ChantierAffectationService {

    private final ChantierAffectationRepository repository;
    private final ChantierRepository chantierRepository;
    private final EmployeRepository employeRepository;
    private final ChantierAffectationPolicy policy;

    public ChantierAffectationService(
            ChantierAffectationRepository repository,
            ChantierRepository chantierRepository,
            EmployeRepository employeRepository,
            ChantierAffectationPolicy policy) {
        this.repository = repository;
        this.chantierRepository = chantierRepository;
        this.employeRepository = employeRepository;
        this.policy = policy;
    }

    @Transactional(readOnly = true)
    public List<ChantierAffectationDto> listByChantier(String chantierId) {
        requireChantier(chantierId);
        int actorGrade = policy.actorGradeOn(chantierId);
        return repository
                .findByTenantIdAndChantierIdAndIsActiveTrueOrderByRoleCodeAscEmployeIdAsc(tenantId(), chantierId)
                .stream()
                .map(entity -> toDto(entity, actorGrade))
                .toList();
    }

    @Transactional(readOnly = true)
    public List<String> assignableRoles(String chantierId) {
        requireChantier(chantierId);
        return policy.assignableRoles(chantierId);
    }

    @Transactional(readOnly = true)
    public List<ChantierAffectationDto> listByEmploye(String employeId) {
        requireEmploye(employeId);
        return repository
                .findByTenantIdAndEmployeIdAndIsActiveTrueOrderByChantierIdAsc(tenantId(), employeId)
                .stream()
                .map(this::toDtoWithoutActor)
                .toList();
    }

    @Transactional
    public ChantierAffectationDto create(String chantierId, ChantierAffectationCreateDto request) {
        requireChantier(chantierId);
        Employe employe = requireEmploye(request.getEmployeId());
        String roleCode = requireAffectableRole(request.getRoleCode());
        policy.assertCanMutate(chantierId, roleCode);
        LocalDate dateDebut = request.getDateDebut() != null ? request.getDateDebut() : LocalDate.now();
        LocalDate dateFin = request.getDateFin();
        if (dateFin != null && dateFin.isBefore(dateDebut)) {
            throw new IllegalArgumentException("dateFin must be on or after dateDebut");
        }

        UUID tenantId = tenantId();
        repository
                .findByTenantIdAndChantierIdAndEmployeIdAndRoleCodeAndIsActiveTrue(
                        tenantId, chantierId, employe.getId(), roleCode)
                .ifPresent(existing -> {
                    throw new IllegalArgumentException(
                            "Active affectation already exists for employe/role on this chantier");
                });

        String id = "aff-" + UUID.randomUUID();
        ChantierAffectation entity = ChantierAffectation.builder()
                .id(id)
                .tenantId(tenantId)
                .chantierId(chantierId)
                .employeId(employe.getId())
                .roleCode(roleCode)
                .dateDebut(dateDebut)
                .dateFin(dateFin)
                .isActive(Boolean.TRUE)
                .build();
        return toDto(repository.save(entity), employe, policy.actorGradeOn(chantierId));
    }

    @Transactional
    public ChantierAffectationDto update(String chantierId, String affectationId, ChantierAffectationUpdateDto request) {
        requireChantier(chantierId);
        ChantierAffectation entity = requireAffectation(chantierId, affectationId);
        policy.assertCanMutate(chantierId, entity.getRoleCode());

        if (StringUtils.hasText(request.getRoleCode())) {
            String nextRole = requireAffectableRole(request.getRoleCode());
            policy.assertCanMutate(chantierId, nextRole);
            entity.setRoleCode(nextRole);
        }
        if (request.getDateDebut() != null) {
            entity.setDateDebut(request.getDateDebut());
        }
        if (request.getDateFin() != null || (request.getDateFin() == null && request.getDateDebut() != null)) {
            // allow clearing dateFin only when explicitly null via a flag is awkward in JSON;
            // keep dateFin update when provided
            if (request.getDateFin() != null) {
                entity.setDateFin(request.getDateFin());
            }
        }
        if (request.getIsActive() != null) {
            entity.setIsActive(request.getIsActive());
            if (Boolean.FALSE.equals(request.getIsActive()) && entity.getDateFin() == null) {
                entity.setDateFin(LocalDate.now());
            }
        }
        if (entity.getDateFin() != null && entity.getDateFin().isBefore(entity.getDateDebut())) {
            throw new IllegalArgumentException("dateFin must be on or after dateDebut");
        }
        return toDto(repository.save(entity), policy.actorGradeOn(chantierId));
    }

    @Transactional
    public void deactivate(String chantierId, String affectationId) {
        requireChantier(chantierId);
        ChantierAffectation entity = requireAffectation(chantierId, affectationId);
        policy.assertCanMutate(chantierId, entity.getRoleCode());
        entity.setIsActive(Boolean.FALSE);
        if (entity.getDateFin() == null) {
            entity.setDateFin(LocalDate.now());
        }
        repository.save(entity);
    }

    @Transactional(readOnly = true)
    public Optional<ChantierAffectation> findActiveTitulaire(String chantierId, String roleCode, LocalDate onDate) {
        String normalized = ChantierRoleCodes.normalize(roleCode);
        if (normalized == null || !StringUtils.hasText(chantierId)) {
            return Optional.empty();
        }
        LocalDate date = onDate != null ? onDate : LocalDate.now();
        return repository
                .findActiveForChantierRoleOnDate(tenantId(), chantierId, normalized, date)
                .stream()
                .findFirst();
    }

    @Transactional(readOnly = true)
    public List<String> findChantierIdsForEmploye(String employeId, LocalDate onDate) {
        LocalDate date = onDate != null ? onDate : LocalDate.now();
        return repository.findActiveForEmployeOnDate(tenantId(), employeId, date).stream()
                .map(ChantierAffectation::getChantierId)
                .distinct()
                .toList();
    }

    private void requireChantier(String chantierId) {
        chantierRepository
                .findByIdAndTenantId(chantierId, tenantId())
                .orElseThrow(() -> new IllegalArgumentException("Chantier not found"));
    }

    private ChantierAffectation requireAffectation(String chantierId, String affectationId) {
        return repository
                .findByIdAndTenantId(affectationId, tenantId())
                .filter(a -> chantierId.equals(a.getChantierId()))
                .orElseThrow(() -> new IllegalArgumentException("Affectation not found"));
    }

    private Employe requireEmploye(String employeId) {
        return employeRepository
                .findByIdAndTenantId(employeId, tenantId())
                .orElseThrow(() -> new IllegalArgumentException("Employe not found: " + employeId));
    }

    private String requireAffectableRole(String roleCode) {
        String normalized = ChantierRoleCodes.normalize(roleCode);
        if (normalized == null || !ChantierRoleCodes.isAffectable(normalized)) {
            throw new IllegalArgumentException(
                    "Role is not affectable on chantier: " + roleCode
                            + ". Allowed: " + ChantierRoleCodes.affectableRoles());
        }
        return normalized;
    }

    private ChantierAffectationDto toDtoWithoutActor(ChantierAffectation entity) {
        return toDto(entity, resolveEmploye(entity), false);
    }

    private ChantierAffectationDto toDto(ChantierAffectation entity, int actorGrade) {
        return toDto(
                entity,
                resolveEmploye(entity),
                ChantierRoleCodes.canCommand(actorGrade, entity.getRoleCode()));
    }

    private ChantierAffectationDto toDto(ChantierAffectation entity, Employe employe, int actorGrade) {
        return toDto(entity, employe, ChantierRoleCodes.canCommand(actorGrade, entity.getRoleCode()));
    }

    private Employe resolveEmploye(ChantierAffectation entity) {
        return employeRepository.findByIdAndTenantId(entity.getEmployeId(), tenantId()).orElse(null);
    }

    private ChantierAffectationDto toDto(ChantierAffectation entity, Employe employe, boolean canMutate) {
        String nom = null;
        String matricule = null;
        UUID userId = null;
        if (employe != null) {
            nom = (employe.getPrenom() + " " + employe.getNom()).trim();
            matricule = employe.getMatricule();
            userId = employe.getUserId();
        }
        return ChantierAffectationDto.builder()
                .id(entity.getId())
                .chantierId(entity.getChantierId())
                .employeId(entity.getEmployeId())
                .employeNom(nom)
                .employeMatricule(matricule)
                .userId(userId)
                .roleCode(entity.getRoleCode())
                .roleLabel(ChantierRoleCodes.label(entity.getRoleCode()))
                .dateDebut(entity.getDateDebut())
                .dateFin(entity.getDateFin())
                .isActive(entity.getIsActive())
                .canMutate(canMutate)
                .build();
    }

    private UUID tenantId() {
        return TenantContext.getTenantId();
    }
}
