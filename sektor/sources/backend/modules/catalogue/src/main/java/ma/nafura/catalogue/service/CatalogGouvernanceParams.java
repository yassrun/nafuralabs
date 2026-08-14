package ma.nafura.catalogue.service;

import org.springframework.stereotype.Component;

/**
 * Seuils G2 — paramétrables, jamais désactivables (plancher = 1 minimum effectif côté code).
 */
@Component
public class CatalogGouvernanceParams {

    public static final String KEY_SEUIL_ARTICLE = "catalogue.seuilTenantsArticle";
    public static final String KEY_SEUIL_OUVRAGE = "catalogue.seuilTenantsOuvrage";
    public static final String KEY_SEUIL_PRIX = "catalogue.seuilTenantsPrix";

    public static final int DEFAULT_SEUIL_ARTICLE = 3;
    public static final int DEFAULT_SEUIL_OUVRAGE = 3;
    public static final int DEFAULT_SEUIL_PRIX = 5;

    public int seuilArticle() {
        return DEFAULT_SEUIL_ARTICLE;
    }

    public int seuilOuvrage() {
        return DEFAULT_SEUIL_OUVRAGE;
    }

    public int seuilPrix() {
        return DEFAULT_SEUIL_PRIX;
    }

    public int seuilPourType(String typeObjet) {
        if ("OUVRAGE".equalsIgnoreCase(typeObjet)) {
            return seuilOuvrage();
        }
        return seuilArticle();
    }
}
