package ma.nafura.etudes.service;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.when;

import java.util.List;
import java.util.Optional;
import java.util.UUID;
import ma.nafura.etudes.api.request.DpgfLotAffectationRequest;
import ma.nafura.etudes.domain.dossier.DossierEtude;
import ma.nafura.etudes.domain.dossier.StatutDossierEtude;
import ma.nafura.etudes.domain.dpgf.Dpgf;
import ma.nafura.etudes.domain.dpgf.DpgfNoeud;
import ma.nafura.etudes.repository.DossierEtudeRepository;
import ma.nafura.etudes.repository.DpgfNoeudRepository;
import ma.nafura.platform.framework.context.TenantContext;
import ma.nafura.platform.framework.context.UserContext;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

@ExtendWith(MockitoExtension.class)
class DpgfLotAffectationServiceTest {

    private static final UUID TENANT = UUID.fromString("aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa");
    private static final UUID DPGF = UUID.fromString("bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb");
    private static final UUID CHARGE = UUID.fromString("cccccccc-cccc-cccc-cccc-cccccccccccc");
    private static final UUID HASSAN = UUID.fromString("dddddddd-dddd-dddd-dddd-dddddddddddd");

    @Mock
    private DpgfNoeudRepository noeudRepository;

    @Mock
    private DossierEtudeRepository dossierEtudeRepository;

    @Mock
    private ChargeEtudeService chargeEtudeService;

    private DpgfLotAffectationService service;

    @BeforeEach
    void setUp() {
        TenantContext.setTenantId(TENANT);
        service = new DpgfLotAffectationService(
                noeudRepository, dossierEtudeRepository, chargeEtudeService, new EtudeSaisiePolicy());
    }

    @AfterEach
    void tearDown() {
        TenantContext.clear();
        UserContext.clear();
    }

    @Test
    void filtre_ingenieur_ne_voit_que_ses_lots() {
        enTantQue(HASSAN, "BTP_INGENIEUR");
        DossierEtude dossier = dossierEnEtude();
        DpgfNoeud elec = lot("02", "Électricité", HASSAN.toString());
        DpgfNoeud go = lot("01", "Gros œuvre", null);

        List<DpgfNoeud> visibles = service.filtrerArbre(List.of(go, elec), dossier);

        assertThat(visibles).containsExactly(elec);
    }

    @Test
    void filtre_charge_voit_tous_les_lots() {
        enTantQue(CHARGE, "BTP_INGENIEUR");
        DossierEtude dossier = dossierEnEtude();
        DpgfNoeud elec = lot("02", "Électricité", HASSAN.toString());
        DpgfNoeud go = lot("01", "Gros œuvre", null);

        List<DpgfNoeud> visibles = service.filtrerArbre(List.of(go, elec), dossier);

        assertThat(visibles).containsExactly(go, elec);
    }

    @Test
    void filtre_sans_affectation_cache_tout_pour_l_ingenieur() {
        enTantQue(HASSAN, "BTP_INGENIEUR");
        DossierEtude dossier = dossierEnEtude();
        DpgfNoeud go = lot("01", "Gros œuvre", null);

        assertThat(service.filtrerArbre(List.of(go), dossier)).isEmpty();
    }

    @Test
    void affecter_lot_a_un_ingenieur() {
        enTantQue(CHARGE, "BTP_INGENIEUR");
        DpgfNoeud elec = lot("02", "Électricité", null);
        when(noeudRepository.findByIdAndTenantId(elec.getId(), TENANT)).thenReturn(Optional.of(elec));
        when(dossierEtudeRepository.findByTenantIdAndDpgfId(TENANT, DPGF))
                .thenReturn(Optional.of(dossierEnEtude()));
        when(chargeEtudeService.requireIngenieur(HASSAN.toString(), "Hassan")).thenReturn("Hassan");
        when(noeudRepository.save(any(DpgfNoeud.class))).thenAnswer(inv -> inv.getArgument(0));

        DpgfLotAffectationRequest req = new DpgfLotAffectationRequest();
        req.setUserId(HASSAN.toString());
        req.setNom("Hassan");
        DpgfNoeud out = service.affecter(elec.getId(), req);

        assertThat(out.getChargeLotUserId()).isEqualTo(HASSAN.toString());
        assertThat(out.getChargeLotNom()).isEqualTo("Hassan");
    }

    @Test
    void affecter_refuse_un_article() {
        enTantQue(CHARGE, "BTP_INGENIEUR");
        DpgfNoeud article = DpgfNoeud.builder()
                .id(UUID.randomUUID())
                .type(DpgfNoeud.TYPE_ARTICLE)
                .code("2.1")
                .libelle("Tableau")
                .dpgf(Dpgf.builder().id(DPGF).build())
                .build();
        when(noeudRepository.findByIdAndTenantId(article.getId(), TENANT)).thenReturn(Optional.of(article));

        DpgfLotAffectationRequest req = new DpgfLotAffectationRequest();
        req.setUserId(HASSAN.toString());
        assertThatThrownBy(() -> service.affecter(article.getId(), req))
                .isInstanceOf(IllegalArgumentException.class)
                .hasMessage("etudes.lot.affectation_lot_uniquement");
    }

    @Test
    void saisie_autorisee_pour_ingenieur_affecte() {
        enTantQue(HASSAN, "BTP_INGENIEUR");
        DpgfNoeud lot = lot("02", "Électricité", HASSAN.toString());
        DpgfNoeud article = DpgfNoeud.builder()
                .id(UUID.randomUUID())
                .parentId(lot.getId())
                .type(DpgfNoeud.TYPE_ARTICLE)
                .code("2.1")
                .libelle("Tableau")
                .dpgf(lot.getDpgf())
                .build();
        when(dossierEtudeRepository.findByTenantIdAndDpgfId(TENANT, DPGF))
                .thenReturn(Optional.of(dossierEnEtude()));
        when(noeudRepository.findByIdAndTenantId(lot.getId(), TENANT)).thenReturn(Optional.of(lot));

        service.assertPeutSaisirNoeud(article);
    }

    @Test
    void saisie_autorisee_pour_charge_lot_non_affecte() {
        enTantQue(CHARGE, "BTP_INGENIEUR");
        DpgfNoeud lot = lot("01", "Gros œuvre", null);
        when(dossierEtudeRepository.findByTenantIdAndDpgfId(TENANT, DPGF))
                .thenReturn(Optional.of(dossierEnEtude()));

        service.assertPeutSaisirNoeud(lot);
    }

    @Test
    void saisie_refusee_pour_charge_si_lot_delegue() {
        enTantQue(CHARGE, "BTP_INGENIEUR");
        DpgfNoeud lot = lot("02", "Électricité", HASSAN.toString());
        when(dossierEtudeRepository.findByTenantIdAndDpgfId(TENANT, DPGF))
                .thenReturn(Optional.of(dossierEnEtude()));

        assertThatThrownBy(() -> service.assertPeutSaisirNoeud(lot))
                .isInstanceOf(IllegalStateException.class)
                .hasMessage("etudes.lot.saisie_reservee_affecte");
    }

    @Test
    void saisie_refusee_pour_autre_ingenieur() {
        enTantQue(HASSAN, "BTP_INGENIEUR");
        DpgfNoeud lot = lot("01", "Gros œuvre", CHARGE.toString());
        when(dossierEtudeRepository.findByTenantIdAndDpgfId(TENANT, DPGF))
                .thenReturn(Optional.of(dossierEnEtude()));

        assertThatThrownBy(() -> service.assertPeutSaisirNoeud(lot))
                .isInstanceOf(IllegalStateException.class)
                .hasMessage("etudes.lot.saisie_reservee_affecte");
    }

    private static void enTantQue(UUID userId, String role) {
        UserContext.setUserId(userId);
        UserContext.setUserRole(role);
        UserContext.setSuperAdmin(false);
    }

    private static DossierEtude dossierEnEtude() {
        return DossierEtude.builder()
                .id(UUID.randomUUID())
                .dpgfId(DPGF)
                .status(StatutDossierEtude.EN_ETUDE)
                .chargeEtudeUserId(CHARGE.toString())
                .build();
    }

    private static DpgfNoeud lot(String code, String libelle, String chargeUserId) {
        return DpgfNoeud.builder()
                .id(UUID.randomUUID())
                .type(DpgfNoeud.TYPE_LOT)
                .code(code)
                .libelle(libelle)
                .chargeLotUserId(chargeUserId)
                .chargeLotNom(chargeUserId == null ? null : "Hassan")
                .dpgf(Dpgf.builder().id(DPGF).build())
                .ordre(0)
                .build();
    }
}
