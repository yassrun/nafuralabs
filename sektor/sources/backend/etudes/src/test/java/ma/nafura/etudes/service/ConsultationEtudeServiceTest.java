package ma.nafura.etudes.service;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import java.math.BigDecimal;
import java.util.ArrayList;
import java.util.List;
import java.util.Optional;
import java.util.UUID;
import ma.nafura.achats.api.request.CatalogueFournisseurLigneCreateDto;
import ma.nafura.achats.domain.contrat.CatalogueSource;
import ma.nafura.achats.service.CatalogueFournisseurLigneService;
import ma.nafura.achats.service.ConsultationAchatService;
import ma.nafura.catalogue.api.CatalogItemSnapshot;
import ma.nafura.catalogue.api.CatalogLookupApi;
import ma.nafura.etudes.api.dto.ConsultationEtudeDto;
import ma.nafura.etudes.api.request.ConsultationEtudeOpenDto;
import ma.nafura.etudes.api.request.ConsultationIdentifierDto;
import ma.nafura.etudes.api.request.ConsultationInviteDto;
import ma.nafura.etudes.api.request.DevisConsultationCreateDto;
import ma.nafura.etudes.domain.consultation.ConsultationEtude;
import ma.nafura.etudes.domain.consultation.ConsultationIdentiteCouverte;
import ma.nafura.etudes.domain.consultation.DevisConsultation;
import ma.nafura.etudes.domain.consultation.DevisConsultationLigne;
import ma.nafura.etudes.domain.dossier.DossierEtude;
import ma.nafura.etudes.repository.ConsultationEtudeRepository;
import ma.nafura.etudes.repository.ConsultationIdentiteCouverteRepository;
import ma.nafura.etudes.repository.DevisConsultationRepository;
import ma.nafura.etudes.repository.DossierDocumentRepository;
import ma.nafura.etudes.repository.DossierEtudeRepository;
import ma.nafura.etudes.service.port.bc.EtudeFournisseurPort;
import ma.nafura.platform.framework.context.TenantContext;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;

class ConsultationEtudeServiceTest {

    private static final UUID TENANT = UUID.fromString("11111111-1111-1111-1111-111111111111");
    private static final UUID DOSSIER = UUID.fromString("22222222-2222-2222-2222-222222222222");
    private static final UUID CONSULT = UUID.fromString("33333333-3333-3333-3333-333333333333");
    private static final UUID FA = UUID.fromString("aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa");
    private static final UUID FB = UUID.fromString("bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb");

    private static final UUID DPGF = UUID.fromString("44444444-4444-4444-4444-444444444444");
    private static final UUID CIMENT_ITEM = UUID.fromString("55555555-5555-5555-5555-555555555555");
    private static final UUID PEINTURE_ITEM = UUID.fromString("66666666-6666-6666-6666-666666666666");
    private static final UUID DEVIS_ID = UUID.fromString("77777777-7777-7777-7777-777777777777");

    private ConsultationEtudeRepository consultationRepository;
    private DevisConsultationRepository devisRepository;
    private ConsultationIdentiteCouverteRepository identificationRepository;
    private DossierEtudeRepository dossierRepository;
    private DossierDocumentRepository documentRepository;
    private EtudeFournisseurPort fournisseurPort;
    private CatalogLookupApi catalogLookupApi;
    private DpuService dpuService;
    private CatalogueFournisseurLigneService catalogueService;
    private ConsultationAchatService consultationAchatService;
    private ConsultationEtudeService service;
    private ConsultationEtude consultation;

    @BeforeEach
    void setUp() {
        TenantContext.setTenantId(TENANT);
        consultationRepository = mock(ConsultationEtudeRepository.class);
        devisRepository = mock(DevisConsultationRepository.class);
        identificationRepository = mock(ConsultationIdentiteCouverteRepository.class);
        dossierRepository = mock(DossierEtudeRepository.class);
        documentRepository = mock(DossierDocumentRepository.class);
        fournisseurPort = mock(EtudeFournisseurPort.class);
        catalogLookupApi = mock(CatalogLookupApi.class);
        dpuService = mock(DpuService.class);
        catalogueService = mock(CatalogueFournisseurLigneService.class);
        consultationAchatService = mock(ConsultationAchatService.class);
        service = new ConsultationEtudeService(
                consultationRepository,
                devisRepository,
                identificationRepository,
                dossierRepository,
                documentRepository,
                fournisseurPort,
                catalogLookupApi,
                dpuService,
                catalogueService,
                consultationAchatService);

        DossierEtude dossier = DossierEtude.builder()
                .id(DOSSIER)
                .tenantId(TENANT)
                .numero("DE-109")
                .objet("Consultation")
                .dpgfId(DPGF)
                .build();
        when(dossierRepository.findByIdAndTenantId(DOSSIER, TENANT)).thenReturn(Optional.of(dossier));

        consultation = ConsultationEtude.builder()
                .id(CONSULT)
                .tenantId(TENANT)
                .dossierEtudeId(DOSSIER)
                .statut(ConsultationEtude.STATUT_OUVERTE)
                .build();

        when(consultationRepository.save(any(ConsultationEtude.class))).thenAnswer(inv -> {
            ConsultationEtude c = inv.getArgument(0);
            if (c.getId() == null) {
                c.setId(CONSULT);
            }
            return c;
        });
        when(devisRepository.save(any(DevisConsultation.class))).thenAnswer(inv -> {
            DevisConsultation d = inv.getArgument(0);
            if (d.getId() == null) {
                d.setId(UUID.randomUUID());
            }
            return d;
        });
        when(identificationRepository.findByConsultationId(CONSULT)).thenReturn(List.of());
        when(identificationRepository.findById(any())).thenReturn(Optional.empty());
        when(identificationRepository.save(any(ConsultationIdentiteCouverte.class))).thenAnswer(inv -> inv.getArgument(0));
        when(fournisseurPort.requireFournisseur(any()))
                .thenAnswer(inv -> new EtudeFournisseurPort.FournisseurSnapshot(
                        inv.getArgument(0), "F", "Fournisseur"));
        when(catalogLookupApi.findByCleStable(any())).thenReturn(Optional.empty());
    }

    @AfterEach
    void tearDown() {
        TenantContext.clear();
    }

    @Test
    void ouvrir_cree_consultation_paquet_et_invite_sans_compter() {
        when(consultationRepository.findByTenantIdAndDossierEtudeId(TENANT, DOSSIER))
                .thenReturn(Optional.empty())
                .thenReturn(Optional.of(consultation));
        when(devisRepository.findByTenantIdAndConsultationIdOrderByRecuAtAsc(TENANT, CONSULT))
                .thenReturn(List.of());

        ConsultationEtudeOpenDto dto = new ConsultationEtudeOpenDto();
        dto.setCleStables(List.of("ciment-cpj-45", "peinture-acrylique"));
        dto.setPartenaireIds(List.of(FA, FB));

        ConsultationEtudeDto opened = service.ouvrir(DOSSIER, dto);

        assertThat(opened.getPaquetCleStables()).containsExactlyInAnyOrder("ciment-cpj-45", "peinture-acrylique");
        assertThat(opened.getPartenaireIds()).containsExactlyInAnyOrder(FA, FB);
        assertThat(opened.getDevisRecus()).isZero();
    }

    @Test
    void inviter_ne_compte_pas_comme_consulte() {
        when(consultationRepository.findByTenantIdAndDossierEtudeId(TENANT, DOSSIER))
                .thenReturn(Optional.of(consultation));
        when(devisRepository.findByTenantIdAndConsultationIdOrderByRecuAtAsc(TENANT, CONSULT))
                .thenReturn(List.of());

        ConsultationInviteDto invite = new ConsultationInviteDto();
        invite.setPartenaireId(FA);
        ConsultationEtudeDto after = service.inviter(DOSSIER, invite);

        assertThat(after.getPartenaireIds()).contains(FA);
        assertThat(after.getDevisRecus()).isZero();
    }

    @Test
    void devis_recu_incremente_le_compteur() {
        when(consultationRepository.findByTenantIdAndDossierEtudeId(TENANT, DOSSIER))
                .thenReturn(Optional.of(consultation));
        List<DevisConsultation> recus = new ArrayList<>();
        when(devisRepository.existsByConsultationIdAndPartenaireId(CONSULT, FA)).thenReturn(false);
        when(devisRepository.findByTenantIdAndConsultationIdOrderByRecuAtAsc(TENANT, CONSULT))
                .thenAnswer(inv -> recus);
        when(devisRepository.save(any(DevisConsultation.class))).thenAnswer(inv -> {
            DevisConsultation d = inv.getArgument(0);
            d.setId(UUID.randomUUID());
            recus.add(d);
            return d;
        });

        DevisConsultationCreateDto body = new DevisConsultationCreateDto();
        body.setPartenaireId(FA);
        ConsultationEtudeDto after = service.recevoirDevis(DOSSIER, body);

        assertThat(after.getDevisRecus()).isEqualTo(1);
        assertThat(after.getFournisseursDistincts()).isEqualTo(1);
    }

    @Test
    void second_devis_meme_fournisseur_refuse() {
        when(consultationRepository.findByTenantIdAndDossierEtudeId(TENANT, DOSSIER))
                .thenReturn(Optional.of(consultation));
        when(devisRepository.existsByConsultationIdAndPartenaireId(CONSULT, FA)).thenReturn(true);

        DevisConsultationCreateDto body = new DevisConsultationCreateDto();
        body.setPartenaireId(FA);

        assertThatThrownBy(() -> service.recevoirDevis(DOSSIER, body))
                .isInstanceOf(IllegalStateException.class)
                .hasMessage("etudes.consultation.devis.deja_recu");
    }

    @Test
    void fichier_seul_compte_sans_identifier() {
        when(consultationRepository.findByTenantIdAndDossierEtudeId(TENANT, DOSSIER))
                .thenReturn(Optional.of(consultation));
        List<DevisConsultation> recus = new ArrayList<>();
        when(devisRepository.existsByConsultationIdAndPartenaireId(CONSULT, FA)).thenReturn(false);
        when(devisRepository.findByTenantIdAndConsultationIdOrderByRecuAtAsc(TENANT, CONSULT))
                .thenAnswer(inv -> recus);
        when(devisRepository.save(any(DevisConsultation.class))).thenAnswer(inv -> {
            DevisConsultation d = inv.getArgument(0);
            d.setId(UUID.randomUUID());
            recus.add(d);
            return d;
        });

        DevisConsultationCreateDto body = new DevisConsultationCreateDto();
        body.setPartenaireId(FA);
        ConsultationEtudeDto after = service.recevoirDevis(DOSSIER, body);

        assertThat(after.getDevisRecus()).isEqualTo(1);
        assertThat(after.getDevis()).singleElement().satisfies(d -> {
            assertThat(d.isHasLignes()).isFalse();
            assertThat(d.getLignes()).isEmpty();
        });
        assertThat(after.getIdentitesCouvertes()).isEmpty();
    }

    @Test
    void lignes_prix_sont_persistees_sur_le_devis() {
        when(consultationRepository.findByTenantIdAndDossierEtudeId(TENANT, DOSSIER))
                .thenReturn(Optional.of(consultation));
        List<DevisConsultation> recus = new ArrayList<>();
        when(devisRepository.existsByConsultationIdAndPartenaireId(CONSULT, FA)).thenReturn(false);
        when(devisRepository.findByTenantIdAndConsultationIdOrderByRecuAtAsc(TENANT, CONSULT))
                .thenAnswer(inv -> recus);
        when(devisRepository.save(any(DevisConsultation.class))).thenAnswer(inv -> {
            DevisConsultation d = inv.getArgument(0);
            d.setId(UUID.randomUUID());
            recus.add(d);
            return d;
        });

        DevisConsultationCreateDto.Ligne ligne = new DevisConsultationCreateDto.Ligne();
        ligne.setCleStable("ciment-cpj-45");
        ligne.setPrixUnitaire(new BigDecimal("85.50"));
        DevisConsultationCreateDto body = new DevisConsultationCreateDto();
        body.setPartenaireId(FA);
        body.setLignes(List.of(ligne));

        ConsultationEtudeDto after = service.recevoirDevis(DOSSIER, body);

        assertThat(after.getDevis()).singleElement().satisfies(d -> {
            assertThat(d.isHasLignes()).isTrue();
            assertThat(d.getLignes()).singleElement().extracting(ConsultationEtudeDto.Ligne::getCleStable)
                    .isEqualTo("ciment-cpj-45");
        });
        assertThat(after.getIdentitesCouvertes()).isEmpty();
    }

    @Test
    void identifier_fichier_seul_n_identifie_pas() {
        when(consultationRepository.findByTenantIdAndDossierEtudeId(TENANT, DOSSIER))
                .thenReturn(Optional.of(consultation));
        DevisConsultation fichierSeul = DevisConsultation.builder()
                .id(DEVIS_ID)
                .tenantId(TENANT)
                .consultationId(CONSULT)
                .partenaireId(FA)
                .lignes(List.of())
                .build();
        when(devisRepository.findByTenantIdAndConsultationIdOrderByRecuAtAsc(TENANT, CONSULT))
                .thenReturn(List.of(fichierSeul));

        ConsultationIdentifierDto body = new ConsultationIdentifierDto();
        body.setCleStables(List.of("ciment-cpj-45"));
        ConsultationEtudeDto after = service.identifier(DOSSIER, body);

        assertThat(after.getIdentitesCouvertes()).isEmpty();
        verify(dpuService, never()).appliquerPrixConsulte(any(), any(), any(), any(), any());
        verify(catalogueService, never()).create(any());
    }

    @Test
    void countDevisRecus_delegueAuxImportsLies() {
        when(consultationAchatService.countDevisExtraitsLies(DOSSIER)).thenReturn(3L);
        assertThat(service.countDevisRecus(DOSSIER)).isEqualTo(3L);
    }

    @Test
    void identifier_une_identite_pour_trois_postes_applique_consulte_laisse_l_autre() {
        when(consultationRepository.findByTenantIdAndDossierEtudeId(TENANT, DOSSIER))
                .thenReturn(Optional.of(consultation));
        DevisConsultationLigne ciment = DevisConsultationLigne.builder()
                .cleStable("ciment-cpj-45")
                .designation("Ciment CPJ 45")
                .prixUnitaire(new BigDecimal("85.50"))
                .ordre(0)
                .build();
        DevisConsultation devis = DevisConsultation.builder()
                .id(DEVIS_ID)
                .tenantId(TENANT)
                .consultationId(CONSULT)
                .partenaireId(FA)
                .lignes(List.of(ciment, ciment, ciment))
                .build();
        when(devisRepository.findByTenantIdAndConsultationIdOrderByRecuAtAsc(TENANT, CONSULT))
                .thenReturn(List.of(devis));
        when(catalogLookupApi.findByCleStable("ciment-cpj-45"))
                .thenReturn(Optional.of(new CatalogItemSnapshot(
                        CIMENT_ITEM.toString(), "CIM", "Ciment", "T", "MATIERE", "ciment-cpj-45")));
        when(catalogLookupApi.findByCleStable("peinture-acrylique"))
                .thenReturn(Optional.of(new CatalogItemSnapshot(
                        PEINTURE_ITEM.toString(), "PEI", "Peinture", "L", "MATIERE", "peinture-acrylique")));
        List<ConsultationIdentiteCouverte> saved = new ArrayList<>();
        when(identificationRepository.save(any(ConsultationIdentiteCouverte.class))).thenAnswer(inv -> {
            ConsultationIdentiteCouverte row = inv.getArgument(0);
            saved.add(row);
            return row;
        });
        when(identificationRepository.findByConsultationId(CONSULT)).thenAnswer(inv -> saved);

        ConsultationIdentifierDto body = new ConsultationIdentifierDto();
        body.setCleStables(List.of("ciment-cpj-45", "peinture-acrylique"));
        ConsultationEtudeDto after = service.identifier(DOSSIER, body);

        assertThat(after.getIdentitesCouvertes()).hasSize(1);
        assertThat(after.getIdentitesCouvertes().get(0).getCleStable()).isEqualTo("ciment-cpj-45");
        assertThat(after.getIdentitesCouvertes().get(0).getPrixUnitaire()).isEqualByComparingTo("85.50");
        verify(dpuService)
                .appliquerPrixConsulte(
                        eq(DPGF),
                        eq(CIMENT_ITEM),
                        eq(new BigDecimal("85.50")),
                        eq(DEVIS_ID),
                        any());
        verify(dpuService, never())
                .appliquerPrixConsulte(eq(DPGF), eq(PEINTURE_ITEM), any(), any(), any());
        verify(catalogueService).create(org.mockito.ArgumentMatchers.argThat((CatalogueFournisseurLigneCreateDto dto) ->
                CatalogueSource.CONSULTATION_ETUDES.equals(dto.getSource())
                        && CIMENT_ITEM.equals(dto.getArticleId())
                        && DEVIS_ID.equals(dto.getSourceRefId())));
    }
}
