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
- Serveropslag via Docker, met statische fallback voor GitHub Pages

## Lokaal bekijken

Statische fallback, bijvoorbeeld voor GitHub Pages of snel lokaal bekijken:

```sh
python3 -m http.server 8080
```

Open daarna <http://localhost:8080>.

Servermodus, met gedeelde opslag van flows:

```sh
npm install
DATA_DIR=./data PORT=8080 LOHC_ADMIN_TOKEN=kies-een-code npm start
```

Open daarna <http://localhost:8080>. In servermodus worden flows en categorieën opgeslagen in `DATA_DIR`. Als `LOHC_ADMIN_TOKEN` is ingesteld, vraagt de editor bij opslaan/verwijderen een beheerderscode.

## Processen maken en bewerken

Open [`editor.html`](editor.html) via de lokale webserver of kies **Bewerk flow** op een procespagina. De editor kan:

- acties, vragen, opmerkingen en uitkomsten toevoegen;
- per vraag twee of meer routes koppelen;
- routes apart laten eindigen of bij dezelfde stap laten samenkomen;
- Nederlandse en Engelse teksten beheren;
- contacten beheren;
- ontbrekende en onbereikbare stappen signaleren;
- concepten lokaal in de browser bewaren wanneer de app statisch draait;
- flows direct op de server opslaan wanneer de app via Docker/Node draait;
- volledige flows importeren en als JSON downloaden.

Wanneer de app via de Node/Docker-server draait, bewaart de editor wijzigingen automatisch op de server. Nieuwe flows, aangepaste flows en nieuwe categorieën worden dan gedeeld met iedereen die dezelfde server gebruikt.

Wanneer de app statisch draait, bijvoorbeeld via GitHub Pages, bewaart de editor wijzigingen als lokaal concept in de browser. Een lokaal concept is alleen op dat apparaat en in die browser zichtbaar. Om een flow dan voor iedereen te publiceren, download je de JSON en vervang je het bijbehorende bestand in [`flows/`](flows/). Voeg bij een volledig nieuwe flow ook de titel en zoekgegevens toe aan `flowCatalog` in [`data.js`](data.js). De technische node-ID's worden door de editor gegenereerd en hoeven niet handmatig te worden beheerd.

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

De app kan nog steeds statisch op GitHub Pages draaien. Voor gedeelde serveropslag gebruik je de Node/Docker-server.

## Draaien met Docker / DigitalOcean

Voor DigitalOcean is de site verpakt als kleine Node-container. Bij de eerste start worden de meegeleverde JSON-flows naar de datamap gekopieerd. Daarna gebruikt de app de datamap als bron van waarheid.

Alleen de LOHC Proceswijzer starten:

```sh
docker build -t lohc-flows .
docker run --rm -p 8080:8080 -v "$PWD/data:/data" -e LOHC_ADMIN_TOKEN=kies-een-code lohc-flows
```

Open daarna:

```text
http://localhost:8080
```

Samen met het project **Pay and statistics calculator** starten kan met:

```sh
docker compose -f docker-compose.oracle.yml up -d --build
```

Daarbij worden de apps zo gepubliceerd:

| App | Lokale poort |
| --- | --- |
| LOHC Proceswijzer | <http://localhost:8080> |
| Pay and statistics calculator | <http://localhost:8081> |

De compose-file verwacht dat beide projecten naast elkaar staan:

```text
Documents/
├── LOHC flows/
└── Pay and statistics calculator/
```

Op een DigitalOcean-droplet moet je in de firewall poort `8080` en `8081` toestaan, of een reverse proxy zoals nginx/Caddy gebruiken om beide apps achter één domein te zetten.

## Status

Dit is een werkend prototype. De eerste registratieflow is overgenomen uit de aangeleverde draw.io-export. De inhoud en e-mailadressen moeten vóór openbaar gebruik door LOHC worden gecontroleerd.

## Licentie

Beschikbaar onder de [MIT License](LICENSE).
