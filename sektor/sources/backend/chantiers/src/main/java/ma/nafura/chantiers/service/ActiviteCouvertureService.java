package ma.nafura.chantiers.service;

import java.util.List;
import org.springframework.stereotype.Service;

/**
 * AC-9 du contrat {@code avancement-et-attachement} — « un nœud couvert par au moins une activité
 * ne se déclare plus en direct ». La règle est posée ici, dans le garde-fou de la déclaration
 * ({@link AvancementPhysiqueService}), avant même que l'activité existe.
 *
 * <p><b>Palier 1 : aucune activité n'existe.</b> Cette implémentation rend toujours une liste
 * vide — aucun nœud n'est jamais couvert, donc la déclaration directe reste ouverte partout,
 * exactement l'état d'aujourd'hui. Le palier 2 la remplacera par une vraie lecture du planning ;
 * la porte est déjà là, le mécanisme de remontée ne l'est pas (hors périmètre de ce contrat).
 */
@Service
public class ActiviteCouvertureService {

    /**
     * @return les identifiants des activités qui couvrent ce nœud — toujours vide au palier 1.
     */
    public List<String> activitesCouvrant(String noeudId) {
        return List.of();
    }
}
