package ma.nafura.chantiers.service;

import static org.mockito.Mockito.verify;

import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

@ExtendWith(MockitoExtension.class)
class ChantierVenteAdapterTest {

    @Mock private ChantierService chantierService;

    @Test
    void delegueLaBasculeAuChantier() {
        new ChantierVenteAdapter(chantierService).basculerVersMarche("ch-1");
        verify(chantierService).basculerVenteVersMarche("ch-1");
    }
}
