package ma.nafura.rh.service;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.Mockito.when;

import ma.nafura.rh.domain.referentiel.RhDepartement;
import ma.nafura.rh.domain.referentiel.RhPoste;
import ma.nafura.rh.repository.RhDepartementRepository;
import ma.nafura.rh.repository.RhPosteRepository;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

@ExtendWith(MockitoExtension.class)
class RhReferentielBinderTest {

    @Mock
    private RhPosteRepository posteRepository;

    @Mock
    private RhDepartementRepository departementRepository;

    @Mock
    private RhPosteService posteService;

    @Mock
    private RhDepartementService departementService;

    @InjectMocks
    private RhReferentielBinder binder;

    @Test
    void bind_usesPosteIdAndAllowsMissingDepartement() {
        RhPoste poste = RhPoste.builder()
                .id("rh-pst-001")
                .code("CONDUCTEUR")
                .libelle("Conducteur de travaux")
                .actif(true)
                .build();
        when(posteService.getById("rh-pst-001")).thenReturn(poste);

        RhReferentielBinder.Bound bound = binder.bind("rh-pst-001", "ignored", null, null);

        assertThat(bound.posteId()).isEqualTo("rh-pst-001");
        assertThat(bound.poste()).isEqualTo("Conducteur de travaux");
        assertThat(bound.departementId()).isNull();
    }

    @Test
    void bind_ensuresPosteFromLibelle() {
        RhPoste poste = RhPoste.builder()
                .id("rh-pst-002")
                .code("MACON")
                .libelle("Maçon")
                .actif(true)
                .build();
        when(posteService.ensure("MACON", "Maçon")).thenReturn(poste);

        RhReferentielBinder.Bound bound = binder.bind(null, "Maçon", null, null);

        assertThat(bound.posteId()).isEqualTo("rh-pst-002");
        assertThat(bound.poste()).isEqualTo("Maçon");
    }
}
