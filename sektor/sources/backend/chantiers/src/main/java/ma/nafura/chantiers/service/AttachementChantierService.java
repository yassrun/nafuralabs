package ma.nafura.chantiers.service;

import java.math.BigDecimal;
import java.util.ArrayList;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.UUID;
import ma.nafura.chantiers.api.dto.AttachementChantierDto;
import ma.nafura.chantiers.api.dto.AttachementLigneDto;
import ma.nafura.chantiers.api.request.AttachementChantierCreateDto;
import ma.nafura.chantiers.domain.attachement.AttachementChantier;
import ma.nafura.chantiers.domain.attachement.AttachementLigne;
import ma.nafura.chantiers.domain.avancement.AvancementPhysique;
import ma.nafura.chantiers.domain.budget.PosteBudgetaire;
import ma.nafura.chantiers.domain.chantier.Chantier;
import ma.nafura.chantiers.domain.chantier.ChantierLot;
import ma.nafura.chantiers.domain.chantier.NatureLigne;
import ma.nafura.chantiers.domain.chantier.ZoneChantier;
import ma.nafura.chantiers.repository.AttachementChantierRepository;
import ma.nafura.chantiers.repository.AttachementLigneRepository;
import ma.nafura.chantiers.repository.AvancementPhysiqueRepository;
import ma.nafura.chantiers.repository.ChantierLotRepository;
import ma.nafura.chantiers.repository.PosteBudgetaireRepository;
import ma.nafura.chantiers.repository.ZoneChantierRepository;
import ma.nafura.platform.framework.context.TenantContext;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.util.StringUtils;
import ma.nafura.chantiers.seeders.ChantierDocumentsSeedService;

/**
 * L'attachement lit les quantités de la période — contrat {@code avancement-et-attachement},
 * AC-10 à AC-17.
 *
 * <p>Les lignes ne se tapent plus : elles se montent depuis les déclarations d'avancement de la
 * période (AC-11), filtrées aux nœuds vendus (AC-13). Deux attachements d'un même chantier ne
 * chevauchent jamais (AC-10) — c'est ce qui garantit qu'une quantité n'est jamais attachée deux
 * fois (AC-16), sans registre séparé. La signature MOE ({@link AttachementSignatureService}) fige
 * tout ; avant elle, une contestation renvoie en brouillon et remonte (AC-17).
 */
@Service
public class AttachementChantierService {

    static final String ERR_PERIODE_INVALIDE = "chantiers.attachement.periode_invalide";
    static final String ERR_PERIODE_CHEVAUCHANTE = "chantiers.attachement.periode_chevauchante";
    static final String ERR_PERIODE_SANS_QUANTITE = "chantiers.attachement.periode_sans_quantite_declaree";
    static final String ERR_ATTACHEMENT_FIGE = "chantiers.attachement.deja_signe";
    static final String ERR_ZONE_HORS_CHANTIER = "chantiers.attachement.zone_hors_chantier";

    private final AttachementChantierRepository repository;
    private final AttachementLigneRepository ligneRepository;
    private final ChantierService chantierService;
    private final ChantierDocumentsSeedService seedService;
    private final AvancementPhysiqueRepository avancementRepository;
    private final ChantierLotRepository lotRepository;
    private final PosteBudgetaireRepository posteRepository;
    private final ZoneChantierRepository zoneRepository;

    public AttachementChantierService(
            AttachementChantierRepository repository,
            AttachementLigneRepository ligneRepository,
            ChantierService chantierService,
            ChantierDocumentsSeedService seedService,
            AvancementPhysiqueRepository avancementRepository,
            ChantierLotRepository lotRepository,
            PosteBudgetaireRepository posteRepository,
            ZoneChantierRepository zoneRepository) {
        this.repository = repository;
        this.ligneRepository = ligneRepository;
        this.chantierService = chantierService;
        this.seedService = seedService;
        this.avancementRepository = avancementRepository;
        this.lotRepository = lotRepository;
        this.posteRepository = posteRepository;
        this.zoneRepository = zoneRepository;
    }

    @Transactional(readOnly = true)
    public List<AttachementChantierDto> listAll() {
        seedService.seedIfEmpty();
        return repository.findByTenantIdOrderByDateDebutDescCreatedAtDesc(tenantId()).stream()
                .map(this::toDto)
                .toList();
    }

    @Transactional(readOnly = true)
    public List<AttachementChantierDto> listByChantier(String chantierId) {
        seedService.seedIfEmpty();
        Chantier chantier = chantierService.getById(chantierId);
        return repository
                .findByTenantIdAndChantierIdOrderByDateDebutDescCreatedAtDesc(tenantId(), chantierId)
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

    /** AC-10, AC-11, AC-13 — la période, montée depuis les déclarations, filtrée au vendu. */
    @Transactional
    public AttachementChantierDto create(String chantierId, AttachementChantierCreateDto body) {
        Chantier chantier = chantierService.getById(chantierId);
        UUID tenantId = tenantId();

        if (body.getDateFin().isBefore(body.getDateDebut())) {
            throw new IllegalArgumentException(ERR_PERIODE_INVALIDE);
        }
        List<AttachementChantier> chevauchants = repository
                .findByTenantIdAndChantierIdAndDateDebutLessThanEqualAndDateFinGreaterThanEqual(
                        tenantId, chantierId, body.getDateFin(), body.getDateDebut());
        if (!chevauchants.isEmpty()) {
            throw new IllegalArgumentException(
                    ERR_PERIODE_CHEVAUCHANTE + ": " + chevauchants.get(0).getNumero());
        }

        String id = "att-" + UUID.randomUUID();
        AttachementChantier entity = AttachementChantier.builder()
                .id(id)
                .tenantId(tenantId)
                .chantierId(chantierId)
                .numero("ATT-" + chantier.getCode() + "-" + body.getDateDebut() + "_" + body.getDateFin())
                .dateDebut(body.getDateDebut())
                .dateFin(body.getDateFin())
                .meteoCode(body.getMeteoCode())
                .temperatureC(body.getTemperatureC())
                .effectifPresent(body.getEffectifPresent())
                .status(AttachementChantier.STATUS_BROUILLON)
                .signatureMoeDataUrl(body.getSignatureMoeDataUrl())
                .build();

        List<AttachementLigne> lignes = monterLignes(tenantId, entity);
        if (lignes.isEmpty()) {
            throw new IllegalArgumentException(ERR_PERIODE_SANS_QUANTITE);
        }
        repository.save(entity);
        lignes.forEach(ligneRepository::save);
        return toDto(entity, chantier);
    }

    @Transactional
    public AttachementChantierDto soumettreSignature(String id) {
        AttachementChantier entity = getEntity(id);
        entity.setStatus(AttachementChantier.STATUS_EN_ATTENTE_MOE);
        return toDto(repository.save(entity));
    }

    /**
     * AC-17 — tant que l'attachement n'est pas signé, le désaccord se règle sur la déclaration :
     * retour en brouillon, puis remontage depuis les déclarations (déjà corrigées côté nœud).
     */
    @Transactional
    public AttachementChantierDto contester(String id) {
        AttachementChantier entity = getEntity(id);
        garderContreFigeage(entity);
        UUID tenantId = tenantId();
        entity.setStatus(AttachementChantier.STATUS_BROUILLON);

        ligneRepository.deleteByTenantIdAndAttachementId(tenantId, entity.getId());
        List<AttachementLigne> lignes = monterLignes(tenantId, entity);
        if (lignes.isEmpty()) {
            throw new IllegalArgumentException(ERR_PERIODE_SANS_QUANTITE);
        }
        repository.save(entity);
        lignes.forEach(ligneRepository::save);
        return toDto(entity);
    }

    /** AC-14 — la zone d'une ligne, facultative, choisie dans le référentiel du chantier. */
    @Transactional
    public AttachementChantierDto assignerZone(String attachementId, String ligneId, String zoneIdRaw) {
        AttachementChantier attachement = getEntity(attachementId);
        garderContreFigeage(attachement);
        UUID tenantId = tenantId();
        AttachementLigne ligne = ligneRepository
                .findByIdAndTenantId(ligneId, tenantId)
                .filter(row -> attachementId.equals(row.getAttachementId()))
                .orElseThrow(() -> new IllegalArgumentException("Ligne d'attachement introuvable: " + ligneId));

        String zoneId = StringUtils.hasText(zoneIdRaw) ? zoneIdRaw.trim() : null;
        if (zoneId != null) {
            zoneRepository
                    .findByIdAndTenantId(zoneId, tenantId)
                    .filter(zone -> attachement.getChantierId().equals(zone.getChantierId()))
                    .orElseThrow(() -> new IllegalArgumentException(ERR_ZONE_HORS_CHANTIER + ": " + zoneId));
        }
        ligne.setZoneId(zoneId);
        ligneRepository.save(ligne);
        return toDto(attachement);
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

    // ── AC-11, AC-13 : le montage ────────────────────────────────────────────

    private List<AttachementLigne> monterLignes(UUID tenantId, AttachementChantier attachement) {
        List<AvancementPhysique> declarations = avancementRepository.findByTenantIdAndChantierIdAndDateSaisieBetween(
                tenantId, attachement.getChantierId(), attachement.getDateDebut(), attachement.getDateFin());

        Map<String, BigDecimal> sommeParNoeud = new LinkedHashMap<>();
        for (AvancementPhysique declaration : declarations) {
            String noeudId = StringUtils.hasText(declaration.getPosteId())
                    ? declaration.getPosteId()
                    : declaration.getLotId();
            if (!StringUtils.hasText(noeudId)) {
                continue;
            }
            sommeParNoeud.merge(noeudId, declaration.getQuantiteRealisee(), BigDecimal::add);
        }

        List<AttachementLigne> lignes = new ArrayList<>();
        int ordre = 0;
        for (Map.Entry<String, BigDecimal> entry : sommeParNoeud.entrySet()) {
            String noeudId = entry.getKey();
            if (resolveNature(tenantId, noeudId) != NatureLigne.VENDU) {
                continue; // AC-13 — un interne n'entre jamais dans un attachement.
            }
            lignes.add(AttachementLigne.builder()
                    .id(attachement.getId() + "-l-" + ordre)
                    .tenantId(tenantId)
                    .attachementId(attachement.getId())
                    .noeudId(noeudId)
                    .quantitePeriode(entry.getValue())
                    .ordre(ordre++)
                    .build());
        }
        return lignes;
    }

    private NatureLigne resolveNature(UUID tenantId, String noeudId) {
        return posteRepository
                .findByIdAndTenantId(noeudId, tenantId)
                .map(PosteBudgetaire::getNature)
                .or(() -> lotRepository.findByIdAndTenantId(noeudId, tenantId).map(ChantierLot::getNature))
                .orElse(NatureLigne.INTERNE);
    }

    private void garderContreFigeage(AttachementChantier attachement) {
        if (AttachementChantier.STATUTS_FIGES.contains(attachement.getStatus())) {
            throw new IllegalStateException(ERR_ATTACHEMENT_FIGE + ": " + attachement.getId());
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
        UUID tenantId = tenantId();
        List<AttachementLigne> lignes =
                ligneRepository.findByTenantIdAndAttachementIdOrderByOrdreAsc(tenantId, row.getId());
        return AttachementChantierDto.builder()
                .id(row.getId())
                .numero(row.getNumero())
                .chantierId(row.getChantierId())
                .chantierCode(chantier.getCode())
                .dateDebut(row.getDateDebut())
                .dateFin(row.getDateFin())
                .meteoCode(row.getMeteoCode())
                .temperatureC(row.getTemperatureC())
                .effectifPresent(row.getEffectifPresent())
                .lignes(lignes.stream().map(ligne -> toLigneDto(ligne, tenantId)).toList())
                .status(row.getStatus())
                .signatureMoeDataUrl(row.getSignatureMoeDataUrl())
                .build();
    }

    /** AC-12 — code, désignation, unité et prix vendu sont lus sur le nœud, jamais recopiés. */
    private AttachementLigneDto toLigneDto(AttachementLigne row, UUID tenantId) {
        NoeudInfo info = resolveNoeudInfo(tenantId, row.getNoeudId());
        BigDecimal montant = info.prixUnitaireVendu() != null
                ? row.getQuantitePeriode().multiply(info.prixUnitaireVendu())
                : null;
        String zoneLibelle = StringUtils.hasText(row.getZoneId())
                ? zoneRepository
                        .findByIdAndTenantId(row.getZoneId(), tenantId)
                        .map(ZoneChantier::getDesignation)
                        .orElse(null)
                : null;
        return AttachementLigneDto.builder()
                .id(row.getId())
                .noeudId(row.getNoeudId())
                .code(info.code())
                .designation(info.designation())
                .unite(info.unite())
                .quantitePeriode(row.getQuantitePeriode())
                .prixUnitaireVendu(info.prixUnitaireVendu())
                .montantHt(montant)
                .zoneId(row.getZoneId())
                .zoneLibelle(zoneLibelle)
                .build();
    }

    private NoeudInfo resolveNoeudInfo(UUID tenantId, String noeudId) {
        return posteRepository
                .findByIdAndTenantId(noeudId, tenantId)
                .map(p -> new NoeudInfo(p.getCode(), p.getDesignation(), p.getUnite(), p.getPrixUnitaireHt()))
                .or(() -> lotRepository
                        .findByIdAndTenantId(noeudId, tenantId)
                        .map(l -> new NoeudInfo(l.getCode(), l.getDesignation(), l.getUnite(), l.getPrixUnitaireHt())))
                .orElseGet(() -> new NoeudInfo(noeudId, noeudId, null, null));
    }

    private record NoeudInfo(String code, String designation, String unite, BigDecimal prixUnitaireVendu) {}

    private static UUID tenantId() {
        return TenantContext.getTenantId();
    }
}
