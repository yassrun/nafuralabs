package ma.nafura.etudes.service.guest;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import java.math.BigDecimal;
import java.time.OffsetDateTime;
import java.util.List;
import java.util.Optional;
import java.util.UUID;
import ma.nafura.etudes.api.dto.GuestLinkCreatedDto;
import ma.nafura.etudes.api.dto.GuestSnapshotDto;
import ma.nafura.etudes.api.request.GuestLinkCreateDto;
import ma.nafura.etudes.domain.dossier.DossierEtude;
import ma.nafura.etudes.domain.dossier.GuestAccessLink;
import ma.nafura.etudes.domain.dpgf.Dpgf;
import ma.nafura.etudes.domain.dpgf.DpgfNoeud;
import ma.nafura.etudes.domain.dpu.ComposantDpu;
import ma.nafura.etudes.domain.dpu.PrixDpu;
import ma.nafura.etudes.repository.DossierEtudeRepository;
import ma.nafura.etudes.repository.GuestAccessLinkRepository;
import ma.nafura.etudes.repository.PrixDpuRepository;
import ma.nafura.etudes.service.DossierDocumentService;
import ma.nafura.etudes.service.DpgfService;
import ma.nafura.platform.framework.context.TenantContext;
import ma.nafura.platform.framework.context.UserContext;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

@ExtendWith(MockitoExtension.class)
class GuestAccessServiceTest {

    private static final UUID TENANT = UUID.fromString("b4b37f63-f36e-4f43-93ee-cdbf9a2ac5c5");
    private static final UUID DOSSIER = UUID.fromString("27b2ef8d-fa57-4275-b709-5a3e68ed2779");
    private static final UUID DPGF = UUID.fromString("11111111-1111-1111-1111-111111111111");
    private static final UUID ARTICLE = UUID.fromString("22222222-2222-2222-2222-222222222222");

    @Mock private GuestAccessLinkRepository linkRepository;
    @Mock private DossierEtudeRepository dossierRepository;
    @Mock private DpgfService dpgfService;
    @Mock private PrixDpuRepository prixDpuRepository;
    @Mock private DossierDocumentService documentService;
    @Mock private ma.nafura.platform.collaboration.comment.CommentService commentService;
    @Mock private ma.nafura.platform.tenancy.repository.TenantRepository tenantRepository;
    @Mock private ma.nafura.etudes.service.cps.CpsService cpsService;

    private GuestAccessService service;

    @BeforeEach
    void setUp() {
        TenantContext.setTenantId(TENANT);
        UserContext.setUserEmail("ahmed.elkortobi@gmail.com");
        service = new GuestAccessService(
                linkRepository,
                dossierRepository,
                dpgfService,
                prixDpuRepository,
                documentService,
                commentService,
                tenantRepository,
                cpsService);
    }

    @AfterEach
    void tearDown() {
        TenantContext.clear();
        UserContext.clear();
    }

    @Test
    void createStockeLeHashPasLeJeton() {
        when(dossierRepository.findByIdAndTenantId(DOSSIER, TENANT))
                .thenReturn(Optional.of(DossierEtude.builder().id(DOSSIER).tenantId(TENANT).build()));
        when(linkRepository.save(any(GuestAccessLink.class))).thenAnswer(inv -> inv.getArgument(0));

        GuestLinkCreateDto req = new GuestLinkCreateDto();
        req.setEmail("  Client@Cegelec.com ");
        req.setPurpose("client_view");
        GuestLinkCreatedDto created = service.create(DOSSIER, req);

        assertThat(created.getToken()).isNotBlank();
        assertThat(created.getEmail()).isEqualTo("client@cegelec.com");
        assertThat(created.getPurpose()).isEqualTo(GuestAccessLink.PURPOSE_CLIENT_VIEW);

        ArgumentCaptor<GuestAccessLink> captor = ArgumentCaptor.forClass(GuestAccessLink.class);
        verify(linkRepository).save(captor.capture());
        GuestAccessLink stored = captor.getValue();
        assertThat(stored.getTokenHash()).isEqualTo(GuestAccessService.hashToken(created.getToken()));
        assertThat(stored.getTokenHash()).doesNotContain(created.getToken());
        assertThat(stored.getEmail()).isEqualTo("client@cegelec.com");
        assertThat(stored.getExpiresAt()).isBefore(OffsetDateTime.now().plusHours(25));
        assertThat(stored.getExpiresAt()).isAfter(OffsetDateTime.now().plusHours(23));
    }

    @Test
    void resolveInconnuOuExpireOuRevoqueDonneLaMemeErreur() {
        when(linkRepository.findByTokenHash(any())).thenReturn(Optional.empty());
        assertThatThrownBy(() -> service.resolve("inconnu")).isInstanceOf(GuestLinkInactiveException.class);

        GuestAccessLink expired = activeLink(GuestAccessLink.PURPOSE_CLIENT_VIEW);
        expired.setExpiresAt(OffsetDateTime.now().minusHours(1));
        when(linkRepository.findByTokenHash(any())).thenReturn(Optional.of(expired));
        assertThatThrownBy(() -> service.resolve("token")).isInstanceOf(GuestLinkInactiveException.class);

        GuestAccessLink revoked = activeLink(GuestAccessLink.PURPOSE_CLIENT_VIEW);
        revoked.setRevokedAt(OffsetDateTime.now().minusMinutes(1));
        when(linkRepository.findByTokenHash(any())).thenReturn(Optional.of(revoked));
        assertThatThrownBy(() -> service.resolve("token")).isInstanceOf(GuestLinkInactiveException.class);
    }

    @Test
    void resolveClientRenvoieArbreEtComposantsSansCoutInterne() {
        GuestAccessLink link = activeLink(GuestAccessLink.PURPOSE_CLIENT_VIEW);
        when(linkRepository.findByTokenHash(any())).thenReturn(Optional.of(link));
        when(linkRepository.save(any(GuestAccessLink.class))).thenAnswer(inv -> inv.getArgument(0));
        when(dossierRepository.findByIdAndTenantId(DOSSIER, TENANT))
                .thenReturn(Optional.of(DossierEtude.builder()
                        .id(DOSSIER)
                        .tenantId(TENANT)
                        .numero("DE-0001")
                        .objet("LOT 6 REVETEMENTS")
                        .clientNom("Cegelec")
                        .dpgfId(DPGF)
                        .build()));

        DpgfNoeud article = DpgfNoeud.builder()
                .id(ARTICLE)
                .type(DpgfNoeud.TYPE_ARTICLE)
                .code("6.1.1")
                .libelle("Carrelage")
                .unite("m2")
                .quantite(new BigDecimal("10"))
                .prixUnitaire(new BigDecimal("120"))
                .total(new BigDecimal("1200"))
                .coutUnitaire(new BigDecimal("80"))
                .enfants(List.of())
                .build();
        DpgfNoeud lot = DpgfNoeud.builder()
                .id(UUID.randomUUID())
                .type(DpgfNoeud.TYPE_LOT)
                .code("6")
                .libelle("LOT 6")
                .enfants(List.of(article))
                .build();
        when(dpgfService.getArbre(DPGF)).thenReturn(Dpgf.builder()
                .id(DPGF)
                .totalHt(new BigDecimal("1200"))
                .hierarchie(List.of(lot))
                .build());

        PrixDpu prix = PrixDpu.builder()
                .dpgfNoeudId(ARTICLE)
                .composants(List.of(ComposantDpu.builder()
                        .type(ComposantDpu.TYPE_MATIERE)
                        .libelle("Ciment colle")
                        .unite("kg")
                        .rendement(new BigDecimal("3"))
                        .prixUnitaire(new BigDecimal("3.90"))
                        .total(new BigDecimal("11.70"))
                        .build()))
                .build();
        when(prixDpuRepository.findByTenantIdAndDpgfNoeudIdIn(eq(TENANT), any()))
                .thenReturn(List.of(prix));

        GuestSnapshotDto snap = service.resolve("raw-token");

        assertThat(snap.getNumero()).isEqualTo("DE-0001");
        assertThat(snap.getObjet()).isEqualTo("LOT 6 REVETEMENTS");
        assertThat(snap.getClientNom()).isEqualTo("Cegelec");
        assertThat(snap.getTotalHt()).isEqualByComparingTo("1200");
        assertThat(snap.getArbre()).hasSize(1);
        GuestSnapshotDto.GuestNoeudDto lotDto = snap.getArbre().get(0);
        assertThat(lotDto.getLibelle()).isEqualTo("LOT 6");
        assertThat(lotDto.getEnfants()).hasSize(1);
        GuestSnapshotDto.GuestNoeudDto art = lotDto.getEnfants().get(0);
        assertThat(art.getId()).isEqualTo(ARTICLE.toString());
        assertThat(art.getCode()).isEqualTo("6.1.1");
        assertThat(art.getPrixUnitaire()).isEqualByComparingTo("120");
        assertThat(art.getCoutUnitaire()).isEqualByComparingTo("80");
        assertThat(art.getDpu()).isNotNull();
        assertThat(art.getDpu().getComposants()).hasSize(1);
        assertThat(art.getComposants()).hasSize(1);
        assertThat(art.getComposants().get(0).getDesignation()).isEqualTo("Ciment colle");
        assertThat(art.getComposants().get(0).getQuantite()).isEqualByComparingTo("3");
        verify(dpgfService).getArbre(DPGF);
    }

    @Test
    void resolveFournisseurNeChargePasLarbre() {
        GuestAccessLink link = activeLink(GuestAccessLink.PURPOSE_FOURNISSEUR_UPLOAD);
        when(linkRepository.findByTokenHash(any())).thenReturn(Optional.of(link));
        when(linkRepository.save(any(GuestAccessLink.class))).thenAnswer(inv -> inv.getArgument(0));
        when(dossierRepository.findByIdAndTenantId(DOSSIER, TENANT))
                .thenReturn(Optional.of(DossierEtude.builder()
                        .id(DOSSIER)
                        .tenantId(TENANT)
                        .numero("DE-0001")
                        .objet("LOT 6")
                        .dpgfId(DPGF)
                        .build()));

        GuestSnapshotDto snap = service.resolve("raw-token");

        assertThat(snap.getPurpose()).isEqualTo(GuestAccessLink.PURPOSE_FOURNISSEUR_UPLOAD);
        assertThat(snap.getArbre()).isEmpty();
        verify(dpgfService, never()).getArbre(any());
    }

    @Test
    void addCommentSigneAvecEmailDuLien() {
        GuestAccessLink link = activeLink(GuestAccessLink.PURPOSE_CLIENT_VIEW);
        when(linkRepository.findByTokenHash(any())).thenReturn(Optional.of(link));
        when(dossierRepository.findByIdAndTenantId(DOSSIER, TENANT))
                .thenReturn(Optional.of(DossierEtude.builder()
                        .id(DOSSIER)
                        .tenantId(TENANT)
                        .dpgfId(DPGF)
                        .build()));
        DpgfNoeud article = DpgfNoeud.builder()
                .id(ARTICLE)
                .type(DpgfNoeud.TYPE_ARTICLE)
                .enfants(List.of())
                .build();
        when(dpgfService.getArbre(DPGF)).thenReturn(Dpgf.builder()
                .id(DPGF)
                .hierarchie(List.of(article))
                .build());
        when(commentService.add(eq("dpgf_noeud"), eq(ARTICLE), eq("Prix trop élevé")))
                .thenReturn(ma.nafura.platform.collaboration.comment.domain.model.RecordComment.builder()
                        .id(UUID.randomUUID())
                        .author("client@cegelec.com")
                        .body("Prix trop élevé")
                        .build());

        GuestSnapshotDto.GuestCommentDto dto = service.addComment("raw-token", ARTICLE, "Prix trop élevé");

        assertThat(dto.getAuthor()).isEqualTo("client@cegelec.com");
        assertThat(dto.getBody()).isEqualTo("Prix trop élevé");
        verify(commentService).add(eq("dpgf_noeud"), eq(ARTICLE), eq("Prix trop élevé"));
    }

    private static GuestAccessLink activeLink(String purpose) {
        return GuestAccessLink.builder()
                .id(UUID.randomUUID())
                .tenantId(TENANT)
                .dossierEtudeId(DOSSIER)
                .email("client@cegelec.com")
                .purpose(purpose)
                .tokenHash("abc")
                .expiresAt(OffsetDateTime.now().plusDays(7))
                .build();
    }
}
