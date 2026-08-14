package ma.nafura.etudes.service;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.when;

import java.util.List;
import java.util.Optional;
import java.util.UUID;
import ma.nafura.etudes.domain.dossier.RoleIntervenant;
import ma.nafura.etudes.domain.dossier.DossierIntervenant;
import ma.nafura.etudes.repository.DossierIntervenantRepository;
import ma.nafura.platform.framework.context.TenantContext;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;

class DossierIntervenantServiceTest {

    private static final UUID TENANT = UUID.fromString("aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa");
    private static final UUID DOSSIER = UUID.fromString("bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb");

    private DossierIntervenantRepository repository;
    private DossierIntervenantService service;

    @BeforeEach
    void setUp() {
        TenantContext.setTenantId(TENANT);
        repository = mock(DossierIntervenantRepository.class);
        service = new DossierIntervenantService(repository);
    }

    @AfterEach
    void tearDown() {
        TenantContext.clear();
    }

    @Test
    void bloqueApprobation_charge_ou_reviseur() {
        when(repository.existsByTenantIdAndDossierEtudeIdAndUserIdAndRoleIn(
                        TENANT,
                        DOSSIER,
                        "u1",
                        List.of(RoleIntervenant.CHARGE_ETUDE.name(), RoleIntervenant.REVISEUR.name())))
                .thenReturn(true);

        assertThat(service.bloqueApprobation(DOSSIER, "u1")).isTrue();
    }

    @Test
    void upsert_cree_charge_etude() {
        when(repository.findByTenantIdAndDossierEtudeIdAndUserIdAndRole(
                        TENANT, DOSSIER, "u1", RoleIntervenant.CHARGE_ETUDE.name()))
                .thenReturn(Optional.empty());
        when(repository.save(org.mockito.ArgumentMatchers.any(DossierIntervenant.class)))
                .thenAnswer(inv -> inv.getArgument(0));

        service.upsertChargeEtude(DOSSIER, "u1", "Ingénieur");

        org.mockito.Mockito.verify(repository).save(org.mockito.ArgumentMatchers.argThat(row ->
                RoleIntervenant.CHARGE_ETUDE.name().equals(row.getRole())
                        && "u1".equals(row.getUserId())
                        && Boolean.TRUE.equals(row.getInvite())));
    }
}
