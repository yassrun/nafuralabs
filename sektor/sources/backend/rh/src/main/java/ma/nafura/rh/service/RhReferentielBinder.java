package ma.nafura.rh.service;

import ma.nafura.rh.domain.referentiel.RhDepartement;
import ma.nafura.rh.domain.referentiel.RhPoste;
import ma.nafura.rh.repository.RhDepartementRepository;
import ma.nafura.rh.repository.RhPosteRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.util.StringUtils;

@Service
public class RhReferentielBinder {

    public record Bound(
            String posteId, String poste, String departementId, String departement) {}

    private final RhPosteRepository posteRepository;
    private final RhDepartementRepository departementRepository;
    private final RhPosteService posteService;
    private final RhDepartementService departementService;

    public RhReferentielBinder(
            RhPosteRepository posteRepository,
            RhDepartementRepository departementRepository,
            RhPosteService posteService,
            RhDepartementService departementService) {
        this.posteRepository = posteRepository;
        this.departementRepository = departementRepository;
        this.posteService = posteService;
        this.departementService = departementService;
    }

    @Transactional
    public Bound bind(String posteId, String posteLibelle, String departementId, String departementLibelle) {
        RhPoste poste = resolvePoste(posteId, posteLibelle);
        RhDepartement departement = resolveDepartement(departementId, departementLibelle);
        return new Bound(
                poste.getId(),
                poste.getLibelle(),
                departement == null ? null : departement.getId(),
                departement == null ? null : departement.getLibelle());
    }

    private RhPoste resolvePoste(String posteId, String posteLibelle) {
        if (StringUtils.hasText(posteId)) {
            return posteService.getById(posteId.trim());
        }
        if (!StringUtils.hasText(posteLibelle)) {
            throw new IllegalArgumentException("Poste RH requis");
        }
        return posteService.ensure(
                RhNomenclatureCodes.slug(posteLibelle, "P", 1), posteLibelle.trim());
    }

    private RhDepartement resolveDepartement(String departementId, String departementLibelle) {
        if (StringUtils.hasText(departementId)) {
            return departementService.getById(departementId.trim());
        }
        if (!StringUtils.hasText(departementLibelle)) {
            return null;
        }
        return departementService.ensure(
                RhNomenclatureCodes.slug(departementLibelle, "D", 1), departementLibelle.trim());
    }

    public String posteName(String posteId) {
        if (!StringUtils.hasText(posteId)) {
            return null;
        }
        return posteRepository
                .findByIdAndTenantId(posteId, RhNomenclatureCodes.tenantId())
                .map(RhPoste::getLibelle)
                .orElse(null);
    }

    public String departementName(String departementId) {
        if (!StringUtils.hasText(departementId)) {
            return null;
        }
        return departementRepository
                .findByIdAndTenantId(departementId, RhNomenclatureCodes.tenantId())
                .map(RhDepartement::getLibelle)
                .orElse(null);
    }
}
