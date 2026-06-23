package ma.nafura.chantiers.service;

import java.time.LocalDate;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.UUID;
import ma.nafura.chantiers.api.dto.SituationConvertToFactureDto;
import ma.nafura.chantiers.api.dto.SituationFactureSummaryDto;
import ma.nafura.chantiers.api.dto.SituationLigneDto;
import ma.nafura.chantiers.api.dto.SituationTravauxDto;
import ma.nafura.chantiers.domain.model.Chantier;
import ma.nafura.chantiers.domain.model.ChantierLot;
import ma.nafura.chantiers.domain.model.SituationLigne;
import ma.nafura.chantiers.domain.model.SituationTravaux;
import ma.nafura.chantiers.port.SituationToFacturePort;
import ma.nafura.chantiers.repository.ChantierLotRepository;
import ma.nafura.chantiers.repository.SituationLigneRepository;
import ma.nafura.chantiers.repository.SituationTravauxRepository;
import ma.nafura.platform.framework.context.TenantContext;
import ma.nafura.platform.framework.event.ErpNotificationPublisher;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.util.StringUtils;

@Service
public class SituationTravauxService {

    private static final List<String> TERMINAL_STATUSES =
            List.of(SituationTravaux.STATUS_PAYEE, SituationTravaux.STATUS_REJETEE);

    private final SituationTravauxRepository situationRepository;
    private final SituationLigneRepository ligneRepository;
    private final ChantierLotRepository lotRepository;
    private final ChantierService chantierService;
    private final SituationGenerationService generationService;
    private final Optional<SituationToFacturePort> situationToFacturePort;
    private final ErpNotificationPublisher erpNotificationPublisher;

    public SituationTravauxService(
            SituationTravauxRepository situationRepository,
            SituationLigneRepository ligneRepository,
            ChantierLotRepository lotRepository,
            ChantierService chantierService,
            SituationGenerationService generationService,
            Optional<SituationToFacturePort> situationToFacturePort,
            ErpNotificationPublisher erpNotificationPublisher) {
        this.situationRepository = situationRepository;
        this.ligneRepository = ligneRepository;
        this.lotRepository = lotRepository;
        this.chantierService = chantierService;
        this.generationService = generationService;
        this.situationToFacturePort = situationToFacturePort;
        this.erpNotificationPublisher = erpNotificationPublisher;
    }

    @Transactional(readOnly = true)
    public List<SituationTravauxDto> listByChantier(String chantierId) {
        Chantier chantier = chantierService.getById(chantierId);
        UUID tenantId = tenantId();
        Map<String, ChantierLot> lotsById = indexLots(tenantId, chantierId);
        return situationRepository
                .findByTenantIdAndChantierIdOrderByNumeroOrdreDesc(tenantId, chantierId)
                .stream()
                .map(row -> toDto(row, chantier, lotsById, false))
                .toList();
    }

    @Transactional(readOnly = true)
    public SituationTravauxDto getById(String situationId) {
        UUID tenantId = tenantId();
        SituationTravaux situation = getEntity(situationId, tenantId);
        Chantier chantier = chantierService.getById(situation.getChantierId());
        Map<String, ChantierLot> lotsById = indexLots(tenantId, situation.getChantierId());
        return toDto(situation, chantier, lotsById, true);
    }

    @Transactional
    public SituationTravauxDto generate(String chantierId, int numeroOrdre) {
        SituationTravaux situation = generationService.generate(chantierId, numeroOrdre);
        Chantier chantier = chantierService.getById(chantierId);
        Map<String, ChantierLot> lotsById = indexLots(tenantId(), chantierId);
        return toDto(situation, chantier, lotsById, true);
    }

    @Transactional
    public SituationTravauxDto submit(String situationId) {
        SituationTravauxDto dto =
                transition(situationId, SituationTravaux.STATUS_BROUILLON, SituationTravaux.STATUS_SOUMISE, null, null);
        publishSituationEvent(
                dto,
                "SOUMIS",
                "Situation soumise : " + dto.getNumero(),
                "Validation MOA requise pour " + dto.getChantierCode(),
                "DAF",
                "DG");
        return dto;
    }

    @Transactional
    public SituationTravauxDto acceptMoa(String situationId) {
        SituationTravauxDto dto = transition(
                situationId,
                SituationTravaux.STATUS_SOUMISE,
                SituationTravaux.STATUS_VALIDEE_MOA,
                null,
                LocalDate.now());
        publishSituationEvent(
                dto,
                "VALIDEE_MOA",
                "Situation validée MOA : " + dto.getNumero(),
                "Prête pour facturation — " + dto.getChantierCode(),
                "CONDUCTEUR_TRAVAUX",
                "COMPTABLE");
        return dto;
    }

    @Transactional
    public SituationTravauxDto reject(String situationId, String motif) {
        if (!StringUtils.hasText(motif)) {
            throw new IllegalArgumentException("Rejection motif is required");
        }
        UUID tenantId = tenantId();
        SituationTravaux situation = getEntity(situationId, tenantId);
        if (!SituationTravaux.STATUS_SOUMISE.equals(situation.getStatus())) {
            throw new IllegalStateException("Situation must be SOUMISE to reject");
        }
        situation.setStatus(SituationTravaux.STATUS_REJETEE);
        situation.setMotifRejet(motif.trim());
        situationRepository.save(situation);

        Chantier chantier = chantierService.getById(situation.getChantierId());
        Map<String, ChantierLot> lotsById = indexLots(tenantId, situation.getChantierId());
        SituationTravauxDto dto = toDto(situation, chantier, lotsById, true);
        publishSituationEvent(
                dto,
                "REJETEE",
                "Situation rejetée : " + dto.getNumero(),
                motif.trim(),
                "CONDUCTEUR_TRAVAUX");
        return dto;
    }

    @Transactional
    public SituationTravauxDto marquerPayee(String situationId) {
        return transition(
                situationId,
                SituationTravaux.STATUS_FACTUREE,
                SituationTravaux.STATUS_PAYEE,
                null,
                null);
    }

    @Transactional
    public SituationConvertToFactureDto convertToFacture(String situationId) {
        UUID tenantId = tenantId();
        SituationTravaux situation = getEntity(situationId, tenantId);
        if (!SituationTravaux.STATUS_VALIDEE_MOA.equals(situation.getStatus())) {
            throw new IllegalStateException("Situation must be VALIDEE_MOA before conversion to facture");
        }

        Chantier chantier = chantierService.getById(situation.getChantierId());
        Map<String, ChantierLot> lotsById = indexLots(tenantId, situation.getChantierId());
        SituationTravauxDto situationDto = toDto(situation, chantier, lotsById, true);

        SituationFactureSummaryDto factureSummary;
        if (situationToFacturePort.isPresent()) {
            factureSummary = situationToFacturePort.get().createFactureFromSituation(situationDto);
        } else {
            String stubId = "stub-facture-" + situationId;
            factureSummary = SituationFactureSummaryDto.builder()
                    .id(stubId)
                    .numero(stubId)
                    .clientId(chantier.getClientId())
                    .clientName(chantier.getClientName())
                    .chantierId(situation.getChantierId())
                    .chantierCode(chantier.getCode())
                    .situationId(situation.getId())
                    .situationNumero(situation.getNumero())
                    .dateEmission(situation.getDateEmission())
                    .dateEcheance(situation.getDateEmission())
                    .totalHt(situation.getNetAPayerHt())
                    .retenueGarantieTaux(situation.getRetenueGarantiePercent())
                    .retenueGarantieMontant(situation.getRetenueGarantieMontant())
                    .netAPayerHt(situation.getNetAPayerHt())
                    .tvaTaux(situation.getTvaTaux())
                    .totalTva(situation.getNetAPayerTtc().subtract(situation.getNetAPayerHt()))
                    .netAPayerTtc(situation.getNetAPayerTtc())
                    .status("BROUILLON")
                    .build();
        }

        situation.setFactureId(factureSummary.getId());
        situation.setStatus(SituationTravaux.STATUS_FACTUREE);
        situationRepository.save(situation);

        return SituationConvertToFactureDto.builder()
                .situation(toDto(situation, chantier, lotsById, true))
                .factureId(factureSummary.getId())
                .facture(factureSummary)
                .build();
    }

    @Transactional(readOnly = true)
    public long countOpenByChantier(String chantierId) {
        chantierService.getById(chantierId);
        return situationRepository.countByTenantIdAndChantierIdAndStatusNotIn(
                tenantId(), chantierId, TERMINAL_STATUSES);
    }

    private SituationTravauxDto transition(
            String situationId,
            String expectedStatus,
            String nextStatus,
            String approbateurMoaName,
            LocalDate approbationDate) {
        UUID tenantId = tenantId();
        SituationTravaux situation = getEntity(situationId, tenantId);
        if (!expectedStatus.equals(situation.getStatus())) {
            throw new IllegalStateException(
                    "Situation status must be " + expectedStatus + " but was " + situation.getStatus());
        }
        situation.setStatus(nextStatus);
        if (StringUtils.hasText(approbateurMoaName)) {
            situation.setApprobateurMoaName(approbateurMoaName.trim());
        }
        if (approbationDate != null) {
            situation.setApprobationDate(approbationDate);
        }
        situationRepository.save(situation);

        Chantier chantier = chantierService.getById(situation.getChantierId());
        Map<String, ChantierLot> lotsById = indexLots(tenantId, situation.getChantierId());
        return toDto(situation, chantier, lotsById, true);
    }

    private SituationTravaux getEntity(String situationId, UUID tenantId) {
        return situationRepository
                .findByIdAndTenantId(situationId, tenantId)
                .orElseThrow(() -> new IllegalArgumentException("Situation not found: " + situationId));
    }

    private Map<String, ChantierLot> indexLots(UUID tenantId, String chantierId) {
        Map<String, ChantierLot> lotsById = new HashMap<>();
        for (ChantierLot lot : lotRepository.findByTenantIdAndChantierIdOrderByOrdreAscCodeAsc(tenantId, chantierId)) {
            lotsById.put(lot.getId(), lot);
        }
        return lotsById;
    }

    private SituationTravauxDto toDto(
            SituationTravaux situation,
            Chantier chantier,
            Map<String, ChantierLot> lotsById,
            boolean includeLignes) {
        List<SituationLigne> lignes = includeLignes
                ? ligneRepository.findByTenantIdAndSituationIdOrderByOrdreAsc(tenantId(), situation.getId())
                : List.of();

        List<SituationLigneDto> ligneDtos = lignes.stream()
                .map(ligne -> toLigneDto(ligne, lotsById.get(ligne.getLotId())))
                .toList();

        return SituationTravauxDto.builder()
                .id(situation.getId())
                .chantierId(situation.getChantierId())
                .chantierCode(chantier.getCode())
                .chantierName(chantier.getLabel())
                .numero(situation.getNumero())
                .numeroOrdre(situation.getNumeroOrdre())
                .datePeriodeDebut(situation.getDatePeriodeDebut())
                .datePeriodeFin(situation.getDatePeriodeFin())
                .dateEmission(situation.getDateEmission())
                .cumulPrecedentHt(situation.getCumulPrecedentHt())
                .cumulCourantHt(situation.getCumulCourantHt())
                .travauxPeriodeHt(situation.getTravauxPeriodeHt())
                .retenueGarantiePercent(situation.getRetenueGarantiePercent())
                .retenueGarantieMontant(situation.getRetenueGarantieMontant())
                .retenueAvancePercent(situation.getRetenueAvancePercent())
                .retenueAvanceMontant(situation.getRetenueAvanceMontant())
                .netAPayerHt(situation.getNetAPayerHt())
                .tvaTaux(situation.getTvaTaux())
                .netAPayerTtc(situation.getNetAPayerTtc())
                .status(situation.getStatus())
                .factureId(situation.getFactureId())
                .approbateurMOAName(situation.getApprobateurMoaName())
                .approbationDate(situation.getApprobationDate())
                .motifRejet(situation.getMotifRejet())
                .notes(situation.getNotes())
                .nbLignes(includeLignes ? ligneDtos.size() : countLignes(situation.getId()))
                .lignes(includeLignes ? ligneDtos : null)
                .build();
    }

    private int countLignes(String situationId) {
        return ligneRepository.findByTenantIdAndSituationIdOrderByOrdreAsc(tenantId(), situationId).size();
    }

    private static SituationLigneDto toLigneDto(SituationLigne ligne, ChantierLot lot) {
        return SituationLigneDto.builder()
                .id(ligne.getId())
                .lotId(ligne.getLotId())
                .lotCode(lot != null ? lot.getCode() : null)
                .posteBudgetaireId(ligne.getPosteBudgetaireId())
                .designation(ligne.getDesignation())
                .unite(ligne.getUnite())
                .quantiteTotale(ligne.getQuantiteTotale())
                .quantitePrecedente(ligne.getQuantitePrecedente())
                .quantiteCumulee(ligne.getQuantiteCumulee())
                .prixUnitaire(ligne.getPrixUnitaire())
                .montantHt(ligne.getMontantHt())
                .build();
    }

    private static UUID tenantId() {
        return TenantContext.getTenantId();
    }

    private void publishSituationEvent(
            SituationTravauxDto dto, String transition, String title, String body, String... roles) {
        erpNotificationPublisher.notifyRoles(
                tenantId(),
                "SITUATION",
                dto.getId(),
                dto.getNumero(),
                transition,
                title,
                body,
                "/chantiers/situations/" + dto.getId(),
                roles);
    }
}
