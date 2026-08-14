# Stabiliser les sources Sektor

> Ranger le code sur la cible `socle` + dossiers métier **actuels**. Pas de Pact. Pas de nouveaux BC.

## Cible

```text
sektor/sources/
  backend/
    socle/          kernel de CETTE app
    <module>/       jars Gradle d’aujourd’hui, inchangés
    app/            assembler Spring Boot seulement
  web/
    socle/          layout ERP, nav, composition shell, i18n hôte
    <domaine>/      un dossier par domaine actuel — plus de pages/
```

**Socle code** = ce que tous les domaines Sektor utilisent, et que venue-catalog n’utilisera pas (layout ERP, adapter LLM BTP, société, onboarding, auth QA locale).

**Pas dans ce lot :** CADRE / SPEC / CH · extraire anatomy / platform · fusionner item+stock+catalogue · publier un package npm.

Les dossiers métier d’aujourd’hui **ne sont pas des BC**. On les garde comme noms de code jusqu’au Pact, plus tard.
