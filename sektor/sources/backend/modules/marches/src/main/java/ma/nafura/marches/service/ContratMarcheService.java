package ma.nafura.marches.service;

import java.time.OffsetDateTime;
import java.time.Year;
import java.util.List;
import java.util.Locale;
import java.util.Optional;
import java.util.UUID;
import ma.nafura.marches.api.request.BpuLigneInputDto;
import ma.nafura.marches.api.request.ContratMarcheCreateDto;
import ma.nafura.marches.api.request.ContratMarcheUpdateDto;
import ma.nafura.marches.domain.model.BpuLigne;
import ma.nafura.marches.domain.model.ContratMarche;
import ma.nafura.marches.repository.BpuLigneRepository;
import ma.nafura.marches.repository.ContratMarcheRepository;
import ma.nafura.platform.framework.context.TenantContext;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.util.StringUtils;

@Service
public class ContratMarcheService {

    private final ContratMarcheRepository contratRepository;
    private final BpuLigneRepository ligneRepository;
    private final ContratMarcheSeedService seedService;

    public ContratMarcheService(
            ContratMarcheRepository contratRepository,
            BpuLigneRepository ligneRepository,
            ContratMarcheSeedService seedService) {
        this.contratRepository = contratRepository;
        this.ligneRepository = ligneRepository;
        this.seedService = seedService;
    }

    @Transactional(readOnly = true)
    public List<ContratMarche> list(String status, String chantierId, String clientId, String search) {
        seedService.seedIfEmpty();
        UUID tenantId = tenantId();
        List<ContratMarche> rows = loadRows(tenantId, status, chantierId, clientId);
        if (StringUtils.hasText(search)) {
            String term = search.trim().toLowerCase(Locale.ROOT);
            rows = rows.stream().filter(c -> matchesSearch(c, term)).toList();
        }
        return rows;
    }

    @Transactional(readOnly = true)
    public ContratMarche getById(String id) {
        seedService.seedIfEmpty();
        return resolveContrat(id).orElseThrow(() -> new IllegalArgumentException("Contrat marché not found"));
    }

    @Transactional
    public ContratMarche create(ContratMarcheCreateDto request) {
        UUID tenantId = tenantId();
        String id = StringUtils.hasText(request.getId()) ? request.getId().trim() : nextContratId(tenantId);
        if (contratRepository.findByIdAndTenantId(id, tenantId).isPresent()) {
            throw new IllegalArgumentException("Contrat marché id already exists: " + id);
        }
        String numero = StringUtils.hasText(request.getNumero()) ? request.getNumero().trim() : nextNumero(tenantId);
        ContratMarche entity = ContratMarche.builder()
                .id(id)
                .tenantId(tenantId)
                .numero(numero)
                .reference(trimOrNull(request.getReference()))
                .intitule(request.getIntitule().trim())
                .chantierId(request.getChantierId().trim())
                .chantierCode(trimOrNull(request.getChantierCode()))
                .chantierNom(trimOrNull(request.getChantierNom()))
                .clientId(request.getClientId().trim())
                .clientNom(trimOrNull(request.getClientNom()))
                .typeMarche(resolveTypeMarche(request.getTypeMarche(), ContratMarche.TYPE_FORFAITAIRE))
                .typeCcagT(resolveTypeCcag(request.getTypeCcagT(), ContratMarche.CCAG_TRAVAUX))
                .natureMarche(trimOrNull(request.getNatureMarche()))
                .dateNotification(request.getDateNotification())
                .dateDemarrage(request.getDateDemarrage())
                .dureeMois(request.getDureeMois())
                .montantHt(request.getMontantHt() != null ? request.getMontantHt() : java.math.BigDecimal.ZERO)
                .tauxTva(request.getTauxTva() != null ? request.getTauxTva() : new java.math.BigDecimal("20"))
                .tauxRg(request.getTauxRg() != null ? request.getTauxRg() : new java.math.BigDecimal("7"))
                .tauxRas(request.getTauxRas() != null ? request.getTauxRas() : java.math.BigDecimal.ZERO)
                .tauxAvance(request.getTauxAvance())
                .status(resolveStatus(request.getStatus(), ContratMarche.STATUS_BROUILLON))
                .build();
        return contratRepository.save(entity);
    }

    @Transactional
    public ContratMarche update(String id, ContratMarcheUpdateDto request) {
        ContratMarche entity = getById(id);
        if (request.getReference() != null) {
            entity.setReference(trimOrNull(request.getReference()));
        }
        if (request.getIntitule() != null) {
            entity.setIntitule(request.getIntitule().trim());
        }
        if (request.getChantierId() != null) {
            entity.setChantierId(request.getChantierId().trim());
        }
        if (request.getChantierCode() != null) {
            entity.setChantierCode(trimOrNull(request.getChantierCode()));
        }
        if (request.getChantierNom() != null) {
            entity.setChantierNom(trimOrNull(request.getChantierNom()));
        }
        if (request.getClientId() != null) {
            entity.setClientId(request.getClientId().trim());
        }
        if (request.getClientNom() != null) {
            entity.setClientNom(trimOrNull(request.getClientNom()));
        }
        if (request.getTypeMarche() != null) {
            entity.setTypeMarche(resolveTypeMarche(request.getTypeMarche(), entity.getTypeMarche()));
        }
        if (request.getTypeCcagT() != null) {
            entity.setTypeCcagT(resolveTypeCcag(request.getTypeCcagT(), entity.getTypeCcagT()));
        }
        if (request.getNatureMarche() != null) {
            entity.setNatureMarche(trimOrNull(request.getNatureMarche()));
        }
        if (request.getDateNotification() != null) {
            entity.setDateNotification(request.getDateNotification());
        }
        if (request.getDateDemarrage() != null) {
            entity.setDateDemarrage(request.getDateDemarrage());
        }
        if (request.getDureeMois() != null) {
            entity.setDureeMois(request.getDureeMois());
        }
        if (request.getMontantHt() != null) {
            entity.setMontantHt(request.getMontantHt());
        }
        if (request.getTauxTva() != null) {
            entity.setTauxTva(request.getTauxTva());
        }
        if (request.getTauxRg() != null) {
            entity.setTauxRg(request.getTauxRg());
        }
        if (request.getTauxRas() != null) {
            entity.setTauxRas(request.getTauxRas());
        }
        if (request.getTauxAvance() != null) {
            entity.setTauxAvance(request.getTauxAvance());
        }
        if (request.getStatus() != null) {
            entity.setStatus(resolveStatus(request.getStatus(), entity.getStatus()));
        }
        entity.setUpdatedAt(OffsetDateTime.now());
        return contratRepository.save(entity);
    }

    @Transactional
    public void delete(String id) {
        ContratMarche entity = getById(id);
        contratRepository.delete(entity);
    }

    @Transactional
    public ContratMarche notifier(String id) {
        ContratMarche entity = getById(id);
        if (!ContratMarche.STATUS_BROUILLON.equals(entity.getStatus())) {
            throw new IllegalStateException("Only draft contracts can be notified");
        }
        entity.setStatus(ContratMarche.STATUS_NOTIFIE);
        if (entity.getDateNotification() == null) {
            entity.setDateNotification(java.time.LocalDate.now());
        }
        entity.setUpdatedAt(OffsetDateTime.now());
        return contratRepository.save(entity);
    }

    @Transactional
    public ContratMarche cloturer(String id) {
        ContratMarche entity = getById(id);
        if (ContratMarche.STATUS_CLOS.equals(entity.getStatus())) {
            throw new IllegalStateException("Contract is already closed");
        }
        entity.setStatus(ContratMarche.STATUS_CLOS);
        entity.setUpdatedAt(OffsetDateTime.now());
        return contratRepository.save(entity);
    }

    @Transactional(readOnly = true)
    public List<BpuLigne> listLignes(String contratId) {
        ContratMarche contrat = getById(contratId);
        return ligneRepository.findByTenantIdAndContratMarcheIdOrderByOrdreAsc(tenantId(), contrat.getId());
    }

    @Transactional
    public BpuLigne addLigne(String contratId, BpuLigneInputDto request) {
        ContratMarche contrat = getById(contratId);
        UUID tenantId = tenantId();
        int ordre = request.getOrdre() != null
                ? request.getOrdre()
                : (int) ligneRepository.countByTenantIdAndContratMarcheId(tenantId, contrat.getId());
        String ligneId = StringUtils.hasText(request.getId())
                ? request.getId().trim()
                : contrat.getId() + "-bpu-" + (ordre + 1);
        BpuLigne ligne = BpuLigne.builder()
                .id(ligneId)
                .tenantId(tenantId)
                .contratMarcheId(contrat.getId())
                .posteCode(request.getPosteCode().trim())
                .designation(request.getDesignation().trim())
                .unite(request.getUnite().trim())
                .quantite(request.getQuantite())
                .prixUnitaireHt(request.getPrixUnitaireHt())
                .ordre(ordre)
                .build();
        ligne.recomputeMontant();
        return ligneRepository.save(ligne);
    }

    private List<ContratMarche> loadRows(UUID tenantId, String status, String chantierId, String clientId) {
        boolean hasStatus = StringUtils.hasText(status);
        boolean hasChantier = StringUtils.hasText(chantierId);
        boolean hasClient = StringUtils.hasText(clientId);

        if (hasStatus && hasChantier) {
            return contratRepository.findByTenantIdAndStatusAndChantierIdOrderByCreatedAtDesc(
                    tenantId, status.trim(), chantierId.trim());
        }
        if (hasStatus) {
            return contratRepository.findByTenantIdAndStatusOrderByCreatedAtDesc(tenantId, status.trim());
        }
        if (hasChantier) {
            return contratRepository.findByTenantIdAndChantierIdOrderByCreatedAtDesc(tenantId, chantierId.trim());
        }
        if (hasClient) {
            return contratRepository.findByTenantIdAndClientIdOrderByCreatedAtDesc(tenantId, clientId.trim());
        }
        return contratRepository.findByTenantIdOrderByCreatedAtDesc(tenantId);
    }

    private Optional<ContratMarche> resolveContrat(String idOrNumero) {
        UUID tenantId = tenantId();
        if (!StringUtils.hasText(idOrNumero)) {
            return Optional.empty();
        }
        String key = idOrNumero.trim();
        Optional<ContratMarche> byId = contratRepository.findByIdAndTenantId(key, tenantId);
        if (byId.isPresent()) {
            return byId;
        }
        return contratRepository.findByTenantIdAndNumero(tenantId, key);
    }

    private String nextNumero(UUID tenantId) {
        long count = contratRepository.countByTenantId(tenantId) + 1;
        return "MAR-" + Year.now().getValue() + "-" + String.format("%03d", count);
    }

    private String nextContratId(UUID tenantId) {
        long count = contratRepository.countByTenantId(tenantId) + 1;
        return "mar-" + String.format("%03d", count);
    }

    private String resolveTypeMarche(String requested, String fallback) {
        if (!StringUtils.hasText(requested)) {
            return fallback;
        }
        String normalized = requested.trim().toUpperCase(Locale.ROOT);
        return switch (normalized) {
            case "FORFAIT" -> ContratMarche.TYPE_FORFAITAIRE;
            case ContratMarche.TYPE_FORFAITAIRE,
                    ContratMarche.TYPE_BPU,
                    ContratMarche.TYPE_METRE_QUANTITATIF,
                    ContratMarche.TYPE_MIXTE,
                    ContratMarche.TYPE_REGIE -> normalized;
            default -> fallback;
        };
    }

    private String resolveTypeCcag(String requested, String fallback) {
        if (!StringUtils.hasText(requested)) {
            return fallback;
        }
        String normalized = requested.trim().toUpperCase(Locale.ROOT);
        return switch (normalized) {
            case ContratMarche.CCAG_TRAVAUX, ContratMarche.CCAG_SERVICE, ContratMarche.CCAG_FOURNITURE -> normalized;
            default -> fallback;
        };
    }

    private String resolveStatus(String requested, String fallback) {
        if (!StringUtils.hasText(requested)) {
            return fallback;
        }
        String normalized = requested.trim().toUpperCase(Locale.ROOT);
        return switch (normalized) {
            case ContratMarche.STATUS_BROUILLON,
                    ContratMarche.STATUS_NOTIFIE,
                    ContratMarche.STATUS_EN_COURS,
                    ContratMarche.STATUS_RECEPTION_PROVISOIRE,
                    ContratMarche.STATUS_RECEPTION_DEFINITIVE,
                    ContratMarche.STATUS_CLOS,
                    "SIGNE" -> normalized.equals("SIGNE") ? ContratMarche.STATUS_NOTIFIE : normalized;
            case "EN_EXECUTION" -> ContratMarche.STATUS_EN_COURS;
            case "CLOTURE" -> ContratMarche.STATUS_CLOS;
            default -> fallback;
        };
    }

    private boolean matchesSearch(ContratMarche c, String term) {
        return contains(c.getNumero(), term)
                || contains(c.getIntitule(), term)
                || contains(c.getReference(), term)
                || contains(c.getChantierCode(), term)
                || contains(c.getChantierNom(), term)
                || contains(c.getClientNom(), term);
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
