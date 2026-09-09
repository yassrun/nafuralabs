package ma.nafura.sektor.dev;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.UUID;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import ma.nafura.platform.framework.context.TenantContext;
import ma.nafura.platform.identity.domain.model.AppUser;
import ma.nafura.platform.identity.repository.AppUserRepository;
import ma.nafura.platform.tenancy.domain.model.Tenant;
import ma.nafura.platform.tenancy.repository.TenantRepository;
import ma.nafura.rh.api.request.RhNomenclatureUpdateDto;
import ma.nafura.rh.domain.employe.Employe;
import ma.nafura.rh.repository.EmployeRepository;
import ma.nafura.rh.service.RhNomenclatureCodes;
import ma.nafura.rh.service.RhPosteService;
import ma.nafura.rh.service.RhReferentielBinder;
import ma.nafura.socle.dev.config.QaLocalConstants;
import org.springframework.boot.ApplicationArguments;
import org.springframework.boot.ApplicationRunner;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.core.annotation.Order;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

/**
 * Mode B: one RH {@link Employe} per QA identity so chantier affectations can bind a user.
 */
@Slf4j
@Component
@Order(110)
@RequiredArgsConstructor
@ConditionalOnProperty(name = "nafura.dev.cursor-auth-enabled", havingValue = "true")
public class QaLocalEmployeProvisioner implements ApplicationRunner {

    private final TenantRepository tenantRepository;
    private final AppUserRepository appUserRepository;
    private final EmployeRepository employeRepository;
    private final RhReferentielBinder referentielBinder;
    private final RhPosteService posteService;

    @Override
    @Transactional
    public void run(ApplicationArguments args) {
        Tenant tenant = tenantRepository.findByKey(QaLocalConstants.TENANT_KEY).orElse(null);
        if (tenant == null) {
            log.warn("QA employes skipped: tenant {} missing", QaLocalConstants.TENANT_KEY);
            return;
        }
        UUID previous = TenantContext.getTenantIdOrNull();
        try {
            TenantContext.setTenantId(tenant.getId());
            ensureEmploye(
                tenant.getId(),
                "qa-emp-owner",
                "QA-OWN",
                "QA00000",
                "Owner",
                "QA",
                QaLocalConstants.OWNER_EMAIL,
                "Gérant",
                "Cadre"
            );
            int index = 1;
            for (QaLocalConstants.RoleUser roleUser : QaLocalConstants.ROLE_USERS) {
                String suffix = roleUser.alias().replace("-", "").toUpperCase();
                if (suffix.length() > 6) {
                    suffix = suffix.substring(0, 6);
                }
                ensureEmploye(
                    tenant.getId(),
                    "qa-emp-" + roleUser.alias(),
                    "QA-" + suffix,
                    String.format("QA%05d", index++),
                    familyName(roleUser.name()),
                    "QA",
                    roleUser.email(),
                    posteLibelle(roleUser.tenantRoleCode()),
                    categorie(roleUser.tenantRoleCode())
                );
            }
        } finally {
            if (previous != null) {
                TenantContext.setTenantId(previous);
            } else {
                TenantContext.clear();
            }
        }
    }

    private void ensureEmploye(
        UUID tenantId,
        String id,
        String matricule,
        String cin,
        String nom,
        String prenom,
        String email,
        String poste,
        String categorie
    ) {
        AppUser user = appUserRepository.findByEmailIgnoreCase(email).orElse(null);
        UUID userId = user != null ? user.getId() : null;
        Employe existing = employeRepository.findByIdAndTenantId(id, tenantId).orElse(null);
        if (existing != null) {
            boolean dirty = false;
            if (userId != null && !userId.equals(existing.getUserId())) {
                existing.setUserId(userId);
                dirty = true;
            }
            if (!email.equalsIgnoreCase(existing.getEmail() == null ? "" : existing.getEmail())) {
                existing.setEmail(email);
                dirty = true;
            }
            String wantedPoste = posteLibelle(poste);
            if (existing.getPosteId() != null
                    && existing.getPoste() != null
                    && existing.getPoste().startsWith("BTP_")) {
                RhNomenclatureUpdateDto update = new RhNomenclatureUpdateDto();
                update.setLibelle(wantedPoste);
                update.setCode(RhNomenclatureCodes.slug(wantedPoste, "P", 1));
                posteService.update(existing.getPosteId(), update);
                existing.setPoste(wantedPoste);
                dirty = true;
            } else if (existing.getPosteId() == null || !wantedPoste.equals(existing.getPoste())) {
                applyReferentiel(existing, wantedPoste, existing.getDepartement() != null ? existing.getDepartement() : "QA");
                dirty = true;
            }
            if (dirty) {
                employeRepository.save(existing);
            }
            return;
        }
        if (employeRepository.findByTenantIdAndMatricule(tenantId, matricule).isPresent()) {
            return;
        }
        RhReferentielBinder.Bound bound = referentielBinder.bind(null, posteLibelle(poste), null, "QA");
        employeRepository.save(Employe.builder()
            .id(id)
            .tenantId(tenantId)
            .matricule(matricule)
            .nom(nom)
            .prenom(prenom)
            .cin(cin)
            .email(email)
            .userId(userId)
            .posteId(bound.posteId())
            .poste(bound.poste())
            .departementId(bound.departementId())
            .departement(bound.departement())
            .categorie(categorie)
            .typeContrat("CDI")
            .statut(Employe.STATUT_ACTIF)
            .dateEmbauche(LocalDate.of(2024, 1, 1))
            .salaireBase(BigDecimal.ZERO)
            .build());
    }

    private void applyReferentiel(Employe existing, String posteLibelle, String departementLibelle) {
        RhReferentielBinder.Bound bound =
                referentielBinder.bind(null, posteLibelle, null, departementLibelle);
        existing.setPosteId(bound.posteId());
        existing.setPoste(bound.poste());
        existing.setDepartementId(bound.departementId());
        existing.setDepartement(bound.departement());
    }

    private static String posteLibelle(String roleOrPoste) {
        if (roleOrPoste == null || roleOrPoste.isBlank()) {
            return "Employé";
        }
        return switch (roleOrPoste.trim()) {
            case "BTP_CONDUCTEUR_TRAVAUX" -> "Conducteur de travaux";
            case "BTP_DIRECTEUR_TRAVAUX" -> "Directeur des travaux";
            case "BTP_CHEF_CHANTIER" -> "Chef de chantier";
            case "BTP_INGENIEUR" -> "Ingénieur";
            case "BTP_MAGASINIER" -> "Magasinier";
            case "BTP_DG" -> "Directeur général";
            case "BTP_DAF" -> "Directeur administratif et financier";
            case "Gérant", "OWNER" -> "Gérant";
            default -> roleOrPoste.startsWith("BTP_") ? roleOrPoste.replace('_', ' ') : roleOrPoste;
        };
    }

    private static String familyName(String displayName) {
        String[] parts = displayName.trim().split("\\s+", 2);
        return parts.length > 1 ? parts[1] : displayName;
    }

    private static String categorie(String roleCode) {
        if ("BTP_MAGASINIER".equals(roleCode) || "BTP_CHEF_CHANTIER".equals(roleCode)) {
            return "Agent_maitrise";
        }
        return "Cadre";
    }
}
