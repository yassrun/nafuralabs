package ma.nafura.achats.service;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.when;

import java.time.Year;
import java.util.ArrayList;
import java.util.List;
import java.util.Optional;
import java.util.UUID;
import ma.nafura.achats.api.dto.ConsultationAchatDto;
import ma.nafura.achats.api.request.ConsultationAchatCreateDto;
import ma.nafura.achats.api.request.ConsultationAchatPanierDto;
import ma.nafura.achats.api.request.ConsultationDestinataireCreateDto;
import ma.nafura.achats.api.request.ConsultationDestinatairesSaveDto;
import ma.nafura.achats.api.request.ConsultationDevisImportDto;
import ma.nafura.achats.domain.consultation.ConsultationAchat;
import ma.nafura.achats.domain.consultation.ConsultationAchatDestinataire;
import ma.nafura.achats.domain.consultation.ConsultationAchatDestinataireContact;
import ma.nafura.achats.domain.consultation.ConsultationAchatDevis;
import ma.nafura.achats.domain.consultation.ConsultationAchatEnvoi;
import ma.nafura.achats.domain.fournisseur.Partner;
import ma.nafura.achats.domain.fournisseur.PartnerContact;
import ma.nafura.achats.domain.fournisseur.PartnerRoleType;
import ma.nafura.achats.repository.ConsultationAchatDestinataireContactRepository;
import ma.nafura.achats.repository.ConsultationAchatDestinataireRepository;
import ma.nafura.achats.repository.ConsultationAchatDevisRepository;
import ma.nafura.achats.repository.ConsultationAchatEnvoiRepository;
import ma.nafura.achats.repository.ConsultationAchatRepository;
import ma.nafura.achats.repository.PartnerContactRepository;
import ma.nafura.achats.repository.PartnerRepository;
import ma.nafura.achats.repository.PartnerRoleRepository;
import ma.nafura.achats.service.port.ConsultationLienEtudePort;
import ma.nafura.catalogue.api.CatalogLookupApi;
import ma.nafura.platform.collaboration.notification.service.EmailService;
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
    private static final UUID FOURNISSEUR_B = UUID.fromString("bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb");
    private static final UUID CONSULTATION = UUID.fromString("33333333-3333-3333-3333-333333333333");
    private static final UUID CONTACT_A = UUID.fromString("cccccccc-cccc-cccc-cccc-cccccccccccc");
    private static final UUID CONTACT_B = UUID.fromString("dddddddd-dddd-dddd-dddd-dddddddddddd");
    private static final UUID DEST_A = UUID.fromString("eeeeeeee-eeee-eeee-eeee-eeeeeeeeeeee");
    private static final UUID DEST_B = UUID.fromString("ffffffff-ffff-ffff-ffff-ffffffffffff");

    @Mock
    private ConsultationAchatRepository repository;

    @Mock
    private ConsultationAchatDevisRepository devisRepository;

    @Mock
    private ConsultationAchatDestinataireRepository destinataireRepository;

    @Mock
    private ConsultationAchatDestinataireContactRepository destContactRepository;

    @Mock
    private ConsultationAchatEnvoiRepository envoiRepository;

    @Mock
    private PartnerRepository partnerRepository;

    @Mock
    private PartnerRoleRepository roleRepository;

    @Mock
    private PartnerContactRepository contactRepository;

    @Mock
    private ObjectProvider<ConsultationLienEtudePort> lienEtudePort;

    @Mock
    private ConsultationLienEtudePort flagPort;

    @Mock
    private ObjectProvider<EmailService> emailServiceProvider;

    @Mock
    private EmailService emailService;

    @Mock
    private ObjectProvider<CatalogLookupApi> catalogLookupProvider;

    private ConsultationAchatService service;

    @BeforeEach
    void setUp() {
        TenantContext.setTenantId(TENANT);
        service = new ConsultationAchatService(
                repository,
                devisRepository,
                destinataireRepository,
                destContactRepository,
                envoiRepository,
                partnerRepository,
                roleRepository,
                contactRepository,
                lienEtudePort,
                emailServiceProvider,
                catalogLookupProvider);
    }

    @AfterEach
    void tearDown() {
        TenantContext.clear();
    }

    @Test
    void listFiltreFournisseurEtArticle() {
        ConsultationAchat withDest = consultationPrep();
        ConsultationAchat other = ConsultationAchat.builder()
                .id(UUID.fromString("44444444-4444-4444-4444-444444444444"))
                .tenantId(TENANT)
                .numero("CS-2026-0002")
                .statut(ConsultationAchat.STATUT_PREPARATION)
                .clesStables(new java.util.LinkedHashSet<>(List.of("peinture")))
                .build();
        when(repository.findByTenantIdOrderByCreatedAtDesc(TENANT)).thenReturn(List.of(withDest, other));
        when(destinataireRepository.findByConsultationIdInOrderByCreatedAtAsc(any()))
                .thenReturn(List.of(destRow(DEST_A, FOURNISSEUR, CONTACT_A)));
        when(envoiRepository.findByConsultationIdInOrderBySentAtAsc(any())).thenReturn(List.of());
        when(partnerRepository.findByIdAndTenantId(FOURNISSEUR, TENANT))
                .thenReturn(Optional.of(Partner.builder().id(FOURNISSEUR).raisonSociale("Lafarge").build()));
        when(contactRepository.findByIdAndTenantId(CONTACT_A, TENANT))
                .thenReturn(Optional.of(contact(CONTACT_A, FOURNISSEUR, "A", "a@lafarge.example")));

        List<ConsultationAchatDto> byFrn = service.list("all", null, FOURNISSEUR, null, null);
        assertThat(byFrn).extracting(ConsultationAchatDto::getNumero).containsExactly("CS-2026-0001");

        List<ConsultationAchatDto> byPanier = service.list("all", null, null, null, "peinture");
        assertThat(byPanier).extracting(ConsultationAchatDto::getNumero).containsExactly("CS-2026-0002");
    }

    @Test
    void createSansFournisseur_panierSeulement() {
        stubCreateSave();
        when(destinataireRepository.findByConsultationIdOrderByCreatedAtAsc(any())).thenReturn(List.of());

        ConsultationAchatCreateDto dto = new ConsultationAchatCreateDto();
        dto.setClesStables(List.of("ciment-cpj-45", " sable-de-dune "));

        ConsultationAchatDto created = service.create(dto);

        assertThat(created.getNumero()).isEqualTo("CS-" + Year.now().getValue() + "-0004");
        assertThat(created.getDossierEtudeId()).isNull();
        assertThat(created.getClesStables()).containsExactly("ciment-cpj-45", "sable-de-dune");
        assertThat(created.getStatut()).isEqualTo(ConsultationAchat.STATUT_PREPARATION);
        assertThat(created.getDevisRecus()).isZero();
        assertThat(created.getDestinataires()).isEmpty();
        org.mockito.Mockito.verify(partnerRepository, never()).findByIdAndTenantId(any(), any());
        org.mockito.Mockito.verify(destinataireRepository, never()).save(any());
    }

    @Test
    void createIgnoreFournisseurId_aucunDestinataire() {
        stubCreateSave();
        when(destinataireRepository.findByConsultationIdOrderByCreatedAtAsc(any())).thenReturn(List.of());

        ConsultationAchatCreateDto dto = new ConsultationAchatCreateDto();
        dto.setFournisseurId(FOURNISSEUR);
        dto.setClesStables(List.of("ciment-cpj-45"));

        ConsultationAchatDto created = service.create(dto);

        assertThat(created.getStatut()).isEqualTo(ConsultationAchat.STATUT_PREPARATION);
        assertThat(created.getDestinataires()).isEmpty();
        org.mockito.Mockito.verify(roleRepository, never())
                .existsByTenantIdAndPartnerIdAndRole(any(), any(), any());
        org.mockito.Mockito.verify(destinataireRepository, never()).save(any());
    }

    @Test
    void addDestinataireRefuseSansEmail() {
        ConsultationAchat entity = consultationPrep();
        when(repository.findByIdAndTenantId(CONSULTATION, TENANT)).thenReturn(Optional.of(entity));
        when(partnerRepository.findByIdAndTenantId(FOURNISSEUR, TENANT))
                .thenReturn(Optional.of(Partner.builder().id(FOURNISSEUR).raisonSociale("Atlas").build()));
        when(roleRepository.existsByTenantIdAndPartnerIdAndRole(
                        TENANT, FOURNISSEUR, PartnerRoleType.FOURNISSEUR))
                .thenReturn(true);
        when(destinataireRepository.existsByConsultationIdAndFournisseurId(CONSULTATION, FOURNISSEUR))
                .thenReturn(false);
        when(contactRepository.findByTenantIdAndPartnerIdOrderByNomAsc(TENANT, FOURNISSEUR))
                .thenReturn(List.of(PartnerContact.builder()
                        .id(CONTACT_A)
                        .partnerId(FOURNISSEUR)
                        .nom("Sans mail")
                        .email("  ")
                        .build()));

        ConsultationDestinataireCreateDto dto = new ConsultationDestinataireCreateDto();
        dto.setFournisseurId(FOURNISSEUR);

        assertThatThrownBy(() -> service.addDestinataire(CONSULTATION, dto))
                .isInstanceOf(IllegalArgumentException.class)
                .hasMessage("consultation.destinataire.sans_email");
        org.mockito.Mockito.verify(destinataireRepository, never()).save(any());
    }

    @Test
    void addDestinataireRefuseSansContactEmailMemeSiPartnersEmail() {
        ConsultationAchat entity = consultationPrep();
        when(repository.findByIdAndTenantId(CONSULTATION, TENANT)).thenReturn(Optional.of(entity));
        when(partnerRepository.findByIdAndTenantId(FOURNISSEUR, TENANT))
                .thenReturn(Optional.of(Partner.builder()
                        .id(FOURNISSEUR)
                        .raisonSociale("Atlas")
                        .email("fallback@atlas.example")
                        .build()));
        when(roleRepository.existsByTenantIdAndPartnerIdAndRole(
                        TENANT, FOURNISSEUR, PartnerRoleType.FOURNISSEUR))
                .thenReturn(true);
        when(destinataireRepository.existsByConsultationIdAndFournisseurId(CONSULTATION, FOURNISSEUR))
                .thenReturn(false);
        when(contactRepository.findByTenantIdAndPartnerIdOrderByNomAsc(TENANT, FOURNISSEUR))
                .thenReturn(List.of());

        ConsultationDestinataireCreateDto dto = new ConsultationDestinataireCreateDto();
        dto.setFournisseurId(FOURNISSEUR);
        assertThatThrownBy(() -> service.addDestinataire(CONSULTATION, dto))
                .isInstanceOf(IllegalArgumentException.class)
                .hasMessage("consultation.destinataire.sans_email");
        org.mockito.Mockito.verify(destinataireRepository, never()).save(any());
        org.mockito.Mockito.verify(contactRepository, never()).save(any());
    }

    @Test
    void addDestinataireRefuseWriteThroughPayload() {
        ConsultationAchat entity = consultationPrep();
        when(repository.findByIdAndTenantId(CONSULTATION, TENANT)).thenReturn(Optional.of(entity));
        Partner fournisseur = Partner.builder().id(FOURNISSEUR).raisonSociale("Sika").build();
        when(partnerRepository.findByIdAndTenantId(FOURNISSEUR, TENANT)).thenReturn(Optional.of(fournisseur));
        when(roleRepository.existsByTenantIdAndPartnerIdAndRole(
                        TENANT, FOURNISSEUR, PartnerRoleType.FOURNISSEUR))
                .thenReturn(true);
        when(destinataireRepository.existsByConsultationIdAndFournisseurId(CONSULTATION, FOURNISSEUR))
                .thenReturn(false);
        when(contactRepository.findByTenantIdAndPartnerIdOrderByNomAsc(TENANT, FOURNISSEUR))
                .thenReturn(List.of());

        ConsultationDestinataireCreateDto dto = new ConsultationDestinataireCreateDto();
        dto.setFournisseurId(FOURNISSEUR);
        assertThatThrownBy(() -> service.addDestinataire(CONSULTATION, dto))
                .isInstanceOf(IllegalArgumentException.class)
                .hasMessage("consultation.destinataire.sans_email");
        org.mockito.Mockito.verify(contactRepository, never()).save(any());
        org.mockito.Mockito.verify(destinataireRepository, never()).save(any());
    }

    @Test
    void addDeuxDestinataires() {
        ConsultationAchat entity = consultationPrep();
        when(repository.findByIdAndTenantId(CONSULTATION, TENANT)).thenReturn(Optional.of(entity));
        when(partnerRepository.findByIdAndTenantId(FOURNISSEUR, TENANT))
                .thenReturn(Optional.of(Partner.builder().id(FOURNISSEUR).raisonSociale("Lafarge").build()));
        when(partnerRepository.findByIdAndTenantId(FOURNISSEUR_B, TENANT))
                .thenReturn(Optional.of(Partner.builder().id(FOURNISSEUR_B).raisonSociale("Sika").build()));
        when(roleRepository.existsByTenantIdAndPartnerIdAndRole(
                        TENANT, FOURNISSEUR, PartnerRoleType.FOURNISSEUR))
                .thenReturn(true);
        when(roleRepository.existsByTenantIdAndPartnerIdAndRole(
                        TENANT, FOURNISSEUR_B, PartnerRoleType.FOURNISSEUR))
                .thenReturn(true);
        when(destinataireRepository.existsByConsultationIdAndFournisseurId(CONSULTATION, FOURNISSEUR))
                .thenReturn(false);
        when(destinataireRepository.existsByConsultationIdAndFournisseurId(CONSULTATION, FOURNISSEUR_B))
                .thenReturn(false);
        PartnerContact contactA = PartnerContact.builder()
                .id(CONTACT_A)
                .partnerId(FOURNISSEUR)
                .nom("A. Benali")
                .email("achat@lafarge.example")
                .build();
        PartnerContact contactB = PartnerContact.builder()
                .id(CONTACT_B)
                .partnerId(FOURNISSEUR_B)
                .nom("M. Kadiri")
                .email("devis@sika.example")
                .build();
        when(contactRepository.findByTenantIdAndPartnerIdOrderByNomAsc(TENANT, FOURNISSEUR))
                .thenReturn(List.of(contactA));
        when(contactRepository.findByTenantIdAndPartnerIdOrderByNomAsc(TENANT, FOURNISSEUR_B))
                .thenReturn(List.of(contactB));
        when(contactRepository.findByIdAndTenantId(CONTACT_A, TENANT)).thenReturn(Optional.of(contactA));
        when(contactRepository.findByIdAndTenantId(CONTACT_B, TENANT)).thenReturn(Optional.of(contactB));

        List<ConsultationAchatDestinataire> saved = new ArrayList<>();
        when(destinataireRepository.save(any(ConsultationAchatDestinataire.class))).thenAnswer(inv -> {
            ConsultationAchatDestinataire row = inv.getArgument(0);
            if (row.getId() == null) {
                row.setId(UUID.randomUUID());
            }
            saved.add(row);
            return row;
        });
        when(destinataireRepository.findByConsultationIdOrderByCreatedAtAsc(CONSULTATION))
                .thenAnswer(inv -> List.copyOf(saved));
        when(devisRepository.findByConsultationIdOrderByCreatedAtAsc(CONSULTATION)).thenReturn(List.of());

        ConsultationDestinataireCreateDto first = new ConsultationDestinataireCreateDto();
        first.setFournisseurId(FOURNISSEUR);
        ConsultationAchatDto afterFirst = service.addDestinataire(CONSULTATION, first);
        assertThat(afterFirst.getDestinataires()).hasSize(1);
        assertThat(afterFirst.getDestinataires().get(0).getFournisseurId()).isEqualTo(FOURNISSEUR);
        assertThat(afterFirst.getDestinataires().get(0).getContactEmail()).isEqualTo("achat@lafarge.example");
        assertThat(afterFirst.getDestinataires().get(0).getStatut())
                .isEqualTo(ConsultationAchatDestinataire.STATUT_EN_ATTENTE);

        ConsultationDestinataireCreateDto second = new ConsultationDestinataireCreateDto();
        second.setFournisseurId(FOURNISSEUR_B);
        ConsultationAchatDto afterSecond = service.addDestinataire(CONSULTATION, second);
        assertThat(afterSecond.getDestinataires()).hasSize(2);
        assertThat(afterSecond.getDestinataires())
                .extracting(d -> d.getFournisseurId())
                .containsExactly(FOURNISSEUR, FOURNISSEUR_B);
        assertThat(afterSecond.getStatut()).isEqualTo(ConsultationAchat.STATUT_PREPARATION);
    }

    @Test
    void addDestinataireNContactsSansChoix_refuse() {
        ConsultationAchat entity = consultationPrep();
        when(repository.findByIdAndTenantId(CONSULTATION, TENANT)).thenReturn(Optional.of(entity));
        when(partnerRepository.findByIdAndTenantId(FOURNISSEUR, TENANT))
                .thenReturn(Optional.of(Partner.builder().id(FOURNISSEUR).raisonSociale("Lafarge").build()));
        when(roleRepository.existsByTenantIdAndPartnerIdAndRole(
                        TENANT, FOURNISSEUR, PartnerRoleType.FOURNISSEUR))
                .thenReturn(true);
        when(destinataireRepository.existsByConsultationIdAndFournisseurId(CONSULTATION, FOURNISSEUR))
                .thenReturn(false);
        when(contactRepository.findByTenantIdAndPartnerIdOrderByNomAsc(TENANT, FOURNISSEUR))
                .thenReturn(List.of(
                        PartnerContact.builder()
                                .id(CONTACT_A)
                                .partnerId(FOURNISSEUR)
                                .nom("A. Benali")
                                .email("achat@lafarge.example")
                                .build(),
                        PartnerContact.builder()
                                .id(CONTACT_B)
                                .partnerId(FOURNISSEUR)
                                .nom("B. Kadiri")
                                .email("devis@lafarge.example")
                                .build()));

        ConsultationDestinataireCreateDto dto = new ConsultationDestinataireCreateDto();
        dto.setFournisseurId(FOURNISSEUR);

        assertThatThrownBy(() -> service.addDestinataire(CONSULTATION, dto))
                .isInstanceOf(IllegalArgumentException.class)
                .hasMessage("consultation.destinataire.contact_requis");
        org.mockito.Mockito.verify(destinataireRepository, never()).save(any());
    }

    @Test
    void addDestinataireNContactsAvecChoix_bindLeContact() {
        ConsultationAchat entity = consultationPrep();
        when(repository.findByIdAndTenantId(CONSULTATION, TENANT)).thenReturn(Optional.of(entity));
        when(partnerRepository.findByIdAndTenantId(FOURNISSEUR, TENANT))
                .thenReturn(Optional.of(Partner.builder().id(FOURNISSEUR).raisonSociale("Lafarge").build()));
        when(roleRepository.existsByTenantIdAndPartnerIdAndRole(
                        TENANT, FOURNISSEUR, PartnerRoleType.FOURNISSEUR))
                .thenReturn(true);
        when(destinataireRepository.existsByConsultationIdAndFournisseurId(CONSULTATION, FOURNISSEUR))
                .thenReturn(false);
        PartnerContact contactA = PartnerContact.builder()
                .id(CONTACT_A)
                .partnerId(FOURNISSEUR)
                .nom("A. Benali")
                .email("achat@lafarge.example")
                .build();
        PartnerContact contactB = PartnerContact.builder()
                .id(CONTACT_B)
                .partnerId(FOURNISSEUR)
                .nom("B. Kadiri")
                .email("devis@lafarge.example")
                .build();
        when(contactRepository.findByTenantIdAndPartnerIdOrderByNomAsc(TENANT, FOURNISSEUR))
                .thenReturn(List.of(contactA, contactB));
        when(contactRepository.findByIdAndTenantId(CONTACT_B, TENANT)).thenReturn(Optional.of(contactB));
        when(destinataireRepository.save(any(ConsultationAchatDestinataire.class))).thenAnswer(inv -> {
            ConsultationAchatDestinataire row = inv.getArgument(0);
            if (row.getId() == null) {
                row.setId(UUID.randomUUID());
            }
            return row;
        });
        when(destinataireRepository.findByConsultationIdOrderByCreatedAtAsc(CONSULTATION))
                .thenAnswer(inv -> List.of(ConsultationAchatDestinataire.builder()
                        .id(UUID.randomUUID())
                        .consultationId(CONSULTATION)
                        .fournisseurId(FOURNISSEUR)
                        .contactId(CONTACT_B)
                        .statut(ConsultationAchatDestinataire.STATUT_EN_ATTENTE)
                        .build()));
        when(devisRepository.findByConsultationIdOrderByCreatedAtAsc(CONSULTATION)).thenReturn(List.of());

        ConsultationDestinataireCreateDto dto = new ConsultationDestinataireCreateDto();
        dto.setFournisseurId(FOURNISSEUR);
        dto.setContactId(CONTACT_B);
        ConsultationAchatDto saved = service.addDestinataire(CONSULTATION, dto);

        ArgumentCaptor<ConsultationAchatDestinataire> captor =
                ArgumentCaptor.forClass(ConsultationAchatDestinataire.class);
        org.mockito.Mockito.verify(destinataireRepository).save(captor.capture());
        assertThat(captor.getValue().getContactId()).isEqualTo(CONTACT_B);
        assertThat(saved.getDestinataires()).hasSize(1);
        assertThat(saved.getDestinataires().get(0).getContactEmail()).isEqualTo("devis@lafarge.example");
    }

    @Test
    void addDestinatairePlusieursContacts_toEtCc() {
        ConsultationAchat entity = consultationPrep();
        when(repository.findByIdAndTenantId(CONSULTATION, TENANT)).thenReturn(Optional.of(entity));
        when(partnerRepository.findByIdAndTenantId(FOURNISSEUR, TENANT))
                .thenReturn(Optional.of(Partner.builder().id(FOURNISSEUR).raisonSociale("Lafarge").build()));
        when(roleRepository.existsByTenantIdAndPartnerIdAndRole(
                        TENANT, FOURNISSEUR, PartnerRoleType.FOURNISSEUR))
                .thenReturn(true);
        when(destinataireRepository.existsByConsultationIdAndFournisseurId(CONSULTATION, FOURNISSEUR))
                .thenReturn(false);
        PartnerContact contactA = PartnerContact.builder()
                .id(CONTACT_A)
                .partnerId(FOURNISSEUR)
                .nom("A. Benali")
                .email("achat@lafarge.example")
                .build();
        PartnerContact contactB = PartnerContact.builder()
                .id(CONTACT_B)
                .partnerId(FOURNISSEUR)
                .nom("B. Kadiri")
                .email("devis@lafarge.example")
                .build();
        when(contactRepository.findByTenantIdAndPartnerIdOrderByNomAsc(TENANT, FOURNISSEUR))
                .thenReturn(List.of(contactA, contactB));
        when(contactRepository.findByIdAndTenantId(CONTACT_A, TENANT)).thenReturn(Optional.of(contactA));
        when(contactRepository.findByIdAndTenantId(CONTACT_B, TENANT)).thenReturn(Optional.of(contactB));
        UUID destId = UUID.fromString("aaaaaaaa-bbbb-cccc-dddd-eeeeeeeeeeee");
        when(destinataireRepository.save(any(ConsultationAchatDestinataire.class))).thenAnswer(inv -> {
            ConsultationAchatDestinataire row = inv.getArgument(0);
            if (row.getId() == null) {
                row.setId(destId);
            }
            return row;
        });
        when(destinataireRepository.findByConsultationIdOrderByCreatedAtAsc(CONSULTATION))
                .thenReturn(List.of(destRow(destId, FOURNISSEUR, CONTACT_A)));
        when(destContactRepository.findByDestinataireIdInOrderByPositionAsc(any()))
                .thenReturn(List.of(
                        ConsultationAchatDestinataireContact.builder()
                                .destinataireId(destId)
                                .contactId(CONTACT_A)
                                .position(0)
                                .build(),
                        ConsultationAchatDestinataireContact.builder()
                                .destinataireId(destId)
                                .contactId(CONTACT_B)
                                .position(1)
                                .build()));
        when(devisRepository.findByConsultationIdOrderByCreatedAtAsc(CONSULTATION)).thenReturn(List.of());

        ConsultationDestinataireCreateDto dto = new ConsultationDestinataireCreateDto();
        dto.setFournisseurId(FOURNISSEUR);
        dto.setContactIds(List.of(CONTACT_A, CONTACT_B));
        ConsultationAchatDto saved = service.addDestinataire(CONSULTATION, dto);

        assertThat(saved.getDestinataires().get(0).getContacts()).hasSize(2);
        assertThat(saved.getDestinataires().get(0).getContactEmail()).isEqualTo("achat@lafarge.example");
        org.mockito.Mockito.verify(destContactRepository, org.mockito.Mockito.times(2))
                .save(any(ConsultationAchatDestinataireContact.class));
    }

    @Test
    void saveDestinataires_majContactsDuMemeFournisseur() {
        ConsultationAchat entity = consultationPrep();
        ConsultationAchatDestinataire existing = destRow(DEST_A, FOURNISSEUR, CONTACT_A);
        when(repository.findByIdAndTenantId(CONSULTATION, TENANT)).thenReturn(Optional.of(entity));
        when(destinataireRepository.findByConsultationIdOrderByCreatedAtAsc(CONSULTATION))
                .thenReturn(List.of(existing));
        when(envoiRepository.findByConsultationIdOrderBySentAtAsc(CONSULTATION)).thenReturn(List.of());
        when(partnerRepository.findByIdAndTenantId(FOURNISSEUR, TENANT))
                .thenReturn(Optional.of(Partner.builder().id(FOURNISSEUR).raisonSociale("Lafarge").build()));
        when(roleRepository.existsByTenantIdAndPartnerIdAndRole(
                        TENANT, FOURNISSEUR, PartnerRoleType.FOURNISSEUR))
                .thenReturn(true);
        PartnerContact contactA = contact(CONTACT_A, FOURNISSEUR, "A. Benali", "achat@lafarge.example");
        PartnerContact contactB = contact(CONTACT_B, FOURNISSEUR, "B. Kadiri", "devis@lafarge.example");
        when(contactRepository.findByTenantIdAndPartnerIdOrderByNomAsc(TENANT, FOURNISSEUR))
                .thenReturn(List.of(contactA, contactB));
        when(contactRepository.findByIdAndTenantId(CONTACT_A, TENANT)).thenReturn(Optional.of(contactA));
        when(contactRepository.findByIdAndTenantId(CONTACT_B, TENANT)).thenReturn(Optional.of(contactB));
        when(destinataireRepository.save(any(ConsultationAchatDestinataire.class))).thenAnswer(inv -> inv.getArgument(0));
        when(destContactRepository.findByDestinataireIdInOrderByPositionAsc(any()))
                .thenReturn(List.of(
                        ConsultationAchatDestinataireContact.builder()
                                .destinataireId(DEST_A)
                                .contactId(CONTACT_A)
                                .position(0)
                                .build(),
                        ConsultationAchatDestinataireContact.builder()
                                .destinataireId(DEST_A)
                                .contactId(CONTACT_B)
                                .position(1)
                                .build()));
        when(devisRepository.findByConsultationIdOrderByCreatedAtAsc(CONSULTATION)).thenReturn(List.of());

        ConsultationDestinataireCreateDto item = new ConsultationDestinataireCreateDto();
        item.setFournisseurId(FOURNISSEUR);
        item.setContactIds(List.of(CONTACT_A, CONTACT_B));
        ConsultationDestinatairesSaveDto body = new ConsultationDestinatairesSaveDto();
        body.setItems(List.of(item));
        ConsultationAchatDto saved = service.saveDestinataires(CONSULTATION, body);

        org.mockito.Mockito.verify(destContactRepository).deleteByDestinataireId(DEST_A);
        org.mockito.Mockito.verify(destContactRepository).flush();
        assertThat(saved.getDestinataires()).hasSize(1);
        assertThat(saved.getDestinataires().get(0).getContacts()).hasSize(2);
    }

    @Test
    void saveDestinataires_remplaceLesNonEnvoyes() {
        ConsultationAchat entity = consultationPrep();
        ConsultationAchatDestinataire existing = destRow(DEST_A, FOURNISSEUR, CONTACT_A);
        when(repository.findByIdAndTenantId(CONSULTATION, TENANT)).thenReturn(Optional.of(entity));
        when(destinataireRepository.findByConsultationIdOrderByCreatedAtAsc(CONSULTATION))
                .thenReturn(List.of(existing))
                .thenReturn(List.of(destRow(DEST_B, FOURNISSEUR_B, CONTACT_B)));
        when(envoiRepository.findByConsultationIdOrderBySentAtAsc(CONSULTATION)).thenReturn(List.of());
        when(partnerRepository.findByIdAndTenantId(FOURNISSEUR_B, TENANT))
                .thenReturn(Optional.of(Partner.builder().id(FOURNISSEUR_B).raisonSociale("Sika").build()));
        when(roleRepository.existsByTenantIdAndPartnerIdAndRole(
                        TENANT, FOURNISSEUR_B, PartnerRoleType.FOURNISSEUR))
                .thenReturn(true);
        PartnerContact contactB = contact(CONTACT_B, FOURNISSEUR_B, "M. Kadiri", "devis@sika.example");
        when(contactRepository.findByTenantIdAndPartnerIdOrderByNomAsc(TENANT, FOURNISSEUR_B))
                .thenReturn(List.of(contactB));
        when(contactRepository.findByIdAndTenantId(CONTACT_B, TENANT)).thenReturn(Optional.of(contactB));
        when(destinataireRepository.save(any(ConsultationAchatDestinataire.class))).thenAnswer(inv -> {
            ConsultationAchatDestinataire row = inv.getArgument(0);
            if (row.getId() == null) {
                row.setId(DEST_B);
            }
            return row;
        });
        when(devisRepository.findByConsultationIdOrderByCreatedAtAsc(CONSULTATION)).thenReturn(List.of());

        ConsultationDestinataireCreateDto item = new ConsultationDestinataireCreateDto();
        item.setFournisseurId(FOURNISSEUR_B);
        ConsultationDestinatairesSaveDto body = new ConsultationDestinatairesSaveDto();
        body.setItems(List.of(item));
        ConsultationAchatDto saved = service.saveDestinataires(CONSULTATION, body);

        org.mockito.Mockito.verify(destinataireRepository).delete(existing);
        assertThat(saved.getDestinataires()).hasSize(1);
        assertThat(saved.getDestinataires().get(0).getFournisseurId()).isEqualTo(FOURNISSEUR_B);
    }

    @Test
    void importDevisSansDestinataire_4xx() {
        ConsultationAchat entity = consultationPrep();
        when(repository.findByIdAndTenantId(CONSULTATION, TENANT)).thenReturn(Optional.of(entity));

        ConsultationDevisImportDto empty = new ConsultationDevisImportDto();
        empty.setFichierNom("vide.pdf");
        empty.setLignes(List.of(ligneCiment()));

        assertThatThrownBy(() -> service.importDevis(CONSULTATION, empty))
                .isInstanceOf(IllegalArgumentException.class)
                .hasMessage("consultation.devis.destinataire.obligatoire");
        org.mockito.Mockito.verify(devisRepository, never()).save(any());
        assertThat(entity.getStatut()).isEqualTo(ConsultationAchat.STATUT_PREPARATION);
    }

    @Test
    void importDevisVideAvecDestinataire_neCreePas() {
        ConsultationAchat entity = consultationPrep();
        ConsultationAchatDestinataire dest = destRow(DEST_A, FOURNISSEUR, CONTACT_A);
        when(repository.findByIdAndTenantId(CONSULTATION, TENANT)).thenReturn(Optional.of(entity));
        when(destinataireRepository.findByIdAndTenantId(DEST_A, TENANT)).thenReturn(Optional.of(dest));

        ConsultationDevisImportDto empty = new ConsultationDevisImportDto();
        empty.setDestinataireId(DEST_A);
        empty.setFichierNom("vide.pdf");
        empty.setLignes(List.of());

        assertThatThrownBy(() -> service.importDevis(CONSULTATION, empty))
                .isInstanceOf(IllegalArgumentException.class)
                .hasMessage("consultation.devis.lignes.vides");
        org.mockito.Mockito.verify(devisRepository, never()).save(any());
        assertThat(dest.getStatut()).isEqualTo(ConsultationAchatDestinataire.STATUT_EN_ATTENTE);
        assertThat(entity.getStatut()).isEqualTo(ConsultationAchat.STATUT_PREPARATION);
    }

    @Test
    void importDevisConfirme_cibleDestinataireEtPasseCompletSiSeul() {
        ConsultationAchat entity = consultationPrep();
        ConsultationAchatDestinataire dest = destRow(DEST_A, FOURNISSEUR, CONTACT_A);
        stubImportGraph(entity, List.of(dest));
        when(devisRepository.save(any(ConsultationAchatDevis.class))).thenAnswer(inv -> {
            ConsultationAchatDevis saved = inv.getArgument(0);
            saved.setId(UUID.fromString("44444444-4444-4444-4444-444444444444"));
            return saved;
        });
        when(devisRepository.findByConsultationIdOrderByCreatedAtAsc(CONSULTATION)).thenAnswer(inv -> {
            ConsultationAchatDevis devis = ConsultationAchatDevis.builder()
                    .id(UUID.fromString("44444444-4444-4444-4444-444444444444"))
                    .consultationId(CONSULTATION)
                    .destinataireId(DEST_A)
                    .fichierNom("devis-lafarge.pdf")
                    .lignes(List.of())
                    .build();
            return List.of(devis);
        });

        ConsultationDevisImportDto request = importRequest(DEST_A, "devis-lafarge.pdf");
        ConsultationAchatDto result = service.importDevis(CONSULTATION, request);

        assertThat(result.getStatut()).isEqualTo(ConsultationAchat.STATUT_COMPLETE);
        assertThat(result.getDevisRecus()).isEqualTo(1);
        assertThat(entity.getStatut()).isEqualTo(ConsultationAchat.STATUT_COMPLETE);
        assertThat(dest.getStatut()).isEqualTo(ConsultationAchatDestinataire.STATUT_DEVIS_RECU);
        ArgumentCaptor<ConsultationAchatDevis> captor = ArgumentCaptor.forClass(ConsultationAchatDevis.class);
        org.mockito.Mockito.verify(devisRepository).save(captor.capture());
        assertThat(captor.getValue().getDestinataireId()).isEqualTo(DEST_A);
        assertThat(captor.getValue().getLignes()).hasSize(1);
        assertThat(captor.getValue().getLignes().get(0).getIdentite()).isEqualTo("ciment-cpj-45");
        assertThat(captor.getValue().getLignes().get(0).getPrixUnitaire()).isEqualByComparingTo("1083.75");
    }

    @Test
    void importDevisPartiellePuisComplete() {
        ConsultationAchat entity = consultationPrep();
        entity.setStatut(ConsultationAchat.STATUT_OUVERTE);
        ConsultationAchatDestinataire destA = destRow(DEST_A, FOURNISSEUR, CONTACT_A);
        ConsultationAchatDestinataire destB = destRow(DEST_B, FOURNISSEUR_B, CONTACT_B);
        stubImportGraph(entity, List.of(destA, destB));
        when(devisRepository.save(any(ConsultationAchatDevis.class))).thenAnswer(inv -> inv.getArgument(0));
        when(devisRepository.findByConsultationIdOrderByCreatedAtAsc(CONSULTATION)).thenReturn(List.of());
        when(envoiRepository.findByConsultationIdOrderBySentAtAsc(CONSULTATION))
                .thenReturn(List.of(envoiRow(DEST_A, "achat@lafarge.example")));

        ConsultationAchatDto partielle = service.importDevis(CONSULTATION, importRequest(DEST_A, "lafarge.pdf"));
        assertThat(partielle.getStatut()).isEqualTo(ConsultationAchat.STATUT_PARTIELLE);
        assertThat(partielle.getDevisRecus()).isEqualTo(1);
        assertThat(destA.getStatut()).isEqualTo(ConsultationAchatDestinataire.STATUT_DEVIS_RECU);
        assertThat(destB.getStatut()).isEqualTo(ConsultationAchatDestinataire.STATUT_EN_ATTENTE);

        ConsultationAchatDto complete = service.importDevis(CONSULTATION, importRequest(DEST_B, "sika.pdf"));
        assertThat(complete.getStatut()).isEqualTo(ConsultationAchat.STATUT_COMPLETE);
        assertThat(complete.getDevisRecus()).isEqualTo(2);
        assertThat(destB.getStatut()).isEqualTo(ConsultationAchatDestinataire.STATUT_DEVIS_RECU);
        assertThat(entity.getStatut()).isEqualTo(ConsultationAchat.STATUT_COMPLETE);
    }

    @Test
    void addToPanier_mergeDedupEtLieDossier() {
        UUID dossier = UUID.fromString("55555555-5555-5555-5555-555555555555");
        ConsultationAchat entity = ConsultationAchat.builder()
                .id(CONSULTATION)
                .tenantId(TENANT)
                .numero("CS-2026-0001")
                .statut(ConsultationAchat.STATUT_PREPARATION)
                .clesStables(new java.util.LinkedHashSet<>(List.of("peinture")))
                .build();
        when(repository.findByIdAndTenantId(CONSULTATION, TENANT)).thenReturn(Optional.of(entity));
        when(destinataireRepository.findByConsultationIdOrderByCreatedAtAsc(CONSULTATION)).thenReturn(List.of());
        when(repository.save(any(ConsultationAchat.class))).thenAnswer(inv -> inv.getArgument(0));

        ConsultationAchatPanierDto dto = new ConsultationAchatPanierDto();
        dto.setClesStables(List.of("ciment-cpj-45", "ciment-cpj-45", "peinture"));
        dto.setDossierEtudeId(dossier);

        ConsultationAchatDto result = service.addToPanier(CONSULTATION, dto);

        assertThat(result.getClesStables()).containsExactlyInAnyOrder("ciment-cpj-45", "peinture");
        assertThat(result.getDossierEtudeId()).isEqualTo(dossier);
        assertThat(entity.getClesStables()).containsExactlyInAnyOrder("ciment-cpj-45", "peinture");
        assertThat(entity.getDossierEtudeId()).isEqualTo(dossier);
    }

    @Test
    void replacePanier_remplaceLeSet() {
        ConsultationAchat entity = ConsultationAchat.builder()
                .id(CONSULTATION)
                .tenantId(TENANT)
                .numero("CS-2026-0001")
                .statut(ConsultationAchat.STATUT_PREPARATION)
                .clesStables(new java.util.LinkedHashSet<>(List.of("peinture", "ciment-cpj-45")))
                .build();
        when(repository.findByIdAndTenantId(CONSULTATION, TENANT)).thenReturn(Optional.of(entity));
        when(destinataireRepository.findByConsultationIdOrderByCreatedAtAsc(CONSULTATION)).thenReturn(List.of());
        when(repository.save(any(ConsultationAchat.class))).thenAnswer(inv -> inv.getArgument(0));

        ConsultationAchatPanierDto dto = new ConsultationAchatPanierDto();
        dto.setClesStables(List.of("sable-de-dune"));

        ConsultationAchatDto result = service.replacePanier(CONSULTATION, dto);

        assertThat(result.getClesStables()).containsExactly("sable-de-dune");
        assertThat(entity.getClesStables()).containsExactly("sable-de-dune");
    }

    @Test
    void replacePanier_vide_refuse() {
        ConsultationAchat entity = consultationPrep();
        when(repository.findByIdAndTenantId(CONSULTATION, TENANT)).thenReturn(Optional.of(entity));

        ConsultationAchatPanierDto dto = new ConsultationAchatPanierDto();
        dto.setClesStables(List.of());

        assertThatThrownBy(() -> service.replacePanier(CONSULTATION, dto))
                .isInstanceOf(IllegalArgumentException.class)
                .hasMessage("consultation.panier.vide");
        org.mockito.Mockito.verify(repository, never()).save(any());
    }

    @Test
    void importDevisHorsEtude_neNotifiePasLeFlag() {
        ConsultationAchat entity = consultationPrep();
        ConsultationAchatDestinataire dest = destRow(DEST_A, FOURNISSEUR, CONTACT_A);
        stubImportGraph(entity, List.of(dest));
        when(devisRepository.save(any(ConsultationAchatDevis.class))).thenAnswer(inv -> inv.getArgument(0));
        when(devisRepository.findByConsultationIdOrderByCreatedAtAsc(CONSULTATION)).thenReturn(List.of());

        service.importDevis(CONSULTATION, importRequest(DEST_A, null));

        org.mockito.Mockito.verify(lienEtudePort, never()).getIfAvailable();
        org.mockito.Mockito.verify(flagPort, never()).appliquerFlagsApresDevis(any());
    }

    @Test
    void importDevisLiee_notifieLeFlag() {
        UUID dossier = UUID.fromString("55555555-5555-5555-5555-555555555555");
        ConsultationAchat entity = ConsultationAchat.builder()
                .id(CONSULTATION)
                .tenantId(TENANT)
                .numero("CS-2026-0001")
                .dossierEtudeId(dossier)
                .statut(ConsultationAchat.STATUT_PREPARATION)
                .build();
        ConsultationAchatDestinataire dest = destRow(DEST_A, FOURNISSEUR, CONTACT_A);
        stubImportGraph(entity, List.of(dest));
        when(devisRepository.save(any(ConsultationAchatDevis.class))).thenAnswer(inv -> inv.getArgument(0));
        when(devisRepository.findByConsultationIdOrderByCreatedAtAsc(CONSULTATION)).thenReturn(List.of());
        when(lienEtudePort.getIfAvailable()).thenReturn(flagPort);

        service.importDevis(CONSULTATION, importRequest(DEST_A, null));

        org.mockito.Mockito.verify(flagPort).appliquerFlagsApresDevis(dossier);
    }

    @Test
    void countDevisExtraitsLies_horsEtudeZero() {
        assertThat(service.countDevisExtraitsLies(null)).isZero();
    }

    @Test
    void countDevisExtraitsLies_sommeLesImportsLies() {
        UUID dossier = UUID.fromString("55555555-5555-5555-5555-555555555555");
        ConsultationAchat liee = ConsultationAchat.builder().id(CONSULTATION).dossierEtudeId(dossier).build();
        when(repository.findByTenantIdAndDossierEtudeId(TENANT, dossier)).thenReturn(List.of(liee));
        when(devisRepository.countByConsultationIdIn(List.of(CONSULTATION))).thenReturn(2L);

        assertThat(service.countDevisExtraitsLies(dossier)).isEqualTo(2L);
    }

    @Test
    void envoyerSansDestinataire_refuse() {
        ConsultationAchat entity = consultationPrep();
        when(repository.findByIdAndTenantId(CONSULTATION, TENANT)).thenReturn(Optional.of(entity));
        when(destinataireRepository.findByConsultationIdOrderByCreatedAtAsc(CONSULTATION)).thenReturn(List.of());

        assertThatThrownBy(() -> service.envoyer(CONSULTATION))
                .isInstanceOf(IllegalArgumentException.class)
                .hasMessage("consultation.envoyer.sans_destinataire");
        org.mockito.Mockito.verify(envoiRepository, never()).save(any());
        org.mockito.Mockito.verify(emailService, never()).sendWithAttachments(any(), any(), any(), any(), any(), any());
    }

    @Test
    void envoyer_journaliseEtPasseOuverte() {
        ConsultationAchat entity = consultationPrep();
        UUID destId = UUID.fromString("eeeeeeee-eeee-eeee-eeee-eeeeeeeeeeee");
        ConsultationAchatDestinataire dest = destRow(destId, FOURNISSEUR, CONTACT_A);
        PartnerContact contactA = contact(CONTACT_A, FOURNISSEUR, "A. Benali", "achat@lafarge.example");
        when(repository.findByIdAndTenantId(CONSULTATION, TENANT)).thenReturn(Optional.of(entity));
        when(destinataireRepository.findByConsultationIdOrderByCreatedAtAsc(CONSULTATION))
                .thenReturn(List.of(dest));
        when(envoiRepository.findByConsultationIdOrderBySentAtAsc(CONSULTATION))
                .thenReturn(List.of())
                .thenReturn(List.of(envoiRow(destId, "achat@lafarge.example")));
        when(contactRepository.findByIdAndTenantId(CONTACT_A, TENANT)).thenReturn(Optional.of(contactA));
        when(partnerRepository.findByIdAndTenantId(FOURNISSEUR, TENANT))
                .thenReturn(Optional.of(Partner.builder().id(FOURNISSEUR).raisonSociale("Lafarge").build()));
        when(emailServiceProvider.getIfAvailable()).thenReturn(emailService);
        when(envoiRepository.save(any(ConsultationAchatEnvoi.class))).thenAnswer(inv -> {
            ConsultationAchatEnvoi row = inv.getArgument(0);
            if (row.getId() == null) {
                row.setId(UUID.randomUUID());
            }
            return row;
        });
        when(repository.save(any(ConsultationAchat.class))).thenAnswer(inv -> inv.getArgument(0));
        when(devisRepository.findByConsultationIdOrderByCreatedAtAsc(CONSULTATION)).thenReturn(List.of());

        ConsultationAchatDto result = service.envoyer(CONSULTATION);

        ArgumentCaptor<ConsultationAchatEnvoi> captor = ArgumentCaptor.forClass(ConsultationAchatEnvoi.class);
        org.mockito.Mockito.verify(envoiRepository).save(captor.capture());
        assertThat(captor.getValue().getDestinataireId()).isEqualTo(destId);
        assertThat(captor.getValue().getEmail()).isEqualTo("achat@lafarge.example");
        org.mockito.Mockito.verify(emailService)
                .sendWithAttachments(
                        org.mockito.ArgumentMatchers.eq(List.of("achat@lafarge.example")),
                        org.mockito.ArgumentMatchers.eq(List.of()),
                        org.mockito.ArgumentMatchers.contains("CS-2026-0001"),
                        org.mockito.ArgumentMatchers.anyString(),
                        org.mockito.ArgumentMatchers.contains("ciment-cpj-45"),
                        org.mockito.ArgumentMatchers.eq(List.of()));
        assertThat(result.getStatut()).isEqualTo(ConsultationAchat.STATUT_OUVERTE);
        assertThat(entity.getStatut()).isEqualTo(ConsultationAchat.STATUT_OUVERTE);
        assertThat(result.getEnvois()).hasSize(1);
    }

    @Test
    void envoyerDeuxiemeFoisSansNouveauDest_nAjoutePas() {
        ConsultationAchat entity = consultationPrep();
        entity.setStatut(ConsultationAchat.STATUT_OUVERTE);
        UUID destId = UUID.fromString("eeeeeeee-eeee-eeee-eeee-eeeeeeeeeeee");
        ConsultationAchatDestinataire dest = destRow(destId, FOURNISSEUR, CONTACT_A);
        ConsultationAchatEnvoi existing = envoiRow(destId, "achat@lafarge.example");
        when(repository.findByIdAndTenantId(CONSULTATION, TENANT)).thenReturn(Optional.of(entity));
        when(destinataireRepository.findByConsultationIdOrderByCreatedAtAsc(CONSULTATION))
                .thenReturn(List.of(dest));
        when(envoiRepository.findByConsultationIdOrderBySentAtAsc(CONSULTATION)).thenReturn(List.of(existing));
        when(contactRepository.findByIdAndTenantId(CONTACT_A, TENANT))
                .thenReturn(Optional.of(contact(CONTACT_A, FOURNISSEUR, "A. Benali", "achat@lafarge.example")));
        when(partnerRepository.findByIdAndTenantId(FOURNISSEUR, TENANT))
                .thenReturn(Optional.of(Partner.builder().id(FOURNISSEUR).raisonSociale("Lafarge").build()));
        when(devisRepository.findByConsultationIdOrderByCreatedAtAsc(CONSULTATION)).thenReturn(List.of());

        ConsultationAchatDto result = service.envoyer(CONSULTATION);

        org.mockito.Mockito.verify(envoiRepository, never()).save(any());
        org.mockito.Mockito.verify(emailService, never()).sendWithAttachments(any(), any(), any(), any(), any(), any());
        assertThat(result.getEnvois()).hasSize(1);
        assertThat(result.getStatut()).isEqualTo(ConsultationAchat.STATUT_OUVERTE);
    }

    @Test
    void addToPanier_apresEnvoi_refuse() {
        ConsultationAchat entity = consultationPrep();
        entity.setStatut(ConsultationAchat.STATUT_OUVERTE);
        when(repository.findByIdAndTenantId(CONSULTATION, TENANT)).thenReturn(Optional.of(entity));
        when(envoiRepository.existsByConsultationId(CONSULTATION)).thenReturn(true);

        ConsultationAchatPanierDto dto = new ConsultationAchatPanierDto();
        dto.setClesStables(List.of("sable-de-dune"));

        assertThatThrownBy(() -> service.addToPanier(CONSULTATION, dto))
                .isInstanceOf(IllegalArgumentException.class)
                .hasMessage("consultation.panier.fige");
        org.mockito.Mockito.verify(repository, never()).save(any());
    }

    @Test
    void envoyerApresNouveauDest_uneNouvelleLigneJournal() {
        ConsultationAchat entity = consultationPrep();
        entity.setStatut(ConsultationAchat.STATUT_OUVERTE);
        UUID destA = UUID.fromString("eeeeeeee-eeee-eeee-eeee-eeeeeeeeeeee");
        UUID destB = UUID.fromString("ffffffff-ffff-ffff-ffff-ffffffffffff");
        ConsultationAchatDestinataire rowA = destRow(destA, FOURNISSEUR, CONTACT_A);
        ConsultationAchatDestinataire rowB = destRow(destB, FOURNISSEUR_B, CONTACT_B);
        ConsultationAchatEnvoi existing = envoiRow(destA, "achat@lafarge.example");
        PartnerContact contactB = contact(CONTACT_B, FOURNISSEUR_B, "M. Kadiri", "devis@sika.example");
        when(repository.findByIdAndTenantId(CONSULTATION, TENANT)).thenReturn(Optional.of(entity));
        when(destinataireRepository.findByConsultationIdOrderByCreatedAtAsc(CONSULTATION))
                .thenReturn(List.of(rowA, rowB));
        when(envoiRepository.findByConsultationIdOrderBySentAtAsc(CONSULTATION))
                .thenReturn(List.of(existing))
                .thenReturn(List.of(existing, envoiRow(destB, "devis@sika.example")));
        when(contactRepository.findByIdAndTenantId(CONTACT_B, TENANT)).thenReturn(Optional.of(contactB));
        when(contactRepository.findByIdAndTenantId(CONTACT_A, TENANT))
                .thenReturn(Optional.of(contact(CONTACT_A, FOURNISSEUR, "A. Benali", "achat@lafarge.example")));
        when(partnerRepository.findByIdAndTenantId(FOURNISSEUR, TENANT))
                .thenReturn(Optional.of(Partner.builder().id(FOURNISSEUR).raisonSociale("Lafarge").build()));
        when(partnerRepository.findByIdAndTenantId(FOURNISSEUR_B, TENANT))
                .thenReturn(Optional.of(Partner.builder().id(FOURNISSEUR_B).raisonSociale("Sika").build()));
        when(emailServiceProvider.getIfAvailable()).thenReturn(emailService);
        when(envoiRepository.save(any(ConsultationAchatEnvoi.class))).thenAnswer(inv -> {
            ConsultationAchatEnvoi row = inv.getArgument(0);
            if (row.getId() == null) {
                row.setId(UUID.randomUUID());
            }
            return row;
        });
        when(devisRepository.findByConsultationIdOrderByCreatedAtAsc(CONSULTATION)).thenReturn(List.of());

        ConsultationAchatDto result = service.envoyer(CONSULTATION);

        ArgumentCaptor<ConsultationAchatEnvoi> captor = ArgumentCaptor.forClass(ConsultationAchatEnvoi.class);
        org.mockito.Mockito.verify(envoiRepository).save(captor.capture());
        assertThat(captor.getValue().getDestinataireId()).isEqualTo(destB);
        assertThat(captor.getValue().getEmail()).isEqualTo("devis@sika.example");
        org.mockito.Mockito.verify(emailService)
                .sendWithAttachments(
                        org.mockito.ArgumentMatchers.eq(List.of("devis@sika.example")),
                        org.mockito.ArgumentMatchers.eq(List.of()),
                        org.mockito.ArgumentMatchers.anyString(),
                        org.mockito.ArgumentMatchers.anyString(),
                        org.mockito.ArgumentMatchers.anyString(),
                        org.mockito.ArgumentMatchers.eq(List.of()));
        assertThat(result.getEnvois()).hasSize(2);
    }

    private void stubImportGraph(ConsultationAchat entity, List<ConsultationAchatDestinataire> dests) {
        when(repository.findByIdAndTenantId(CONSULTATION, TENANT)).thenReturn(Optional.of(entity));
        when(repository.save(any(ConsultationAchat.class))).thenAnswer(inv -> inv.getArgument(0));
        when(destinataireRepository.findByConsultationIdOrderByCreatedAtAsc(CONSULTATION))
                .thenAnswer(inv -> List.copyOf(dests));
        when(destinataireRepository.save(any(ConsultationAchatDestinataire.class)))
                .thenAnswer(inv -> inv.getArgument(0));
        for (ConsultationAchatDestinataire dest : dests) {
            when(destinataireRepository.findByIdAndTenantId(dest.getId(), TENANT)).thenReturn(Optional.of(dest));
            when(partnerRepository.findByIdAndTenantId(dest.getFournisseurId(), TENANT))
                    .thenReturn(Optional.of(Partner.builder()
                            .id(dest.getFournisseurId())
                            .raisonSociale(FOURNISSEUR.equals(dest.getFournisseurId()) ? "Lafarge" : "Sika")
                            .build()));
            when(contactRepository.findByIdAndTenantId(dest.getContactId(), TENANT))
                    .thenReturn(Optional.of(contact(
                            dest.getContactId(),
                            dest.getFournisseurId(),
                            "Contact",
                            FOURNISSEUR.equals(dest.getFournisseurId())
                                    ? "achat@lafarge.example"
                                    : "devis@sika.example")));
        }
    }

    private static ConsultationDevisImportDto.Ligne ligneCiment() {
        ConsultationDevisImportDto.Ligne ligne = new ConsultationDevisImportDto.Ligne();
        ligne.setIdentite("ciment-cpj-45");
        ligne.setLibelle("Ciment CPJ 45");
        ligne.setQuantite(new java.math.BigDecimal("12"));
        ligne.setUnite("t");
        ligne.setPrixUnitaire(new java.math.BigDecimal("1083.75"));
        return ligne;
    }

    private static ConsultationDevisImportDto importRequest(UUID destinataireId, String fichierNom) {
        ConsultationDevisImportDto request = new ConsultationDevisImportDto();
        request.setDestinataireId(destinataireId);
        request.setFichierNom(fichierNom);
        request.setLignes(List.of(ligneCiment()));
        return request;
    }

    private void stubDestinataireSaveAndReload(UUID contactId) {
        when(destinataireRepository.save(any(ConsultationAchatDestinataire.class))).thenAnswer(inv -> {
            ConsultationAchatDestinataire row = inv.getArgument(0);
            if (row.getId() == null) {
                row.setId(UUID.randomUUID());
            }
            return row;
        });
        when(destinataireRepository.findByConsultationIdOrderByCreatedAtAsc(CONSULTATION))
                .thenAnswer(inv -> List.of(ConsultationAchatDestinataire.builder()
                        .id(UUID.randomUUID())
                        .consultationId(CONSULTATION)
                        .fournisseurId(FOURNISSEUR)
                        .contactId(contactId)
                        .statut(ConsultationAchatDestinataire.STATUT_EN_ATTENTE)
                        .build()));
        when(devisRepository.findByConsultationIdOrderByCreatedAtAsc(CONSULTATION)).thenReturn(List.of());
    }

    private void stubCreateSave() {
        when(repository.countByTenantId(TENANT)).thenReturn(3L);
        when(repository.save(any(ConsultationAchat.class))).thenAnswer(inv -> {
            ConsultationAchat saved = inv.getArgument(0);
            saved.setId(CONSULTATION);
            return saved;
        });
    }

    private static ConsultationAchat consultationPrep() {
        return ConsultationAchat.builder()
                .id(CONSULTATION)
                .tenantId(TENANT)
                .numero("CS-2026-0001")
                .statut(ConsultationAchat.STATUT_PREPARATION)
                .clesStables(new java.util.LinkedHashSet<>(List.of("ciment-cpj-45")))
                .build();
    }

    private static ConsultationAchatDestinataire destRow(UUID id, UUID fournisseurId, UUID contactId) {
        return ConsultationAchatDestinataire.builder()
                .id(id)
                .tenantId(TENANT)
                .consultationId(CONSULTATION)
                .fournisseurId(fournisseurId)
                .contactId(contactId)
                .statut(ConsultationAchatDestinataire.STATUT_EN_ATTENTE)
                .build();
    }

    private static ConsultationAchatEnvoi envoiRow(UUID destinataireId, String email) {
        return ConsultationAchatEnvoi.builder()
                .id(UUID.randomUUID())
                .tenantId(TENANT)
                .consultationId(CONSULTATION)
                .destinataireId(destinataireId)
                .email(email)
                .sentAt(java.time.OffsetDateTime.parse("2026-08-28T18:02:00Z"))
                .build();
    }

    private static PartnerContact contact(UUID id, UUID partenaireId, String nom, String email) {
        return PartnerContact.builder()
                .id(id)
                .partnerId(partenaireId)
                .nom(nom)
                .email(email)
                .build();
    }
}
