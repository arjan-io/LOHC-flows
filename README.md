# LOHC Proceswijzer

Een doorzoekbare, tweetalige proceswijzer voor vrijwilligers en medewerkers van LOHC. De website beantwoordt praktische vragen zoals:

- Wie moet ik informeren bij een nieuwe inschrijving?
- Welke stappen horen bij een opzegging?
- Wie is verantwoordelijk voor een bepaalde actie?

De eerste voorbeeldflow is **Ledenadministratie → Nieuwe inschrijving**.

## Mogelijkheden

- Processen ingedeeld per discipline/categorie
- Zoeken op situatie, rol of trefwoord
- Nederlands en Engels
- Mobielvriendelijke flowweergave
- Contactgegevens per proces
- Print- en deelfunctie
- Geen database, account of betaalde dienst nodig

## Lokaal bekijken

Omdat de website JavaScript-modules gebruikt, moet hij via een kleine lokale webserver worden geopend. Bijvoorbeeld met Python:

```sh
python3 -m http.server 8080
```

Open daarna <http://localhost:8080>.

## Processen toevoegen

Alle categorieën en processen staan in [`data.js`](data.js). Een proces bevat:

- een stabiel `id`;
- een `category`;
- een proceseigenaar en controledatum;
- Nederlandse en Engelse titel, omschrijving, trefwoorden en stappen;
- relevante contactrollen.

Kopieer een bestaand procesobject in `flows` en pas de velden aan. Ondersteunde staptypen zijn:

| Type | Gebruik |
| --- | --- |
| `start` | Aanleiding of invoer |
| `action` | Uit te voeren actie |
| `decision` | Vraag met twee routes |
| `notice` | Belangrijke mededeling of overdracht |
| `end` | Resultaat van het proces |

Voeg een nieuwe categorie toe aan `categories`. Processen worden automatisch geteld en doorzoekbaar gemaakt.

## Publiceren

De app is volledig statisch en kan onder meer op GitHub Pages, Netlify of de bestaande website van de club worden gepubliceerd. Voor GitHub Pages kan de repository vanuit de root van de standaardbranch worden gepubliceerd; er is geen bouwstap nodig.

## Status

Dit is een eerste werkend prototype. De voorbeeldflow is overgenomen en vereenvoudigd op basis van de aangeleverde schets. De inhoud en e-mailadressen moeten vóór openbaar gebruik door LOHC worden gecontroleerd.

## Licentie

Beschikbaar onder de [MIT License](LICENSE).
