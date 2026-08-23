package ma.nafura.etudes.service;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import java.math.BigDecimal;
import java.util.LinkedHashSet;
import java.util.List;
import java.util.Optional;
import java.util.Set;
import java.util.UUID;
import ma.nafura.achats.domain.consultation.ConsultationAchat;
import ma.nafura.achats.domain.consultation.ConsultationAchatDevis;
import ma.nafura.achats.domain.consultation.ConsultationAchatDevisLigne;
import ma.nafura.achats.repository.ConsultationAchatDevisRepository;
import ma.nafura.achats.repository.ConsultationAchatRepository;
import ma.nafura.catalogue.api.CatalogItemSnapshot;
import ma.nafura.catalogue.api.CatalogLookupApi;
import ma.nafura.etudes.domain.dossier.DossierEtude;
import ma.nafura.etudes.repository.DossierEtudeRepository;
import ma.nafura.platform.framework.context.TenantContext;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;

class ConsultationAchatFlagServiceTest {

    private static final UUID TENANT = UUID.fromString("11111111-1111-1111-1111-111111111111");
    private static final UUID DOSSIER = UUID.fromString("22222222-2222-2222-2222-222222222222");
    private static final UUID DPGF = UUID.fromString("44444444-4444-4444-4444-444444444444");
    private static final UUID CONSULT = UUID.fromString("33333333-3333-3333-3333-333333333333");
    private static final UUID CIMENT_ITEM = UUID.fromString("55555555-5555-5555-5555-555555555555");
    private static final UUID PEINTURE_ITEM = UUID.fromString("66666666-6666-6666-6666-666666666666");
    private static final UUID DEVIS = UUID.fromString("77777777-7777-7777-7777-777777777777");

    private ConsultationAchatRepository consultationRepository;
    private ConsultationAchatDevisRepository devisRepository;
    private DossierEtudeRepository dossierRepository;
    private CatalogLookupApi catalogLookupApi;
    private DpuService dpuService;
    private ParametresEtudeService parametres;
    private ConsultationAchatFlagService service;

    @BeforeEach
    void setUp() {
        TenantContext.setTenantId(TENANT);
        consultationRepository = mock(ConsultationAchatRepository.class);
        devisRepository = mock(ConsultationAchatDevisRepository.class);
        dossierRepository = mock(DossierEtudeRepository.class);
        catalogLookupApi = mock(CatalogLookupApi.class);
        dpuService = mock(DpuService.class);
        parametres = mock(ParametresEtudeService.class);
        when(parametres.consultationMinimum()).thenReturn(1);
        service = new ConsultationAchatFlagService(
                consultationRepository,
                devisRepository,
                dossierRepository,
                catalogLookupApi,
                dpuService,
                parametres);
    }

    @AfterEach
    void tearDown() {
        TenantContext.clear();
    }

    @Test
    void sansDossier_neFlaguePas() {
        service.appliquerFlagsApresDevis(null);
        verify(dpuService, never()).appliquerPrixConsulte(any(), any(), any(), any(), any());
    }

    @Test
    void sansDpgf_neFlaguePas() {
        when(dossierRepository.findByIdAndTenantId(DOSSIER, TENANT))
                .thenReturn(Optional.of(DossierEtude.builder().id(DOSSIER).tenantId(TENANT).build()));
        service.appliquerFlagsApresDevis(DOSSIER);
        verify(dpuService, never()).appliquerPrixConsulte(any(), any(), any(), any(), any());
    }

    @Test
    void n1_cimentExtrait_consulte_peintureNonCouverte() {
        stubDossierLiee();
        ConsultationAchatDevis devis = devisCiment(DEVIS, new BigDecimal("1083.75"));
        when(devisRepository.findByConsultationIdIn(List.of(CONSULT))).thenReturn(List.of(devis));
        when(catalogLookupApi.findByCleStable("ciment-cpj-45"))
                .thenReturn(Optional.of(item(CIMENT_ITEM, "ciment-cpj-45")));
        when(catalogLookupApi.findByCleStable("peinture"))
                .thenReturn(Optional.of(item(PEINTURE_ITEM, "peinture")));

        service.appliquerFlagsApresDevis(DOSSIER);

        verify(dpuService)
                .appliquerPrixConsulte(
                        eq(DPGF),
                        eq(CIMENT_ITEM),
                        eq(new BigDecimal("1083.75")),
                        eq(DEVIS),
                        any());
        verify(dpuService, never())
                .appliquerPrixConsulte(eq(DPGF), eq(PEINTURE_ITEM), any(), any(), any());
    }

    @Test
    void n2_unSeulDevis_neFlaguePas() {
        stubDossierLiee();
        when(parametres.consultationMinimum()).thenReturn(2);
        when(devisRepository.findByConsultationIdIn(List.of(CONSULT)))
                .thenReturn(List.of(devisCiment(DEVIS, new BigDecimal("1083.75"))));
        when(catalogLookupApi.findByCleStable("ciment-cpj-45"))
                .thenReturn(Optional.of(item(CIMENT_ITEM, "ciment-cpj-45")));

        service.appliquerFlagsApresDevis(DOSSIER);

        verify(dpuService, never()).appliquerPrixConsulte(any(), any(), any(), any(), any());
    }

    private void stubDossierLiee() {
        when(dossierRepository.findByIdAndTenantId(DOSSIER, TENANT))
                .thenReturn(Optional.of(DossierEtude.builder()
                        .id(DOSSIER)
                        .tenantId(TENANT)
                        .dpgfId(DPGF)
                        .build()));
        ConsultationAchat consultation = ConsultationAchat.builder()
                .id(CONSULT)
                .tenantId(TENANT)
                .dossierEtudeId(DOSSIER)
                .clesStables(new LinkedHashSet<>(Set.of("ciment-cpj-45", "peinture")))
                .build();
        when(consultationRepository.findByTenantIdAndDossierEtudeId(TENANT, DOSSIER))
                .thenReturn(List.of(consultation));
    }

    private static ConsultationAchatDevis devisCiment(UUID id, BigDecimal pu) {
        return ConsultationAchatDevis.builder()
                .id(id)
                .consultationId(CONSULT)
                .lignes(List.of(ConsultationAchatDevisLigne.builder()
                        .identite("ciment-cpj-45")
                        .libelle("Ciment CPJ 45")
                        .prixUnitaire(pu)
                        .build()))
                .build();
    }

    private static CatalogItemSnapshot item(UUID id, String cle) {
        return new CatalogItemSnapshot(id.toString(), "X", cle, "T", "MATIERE", cle);
    }
}
