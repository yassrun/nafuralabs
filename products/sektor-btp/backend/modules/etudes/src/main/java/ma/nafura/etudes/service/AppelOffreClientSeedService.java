package ma.nafura.etudes.service;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.UUID;
import ma.nafura.etudes.domain.model.AppelOffreClient;
import ma.nafura.etudes.domain.model.Metre;
import ma.nafura.etudes.repository.AppelOffreClientRepository;
import ma.nafura.etudes.repository.MetreRepository;
import ma.nafura.platform.framework.context.TenantContext;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class AppelOffreClientSeedService {

    private final AppelOffreClientRepository repository;
    private final MetreRepository metreRepository;
    private final MetreSeedService metreSeedService;
    private final AppelOffreClientEmbeddedBuilder embeddedBuilder;

    public AppelOffreClientSeedService(
            AppelOffreClientRepository repository,
            MetreRepository metreRepository,
            MetreSeedService metreSeedService,
            AppelOffreClientEmbeddedBuilder embeddedBuilder) {
        this.repository = repository;
        this.metreRepository = metreRepository;
        this.metreSeedService = metreSeedService;
        this.embeddedBuilder = embeddedBuilder;
    }

    @Transactional
    public void seedIfEmpty() {
        UUID tenantId = TenantContext.getTenantId();
        if (repository.countByTenantId(tenantId) > 0) {
            return;
        }
        metreSeedService.seedIfEmpty();
        seedAoc001(tenantId);
        seedAoc006(tenantId);
        seedAoc009(tenantId);
    }

    private void seedAoc001(UUID tenantId) {
        Metre metre = metreRepository
                .findByTenantIdAndNumero(tenantId, "MET-2026-002")
                .orElse(null);
        AppelOffreClient entity = AppelOffreClient.builder()
                .tenantId(tenantId)
                .numero("AOC-2026-0001")
                .reference("ADM/AO/2026-014")
                .objet("Pont Bouregreg ouvrage 3 — Génie civil")
                .donneurOrdre("ADM (Autoroutes du Maroc)")
                .type(AppelOffreClient.TYPE_PUBLIC)
                .dateLimiteDepot(LocalDate.parse("2026-02-15"))
                .dateOuverturePlis(LocalDate.parse("2026-02-15"))
                .cautionProvisoire(new BigDecimal("870000"))
                .cautionDefinitive(new BigDecimal("4350000"))
                .cautionRetenueGarantie(new BigDecimal("4350000"))
                .estimationMoaHt(new BigDecimal("90000000"))
                .ville("Salé")
                .delaiExecutionJours(720)
                .status(AppelOffreClient.STATUS_ATTRIBUE)
                .devisNumero("DV-2026-0006")
                .metreId(metre != null ? metre.getId().toString() : null)
                .metreNumero(metre != null ? metre.getNumero() : "MET-2026-002")
                .resultatRangNotre(1)
                .resultatNbPlis(7)
                .resultatAttributaire("SEYRURA BTP SARL")
                .resultatMontantHt(new BigDecimal("87000000"))
                .chantierGenereId("CH-2025-002")
                .notes("AO gagné — chantier généré le 25/02/2026")
                .build();
        persistSeeded(entity);
    }

    private void seedAoc006(UUID tenantId) {
        AppelOffreClient entity = AppelOffreClient.builder()
                .tenantId(tenantId)
                .numero("AOC-2026-0006")
                .reference("ADM/AO/2026-088")
                .objet("Voirie autoroute A8 — section Beni Mellal")
                .donneurOrdre("ADM (Autoroutes du Maroc)")
                .type(AppelOffreClient.TYPE_PUBLIC)
                .dateLimiteDepot(LocalDate.parse("2026-05-25"))
                .cautionProvisoire(new BigDecimal("500000"))
                .estimationMoaHt(new BigDecimal("52000000"))
                .ville("Beni Mellal")
                .delaiExecutionJours(600)
                .status(AppelOffreClient.STATUS_EN_PREPARATION)
                .notes("17 jours restants — caution en cours d'émission BMCE")
                .build();
        persistSeeded(entity);
    }

    private void seedAoc009(UUID tenantId) {
        AppelOffreClient entity = AppelOffreClient.builder()
                .tenantId(tenantId)
                .numero("AOC-2026-0009")
                .reference("OCP/AO/2025-205")
                .objet("Construction bureaux administratifs OCP Khouribga")
                .donneurOrdre("OCP SA")
                .type(AppelOffreClient.TYPE_PRIVE)
                .dateLimiteDepot(LocalDate.parse("2025-11-05"))
                .dateOuverturePlis(LocalDate.parse("2025-11-05"))
                .cautionProvisoire(new BigDecimal("180000"))
                .estimationMoaHt(new BigDecimal("18000000"))
                .ville("Khouribga")
                .delaiExecutionJours(360)
                .status(AppelOffreClient.STATUS_PERDU)
                .resultatRangNotre(3)
                .resultatNbPlis(11)
                .resultatAttributaire("TGCC SA")
                .resultatMontantHt(new BigDecimal("16500000"))
                .notes("Concurrent moins-disant retenu — écart -8% sur notre prix")
                .build();
        persistSeeded(entity);
    }

    private void persistSeeded(AppelOffreClient entity) {
        AppelOffreClient saved = repository.save(entity);
        saved.setDocuments(embeddedBuilder.buildDocuments(saved));
        saved.setChecklist(embeddedBuilder.buildChecklist(saved));
        repository.save(saved);
    }
}
