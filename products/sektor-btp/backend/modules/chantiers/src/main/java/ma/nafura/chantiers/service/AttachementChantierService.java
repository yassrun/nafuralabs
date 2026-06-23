package ma.nafura.chantiers.service;

import java.math.BigDecimal;
import java.util.List;
import java.util.UUID;
import ma.nafura.chantiers.api.dto.AttachementChantierDto;
import ma.nafura.chantiers.api.dto.AttachementLigneDto;
import ma.nafura.chantiers.api.request.AttachementChantierCreateDto;
import ma.nafura.chantiers.api.request.AttachementLigneInputDto;
import ma.nafura.chantiers.domain.model.AttachementChantier;
import ma.nafura.chantiers.domain.model.AttachementLigne;
import ma.nafura.chantiers.domain.model.Chantier;
import ma.nafura.chantiers.repository.AttachementChantierRepository;
import ma.nafura.chantiers.repository.AttachementLigneRepository;
import ma.nafura.platform.framework.context.TenantContext;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.util.StringUtils;

@Service
public class AttachementChantierService {

    private final AttachementChantierRepository repository;
    private final AttachementLigneRepository ligneRepository;
    private final ChantierService chantierService;
    private final ChantierDocumentsSeedService seedService;

    public AttachementChantierService(
            AttachementChantierRepository repository,
            AttachementLigneRepository ligneRepository,
            ChantierService chantierService,
            ChantierDocumentsSeedService seedService) {
        this.repository = repository;
        this.ligneRepository = ligneRepository;
        this.chantierService = chantierService;
        this.seedService = seedService;
    }

    @Transactional(readOnly = true)
    public List<AttachementChantierDto> listAll() {
        seedService.seedIfEmpty();
        return repository.findByTenantIdOrderByDateDescCreatedAtDesc(tenantId()).stream()
                .map(this::toDto)
                .toList();
    }

    @Transactional(readOnly = true)
    public List<AttachementChantierDto> listByChantier(String chantierId) {
        seedService.seedIfEmpty();
        Chantier chantier = chantierService.getById(chantierId);
        return repository
                .findByTenantIdAndChantierIdOrderByDateDescCreatedAtDesc(tenantId(), chantierId)
                .stream()
                .map(row -> toDto(row, chantier))
                .toList();
    }

    @Transactional(readOnly = true)
    public AttachementChantierDto getById(String id) {
        seedService.seedIfEmpty();
        AttachementChantier row = getEntity(id);
        return toDto(row);
    }

    @Transactional
    public AttachementChantierDto create(String chantierId, AttachementChantierCreateDto body) {
        Chantier chantier = chantierService.getById(chantierId);
        String id = "att-" + UUID.randomUUID();
        String numero = "ATT-" + chantier.getCode() + "-" + body.getDate();
        AttachementChantier entity = AttachementChantier.builder()
                .id(id)
                .tenantId(tenantId())
                .chantierId(chantierId)
                .numero(numero)
                .date(body.getDate())
                .meteoCode(body.getMeteoCode())
                .temperatureC(body.getTemperatureC())
                .effectifPresent(body.getEffectifPresent())
                .status(AttachementChantier.STATUS_BROUILLON)
                .signatureMoeDataUrl(body.getSignatureMoeDataUrl())
                .build();
        repository.save(entity);
        saveLignes(id, body.getLignes());
        return toDto(entity, chantier);
    }

    @Transactional
    public AttachementChantierDto soumettreSignature(String id) {
        AttachementChantier entity = getEntity(id);
        entity.setStatus(AttachementChantier.STATUS_EN_ATTENTE_MOE);
        return toDto(repository.save(entity));
    }

    @Transactional
    public AttachementChantierDto applySignature(String attachementId, String signatureBase64) {
        AttachementChantier entity = getEntity(attachementId);
        String dataUrl = signatureBase64.startsWith("data:")
                ? signatureBase64
                : "data:image/png;base64," + signatureBase64;
        entity.setSignatureMoeDataUrl(dataUrl);
        if (AttachementChantier.STATUS_EN_ATTENTE_MOE.equals(entity.getStatus())
                || AttachementChantier.STATUS_BROUILLON.equals(entity.getStatus())) {
            entity.setStatus(AttachementChantier.STATUS_SIGNE_MOE);
        }
        return toDto(repository.save(entity));
    }

    private void saveLignes(String attachementId, List<AttachementLigneInputDto> lignes) {
        if (lignes == null) {
            return;
        }
        int ordre = 0;
        for (AttachementLigneInputDto ligne : lignes) {
            ligneRepository.save(AttachementLigne.builder()
                    .id(attachementId + "-l-" + ordre)
                    .tenantId(tenantId())
                    .attachementId(attachementId)
                    .posteCode(ligne.getPosteCode().trim())
                    .designation(ligne.getDesignation().trim())
                    .quantiteExecutee(ligne.getQuantiteExecutee())
                    .unite(ligne.getUnite().trim())
                    .zone(StringUtils.hasText(ligne.getZone()) ? ligne.getZone().trim() : null)
                    .ordre(ordre++)
                    .build());
        }
    }

    private AttachementChantier getEntity(String id) {
        return repository
                .findByTenantIdAndId(tenantId(), id)
                .orElseThrow(() -> new IllegalArgumentException("Attachement not found: " + id));
    }

    private AttachementChantierDto toDto(AttachementChantier row) {
        Chantier chantier = chantierService.getById(row.getChantierId());
        return toDto(row, chantier);
    }

    private AttachementChantierDto toDto(AttachementChantier row, Chantier chantier) {
        List<AttachementLigne> lignes =
                ligneRepository.findByTenantIdAndAttachementIdOrderByOrdreAsc(tenantId(), row.getId());
        return AttachementChantierDto.builder()
                .id(row.getId())
                .numero(row.getNumero())
                .chantierId(row.getChantierId())
                .chantierCode(chantier.getCode())
                .date(row.getDate())
                .meteoCode(row.getMeteoCode())
                .temperatureC(row.getTemperatureC())
                .effectifPresent(row.getEffectifPresent())
                .lignes(lignes.stream().map(this::toLigneDto).toList())
                .status(row.getStatus())
                .signatureMoeDataUrl(row.getSignatureMoeDataUrl())
                .build();
    }

    private AttachementLigneDto toLigneDto(AttachementLigne row) {
        return AttachementLigneDto.builder()
                .posteCode(row.getPosteCode())
                .designation(row.getDesignation())
                .quantiteExecutee(row.getQuantiteExecutee())
                .unite(row.getUnite())
                .zone(row.getZone())
                .build();
    }

    private UUID tenantId() {
        return TenantContext.getTenantId();
    }
}
