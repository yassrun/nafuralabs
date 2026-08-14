# Casa seed list — rooftops & must-have spots

Source initiale : conversation Google AI Mode (2026-08-01).  
Objectif : accumuler une liste nominative avant import TEXT / check existence, plutôt que nearby aveugle.

Statuts catalogue (snapshot local `nafura_venue_catalog`) :

| status | sens |
|---|---|
| `IN_CATALOG` | déjà présent (match nom approximatif) |
| `MISSING` | à importer |
| `AMBIGUOUS` | match partiel / douteux — vérifier à la main |
| `FALSE_POSITIVE` | import Google bruité — à rejeter / supprimer |

Derniers imports TEXT :
- Rooftops/chicha **2026-08-01 ~19:32 UTC** → Casa 216 → 242
- Nightclubs after-2h **2026-08-01 ~19:40 UTC** → Casa → **251** (Dandana Marrakech purgé 2×)
- Bonus Google (Voice Club queries) : Havana Night Club + VANITY POOL CLUB enrichis
- Café urbain / chicha (sans alcool) **2026-08-01 ~19:48 UTC** → Casa → **289** (FPs hors-ville purgés)
- Pubs / bars / cabarets (`newvague.md`) **2026-08-01 ~20:02 UTC** → Casa → **338**

---

## Prompt Google AI — vague suivante

Copier-coller pour enrichir la liste (garder le même format) :

```text
Liste tous les lieux célèbres de Casablanca (Maroc) dans ces catégories :
1) rooftops / sky bars
2) clubs / lounges nightlife
3) restaurants signature / resto-bars
4) beach clubs (corniche / Aïn Diab)

Pour chaque lieu, donne UNIQUEMENT :
- name (nom commercial exact Google si possible)
- zone (Maârif, Gauthier, Racine, Anfa/Aïn Diab, Corniche, Centre, CIL, autre)
- categoryHint (ROOFTOP | NIGHTCLUB | LOUNGE | RESTAURANT | BEACH_CLUB)
- resto-bar → taxonomy multi `["RESTAURANT","BAR"]` (plus de type `RESTO_BAR`)
- googleTextQuery (requête courte pour Google Places Text, ex. "Sky 28 Casablanca")
- why (1 courte phrase)

Exclus les chaînes fast-food, salons, spas, barbershops.
Pas de prose marketing. Tableau markdown uniquement.
Si tu n'es pas sûr qu'il existe encore, marque confidence=low.
```

---

## Rooftops (Google AI Mode — vague 1)

| name | zone | google name en base | catalogStatus | notes |
|---|---|---|---|---|
| Bliss Rooftop | Gauthier | Bliss Rooftop | IN_CATALOG | |
| Thejamesrooftop | Gauthier | Thejamesrooftop | IN_CATALOG | |
| Misti Roof Top | Bd Moulay Hassan I | Misti Roof Top | IN_CATALOG | importé |
| Sky 28 / Skies | Twin Center | Sky 28 | IN_CATALOG | importé |
| Le Rooftop (Royal Mansour) | Av. des FAR | Le Rooftop | IN_CATALOG | vérifier que ce n’est pas un autre « Le Rooftop » |
| Birds Rooftop Casablanca | Corniche | Birds Rooftop Casablanca | IN_CATALOG | importé |
| La Ola Rooftop | Aïn Diab | La Ola Rooftop | IN_CATALOG | |
| Lucy in The Sky | CIL | Lucy in The Sky | IN_CATALOG | importé |
| Vibe rooftop | Bd Abdelmoumen | Vibe rooftop | IN_CATALOG | importé |
| Nomads Rooftop Casablanca | Maârif | Nomads Rooftop… | IN_CATALOG | |

---

## Must-have hors rooftop

| name | google name en base | catalogStatus |
|---|---|---|
| Kôya Restaurant Lounge Casa | Kôya Restaurant Lounge Casa | IN_CATALOG |
| DjaDja Afro Club | DjaDja Afro Club | IN_CATALOG |
| Cabestan | Le Cabestan | IN_CATALOG |
| Rick's Café | Rick's Café | IN_CATALOG |

---

## Café / chicha / lounges

| name | google name en base | catalogStatus | notes |
|---|---|---|---|
| Nomads Rooftop | Nomads Rooftop… | IN_CATALOG | |
| Le Duplex | Le Duplex Casablanca | IN_CATALOG | |
| Volfoni | ? | AMBIGUOUS | hits `Pomo Dolce` / `Moods Café` — revoir / re-TEXT `Volfoni Palmier` |
| Le Millionnaire | Le Milliardaire Casablanca | IN_CATALOG | Google = **Milliardaire** (pas Millionnaire) |
| Mylos | Milos | IN_CATALOG | orthographe Google **Milos** |
| Le Miami | La Table du Miami / GRANDE TERRASSE MIAMI PLAGE | AMBIGUOUS | aussi faux positif `Miami Fitness Club` |
| The Roof | Rooftop 360 Casablanca ? | AMBIGUOUS | vérifier fiche |
| L'Authentique | — | FALSE_POSITIVE | importé `RAPID CROUSTI L'AUTHENTIQUE` etc. — à purger |
| Café moka | — | FALSE_POSITIVE | bruit coffee shops — à purger |
| RS Lounge by Rhodes | RS Lounge by Rhodes | IN_CATALOG | alcool à confirmer |
| Diamond Lounge | Diamond Lounge | IN_CATALOG | |
| Leopard | Leopard restaurant Casablanca | IN_CATALOG | |
| 10000 / Dix Mille | — | AMBIGUOUS | hits `1000° Coffee` / `Cube Lounge` — pas le bon spot |
| Love | Love Lounge Restaurant | IN_CATALOG | |

### Vague lounge nocturne / chicha (Google AI — sans alcool)

| name | google name en base | catalogStatus | notes |
|---|---|---|---|
| Ostoura | Ostoura casablanca | IN_CATALOG | |
| Dubai Lounge & Coffee | Burj Dubai Lounge & Coffee | IN_CATALOG | |
| XS Casablanca | XS Casablanca | IN_CATALOG | même adresse que Yellow Club — vérifier |
| Casa Plage | Casa plage | IN_CATALOG | |
| Moods Café Restaurant | Moods Café-Restaurant | IN_CATALOG | déjà en base |
| La Storia | La Storia Casablanca | IN_CATALOG | |
| Le Gatsby | Le Gatsby | IN_CATALOG | |
| Boost Café | Boost Coffee Abdelmoumen | IN_CATALOG | |
| Mint – Four Seasons | Mint (Corniche) | AMBIGUOUS | pas clairement le Mint hôtel |
| Venezia Ice Corniche | Venezia Ice Ain Diab | IN_CATALOG | |
| Le Basmane | Le Basmane | IN_CATALOG | |
| Dar Alkaid | Restaurant Dar El Kaid | IN_CATALOG | |
| Café Maure | → La Sqala | AMBIGUOUS | Google merge avec La Sqala |
| Le Rossignol | Le Rossignol Restaurant… | IN_CATALOG | |
| La Cascade | La Cascade | IN_CATALOG | |
| Tropicana Café | Tropicana Space | AMBIGUOUS | nom Google différent |
| Café Bianca | Bianca Café | IN_CATALOG | |
| La Terrazza | Restaurant La Terrazza | IN_CATALOG | Tahiti Beach / Corniche |
| Sunny Beach | — | MISSING | hit `Cafe Ocean View` purgé |
| Terracotta Beach | — | FALSE_POSITIVE | Google → Harhoura / Témara — purgé |
| Le Marly | Le Marly | IN_CATALOG | déjà en base |
| Beverly Bakery & Café | Beverly Bakery & Café | IN_CATALOG | |
| Paul / Starbucks / McCafé Anfa | — | SKIPPED | chaînes — non importées en masse |

### Vague café urbain / trad (échantillon TEXT)

| name | google name en base | catalogStatus | notes |
|---|---|---|---|
| % Arabica | % Arabica Casablanca | IN_CATALOG | |
| Espressolab | EspressoLab | IN_CATALOG | |
| Bondi Coffee Kitchen | Bondi Coffee Kitchen | IN_CATALOG | |
| Amoud | Amoud Belvédère | IN_CATALOG | 1 branche ; Californie non importée |
| Maison Alexis | La terrasse -1951- Maison Alexis | IN_CATALOG | |
| Dip n Dip | dipndip Urban Square | IN_CATALOG | |
| Alba Salon de Thé | Café Alba | IN_CATALOG | |
| Le Petit Poucet | Petit Poucet | IN_CATALOG | |
| Maison Amande | Boulangerie Amande | AMBIGUOUS | |
| Mesk Ellil | Nassim ellil | AMBIGUOUS | orthographe Google |
| Boho Café | — | FALSE_POSITIVE | hit **Bruxelles / Rabat** — purgé |
| Café de la Presse | La Presse (Restaurant Brasserie) | AMBIGUOUS | brasserie, pas café presse ? |
| Café Excelsior | Café Excelsior | IN_CATALOG | |
| Café Impérial | Cafe Imperial | IN_CATALOG | |
| Café de France | Cafe de France | IN_CATALOG | |
| La Sqala | La Sqala | IN_CATALOG | déjà en base |
| Bacha Coffee | Café bacha | AMBIGUOUS | probablement pas Bacha (luxe) |
| Hey Bou | — | FALSE_POSITIVE | Google → `Bun coffee` — purgé ; place_id manuel |
| Carré Zen | — | MISSING | hit `zen Café` hors zone — purgé |
| Oakberry | OAKBERRY AÇAÍ - Aeria Mall | IN_CATALOG | |
| Seven Grams | Seven 7 Grams | IN_CATALOG | |
| La Grillardière | La Grillardière | IN_CATALOG | |
| Organic Kitchen | Organic Kitchen | IN_CATALOG | |
| Good Bun | The GoodBun | IN_CATALOG | |
| Bloom Coffee Shop | Bloom | IN_CATALOG | |
| Le Duo Café | Le Duo Café Restaurant | IN_CATALOG | |
| Clay Oven | Clay Oven Casablanca | IN_CATALOG | déjà en base |

### Faux positifs à revoir

- Miami Fitness Club  
- RAPID CROUSTI L'AUTHENTIQUE - CASABLANCA, Foodly bourgogne, BRUTT  
- COFFEE SHOP EL MANSSOURI, khayma coffee, Café Or  
- 1000° Coffee and more  
- Boho Rabat / Terracotta Harhoura / zen Café / Cafe Ocean View — **purgés**  

---

## Nightclubs ouverts après 2h (Google AI Mode)

Filtre demandé : nightlife qui finit **après 2h** (surtout Aïn Diab / Corniche). Horaires à revalider le soir même.

### Déjà en base avant import

| name | google name en base | catalogStatus |
|---|---|---|
| Manhattan Club | Manhattan Club | IN_CATALOG |
| Maison B | Maison B | IN_CATALOG |
| Backstage Casablanca | Backstage Casablanca | IN_CATALOG |
| Yellow Club | Yellow CLUB | IN_CATALOG |
| Black House (Hyatt) | Black House Disco | IN_CATALOG |

### Importés (maxResults=1)

| name | google name en base | until (AI) | catalogStatus | notes |
|---|---|---|---|---|
| Joker Club Casablanca | Joker Club Casablanca | ~4h | IN_CATALOG | |
| Skybar Casablanca | Skybar | ~4h / 4h30 | IN_CATALOG | ≠ Sky 28 Twin Center |
| Coyote Girls | Coyote Girls | ~3h | IN_CATALOG | dinner/cabaret |
| Mano Club | Mano Club | ~3–4h | IN_CATALOG | |
| Standard Club | Standard club | ~3–4h | IN_CATALOG | |
| Punjab Club | PUNJAB Cabaret Oriental | ~3–4h | IN_CATALOG | |
| Voice Club | The Voice | ~3–4h | AMBIGUOUS | Hay Salama — probablement pas le club Corniche |
| Larocca Lounge | La Rocca Lounge Restaurant | ~3–4h | IN_CATALOG | |
| Dandana Cabaret | — | — | FALSE_POSITIVE | Google ne connaît que **Marrakech** → purgé (×2) |
| Le Carré Rouge | — | ~3–4h | MISSING | TEXT mappe vers **Yellow CLUB** (Rue de la Mer Rouge) — pas de fiche Google distincte |
| Byblos | BYBLOS Night Club | ~3–4h | IN_CATALOG | |

### Bonus importés (mauvais match Voice Club, lieux Casa réels)

| name | google name en base | catalogStatus |
|---|---|---|
| Havana Night Club | Havana Night Club - casablanca | IN_CATALOG |
| Vanity Pool Club | VANITY POOL CLUB | IN_CATALOG |

### À re-TEXT / manuel

- Dandana Cabaret **Casablanca** — pas trouvé via Google Places
- Voice Club Casablanca — `The Voice` douteux ; pas de meilleur hit
- Le Carré Rouge — chercher place_id Instagram / Maps à la main

Tag métier utile plus tard : `openAfter2am=true` (pas encore en modèle — pour l’instant note seed).

---

## Backlog Google AI

- [x] Vague rooftops → importée
- [x] Vague café/chicha partielle → importée (avec bruit)
- [x] Vague nightclubs after-2h → importée
- [x] Vague café urbain / chicha sans alcool → importée (~41 créés, FPs purgés)
- [x] Vague pubs / bars / cabarets (`newvague.md`) → importée
- [ ] Re-TEXT : Volfoni, Sunny Beach, Terracotta Casa, Boho Casa, Carré Zen, Café Maure, Bacha Coffee, Bodeguita Casa, Scenario, Brooklyn Bar, Light Pub, VIP Pub, Ziryab, Jad Mahal, Aladin cabaret
- [ ] Manuel : Dandana Casa, Voice Club, Carré Rouge, L'Envers, Le Calife, Al Moggar (place_id)
- [ ] Purger faux positifs restants (Miami Fitness, coffee noise, hotels entiers si non voulus…)
- [ ] Vague restaurants signature
- [ ] Vague beach clubs

---

## Pubs / bars / cabarets (`newvague.md`)

Source : `docs/campaigns/newvague.md`. Déjà en base avant vague : Irish Pub, Bodega, Amstrong, Trica, Entrecôte, Cabestan, Rick's, Larocca, Skybar, Manhattan, Backstage, Maison B, Black House, Joker, Punjab, Byblos, etc.

### Pubs / bars importés (OK)

| name | google name en base | notes |
|---|---|---|
| Le Jefferson | Le Jefferson | |
| Le Pépère | Pépère Sportsbar | |
| Café La Chope | Café La Chope | |
| Le Kimmy'z | Le Kimmy'z | |
| La Java | La Java | |
| La Closerie | La Closerie | |
| Le Patio | Le Patio | |
| Le Béret | Le Beret | El Hank |
| Le Petit Rocher | Le Petit Rocher | |
| CasArt | Bar CasArt | Sofitel |
| Bar Cintra | Bar Cintra | |
| Peau de Vache | Peau de Vache | |
| La Cigale | Brasserie La Cigale | Sidi Belyout |
| Chez John | Chez John | |
| Le Bistrot Chic | Le Bistrot Chic | |
| Comptoir des Arènes | Les Arènes Café | AMBIGUOUS nom |
| Bistrot Burger | Bistrot Burger BD chefchaouni | |
| La Bavaroise | La Brasserie Bavaroise | |
| Jardin de l'Opéra | Le Jardin De L'Opéra | |
| La Pergola | La Pergola | |
| Taverne du Dauphin | Taverne du Dauphin | |
| Le Chester's | Le Chester's | |
| Le Cardinal | Le Cardinal | |
| Le Titan | Le Bistrot Titan | |
| Don Camillo | Don Camillo | |
| Riad 21 | Riad 21 | |
| Social Dining Club | Social Dining Club | |
| La Bazenne | A la Bazenne | |
| Café Balthazar | Balthazar Cafe | Corniche |
| 16ème Floor | 16ème Floor | Mövenpick |
| Lily's | Lily's Restaurant | Corniche |
| Umayya | Umayya | |
| Iloli | ILOLI | |
| NKOA | NKOA | |
| La Table du Marché | La Table Du Marché | Bourgogne |
| Golden Tulip Brasserie | La Brasserie by Éric Frechon | Farah |

### Cabarets importés

| name | google name en base | notes |
|---|---|---|
| Jundoul | Jundoul cabaret | Aïn Diab |
| Zaman Lounge | Cabaret Zaman | |
| Don Quichotte | Cafe Bar Night Club Don Quichotte | |
| Embassy | Cabaret embassy | |
| Dawliz | Dawliz Hôtel | hôtel + concept |
| Le Mirage | Le Mirage | |
| L'Oriental | Hala Night Club Oriental | AMBIGUOUS |
| Nuits de Beyrouth | Alo Beyrouth | AMBIGUOUS |
| Beirut Cabaret | Théâtre du Liban | AMBIGUOUS |

### Faux positifs / manquants (purgés ou skip)

| name | statut | notes |
|---|---|---|
| Bodeguita | FALSE_POSITIVE | Google → Bouskoura |
| L'Envers | FALSE_POSITIVE | Google → Marrakech |
| Le Calife | FALSE_POSITIVE | Google → Paris |
| Al Moggar | FALSE_POSITIVE | Google → Agadir |
| Scenario | FALSE_POSITIVE | hit `BERED` — purgé |
| Brooklyn Bar / Light Pub / Diplomate / VIP Pub | FALSE_POSITIVE | mauvais hits — purgés |
| Ziryab / Jad Mahal / Aladin cabaret | FALSE_POSITIVE | Rabat / Marrakech / chawarma |
| Casa José | AMBIGUOUS | ancien hit hors pub |
| Marriott / Radisson / Barceló | AMBIGUOUS | fiche **hôtel** entière, pas le bar |
| Living Room / Rooftop 7 / Le 4 / Le Rouge / The Address / Casablanca Lounge | SKIPPED | déjà en base ou place_id existant |
| Moulin Rouge / Shéhérazade / Layali Beirut / Arabian Nights | SKIPPED | déjà matchés ailleurs |
