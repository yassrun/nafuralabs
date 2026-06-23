package ma.nafura.chantiers.service;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.util.ArrayList;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Locale;
import java.util.Map;
import java.util.UUID;
import ma.nafura.chantiers.api.dto.BudgetChantierDto;
import ma.nafura.chantiers.api.dto.BudgetLigneDto;
import ma.nafura.chantiers.api.request.BudgetChantierUpsertDto;
import ma.nafura.chantiers.domain.model.BudgetChantier;
import ma.nafura.chantiers.domain.model.BudgetLigne;
import ma.nafura.chantiers.domain.model.Chantier;
import ma.nafura.chantiers.repository.BudgetChantierRepository;
import ma.nafura.chantiers.repository.BudgetLigneRepository;
import ma.nafura.platform.framework.context.TenantContext;
import org.springframework.core.io.ClassPathResource;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.util.StringUtils;

@Service
public class BudgetChantierService {

    private static final List<RubriqueTemplate> DEFAULT_RUBRIQUES = List.of(
            new RubriqueTemplate("MATERIAUX", "Materiaux", "Gros oeuvre"),
            new RubriqueTemplate("MO", "Main d oeuvre", "Execution"),
            new RubriqueTemplate("SOUS_TRAITANCE", "Sous-traitance", "Second oeuvre"),
            new RubriqueTemplate("LOCATION_MATERIEL", "Location materiel", "Materiel"),
            new RubriqueTemplate("CARBURANT", "Carburant", "Logistique"),
            new RubriqueTemplate("FRAIS_GENERAUX", "Frais generaux", "Support"),
            new RubriqueTemplate("IMPREVUS", "Imprevus", "Pilotage"));

    private final BudgetChantierRepository budgetRepository;
    private final BudgetLigneRepository ligneRepository;
    private final ChantierService chantierService;
    private final BudgetChantierSeedService seedService;

    public BudgetChantierService(
            BudgetChantierRepository budgetRepository,
            BudgetLigneRepository ligneRepository,
            ChantierService chantierService,
            BudgetChantierSeedService seedService) {
        this.budgetRepository = budgetRepository;
        this.ligneRepository = ligneRepository;
        this.chantierService = chantierService;
        this.seedService = seedService;
    }

    @Transactional(readOnly = true)
    public BudgetChantierDto getByChantierId(String chantierId) {
        seedService.seedIfEmpty();
        Chantier chantier = chantierService.getById(chantierId);
        UUID tenantId = tenantId();
        BudgetChantier budget = budgetRepository
                .findByTenantIdAndChantierId(tenantId, chantierId)
                .orElseGet(() -> buildTransientBudget(tenantId, chantier));
        List<BudgetLigne> lignes = budget.getId() != null
                ? ligneRepository.findByTenantIdAndBudgetChantierIdOrderByOrdreAscRubriqueAsc(
                        tenantId, budget.getId())
                : defaultLignes(tenantId, budget.getId(), chantier);
        return toDto(chantier, budget, lignes);
    }

    @Transactional
    public BudgetChantierDto upsert(String chantierId, BudgetChantierUpsertDto request) {
        Chantier chantier = chantierService.getById(chantierId);
        UUID tenantId = tenantId();
        String budgetId = buildBudgetId(chantierId);

        BudgetChantier budget = budgetRepository
                .findByTenantIdAndChantierId(tenantId, chantierId)
                .orElseGet(() -> BudgetChantier.builder()
                        .id(budgetId)
                        .tenantId(tenantId)
                        .chantierId(chantierId)
                        .build());

        List<BudgetLigneInput> inputs = normalizeInputs(request.getLignes());
        BigDecimal previsionnelTotal = sum(inputs, BudgetLigneInput::previsionnelHt);
        BigDecimal reviseTotal = sum(inputs, BudgetLigneInput::reviseHt);

        budget.setPrevisionnelHt(
                request.getPrevisionnelHt() != null ? request.getPrevisionnelHt() : previsionnelTotal);
        budget.setReviseHt(request.getReviseHt() != null ? request.getReviseHt() : reviseTotal);
        budgetRepository.save(budget);

        Map<String, BudgetLigne> existingByRubrique = new LinkedHashMap<>();
        for (BudgetLigne ligne : ligneRepository.findByTenantIdAndBudgetChantierIdOrderByOrdreAscRubriqueAsc(
                tenantId, budget.getId())) {
            existingByRubrique.put(ligne.getRubrique(), ligne);
        }

        List<BudgetLigne> saved = new ArrayList<>();
        int ordre = 1;
        for (BudgetLigneInput input : inputs) {
            BudgetLigne ligne = existingByRubrique.remove(input.rubrique());
            if (ligne == null) {
                ligne = BudgetLigne.builder()
                        .id(buildLigneId(budget.getId(), input.rubrique()))
                        .tenantId(tenantId)
                        .budgetChantierId(budget.getId())
                        .rubrique(input.rubrique())
                        .build();
            }
            ligne.setLabel(input.label());
            ligne.setLot(input.lot());
            ligne.setPrevisionnelHt(input.previsionnelHt());
            ligne.setReviseHt(input.reviseHt());
            ligne.setEngageHt(input.engageHt() != null ? input.engageHt() : BigDecimal.ZERO);
            ligne.setRealiseHt(input.realiseHt() != null ? input.realiseHt() : BigDecimal.ZERO);
            ligne.setPosteBudgetaireId(input.posteBudgetaireId());
            ligne.setOrdre(input.ordre() != null ? input.ordre() : ordre);
            saved.add(ligneRepository.save(ligne));
            ordre++;
        }

        for (BudgetLigne orphan : existingByRubrique.values()) {
            ligneRepository.delete(orphan);
        }

        return toDto(chantier, budget, saved);
    }

    private BudgetChantierDto toDto(Chantier chantier, BudgetChantier budget, List<BudgetLigne> lignes) {
        List<BudgetLigneDto> ligneDtos = lignes.stream().map(this::toLigneDto).toList();
        BigDecimal engageHt = sumDto(ligneDtos, BudgetLigneDto::getEngageHt);
        BigDecimal realiseHt = sumDto(ligneDtos, BudgetLigneDto::getRealiseHt);
        BigDecimal previsionnelHt = budget.getPrevisionnelHt() != null
                ? budget.getPrevisionnelHt()
                : sumDto(ligneDtos, BudgetLigneDto::getPrevisionnelHt);
        BigDecimal reviseHt = budget.getReviseHt() != null
                ? budget.getReviseHt()
                : sumDto(ligneDtos, BudgetLigneDto::getReviseHt);

        return BudgetChantierDto.builder()
                .id(budget.getId())
                .chantierId(chantier.getId())
                .code(chantier.getCode())
                .name(chantier.getLabel())
                .client(chantier.getClientName())
                .previsionnelHt(previsionnelHt)
                .reviseHt(reviseHt)
                .engageHt(engageHt)
                .realiseHt(realiseHt)
                .resteAEngagerHt(reviseHt.subtract(engageHt))
                .lignes(ligneDtos)
                .build();
    }

    private BudgetLigneDto toLigneDto(BudgetLigne ligne) {
        BigDecimal resteHt = ligne.getReviseHt().subtract(ligne.getEngageHt());
        BigDecimal ecartHt = ligne.getReviseHt().subtract(ligne.getRealiseHt());
        BigDecimal ecartPercent = ligne.getReviseHt().compareTo(BigDecimal.ZERO) == 0
                ? BigDecimal.ZERO
                : ecartHt.multiply(BigDecimal.valueOf(100))
                        .divide(ligne.getReviseHt(), 1, RoundingMode.HALF_UP);
        return BudgetLigneDto.builder()
                .id(ligne.getId())
                .rubrique(ligne.getRubrique())
                .label(ligne.getLabel())
                .lot(ligne.getLot())
                .previsionnelHt(ligne.getPrevisionnelHt())
                .reviseHt(ligne.getReviseHt())
                .engageHt(ligne.getEngageHt())
                .realiseHt(ligne.getRealiseHt())
                .resteHt(resteHt)
                .ecartHt(ecartHt)
                .ecartPercent(ecartPercent)
                .posteBudgetaireId(ligne.getPosteBudgetaireId())
                .ordre(ligne.getOrdre())
                .build();
    }

    private BudgetChantier buildTransientBudget(UUID tenantId, Chantier chantier) {
        return BudgetChantier.builder()
                .id(buildBudgetId(chantier.getId()))
                .tenantId(tenantId)
                .chantierId(chantier.getId())
                .previsionnelHt(chantier.getMontantHt())
                .reviseHt(chantier.getMontantHt())
                .build();
    }

    private List<BudgetLigne> defaultLignes(UUID tenantId, String budgetId, Chantier chantier) {
        List<BudgetLigne> lignes = new ArrayList<>();
        int ordre = 1;
        for (RubriqueTemplate template : DEFAULT_RUBRIQUES) {
            lignes.add(BudgetLigne.builder()
                    .id(buildLigneId(budgetId, template.rubrique()))
                    .tenantId(tenantId)
                    .budgetChantierId(budgetId)
                    .rubrique(template.rubrique())
                    .label(template.label())
                    .lot(template.lot())
                    .previsionnelHt(BigDecimal.ZERO)
                    .reviseHt(BigDecimal.ZERO)
                    .engageHt(BigDecimal.ZERO)
                    .realiseHt(BigDecimal.ZERO)
                    .ordre(ordre++)
                    .build());
        }
        if (chantier.getMontantHt() != null && chantier.getMontantHt().compareTo(BigDecimal.ZERO) > 0) {
            lignes.getFirst().setPrevisionnelHt(chantier.getMontantHt());
            lignes.getFirst().setReviseHt(chantier.getMontantHt());
        }
        return lignes;
    }

    private static List<BudgetLigneInput> normalizeInputs(List<BudgetChantierUpsertDto.BudgetLigneInputDto> rows) {
        if (rows == null || rows.isEmpty()) {
            throw new IllegalArgumentException("At least one budget line is required");
        }
        List<BudgetLigneInput> normalized = new ArrayList<>();
        int ordre = 1;
        for (BudgetChantierUpsertDto.BudgetLigneInputDto row : rows) {
            normalized.add(new BudgetLigneInput(
                    row.getId(),
                    row.getRubrique().trim().toUpperCase(Locale.ROOT),
                    row.getLabel().trim(),
                    StringUtils.hasText(row.getLot()) ? row.getLot().trim() : null,
                    row.getPrevisionnelHt(),
                    row.getReviseHt(),
                    row.getEngageHt(),
                    row.getRealiseHt(),
                    trimOrNull(row.getPosteBudgetaireId()),
                    row.getOrdre() != null ? row.getOrdre() : ordre++));
        }
        return normalized;
    }

    private static BigDecimal sum(List<BudgetLigneInput> rows, java.util.function.Function<BudgetLigneInput, BigDecimal> getter) {
        return rows.stream().map(getter).reduce(BigDecimal.ZERO, BigDecimal::add);
    }

    private static BigDecimal sumDto(List<BudgetLigneDto> rows, java.util.function.Function<BudgetLigneDto, BigDecimal> getter) {
        return rows.stream().map(getter).reduce(BigDecimal.ZERO, BigDecimal::add);
    }

    private static String buildBudgetId(String chantierId) {
        return chantierId + "-budget";
    }

    private static String buildLigneId(String budgetId, String rubrique) {
        String slug = rubrique.toLowerCase(Locale.ROOT).replaceAll("[^a-z0-9]+", "-");
        return budgetId + "-ligne-" + slug;
    }

    private static String trimOrNull(String value) {
        if (!StringUtils.hasText(value)) {
            return null;
        }
        return value.trim();
    }

    private static UUID tenantId() {
        return TenantContext.getTenantId();
    }

    private record RubriqueTemplate(String rubrique, String label, String lot) {}

    private record BudgetLigneInput(
            String id,
            String rubrique,
            String label,
            String lot,
            BigDecimal previsionnelHt,
            BigDecimal reviseHt,
            BigDecimal engageHt,
            BigDecimal realiseHt,
            String posteBudgetaireId,
            Integer ordre) {}
}
