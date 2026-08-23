package ma.nafura.achats.service;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.when;

import java.time.Year;
import java.util.List;
import java.util.Optional;
import java.util.UUID;
import ma.nafura.achats.api.dto.ConsultationAchatDto;
import ma.nafura.achats.api.request.ConsultationAchatCreateDto;
import ma.nafura.achats.api.request.ConsultationAchatPanierDto;
import ma.nafura.achats.api.request.ConsultationDevisImportDto;
import ma.nafura.achats.domain.consultation.ConsultationAchat;
import ma.nafura.achats.domain.consultation.ConsultationAchatDevis;
import ma.nafura.achats.domain.fournisseur.Partner;
import ma.nafura.achats.domain.fournisseur.PartnerRoleType;
import ma.nafura.achats.repository.ConsultationAchatDevisRepository;
import ma.nafura.achats.repository.ConsultationAchatRepository;
import ma.nafura.achats.repository.PartnerRepository;
import ma.nafura.achats.repository.PartnerRoleRepository;
import ma.nafura.achats.service.port.ConsultationLienEtudePort;
import ma.nafura.platform.framework.context.TenantContext;
import org.springframework.beans.factory.ObjectProvider;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

@ExtendWith(MockitoExtension.class)
class ConsultationAchatServiceTest {

    private static final UUID TENANT = UUID.fromString("11111111-1111-1111-1111-111111111111");
    private static final UUID FOURNISSEUR = UUID.fromString("aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa");

    @Mock
    private ConsultationAchatRepository repository;

    @Mock
    private ConsultationAchatDevisRepository devisRepository;

    @Mock
    private PartnerRepository partnerRepository;

    @Mock
    private PartnerRoleRepository roleRepository;

    @Mock
    private ObjectProvider<ConsultationLienEtudePort> lienEtudePort;

    @Mock
    private ConsultationLienEtudePort flagPort;

    private ConsultationAchatService service;

    @BeforeEach
    void setUp() {
        TenantContext.setTenantId(TENANT);
        service = new ConsultationAchatService(
                repository, devisRepository, partnerRepository, roleRepository, lienEtudePort);
    }

    @AfterEach
    void tearDown() {
        TenantContext.clear();
    }

    @Test
    void createHorsEtude_panierEtFournisseur() {
        Partner partner = Partner.builder().id(FOURNISSEUR).raisonSociale("Lafarge").build();
        when(partnerRepository.findByIdAndTenantId(FOURNISSEUR, TENANT)).thenReturn(Optional.of(partner));
        when(roleRepository.existsByTenantIdAndPartnerIdAndRole(TENANT, FOURNISSEUR, PartnerRoleType.FOURNISSEUR))
                .thenReturn(true);
        when(repository.countByTenantId(TENANT)).thenReturn(3L);
        when(devisRepository.countByConsultationId(any())).thenReturn(0L);
        when(repository.save(any(ConsultationAchat.class))).thenAnswer(inv -> {
            ConsultationAchat saved = inv.getArgument(0);
            saved.setId(UUID.fromString("33333333-3333-3333-3333-333333333333"));
            return saved;
        });

        ConsultationAchatCreateDto dto = new ConsultationAchatCreateDto();
        dto.setFournisseurId(FOURNISSEUR);
        dto.setClesStables(List.of("ciment-cpj-45", " sable-de-dune "));

        ConsultationAchatDto created = service.create(dto);

        assertThat(created.getNumero()).isEqualTo("CS-" + Year.now().getValue() + "-0004");
        assertThat(created.getDossierEtudeId()).isNull();
        assertThat(created.getFournisseurId()).isEqualTo(FOURNISSEUR);
        assertThat(created.getFournisseurNom()).isEqualTo("Lafarge");
        assertThat(created.getClesStables()).containsExactly("ciment-cpj-45", "sable-de-dune");
        assertThat(created.getStatut()).isEqualTo(ConsultationAchat.STATUT_DEMANDE);
        assertThat(created.getDevisRecus()).isZero();

        ArgumentCaptor<ConsultationAchat> captor = ArgumentCaptor.forClass(ConsultationAchat.class);
        org.mockito.Mockito.verify(repository).save(captor.capture());
        assertThat(captor.getValue().getDossierEtudeId()).isNull();
    }

    @Test
    void createRefuseFournisseurInconnu() {
        when(partnerRepository.findByIdAndTenantId(FOURNISSEUR, TENANT)).thenReturn(Optional.empty());
        ConsultationAchatCreateDto dto = new ConsultationAchatCreateDto();
        dto.setFournisseurId(FOURNISSEUR);
        assertThatThrownBy(() -> service.create(dto))
                .isInstanceOf(IllegalArgumentException.class)
                .hasMessage("consultation.fournisseur.introuvable");
    }

    @Test
    void createRefuseSansRoleFournisseur() {
        Partner partner = Partner.builder().id(FOURNISSEUR).raisonSociale("Client seul").build();
        when(partnerRepository.findByIdAndTenantId(FOURNISSEUR, TENANT)).thenReturn(Optional.of(partner));
        when(roleRepository.existsByTenantIdAndPartnerIdAndRole(TENANT, FOURNISSEUR, PartnerRoleType.FOURNISSEUR))
                .thenReturn(false);
        ConsultationAchatCreateDto dto = new ConsultationAchatCreateDto();
        dto.setFournisseurId(FOURNISSEUR);
        assertThatThrownBy(() -> service.create(dto))
                .isInstanceOf(IllegalArgumentException.class)
                .hasMessage("consultation.fournisseur.pas_fiche");
    }

    @Test
    void importDevisVide_neCreePas() {
        UUID consultationId = UUID.fromString("33333333-3333-3333-3333-333333333333");
        ConsultationAchat entity = ConsultationAchat.builder()
                .id(consultationId)
                .tenantId(TENANT)
                .numero("CS-2026-0001")
                .fournisseurId(FOURNISSEUR)
                .statut(ConsultationAchat.STATUT_DEMANDE)
                .build();
        when(repository.findByIdAndTenantId(consultationId, TENANT)).thenReturn(Optional.of(entity));

        ConsultationDevisImportDto empty = new ConsultationDevisImportDto();
        empty.setFichierNom("vide.pdf");
        empty.setLignes(List.of());

        assertThatThrownBy(() -> service.importDevis(consultationId, empty))
                .isInstanceOf(IllegalArgumentException.class)
                .hasMessage("consultation.devis.lignes.vides");
        org.mockito.Mockito.verify(devisRepository, org.mockito.Mockito.never()).save(any());
        assertThat(entity.getStatut()).isEqualTo(ConsultationAchat.STATUT_DEMANDE);
    }

    @Test
    void importDevisConfirme_persisteLignesEtPasseDevisRecu() {
        UUID consultationId = UUID.fromString("33333333-3333-3333-3333-333333333333");
        ConsultationAchat entity = ConsultationAchat.builder()
                .id(consultationId)
                .tenantId(TENANT)
                .numero("CS-2026-0001")
                .fournisseurId(FOURNISSEUR)
                .statut(ConsultationAchat.STATUT_DEMANDE)
                .build();
        Partner partner = Partner.builder().id(FOURNISSEUR).raisonSociale("Lafarge").build();
        when(repository.findByIdAndTenantId(consultationId, TENANT)).thenReturn(Optional.of(entity));
        when(partnerRepository.findByIdAndTenantId(FOURNISSEUR, TENANT)).thenReturn(Optional.of(partner));
        when(repository.save(any(ConsultationAchat.class))).thenAnswer(inv -> inv.getArgument(0));
        when(devisRepository.save(any(ConsultationAchatDevis.class))).thenAnswer(inv -> {
            ConsultationAchatDevis saved = inv.getArgument(0);
            saved.setId(UUID.fromString("44444444-4444-4444-4444-444444444444"));
            return saved;
        });
        when(devisRepository.findByConsultationIdOrderByCreatedAtAsc(consultationId)).thenAnswer(inv -> {
            ConsultationAchatDevis devis = ConsultationAchatDevis.builder()
                    .id(UUID.fromString("44444444-4444-4444-4444-444444444444"))
                    .consultationId(consultationId)
                    .fichierNom("devis-lafarge.pdf")
                    .lignes(List.of())
                    .build();
            return List.of(devis);
        });

        ConsultationDevisImportDto.Ligne ligne = new ConsultationDevisImportDto.Ligne();
        ligne.setIdentite("ciment-cpj-45");
        ligne.setLibelle("Ciment CPJ 45");
        ligne.setQuantite(new java.math.BigDecimal("12"));
        ligne.setUnite("t");
        ligne.setPrixUnitaire(new java.math.BigDecimal("1083.75"));
        ConsultationDevisImportDto request = new ConsultationDevisImportDto();
        request.setFichierNom("devis-lafarge.pdf");
        request.setLignes(List.of(ligne));

        ConsultationAchatDto result = service.importDevis(consultationId, request);

        assertThat(result.getStatut()).isEqualTo(ConsultationAchat.STATUT_DEVIS_RECU);
        assertThat(result.getDevisRecus()).isEqualTo(1);
        assertThat(entity.getStatut()).isEqualTo(ConsultationAchat.STATUT_DEVIS_RECU);
        ArgumentCaptor<ConsultationAchatDevis> captor = ArgumentCaptor.forClass(ConsultationAchatDevis.class);
        org.mockito.Mockito.verify(devisRepository).save(captor.capture());
        assertThat(captor.getValue().getLignes()).hasSize(1);
        assertThat(captor.getValue().getLignes().get(0).getIdentite()).isEqualTo("ciment-cpj-45");
        assertThat(captor.getValue().getLignes().get(0).getPrixUnitaire()).isEqualByComparingTo("1083.75");
    }

    @Test
    void addToPanier_mergeDedupEtLieDossier() {
        UUID consultationId = UUID.fromString("33333333-3333-3333-3333-333333333333");
        UUID dossier = UUID.fromString("55555555-5555-5555-5555-555555555555");
        ConsultationAchat entity = ConsultationAchat.builder()
                .id(consultationId)
                .tenantId(TENANT)
                .numero("CS-2026-0001")
                .fournisseurId(FOURNISSEUR)
                .statut(ConsultationAchat.STATUT_DEMANDE)
                .clesStables(new java.util.LinkedHashSet<>(List.of("peinture")))
                .build();
        Partner partner = Partner.builder().id(FOURNISSEUR).raisonSociale("Lafarge").build();
        when(repository.findByIdAndTenantId(consultationId, TENANT)).thenReturn(Optional.of(entity));
        when(partnerRepository.findByIdAndTenantId(FOURNISSEUR, TENANT)).thenReturn(Optional.of(partner));
        when(devisRepository.countByConsultationId(consultationId)).thenReturn(0L);
        when(repository.save(any(ConsultationAchat.class))).thenAnswer(inv -> inv.getArgument(0));

        ConsultationAchatPanierDto dto = new ConsultationAchatPanierDto();
        dto.setClesStables(List.of("ciment-cpj-45", "ciment-cpj-45", "peinture"));
        dto.setDossierEtudeId(dossier);

        ConsultationAchatDto result = service.addToPanier(consultationId, dto);

        assertThat(result.getClesStables()).containsExactlyInAnyOrder("ciment-cpj-45", "peinture");
        assertThat(result.getDossierEtudeId()).isEqualTo(dossier);
        assertThat(entity.getClesStables()).containsExactlyInAnyOrder("ciment-cpj-45", "peinture");
        assertThat(entity.getDossierEtudeId()).isEqualTo(dossier);
    }

    @Test
    void importDevisHorsEtude_neNotifiePasLeFlag() {
        UUID consultationId = UUID.fromString("33333333-3333-3333-3333-333333333333");
        ConsultationAchat entity = ConsultationAchat.builder()
                .id(consultationId)
                .tenantId(TENANT)
                .numero("CS-2026-0001")
                .fournisseurId(FOURNISSEUR)
                .statut(ConsultationAchat.STATUT_DEMANDE)
                .build();
        Partner partner = Partner.builder().id(FOURNISSEUR).raisonSociale("Lafarge").build();
        when(repository.findByIdAndTenantId(consultationId, TENANT)).thenReturn(Optional.of(entity));
        when(partnerRepository.findByIdAndTenantId(FOURNISSEUR, TENANT)).thenReturn(Optional.of(partner));
        when(repository.save(any(ConsultationAchat.class))).thenAnswer(inv -> inv.getArgument(0));
        when(devisRepository.save(any(ConsultationAchatDevis.class))).thenAnswer(inv -> inv.getArgument(0));
        when(devisRepository.findByConsultationIdOrderByCreatedAtAsc(consultationId)).thenReturn(List.of());

        ConsultationDevisImportDto.Ligne ligne = new ConsultationDevisImportDto.Ligne();
        ligne.setIdentite("ciment-cpj-45");
        ligne.setLibelle("Ciment CPJ 45");
        ligne.setPrixUnitaire(new java.math.BigDecimal("1083.75"));
        ConsultationDevisImportDto request = new ConsultationDevisImportDto();
        request.setLignes(List.of(ligne));

        service.importDevis(consultationId, request);

        org.mockito.Mockito.verify(lienEtudePort, org.mockito.Mockito.never()).getIfAvailable();
        org.mockito.Mockito.verify(flagPort, org.mockito.Mockito.never()).appliquerFlagsApresDevis(any());
    }

    @Test
    void importDevisLiee_notifieLeFlag() {
        UUID consultationId = UUID.fromString("33333333-3333-3333-3333-333333333333");
        UUID dossier = UUID.fromString("55555555-5555-5555-5555-555555555555");
        ConsultationAchat entity = ConsultationAchat.builder()
                .id(consultationId)
                .tenantId(TENANT)
                .numero("CS-2026-0001")
                .fournisseurId(FOURNISSEUR)
                .dossierEtudeId(dossier)
                .statut(ConsultationAchat.STATUT_DEMANDE)
                .build();
        Partner partner = Partner.builder().id(FOURNISSEUR).raisonSociale("Lafarge").build();
        when(repository.findByIdAndTenantId(consultationId, TENANT)).thenReturn(Optional.of(entity));
        when(partnerRepository.findByIdAndTenantId(FOURNISSEUR, TENANT)).thenReturn(Optional.of(partner));
        when(repository.save(any(ConsultationAchat.class))).thenAnswer(inv -> inv.getArgument(0));
        when(devisRepository.save(any(ConsultationAchatDevis.class))).thenAnswer(inv -> inv.getArgument(0));
        when(devisRepository.findByConsultationIdOrderByCreatedAtAsc(consultationId)).thenReturn(List.of());
        when(lienEtudePort.getIfAvailable()).thenReturn(flagPort);

        ConsultationDevisImportDto.Ligne ligne = new ConsultationDevisImportDto.Ligne();
        ligne.setIdentite("ciment-cpj-45");
        ligne.setLibelle("Ciment CPJ 45");
        ligne.setPrixUnitaire(new java.math.BigDecimal("1083.75"));
        ConsultationDevisImportDto request = new ConsultationDevisImportDto();
        request.setLignes(List.of(ligne));

        service.importDevis(consultationId, request);

        org.mockito.Mockito.verify(flagPort).appliquerFlagsApresDevis(dossier);
    }

    @Test
    void countDevisExtraitsLies_horsEtudeZero() {
        assertThat(service.countDevisExtraitsLies(null)).isZero();
    }

    @Test
    void countDevisExtraitsLies_sommeLesImportsLies() {
        UUID dossier = UUID.fromString("55555555-5555-5555-5555-555555555555");
        UUID c1 = UUID.fromString("33333333-3333-3333-3333-333333333333");
        ConsultationAchat liee = ConsultationAchat.builder().id(c1).dossierEtudeId(dossier).build();
        when(repository.findByTenantIdAndDossierEtudeId(TENANT, dossier)).thenReturn(List.of(liee));
        when(devisRepository.countByConsultationIdIn(List.of(c1))).thenReturn(2L);

        assertThat(service.countDevisExtraitsLies(dossier)).isEqualTo(2L);
    }
}
