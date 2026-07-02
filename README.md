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
- Visuele editor met live voorbeeld en validatie
- JSON-import en -export voor processen
- Print- en deelfunctie
- Geen database, account of betaalde dienst nodig

## Lokaal bekijken

Omdat de website JavaScript-modules gebruikt, moet hij via een kleine lokale webserver worden geopend. Bijvoorbeeld met Python:

```sh
python3 -m http.server 8080
```

Open daarna <http://localhost:8080>.

## Processen maken en bewerken

Open [`editor.html`](editor.html) via de lokale webserver of kies **Bewerk flow** op een procespagina. De editor kan:

- acties, vragen, opmerkingen en uitkomsten toevoegen;
- per vraag twee of meer routes koppelen;
- routes apart laten eindigen of bij dezelfde stap laten samenkomen;
- Nederlandse en Engelse teksten beheren;
- contacten beheren;
- ontbrekende en onbereikbare stappen signaleren;
- concepten lokaal in de browser bewaren;
- volledige flows importeren en als JSON downloaden.

Plaats een gedownloade flow in [`flows/`](flows/) en voeg de titel en zoekgegevens toe aan `flowCatalog` in [`data.js`](data.js). De technische node-ID's worden door de editor gegenereerd en hoeven niet handmatig te worden beheerd.

Een procesbestand bevat:

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
| `note` | Belangrijke mededeling of overdracht |
| `end` | Resultaat van het proces |

Iedere actie wijst met `next` naar een volgende stap. Een vraag bevat routes die ieder naar een eigen doelstap wijzen. Wanneer routes naar dezelfde stap wijzen, toont de viewer ze als een splitsing die later weer samenkomt. De structuur wordt beschreven door [`flows/flow.schema.json`](flows/flow.schema.json).

## Publiceren

De app is volledig statisch en kan onder meer op GitHub Pages, Netlify of de bestaande website van de club worden gepubliceerd. De meegeleverde GitHub Actions-workflow publiceert iedere wijziging op `main` automatisch naar GitHub Pages; er is geen bouwstap nodig.

## Status

Dit is een werkend prototype. De eerste registratieflow is overgenomen uit de aangeleverde draw.io-export. De inhoud en e-mailadressen moeten vóór openbaar gebruik door LOHC worden gecontroleerd.

## Licentie

Beschikbaar onder de [MIT License](LICENSE).
