package ma.nafura.finance.service;

import java.math.BigDecimal;
import java.util.List;
import java.util.UUID;
import ma.nafura.finance.api.dto.CaisseDto;
import ma.nafura.finance.api.dto.CaisseMouvementDto;
import ma.nafura.finance.api.request.CaisseMouvementCreateDto;
import ma.nafura.finance.domain.model.Caisse;
import ma.nafura.finance.domain.model.CaisseMouvement;
import ma.nafura.finance.repository.CaisseMouvementRepository;
import ma.nafura.finance.repository.CaisseRepository;
import ma.nafura.platform.framework.context.TenantContext;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.util.StringUtils;

@Service
public class CaisseService {

    private final CaisseRepository caisseRepository;
    private final CaisseMouvementRepository mouvementRepository;
    private final CaisseSeedService seedService;
    private final CaisseSoldeService soldeService;

    public CaisseService(
            CaisseRepository caisseRepository,
            CaisseMouvementRepository mouvementRepository,
            CaisseSeedService seedService,
            CaisseSoldeService soldeService) {
        this.caisseRepository = caisseRepository;
        this.mouvementRepository = mouvementRepository;
        this.seedService = seedService;
        this.soldeService = soldeService;
    }

    @Transactional(readOnly = true)
    public List<CaisseDto> list(String type, String chantierId) {
        seedService.ensureTenantDefaults();
        List<Caisse> rows;
        if (StringUtils.hasText(type) && StringUtils.hasText(chantierId)) {
            rows = caisseRepository.findByTenantIdAndCaisseTypeAndChantierIdOrderByNameAsc(
                    tenantId(), type, chantierId);
        } else if (StringUtils.hasText(type)) {
            rows = caisseRepository.findByTenantIdAndCaisseTypeOrderByNameAsc(tenantId(), type);
        } else {
            rows = caisseRepository.findByTenantIdOrderByNameAsc(tenantId());
        }
        return rows.stream().map(this::toDto).toList();
    }

    @Transactional(readOnly = true)
    public BigDecimal getSolde(UUID caisseId) {
        Caisse caisse = requireCaisse(caisseId);
        return soldeService.computeBalance(caisse, tenantId());
    }

    @Transactional(readOnly = true)
    public List<CaisseMouvementDto> listMouvements(UUID caisseId) {
        requireCaisse(caisseId);
        return mouvementRepository
                .findByTenantIdAndCaisseIdOrderByMovementDateDescCreatedAtDesc(tenantId(), caisseId)
                .stream()
                .map(this::toMouvementDto)
                .toList();
    }

    @Transactional
    public CaisseMouvementDto createMouvement(CaisseMouvementCreateDto request) {
        requireCaisse(request.getCaisseId());
        String status = StringUtils.hasText(request.getStatus())
                ? request.getStatus()
                : CaisseMouvement.STATUS_VALIDE;
        CaisseMouvement entity = CaisseMouvement.builder()
                .tenantId(tenantId())
                .caisseId(request.getCaisseId())
                .movementDate(request.getDate())
                .movementType(request.getType())
                .amount(request.getMontant())
                .category(request.getCategorie())
                .description(request.getDescription())
                .photoTicketUrl(request.getPhotoTicketUrl())
                .geolocLat(request.getGeolocLat())
                .geolocLng(request.getGeolocLng())
                .workflowStatus(status)
                .build();
        return toMouvementDto(mouvementRepository.save(entity));
    }

    @Transactional
    public CaisseMouvementDto validerMouvement(UUID id) {
        CaisseMouvement entity = mouvementRepository
                .findByIdAndTenantId(id, tenantId())
                .orElseThrow(() -> new IllegalArgumentException("Movement not found"));
        entity.setWorkflowStatus(CaisseMouvement.STATUS_VALIDE);
        return toMouvementDto(mouvementRepository.save(entity));
    }

    private CaisseDto toDto(Caisse entity) {
        return CaisseDto.builder()
                .id(entity.getId())
                .caisseType(entity.getCaisseType())
                .code(entity.getCode())
                .name(entity.getName())
                .chantierId(entity.getChantierId())
                .chantierLabel(entity.getChantierLabel())
                .chefChantierId(entity.getChefChantierId())
                .chefChantierName(entity.getChefChantierName())
                .currencyCode(entity.getCurrencyCode())
                .glAccountCode(entity.getGlAccountCode())
                .soldeInitial(entity.getOpeningBalance())
                .soldeActuel(soldeService.computeBalance(entity, tenantId()))
                .status(entity.getStatus())
                .dateOuverture(entity.getOpenedAt())
                .dateCloture(entity.getClosedAt())
                .notes(entity.getNotes())
                .build();
    }

    private CaisseMouvementDto toMouvementDto(CaisseMouvement entity) {
        CaisseMouvementDto.GeolocDto geoloc = null;
        if (entity.getGeolocLat() != null && entity.getGeolocLng() != null) {
            geoloc = CaisseMouvementDto.GeolocDto.builder()
                    .lat(entity.getGeolocLat())
                    .lng(entity.getGeolocLng())
                    .build();
        }
        return CaisseMouvementDto.builder()
                .id(entity.getId())
                .caisseId(entity.getCaisseId())
                .date(entity.getMovementDate())
                .type(entity.getMovementType())
                .montant(entity.getAmount())
                .categorie(entity.getCategory())
                .description(entity.getDescription())
                .photoTicketUrl(entity.getPhotoTicketUrl())
                .geoloc(geoloc)
                .validePar(entity.getValidatedBy())
                .status(entity.getWorkflowStatus())
                .build();
    }

    private Caisse requireCaisse(UUID id) {
        return caisseRepository
                .findByIdAndTenantId(id, tenantId())
                .orElseThrow(() -> new IllegalArgumentException("Caisse not found"));
    }

    private static UUID tenantId() {
        return TenantContext.getTenantId();
    }
}
