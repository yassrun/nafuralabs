package ma.nafura.etudes.service;

import java.util.ArrayList;
import java.util.List;
import java.util.UUID;
import ma.nafura.catalogue.api.CatalogItemSnapshot;
import ma.nafura.catalogue.api.CatalogLookupApi;
import ma.nafura.etudes.api.dto.DecisionCatalogueTraceDto;
import ma.nafura.etudes.domain.dossier.DossierEtude;
import ma.nafura.etudes.domain.dpu.ComposantDpu;
import ma.nafura.etudes.repository.ComposantDpuRepository;
import ma.nafura.platform.framework.context.TenantContext;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class DecisionCatalogueService {

    private final ComposantDpuRepository composantRepository;
    private final CatalogLookupApi catalogLookupApi;

    public DecisionCatalogueService(
            ComposantDpuRepository composantRepository, CatalogLookupApi catalogLookupApi) {
        this.composantRepository = composantRepository;
        this.catalogLookupApi = catalogLookupApi;
    }

    @Transactional(readOnly = true)
    public List<DecisionCatalogueTraceDto> listerPourDossier(DossierEtude dossier) {
        if (dossier.getDpgfId() == null) {
            return List.of();
        }
        UUID tenantId = TenantContext.getTenantId();
        List<ComposantDpu> composants =
                composantRepository.findAvecDecisionCatalogue(tenantId, dossier.getDpgfId());
        List<DecisionCatalogueTraceDto> out = new ArrayList<>(composants.size());
        for (ComposantDpu c : composants) {
            String itemCode = null;
            String itemName = null;
            if (c.getItemId() != null) {
                itemCode = catalogLookupApi
                        .getItem(c.getItemId())
                        .map(CatalogItemSnapshot::code)
                        .orElse(null);
                itemName = c.getLibelle();
            }
            out.add(DecisionCatalogueTraceDto.builder()
                    .composantId(c.getId())
                    .libelle(c.getLibelle())
                    .decision(c.getDecisionCatalogue())
                    .itemId(c.getItemId())
                    .itemCode(itemCode)
                    .itemName(itemName)
                    .acteur(c.getDecisionCataloguePar())
                    .date(c.getDecisionCatalogueAt())
                    .motif(c.getDecisionCatalogueMotif())
                    .build());
        }
        return List.copyOf(out);
    }

    @Transactional(readOnly = true)
    public long compterLibresSansDecision(DossierEtude dossier) {
        if (dossier.getDpgfId() == null) {
            return 0;
        }
        return composantRepository.countLibresSansDecision(
                TenantContext.getTenantId(), dossier.getDpgfId());
    }
}
